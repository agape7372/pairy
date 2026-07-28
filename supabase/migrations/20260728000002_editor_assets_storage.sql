-- Pairy · 에디터 이미지 영속 저장소
--
-- 공개 읽기: 렌더러와 협업 참가자가 영속 URL을 직접 표시한다.
-- 쓰기/삭제: authenticated 사용자가 자신의 auth.uid() 첫 폴더만 관리한다.

begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'editor-assets',
  'editor-assets',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public object URLs are served by the bucket's public flag. Do not grant
-- public SELECT on storage.objects: that would also expose object listings
-- and metadata through the Storage API. Drop a stale policy if rerun.
drop policy if exists "editor assets public read" on storage.objects;

-- Storage remove() needs SELECT as well as DELETE. Limit metadata reads to the
-- authenticated owner; public file delivery still bypasses this via the bucket.
drop policy if exists "editor assets owner read metadata" on storage.objects;
create policy "editor assets owner read metadata"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'editor-assets'
    and owner_id = (select auth.uid())::text
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "editor assets owner insert" on storage.objects;
create policy "editor assets owner insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'editor-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "editor assets owner delete" on storage.objects;
create policy "editor assets owner delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'editor-assets'
    and owner_id = (select auth.uid())::text
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;
