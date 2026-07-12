-- Pairy · 캐릭터(자캐) 테이블 (F-17 봉합, 2026-07-12)
--
-- 왜: 감사 F-17 "characters 테이블 부재 → 항상 localStorage". 클린 재구축 때도 누락(404).
--     "자캐"가 제품 정체성인데 서버 저장이 안 돼 로그인 기기 밖에선 사라짐.
-- 조치: database.types.ts characters Row 정본대로 테이블 + 본인 소유 RLS.

begin;

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text not null default '#FFD9D9',
  avatar_url text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  world_name text,
  sort_order integer not null default 0,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_characters_user on public.characters(user_id, sort_order);

alter table public.characters enable row level security;

-- 본인 캐릭터만 CRUD. 공개 프로필에서 타인 자캐 노출이 필요해지면 SELECT 정책을 별도 확장.
drop policy if exists "Users manage own characters" on public.characters;
create policy "Users select own characters"
  on public.characters for select using (user_id = (select auth.uid()));
create policy "Users insert own characters"
  on public.characters for insert with check (user_id = (select auth.uid()));
create policy "Users update own characters"
  on public.characters for update using (user_id = (select auth.uid()));
create policy "Users delete own characters"
  on public.characters for delete using (user_id = (select auth.uid()));

commit;

-- 검증:
--   GET /rest/v1/characters?select=count → 200 (테이블 존재)
--   (로그인) insert user_id=본인 → 성공 / user_id=타인 → 42501
