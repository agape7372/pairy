-- Pairy · 자료 허브 서버화 (M5, 2026-07-12)
--
-- 왜: 자료 게시(resources/new)가 localStorage 데모 저장 → 게시해도 본인 브라우저 밖에선 안 보임.
--     자료 허브 목록도 하드코딩 샘플. resources 테이블 + resources 스토리지 버킷으로 실서빙.

begin;

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 60),
  description text not null default '' check (char_length(description) <= 500),
  category text not null check (
    category in ('imeres', 'tretle', 'pairtl', 'sessionlog', 'cocofolia', 'program')
  ),
  tags text[] not null default '{}',
  license text not null default 'free' check (
    license in ('free', 'credit', 'noncommercial', 'paid')
  ),
  -- 유료 자료 가격(원). license='paid' 일 때만 양수.
  price integer not null default 0 check (price >= 0),
  thumbnail_url text,
  file_url text,
  file_name text,
  file_size_kb integer,
  external_url text,
  view_count integer not null default 0,
  download_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_resources_category
  on public.resources(category, created_at desc);
create index if not exists idx_resources_author
  on public.resources(author_id, created_at desc);

alter table public.resources enable row level security;

-- 허브는 공개 목록 — 누구나 읽기, 작성자만 쓰기
drop policy if exists "Resources are viewable by everyone" on public.resources;
create policy "Resources are viewable by everyone"
  on public.resources for select using (true);
drop policy if exists "Authors insert own resources" on public.resources;
create policy "Authors insert own resources"
  on public.resources for insert with check (author_id = (select auth.uid()));
drop policy if exists "Authors update own resources" on public.resources;
create policy "Authors update own resources"
  on public.resources for update using (author_id = (select auth.uid()));
drop policy if exists "Authors delete own resources" on public.resources;
create policy "Authors delete own resources"
  on public.resources for delete using (author_id = (select auth.uid()));

-- 자료 파일 버킷 — avatars 와 같은 "첫 폴더 = 소유자 uid" 규약(M-5)
insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do nothing;

drop policy if exists "resources public read" on storage.objects;
create policy "resources public read"
  on storage.objects for select using (bucket_id = 'resources');

drop policy if exists "resources owner write" on storage.objects;
create policy "resources owner write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'resources'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "resources owner delete" on storage.objects;
create policy "resources owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'resources'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;

-- 검증:
--   GET /rest/v1/resources?select=count → 200 (anon 읽기 가능)
--   (로그인) insert author_id=본인 → 201 / 타인 → 42501
--   POST /storage/v1/object/resources/{내uid}/x.png → 성공 / {남uid}/ → 403
