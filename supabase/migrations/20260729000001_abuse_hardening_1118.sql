-- Pairy · 어뷰징 점검 후속 봉합 (2026-11-18, 가지 fix/abuse-1118 · 미합침 · 운영 미적용)
--
-- 1) 결제 부여 함수 EXECUTE — `revoke ... from public` 만으로는 Supabase 기본 ACL 이 anon·authenticated 에
--    직접 준 EXECUTE 가 남는다. 직접 /rpc 호출로 무료 구독·결제 없는 구매가 가능했을 수 있다.
-- 2) 「링크만 공유(unlisted)」 — select 정책이 share_id 없이도 unlisted 를 열어 전체 열거가 가능했다.
--    정책은 public 만, unlisted 는 share_id 를 인자로 받는 definer RPC 로만 읽는다.
-- 3) Storage — works·templates 버킷 쓰기는 첫 폴더 = auth.uid() (avatars 와 같은 규칙).
--    resources 버킷에 크기·MIME 상한.
-- 4) 환불 회수 — 취소 확정 시 구독 만료 앞당김 · 단건구매를 refunded 로. 호출은 service_role 만.
--
-- 적용 순서: 이 마이그레이션 먼저 -> 곧바로 앱 배포. 구 앱의 공유 페이지는 unlisted 열람이
-- 새 앱이 나갈 때까지 끊기므로 두 단계를 같은 시간대에 묶는다.

begin;

-- ============================================================
-- 1) 결제 부여 함수 — service_role 전용으로 고정
--    (grant_subscription 은 confirm_payment_and_grant 안에서 definer 로 불린다 = 소유자 권한이라 영향 없음)
-- ============================================================
revoke all on function public.grant_subscription(uuid, integer) from public, anon, authenticated;
revoke all on function public.confirm_payment_and_grant(uuid, text) from public, anon, authenticated;
grant execute on function public.grant_subscription(uuid, integer) to service_role;
grant execute on function public.confirm_payment_and_grant(uuid, text) to service_role;

-- ============================================================
-- 2) works — unlisted 는 select 정책에서 제외, RPC 로만
-- ============================================================
drop policy if exists "Shared works are viewable by everyone" on public.works;
create policy "Shared works are viewable by everyone" on public.works
  for select using (share_status = 'public');

-- share_id(캡 토큰)를 아는 사람만 1건. 목록·열거 불가. 익명 공유 페이지(anon)와 OG 조회가 쓴다.
create or replace function public.get_shared_work(p_share_id text)
returns setof public.works
language sql
security definer
stable
set search_path = public
as $$
  select *
    from public.works
   where share_id = p_share_id
     and share_status in ('unlisted', 'public')
   limit 1;
$$;

revoke all on function public.get_shared_work(text) from public, anon, authenticated;
grant execute on function public.get_shared_work(text) to anon, authenticated;

-- ============================================================
-- 3) Storage
-- ============================================================
-- works: 첫 폴더 = 소유자 uid 일 때만 쓰기·덮어쓰기 (종전: 로그인 누구나 임의 경로)
drop policy if exists "works auth write" on storage.objects;
drop policy if exists "works auth update" on storage.objects;
drop policy if exists "works owner write" on storage.objects;
drop policy if exists "works owner update" on storage.objects;

create policy "works owner write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'works'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "works owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'works'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'works'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- templates: 앱은 이미 `{uid}/...` 로 올린다
drop policy if exists "templates auth write" on storage.objects;
drop policy if exists "templates owner write" on storage.objects;

create policy "templates owner write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'templates'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- resources: 앱 상한(MAX_RESOURCE_FILE_MB = 20)과 같은 크기 + 허용 형식.
-- 실행 파일·HTML·SVG 등은 제외(압축 파일로 올리는 쪽). 허용 목록은 src/hooks/useResources.ts 의 RESOURCE_FILE_ACCEPT 와 맞춘다.
update storage.buckets
   set file_size_limit = 20971520,
       allowed_mime_types = array[
         'image/jpeg', 'image/png', 'image/gif', 'image/webp',
         'image/vnd.adobe.photoshop', 'application/x-photoshop',
         'application/pdf',
         'application/zip', 'application/x-zip-compressed',
         'application/x-7z-compressed', 'application/vnd.rar', 'application/x-rar-compressed',
         'text/plain', 'text/csv', 'application/json',
         'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-wav'
       ]
 where id = 'resources';

-- ============================================================
-- 4) 환불 회수 — 웹훅(재조회로 CANCELED 확인) 뒤 service_role 이 부른다
-- ============================================================
create or replace function public.revoke_payment_and_grant(p_order_id text)
returns text -- 'revoked' | 'canceled' | 'already' | 'not_found'
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.payments;
begin
  select * into v from public.payments where order_id = p_order_id for update;
  if not found then
    return 'not_found';
  end if;

  if v.status = 'canceled' then
    return 'already';
  end if;

  -- 아직 부여 전(pending·failed): 상태만 canceled
  if v.status <> 'paid' or v.granted_at is null then
    update public.payments
       set status = 'canceled', updated_at = now()
     where id = v.id;
    return 'canceled';
  end if;

  update public.payments
     set status = 'canceled', updated_at = now()
   where id = v.id;

  if v.template_id is not null then
    -- 단건구매 회수
    update public.purchases
       set status = 'refunded', updated_at = now()
     where buyer_id = v.user_id
       and template_id = v.template_id
       and status = 'completed';
  else
    -- 구독: 이 결제로 늘어난 기간만큼 되돌린다. 남은 기간이 없으면 free.
    update public.profiles
       set subscription_tier = case
             when subscription_valid_until - make_interval(days => v.grant_days) > now()
               then subscription_tier
             else 'free'::public.subscription_tier
           end,
           subscription_valid_until = subscription_valid_until - make_interval(days => v.grant_days),
           updated_at = now()
     where id = v.user_id
       and subscription_valid_until is not null;
  end if;

  return 'revoked';
end;
$$;

revoke all on function public.revoke_payment_and_grant(text) from public, anon, authenticated;
grant execute on function public.revoke_payment_and_grant(text) to service_role;

commit;

-- 검증 (적용 뒤, 실호출):
--   anon:          POST /rest/v1/rpc/grant_subscription                   -> 42501
--   authenticated: POST /rest/v1/rpc/confirm_payment_and_grant            -> 42501
--   anon:          GET  /rest/v1/works?share_status=eq.unlisted           -> []
--   anon:          POST /rest/v1/rpc/get_shared_work {"p_share_id":"<unlisted id>"} -> 1행
--   authenticated: works 버킷 {남uid}/x.png 업로드                         -> 403
--   resources 버킷: .exe / text/html 업로드                                -> 415 (mime)
--
-- 되돌리기(롤백) SQL:
--   grant execute on function public.grant_subscription(uuid, integer) to anon, authenticated;       -- 비권장
--   grant execute on function public.confirm_payment_and_grant(uuid, text) to anon, authenticated;   -- 비권장
--   drop policy "Shared works are viewable by everyone" on public.works;
--   create policy "Shared works are viewable by everyone" on public.works
--     for select using (share_status in ('unlisted', 'public'));
--   drop function public.get_shared_work(text);
--   drop policy "works owner write" on storage.objects;  drop policy "works owner update" on storage.objects;
--   create policy "works auth write" on storage.objects for insert to authenticated with check (bucket_id = 'works');
--   create policy "works auth update" on storage.objects for update to authenticated using (bucket_id = 'works');
--   drop policy "templates owner write" on storage.objects;
--   create policy "templates auth write" on storage.objects for insert to authenticated with check (bucket_id = 'templates');
--   update storage.buckets set file_size_limit = null, allowed_mime_types = null where id = 'resources';
--   drop function public.revoke_payment_and_grant(text);
