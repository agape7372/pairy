-- Pairy · Tier 0 보안 봉합 (Fable 감사 2026-07-06)
-- 대상 결함: C-1(권한/수익 자가승격), C-2(스키마 드리프트 profiles.role), H-1(collab_sessions 전체 노출)
--
-- ⚠️ 적용 주의 — 이 마이그레이션은 자동 적용되지 않았다(감사 원칙: 침묵 적용 금지).
--   1) 먼저 라이브 DB(project: cqmukwbwuzqgkpgogmby)를 백업: `supabase db dump -f backup.sql` 또는 대시보드 백업.
--   2) 적용: Supabase SQL Editor 붙여넣기 또는 `supabase db push`.
--   3) 아래 "검증" 섹션으로 봉합 확인.
--   * role 컬럼이 라이브 DB에 이미 수동 추가돼 있을 수 있어 IF NOT EXISTS 로 방어했다.
--   * 보수적 조치: 이번엔 돈/관리자 컬럼(role/total_earnings/pending_payout)만 잠근다.
--     is_creator·follower_count·following_count 잠금은 follow-count 트리거 신설 후 후속 마이그레이션에서(앱 파손 방지).

begin;

-- ============================================================
-- C-2 · 스키마 드리프트 해소: profiles.role 정본화
--   앱(database.types.ts:9, useUser.ts:57, lib/auth)이 profiles.role 을
--   'user'|'creator'|'admin'|'super_admin' 으로 select 하나 커밋 스키마엔 부재.
--   → 코드와 스키마를 일치시켜 "프로덕션을 소스로 재현 가능" 상태로 복구.
-- ============================================================
do $$ begin
  create type public.user_role as enum ('user', 'creator', 'admin', 'super_admin');
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists role public.user_role not null default 'user';

-- 기존 is_creator=true 계정을 creator 로 백필(role 이 아직 기본값인 행만).
update public.profiles
  set role = 'creator'
  where is_creator = true and role = 'user';

comment on column public.profiles.role is
  '권한 등급. 클라이언트 직접 변경 불가(아래 REVOKE). 승격은 service_role/SECURITY DEFINER RPC 로만.';

-- ============================================================
-- C-1 · 권한/수익 자가승격 차단
--   기존 UPDATE 정책(schema.sql:209)은 WITH CHECK 도 컬럼 제한도 없어
--   브라우저 콘솔서 `update profiles set role='super_admin'` / total_earnings 조작 가능.
--   조치: (1) 정책에 WITH CHECK(행 소유 재확인), (2) 민감 컬럼 UPDATE 권한 회수.
-- ============================================================

-- (1) id 변경/타행 탈취 방지
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- (2) 민감 컬럼 UPDATE 회수. PostgREST 는 컬럼 권한을 준수 → 클라이언트가 이 컬럼들을 변경 불가.
--     정상 변경 가능: username, display_name, avatar_url, bio.
--     role/earnings 변경은 트리거·SECURITY DEFINER RPC·service_role 로만.
revoke update (role, total_earnings, pending_payout)
  on public.profiles from authenticated, anon;

-- 후속(TODO, 별도 마이그레이션): follow-count 트리거 신설 후
--   `revoke update (is_creator, follower_count, following_count) ... from authenticated;`
--   is_creator 자가승격은 whisper 발송 권한과 연결되므로 잠가야 하나, 현재 whisper 발송이 no-op 이라 즉시 위험 없음.

-- ============================================================
-- H-1 · collab_sessions 전체 노출 차단
--   기존 정책(schema.sql:245, migrations 20260102): SELECT USING (true)
--   → 누구나 전 세션 participants(유저ID/이름)·invite_code 덤프.
--   조치: host/참가자만 SELECT. 참가 전 초대코드 조회는 전용 RPC 로.
-- ============================================================
drop policy if exists "Users can select sessions by invite code or as host" on public.collab_sessions;

create policy "Host or participant can select session"
  on public.collab_sessions for select
  using (
    host_id = (select auth.uid())
    or exists (
      select 1
      from jsonb_array_elements(participants) as p
      where p->>'id' = (select auth.uid())::text
    )
  );

-- 참가 전 단계: 초대코드 정확 일치 시 세션 1건만 반환(전체 열람 없이 참여 흐름 지원).
create or replace function public.get_collab_session_by_invite(p_invite_code text)
returns public.collab_sessions
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.collab_sessions
  where invite_code = p_invite_code
    and status in ('waiting', 'active')
    and expires_at > now()
  limit 1;
$$;

revoke all on function public.get_collab_session_by_invite(text) from public;
grant execute on function public.get_collab_session_by_invite(text) to authenticated;

comment on function public.get_collab_session_by_invite(text) is
  '초대코드 정확 일치 시 활성 세션 1건 반환. 전체 테이블 열람 없이 참여 흐름 지원(H-1 대체 경로). '
  '앱: useCollabSession.joinSession 을 localStorage 조회 대신 이 RPC 로 배선(C-5).';

commit;

-- ============================================================
-- 검증 (적용 후 SQL Editor / psql 에서)
--   C-1: (authenticated 토큰) update profiles set role='super_admin' where id = auth.uid();
--        → ERROR: permission denied for column role  (또는 무변경)
--   C-2: select role from public.profiles limit 1;                → 컬럼 존재, 값 'user'/'creator'
--   H-1: select count(*) from public.collab_sessions;            → 본인 관련 세션만
--        select * from public.get_collab_session_by_invite('MINT-1234');  → 해당 1건
-- 롤백: role 컬럼은 유지 권장(코드 의존). 정책을 USING(true) 로 되돌리는 것은 보안상 비권장.
-- ============================================================
