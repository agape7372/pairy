-- Pairy · C-01a 봉합 — works/templates 스토리지 오브젝트 소유권 강제 (2026-07-20)
--
-- 왜(2차 감사 C-01a CONFIRMED · .gpt5.6sol.md · DL-0006): 20260712000004:60-77 의
--   works/templates 정책이 소유권 검증 없이 `bucket_id='works'` 만 확인 →
--   임의 로그인 사용자가 타인 works 오브젝트를 덮어쓰기/수정 가능(avatars/resources 는 이미
--   (storage.foldername(name))[1] = auth.uid() 로 봉합됨). 원 마이그레이션 주석(52-54)이
--   "세밀 소유검증은 후속" 이라 명시적으로 defer 했던 부분.
-- 조치: avatars 패턴대로 works/templates 도 경로 첫 폴더 = 소유자 uid 로 강제 + 누락된
--   update/delete 소유 정책 추가. 공개 읽기(공유 이미지)는 유지.
-- 안전성: works/templates 버킷 업로더가 현재 src 에 0건(editor 는 이미지·틀을 works.editor_data
--   JSONB 로 저장, uploadWorkImage/uploadWorkThumbnail 는 死코드) → 현 흐름 회귀 없음.
--   storage.ts 의 uploadWork* 경로도 {uid}/{workId}/... 로 선제 정정(정책과 정합, 향후 배선 대비).

begin;

-- ── works: 공개 읽기 유지, 쓰기/수정/삭제는 본인 폴더(uid)만 ──
drop policy if exists "works auth write" on storage.objects;
drop policy if exists "works auth update" on storage.objects;

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
  );

create policy "works owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'works'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ── templates: 동일 패턴 + 누락됐던 update/delete 소유 정책 추가 ──
drop policy if exists "templates auth write" on storage.objects;

create policy "templates owner write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'templates'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "templates owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'templates'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "templates owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'templates'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;

-- 검증:
--   (로그인 A) POST /storage/v1/object/works/{A_uid}/... → 성공
--   (로그인 A) PUT  /storage/v1/object/works/{B_uid}/... → 403 (C-01a 차단)
--   공개 GET  /storage/v1/object/public/works/{누구든}/... → 성공(읽기 공개 유지)
