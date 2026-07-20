-- Pairy · H-05 봉합 — is_creator·follower/following_count 자가쓰기 차단 (2026-07-20)
--
-- 왜: 20260706000000·20260712000001 주석이 "follow-count 트리거 신설 후 후속 마이그레이션에서 잠금"을
--     약속했으나 마이그레이션에 착지하지 않았다. 20260712000002:28-30 GRANT 목록에
--     is_creator·follower_count·following_count 가 그대로 남아, 로그인 사용자가
--     본인 profiles 를 PATCH 해 is_creator=true 자가승격 → Whisper insert 권한 획득 가능
--     (2차 감사 H-05 CONFIRMED · .gpt5.6sol.md · DL-0006).
-- 조치: 세 컬럼을 UPDATE GRANT 목록에서 제거. follower/following_count 는
--     20260712000006 의 SECURITY DEFINER 트리거(sync_follow_counts)가 owner 로 유지하므로 무영향.
--     is_creator 는 src 내 클라 writer 0건(읽기 전용) — 회귀 없음.
--     is_creator 를 정당히 부여하려면 향후 service_role/RPC 경로로(role·subscription_tier 와 동일 패턴).
-- 주의: 컬럼 REVOKE 는 테이블 GRANT 가 살아있으면 무효 — 테이블 REVOKE 후 허용 컬럼만 재-GRANT
--     (20260712000001 패턴). settings 는 20260712000007 에서 추가 GRANT 되었으므로 목록에 유지.

begin;

revoke update on public.profiles from authenticated, anon;

-- 클라이언트가 정당하게 고칠 수 있는 컬럼만
-- (제외: id·role·total_earnings·pending_payout·subscription_*·is_creator·follower_count·following_count)
grant update (username, display_name, avatar_url, bio, settings, updated_at)
  on public.profiles to authenticated;

commit;

-- 검증 (anon/authenticated REST):
--   PATCH profiles {"is_creator":true} (본인)      → 42501 permission denied for table profiles
--   PATCH profiles {"follower_count":9999} (본인)  → 42501
--   PATCH profiles {"display_name":"x"} (본인)      → 정상
--   팔로우 insert/delete → follower_count 트리거로 정상 변동
