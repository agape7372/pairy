-- Pairy · C-1 재봉합 — 컬럼 권한 회수가 무효였던 것 교정 (2026-07-12)
--
-- 왜: 20260706 tier0 의 `revoke update (role, total_earnings, pending_payout)` 는
--     Supabase 기본 테이블 레벨 `GRANT UPDATE ... TO authenticated, anon` 이 살아있는 한
--     아무것도 막지 못한다(Postgres 권한 모델: 컬럼 REVOKE 는 컬럼 단위 GRANT 만 상쇄).
--     실검증(2026-07-12, anon PATCH role → HTTP 200)으로 확인됨.
-- 조치: 테이블 레벨 UPDATE 를 전부 회수하고, 허용 컬럼만 컬럼 단위로 재부여.
--     is_creator·follower/following_count 는 tier0 의 보수 방침대로 아직 허용
--     (follow-count 트리거 신설 후 후속 마이그레이션에서 잠금).

begin;

revoke update on public.profiles from authenticated, anon;

-- 클라이언트가 정당하게 고칠 수 있는 컬럼만 (id·role·total_earnings·pending_payout 제외)
grant update (username, display_name, avatar_url, bio,
              is_creator, follower_count, following_count, updated_at)
  on public.profiles to authenticated;

commit;

-- 검증 (anon/authenticated REST):
--   PATCH profiles {"role":"super_admin"}      → 42501 permission denied for table profiles
--   PATCH profiles {"total_earnings":1}        → 42501
--   PATCH profiles {"display_name":"x"} (본인) → 정상 (RLS WITH CHECK 하에서)
