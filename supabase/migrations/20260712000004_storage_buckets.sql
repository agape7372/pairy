-- Pairy · 스토리지 버킷 + RLS (M-5 봉합, 2026-07-12)
--
-- 왜: 클린 재구축 시 버킷이 안 만들어져(bucket 목록 []) 프로필·캐릭터 사진 업로드가 전부 실패.
--     또한 감사 M-5: 경로 소유권 검증 없으면 `{남의uid}/avatar` 로 타인 아바타 덮어쓰기 가능.
-- 조치: avatars/works/templates 버킷 생성 + storage.objects RLS.
--     avatars 는 경로 첫 폴더 = 소유자 uid 로 강제(코드도 {uid}/... 로 통일) → 타인 경로 쓰기 차단.

begin;

-- 버킷 (public read — 프로필/작품 이미지는 공개 URL 로 노출)
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('works', 'works', true),
  ('templates', 'templates', true)
on conflict (id) do nothing;

-- ============================================================
-- avatars — 공개 읽기, 본인 폴더(uid)만 쓰기 (M-5 소유 검증)
--   경로 규약: '{auth.uid}/avatar.ext' · '{auth.uid}/characters/{ts}.ext'
-- ============================================================
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars owner write" on storage.objects;
create policy "avatars owner write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ============================================================
-- works / templates — 공개 읽기, 로그인 사용자 쓰기
--   (works 경로는 workId, templates 는 크리에이터 자산 — 세밀 소유검증은 후속.
--    지금은 버킷 부재로 인한 업로드 실패 복구가 우선.)
-- ============================================================
drop policy if exists "works public read" on storage.objects;
create policy "works public read"
  on storage.objects for select using (bucket_id = 'works');

drop policy if exists "works auth write" on storage.objects;
create policy "works auth write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'works');

drop policy if exists "works auth update" on storage.objects;
create policy "works auth update"
  on storage.objects for update to authenticated using (bucket_id = 'works');

drop policy if exists "templates public read" on storage.objects;
create policy "templates public read"
  on storage.objects for select using (bucket_id = 'templates');

drop policy if exists "templates auth write" on storage.objects;
create policy "templates auth write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'templates');

commit;

-- 검증:
--   select id from storage.buckets;  → avatars, works, templates
--   (로그인) POST /storage/v1/object/avatars/{내uid}/avatar.png → 성공
--   (로그인) POST /storage/v1/object/avatars/{남uid}/avatar.png → 403 (M-5 차단)
