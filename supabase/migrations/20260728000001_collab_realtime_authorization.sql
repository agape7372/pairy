-- Pairy · 협업 Realtime private-channel 권한
--
-- 채널 topic:
--   collab-yjs:<collab_sessions.id>:<collab_sessions.realtime_key>
--
-- 구독은 realtime.messages SELECT RLS가, 발행은 매 호출 멤버십을 재검증하는
-- broadcast_collab_message RPC가 담당한다. 클라이언트의 Realtime 직접 INSERT는
-- 허용하지 않는다. 참가자/상태가 바뀌면 키를 회전해 기존 연결의 발행 권한도 폐기한다.

begin;

-- 기존 세션도 즉시 사용할 수 있도록 DEFAULT가 기존 행을 채우고 NOT NULL을 보장한다.
alter table public.collab_sessions
  add column if not exists realtime_key uuid not null default gen_random_uuid();

-- 부분 적용 뒤 재실행해도 컬럼 계약을 복구한다.
update public.collab_sessions
set realtime_key = gen_random_uuid()
where realtime_key is null;

alter table public.collab_sessions
  alter column realtime_key set default gen_random_uuid(),
  alter column realtime_key set not null;

comment on column public.collab_sessions.realtime_key is
  'Private Realtime topic capability. participants/status 변경 시 서버 trigger가 회전한다.';

-- kick/leave/end와 같은 권한 경계 변경은 기존 topic을 즉시 폐기한다.
create or replace function public.rotate_collab_realtime_key()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.participants is distinct from old.participants
     or new.status is distinct from old.status then
    new.realtime_key := gen_random_uuid();
  end if;

  return new;
end;
$$;

revoke all on function public.rotate_collab_realtime_key() from public;

drop trigger if exists rotate_collab_realtime_key_on_membership
  on public.collab_sessions;

create trigger rotate_collab_realtime_key_on_membership
  before update of participants, status
  on public.collab_sessions
  for each row
  execute function public.rotate_collab_realtime_key();

-- 이전 초안이 적용된 환경에서도 클라이언트 직접 발행 정책을 제거한다.
drop policy if exists "Pairy collab members can receive realtime"
  on realtime.messages;
drop policy if exists "Pairy collab members can send realtime"
  on realtime.messages;

-- Private Broadcast 구독만 허용한다. Presence와 클라이언트 INSERT는 열지 않는다.
create policy "Pairy collab members can receive realtime"
  on realtime.messages
  for select
  to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and exists (
      select 1
      from public.collab_sessions as session
      where
        (
          'collab-yjs:'::text
          || session.id::text
          || ':'::text
          || session.realtime_key::text
        ) = (select realtime.topic())
        and session.status in ('waiting', 'active')
        and session.expires_at > now()
        and (
          session.host_id = (select auth.uid())
          or coalesce(session.participants, '[]'::jsonb) @>
            jsonb_build_array(
              jsonb_build_object('id', (select auth.uid())::text)
            )
        )
    )
  );

-- 모든 협업 발행은 이 RPC를 통과한다. SECURITY DEFINER이므로 RLS 우회 대신
-- 함수 안에서 세션 키·상태·만료·현재 멤버십을 명시적으로 매 호출 검증한다.
create or replace function public.broadcast_collab_message(
  p_session_id uuid,
  p_realtime_key uuid,
  p_event text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_current_key uuid;
  v_payload jsonb;
  v_payload_size integer;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = '28000';
  end if;

  if p_event is null or p_event not in (
    'yjs-update',
    'awareness-update',
    'request-state',
    'state-response'
  ) then
    raise exception 'COLLAB_EVENT_NOT_ALLOWED'
      using errcode = '22023';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'COLLAB_PAYLOAD_MUST_BE_OBJECT'
      using errcode = '22023';
  end if;

  -- 오른쪽 JSONB가 같은 키를 덮어쓰므로 클라이언트 userId 사칭을 제거한다.
  v_payload :=
    p_payload || jsonb_build_object('userId', v_uid::text);
  v_payload_size := octet_length(v_payload::text);

  if v_payload_size > 262144 then
    raise exception 'COLLAB_PAYLOAD_TOO_LARGE'
      using errcode = '22001';
  end if;

  select session.realtime_key
  into v_current_key
  from public.collab_sessions as session
  where session.id = p_session_id
    and session.realtime_key = p_realtime_key
    and session.status in ('waiting', 'active')
    and session.expires_at > now()
    and (
      session.host_id = v_uid
      or coalesce(session.participants, '[]'::jsonb) @>
        jsonb_build_array(jsonb_build_object('id', v_uid::text))
    )
  limit 1;

  -- 세션 존재 여부, 키 오류, 만료, 비멤버를 동일 오류로 처리해 정보 누출을 줄인다.
  if v_current_key is null then
    raise exception 'COLLAB_MESSAGE_FORBIDDEN'
      using errcode = '42501';
  end if;

  perform realtime.send(
    v_payload,
    p_event,
    'collab-yjs:'::text
      || p_session_id::text
      || ':'::text
      || v_current_key::text,
    true
  );
end;
$$;

revoke all on function public.broadcast_collab_message(
  uuid,
  uuid,
  text,
  jsonb
) from public;
revoke all on function public.broadcast_collab_message(
  uuid,
  uuid,
  text,
  jsonb
) from anon;
revoke all on function public.broadcast_collab_message(
  uuid,
  uuid,
  text,
  jsonb
) from authenticated;
grant execute on function public.broadcast_collab_message(
  uuid,
  uuid,
  text,
  jsonb
) to authenticated;

comment on function public.broadcast_collab_message(uuid, uuid, text, jsonb) is
  '활성 협업 멤버의 허용 event만 private Realtime topic에 발행한다. '
  '매 호출 현재 키/멤버십 검증, userId 서버 강제, payload 256KB 제한.';

commit;

-- 라이브 검증:
-- 1) host/현재 participant + 현재 realtime_key → private subscribe/RPC 성공
-- 2) 비멤버·잘못된 key·completed/expired 세션 → subscribe/RPC 실패
-- 3) kick/leave/status 변경 → realtime_key 변경, 이전 key RPC 즉시 42501
-- 4) 허용 외 event·비객체·256KB 초과 payload → 22023/22001
-- 5) payload.userId는 호출자의 auth.uid()로 덮어써서 수신
