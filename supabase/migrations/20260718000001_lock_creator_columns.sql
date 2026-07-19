-- Pairy · M-4 마감 — is_creator·팔로우 카운트 클라이언트 UPDATE 회수 (2026-07-18)
--
-- 왜: 20260712000001 이 보수적으로 남겨둔 is_creator·follower_count·following_count 가
--     여전히 클라이언트 UPDATE 가능 → 누구나 자신을 크리에이터로 자가승격(M-4),
--     팔로워 수 조작 가능. 선행 조건이던 follow-count 트리거(20260712000006,
--     SECURITY DEFINER)는 이미 존재하므로 카운트 컬럼의 클라이언트 권한이 불필요해졌고,
--     src/ 전체에서 is_creator 를 쓰는 클라이언트 코드도 없음(2026-07-18 확인).
-- 조치: 테이블 REVOKE 후 허용 컬럼만 재부여 패턴(20260712000001)을 축소 재적용.
--     크리에이터 승격은 별도 서버 경로(향후 RPC/운영)로만 — 셀프서비스 요건이 정의되기
--     전까지 클라이언트 경로를 열지 않는다.

begin;

revoke update on public.profiles from authenticated, anon;

-- 클라이언트가 정당하게 고칠 수 있는 컬럼만
-- (제외: id·role·total_earnings·pending_payout·subscription_*·is_creator·follower/following_count)
-- settings 는 20260712000007 에서 합류한 허용 컬럼 — 목록 재작성 시 누락 금지.
grant update (username, display_name, avatar_url, bio, settings, updated_at)
  on public.profiles to authenticated;

commit;

-- 검증 (authenticated REST, 본인 행):
--   PATCH profiles {"is_creator":true}       → 42501 permission denied
--   PATCH profiles {"follower_count":9999}   → 42501
--   PATCH profiles {"display_name":"x"}      → 정상
--   follows INSERT → 트리거로 follower_count 정상 증가 (SECURITY DEFINER 라 영향 없음)
