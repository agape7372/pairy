-- Pairy · resources URL 스킴 제약 (M5 후속, 보안 리뷰 지적)
--
-- 왜: external_url/file_url 은 클라 검증만 있었음 — REST 직접 insert 로
--     javascript:/data: 스킴을 심으면 상세 페이지 window.open 에서 XSS.
--     클라 가드와 함께 서버에도 http(s) 강제.

begin;

alter table public.resources
  drop constraint if exists resources_external_url_scheme;
alter table public.resources
  add constraint resources_external_url_scheme
  check (external_url is null or external_url ~* '^https?://');

alter table public.resources
  drop constraint if exists resources_file_url_scheme;
alter table public.resources
  add constraint resources_file_url_scheme
  check (file_url is null or file_url ~* '^https?://');

alter table public.resources
  drop constraint if exists resources_thumbnail_url_scheme;
alter table public.resources
  add constraint resources_thumbnail_url_scheme
  check (thumbnail_url is null or thumbnail_url ~* '^https?://');

commit;

-- 검증: (로그인) insert external_url='javascript:alert(1)' → 23514 (check violation)
