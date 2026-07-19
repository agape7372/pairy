-- Pairy · 알림 실배선 (F-31, 2026-07-19)
--
-- 왜: 알림 벨/패널이 빈 스텁(mock []) — 이벤트원이 없어 defer 였던 것을 실배선.
-- 설계: 이벤트는 DB 트리거(SECURITY DEFINER)가 기록 — 팔로우/댓글/좋아요.
--     클라이언트는 자기 알림 SELECT·read_at UPDATE·DELETE 만 가능, INSERT 불가(위조 차단).

begin;

do $$ begin
  create type public.notification_type as enum ('follow', 'comment', 'like', 'system');
exception when duplicate_object then null;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  -- 수신자
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  -- 행위자 (탈퇴 시 null — 알림은 유지)
  actor_id uuid references public.profiles(id) on delete set null,
  -- 대상 (틀 삭제 시 알림도 정리)
  template_id uuid references public.templates(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  -- system 타입용 커스텀 문구 (그 외 타입은 클라이언트가 type+actor+template 로 조립)
  message text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

-- 권한: INSERT 는 트리거(SECURITY DEFINER)만. UPDATE 는 read_at 컬럼만(읽음 처리).
revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

drop policy if exists "Users select own notifications" on public.notifications;
create policy "Users select own notifications"
  on public.notifications for select using (user_id = (select auth.uid()));

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users delete own notifications" on public.notifications;
create policy "Users delete own notifications"
  on public.notifications for delete using (user_id = (select auth.uid()));

-- ── 이벤트 트리거 ──

-- 팔로우: follower → following 에게
create or replace function public.notify_on_follow()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, actor_id)
  values (new.following_id, 'follow', new.follower_id);
  return null;
end;
$$;

drop trigger if exists trigger_notify_on_follow on public.follows;
create trigger trigger_notify_on_follow
  after insert on public.follows
  for each row execute function public.notify_on_follow();

-- 댓글: 틀 크리에이터에게 (자기 틀에 자기가 단 댓글은 제외)
create or replace function public.notify_on_comment()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_creator uuid;
begin
  select creator_id into v_creator from public.templates where id = new.template_id;
  if v_creator is not null and v_creator <> new.user_id then
    insert into public.notifications (user_id, type, actor_id, template_id, comment_id)
    values (v_creator, 'comment', new.user_id, new.template_id, new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists trigger_notify_on_comment on public.comments;
create trigger trigger_notify_on_comment
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- 좋아요: 틀 크리에이터에게 (셀프 제외)
create or replace function public.notify_on_like()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_creator uuid;
begin
  select creator_id into v_creator from public.templates where id = new.template_id;
  if v_creator is not null and v_creator <> new.user_id then
    insert into public.notifications (user_id, type, actor_id, template_id)
    values (v_creator, 'like', new.user_id, new.template_id);
  end if;
  return null;
end;
$$;

drop trigger if exists trigger_notify_on_like on public.likes;
create trigger trigger_notify_on_like
  after insert on public.likes
  for each row execute function public.notify_on_like();

-- Realtime 구독 (벨 실시간 갱신)
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

commit;

-- 검증:
--   B가 A를 팔로우 → A 의 notifications 에 follow 1행 (A 만 SELECT 가능)
--   (authenticated) INSERT → 42501 / UPDATE read_at 본인 행 → 정상 / 타컬럼 → 42501
--   A가 자기 틀에 댓글 → 알림 없음(셀프 제외)
