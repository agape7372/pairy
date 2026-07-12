-- Pairy · 팔로우 카운트 트리거 (2026-07-12)
--
-- 왜: base_schema 에 like_count·comment_like_count 트리거는 있으나
--     follows → profiles.follower_count/following_count 갱신 트리거가 없어,
--     팔로우가 성공해도 카운트가 0 에 정체(감사 지적).
-- 조치: follows insert/delete 시 양쪽 profiles 카운트를 원자 갱신.

begin;

create or replace function public.sync_follow_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set follower_count = follower_count + 1 where id = new.following_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
  elsif (tg_op = 'DELETE') then
    update public.profiles set follower_count = greatest(0, follower_count - 1) where id = old.following_id;
    update public.profiles set following_count = greatest(0, following_count - 1) where id = old.follower_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trigger_sync_follow_counts on public.follows;
create trigger trigger_sync_follow_counts
  after insert or delete on public.follows
  for each row execute function public.sync_follow_counts();

commit;
