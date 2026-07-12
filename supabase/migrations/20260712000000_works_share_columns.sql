-- Pairy · works 공유/캐릭터 컬럼 정본화 (C-2 잔여 드리프트 해소, 2026-07-12)
-- 코드(database.types.ts works Row·useShareWork)가 기대하는 컬럼이 스키마에 없던 것을 정본화.
-- DL-0001 Vercel 이전으로 share/[shareId] 가 실서빙되므로 익명 조회 정책까지 함께 배선.

begin;

-- 공유 상태 enum (코드 정본: 'private' | 'unlisted' | 'public' — database.types.ts:34)
do $$ begin
  create type public.share_status as enum ('private', 'unlisted', 'public');
exception when duplicate_object then null;
end $$;

alter table public.works
  add column if not exists share_status public.share_status not null default 'private',
  add column if not exists share_id text,
  add column if not exists og_image_url text,
  add column if not exists view_count integer not null default 0,
  add column if not exists character_ids jsonb not null default '[]'::jsonb,
  add column if not exists published_at timestamptz;

-- share_id 는 링크 공유의 capability token (nanoid 8자) — 유일성 보장
create unique index if not exists idx_works_share_id_unique
  on public.works(share_id) where share_id is not null;

-- 공유 페이지(share/[shareId]) 익명 조회: 링크 공유(unlisted)·공개(public)만.
-- private 은 소유자 정책(기존 "Users can select own works")으로만 조회된다.
drop policy if exists "Shared works are viewable by everyone" on public.works;
create policy "Shared works are viewable by everyone" on public.works
  for select using (share_status in ('unlisted', 'public'));

-- 조회수 증가: 익명 방문자는 works UPDATE 권한이 없으므로(RLS) 전용 RPC 로만.
-- 기존 read-then-write(useShareWork.incrementViewCount)는 익명에게 침묵 실패였음.
create or replace function public.increment_share_view(p_share_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.works
     set view_count = view_count + 1
   where share_id = p_share_id
     and share_status in ('unlisted', 'public');
$$;

grant execute on function public.increment_share_view(text) to anon, authenticated;

commit;

-- 검증:
--   select column_name from information_schema.columns where table_name='works';
--   → share_status·share_id·og_image_url·view_count·character_ids·published_at 존재
--   anon 키로: GET /rest/v1/works?select=title&share_status=eq.private → [] (차단)
