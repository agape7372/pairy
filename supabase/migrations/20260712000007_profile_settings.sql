-- Pairy · 사용자 설정 저장 (M3, 2026-07-12)
-- 알림/개인정보 토글이 로컬 state 라 새로고침 시 소실 → profiles.settings jsonb 로 영속.

begin;

alter table public.profiles
  add column if not exists settings jsonb not null default '{}'::jsonb;

-- 본인이 settings 를 UPDATE 할 수 있도록 컬럼 GRANT 추가
-- (20260712000001 의 "테이블 REVOKE 후 허용 컬럼만 GRANT" 목록에 settings 합류).
grant update (settings) on public.profiles to authenticated;

commit;
