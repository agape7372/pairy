-- Pairy · 라이브러리 폴더 (M3, 2026-07-12)
--
-- 왜: my/library 의 "새 폴더"가 no-op(모달 JSX 부재) + 폴더 목록이 하드코딩 샘플 →
--     실 테이블 + 본인 소유 RLS. 폴더 수 상한은 클라이언트만 검사하면 우회 가능(C-3 원칙)이라
--     서버 트리거로도 강제. 서버 tier enum 은 free|premium 뿐(duo/creator 동결, DL-0004).

begin;

create table if not exists public.library_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 50),
  emoji text not null default '📁' check (char_length(emoji) <= 8),
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_library_folders_user
  on public.library_folders(user_id, created_at);

alter table public.library_folders enable row level security;

drop policy if exists "Users select own folders" on public.library_folders;
create policy "Users select own folders"
  on public.library_folders for select using (user_id = (select auth.uid()));
drop policy if exists "Users insert own folders" on public.library_folders;
create policy "Users insert own folders"
  on public.library_folders for insert with check (user_id = (select auth.uid()));
drop policy if exists "Users update own folders" on public.library_folders;
create policy "Users update own folders"
  on public.library_folders for update using (user_id = (select auth.uid()));
drop policy if exists "Users delete own folders" on public.library_folders;
create policy "Users delete own folders"
  on public.library_folders for delete using (user_id = (select auth.uid()));

-- 폴더 수 서버 강제. invoker 권한으로 충분(본인 행 count 는 RLS 통과)이라 definer 안 씀.
create or replace function public.enforce_library_folder_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_tier text;
  v_cap integer;
  v_count integer;
begin
  select subscription_tier::text into v_tier
    from public.profiles where id = new.user_id;
  v_cap := case v_tier when 'premium' then 20 else 3 end;
  select count(*) into v_count
    from public.library_folders where user_id = new.user_id;
  if v_count >= v_cap then
    raise exception '폴더는 최대 %개까지 만들 수 있어요.', v_cap
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_library_folders_limit on public.library_folders;
create trigger trg_library_folders_limit
  before insert on public.library_folders
  for each row execute function public.enforce_library_folder_limit();

commit;

-- 검증:
--   GET /rest/v1/library_folders?select=count → 200 (테이블 존재, anon 은 0행)
--   (로그인) insert user_id=본인 → 성공 / user_id=타인 → 42501
--   free 유저 4번째 insert → P0001 "폴더는 최대 3개까지..."
