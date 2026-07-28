-- Optimize private collaboration-channel authorization.
--
-- Realtime evaluates realtime.messages RLS while a client joins a private
-- channel. The original policy built a topic string for every visible session,
-- which cannot use collab_sessions_pkey and also evaluates that table's RLS.
-- Parse the capability topic once, then perform one security-definer PK lookup.

begin;

create or replace function public.can_subscribe_collab_topic(p_topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_prefix constant text := 'collab-yjs:';
  v_parts text[];
  v_session_id uuid;
  v_realtime_key uuid;
begin
  if v_uid is null
     or p_topic is null
     or length(p_topic) > 128
     or left(p_topic, length(v_prefix)) <> v_prefix then
    return false;
  end if;

  v_parts := string_to_array(
    substr(p_topic, length(v_prefix) + 1),
    ':'
  );

  if coalesce(array_length(v_parts, 1), 0) <> 2
     or nullif(v_parts[1], '') is null
     or nullif(v_parts[2], '') is null then
    return false;
  end if;

  begin
    v_session_id := v_parts[1]::uuid;
    v_realtime_key := v_parts[2]::uuid;
  exception
    when invalid_text_representation then
      return false;
  end;

  return exists (
    select 1
    from public.collab_sessions as session
    where session.id = v_session_id
      and session.realtime_key = v_realtime_key
      and session.status in ('waiting', 'active')
      and session.expires_at > now()
      and (
        session.host_id = v_uid
        or coalesce(session.participants, '[]'::jsonb) @>
          jsonb_build_array(jsonb_build_object('id', v_uid::text))
      )
  );
end;
$$;

revoke all on function public.can_subscribe_collab_topic(text) from public;
revoke all on function public.can_subscribe_collab_topic(text) from anon;
grant execute on function public.can_subscribe_collab_topic(text)
  to authenticated;

comment on function public.can_subscribe_collab_topic(text) is
  'Authorizes the current JWT for one collab-yjs:<session>:<key> topic using a PK lookup.';

drop policy if exists "Pairy collab members can receive realtime"
  on realtime.messages;

create policy "Pairy collab members can receive realtime"
  on realtime.messages
  for select
  to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (
      select public.can_subscribe_collab_topic(
        (select realtime.topic())
      )
    )
  );

commit;
