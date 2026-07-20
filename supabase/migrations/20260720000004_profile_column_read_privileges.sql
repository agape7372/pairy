-- Pairy · H-04 봉합 — public profiles SELECT 의 민감 컬럼 노출 차단 (2026-07-20)
--
-- 왜(2차 감사 H-04 CONFIRMED · .gpt5.6sol.md · DL-0006): profiles SELECT 정책이
--   base_schema.sql:208 `USING (true)` 로 모든 row 공개인데, RLS 는 row 만 제한하고 column 은
--   못 숨긴다. 그래서 anon 키로 `GET profiles?select=total_earnings,pending_payout,
--   subscription_tier,subscription_valid_until,settings,role` 하면 전 사용자의 재무·구독·설정·권한이
--   그대로 덤프된다. 앱은 이미 방어적(공개 조회는 안전 컬럼만)이나 DB 계층엔 필터가 없음.
-- 조치: 컬럼 단위 SELECT 권한. RLS(row=using true)는 유지하되, anon/authenticated 는 안전 컬럼만
--   SELECT 가능. 본인 민감 필드는 SECURITY DEFINER RPC(get_my_profile)로만 반환(own row).
-- 정합: 크로스유저 조회(useCreatorProfile)·FK 임베드(comments/follows/bookmarks/resources author)는
--   전부 안전 컬럼만 select 하므로 무영향. 민감 컬럼 읽기는 오직 본인 3곳(useUser·settings·getProfile).

begin;

-- 컬럼 REVOKE 는 테이블 GRANT 가 살아있으면 무효 → 테이블 SELECT 회수 후 안전 컬럼만 재부여.
revoke select on public.profiles from anon, authenticated;

grant select (id, username, display_name, avatar_url, bio,
              is_creator, follower_count, following_count, created_at, updated_at)
  on public.profiles to anon, authenticated;

-- 본인 프로필 전체(민감 컬럼 포함)는 이 RPC 로만. definer 라 컬럼 GRANT 를 우회하지만
-- where id = auth.uid() 로 본인 행만 반환 → 타인 민감정보 노출 불가.
create or replace function public.get_my_profile()
returns setof public.profiles
language sql
security definer
set search_path = public
stable
as $$
  select * from public.profiles where id = (select auth.uid());
$$;

revoke all on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

commit;

-- 검증 (anon/authenticated REST):
--   GET profiles?select=id,display_name           → 정상(안전 컬럼)
--   GET profiles?select=total_earnings            → 42501 permission denied for column
--   GET profiles?select=subscription_tier,settings→ 42501
--   GET profiles?select=* (authenticated, 본인)   → 42501(민감 컬럼 포함되므로) — 앱은 get_my_profile 사용
--   select public.get_my_profile()                → 본인 전체 행(role·subscription·earnings·settings 포함)
--   select public.get_my_profile() (타인 것)      → 불가(파라미터 없음, auth.uid() 고정)
--   FK 임베드 profiles(id,display_name,avatar_url) → 정상(안전 컬럼)
