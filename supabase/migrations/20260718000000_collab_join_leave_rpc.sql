-- Pairy · 협업 세션 참가/이탈 RPC (C-5 배선, 2026-07-18)
--
-- 왜: H-1 봉합 후 collab_sessions UPDATE 정책이 호스트 전용이라, 게스트가 자신을
--     participants 에 추가/제거할 수 없음 → 초대코드 참가 흐름이 서버로 갈 수 없었다.
--     get_collab_session_by_invite(조회, 20260706)에 이어 쓰기 경로를 SECURITY DEFINER 로 제공.
--     participants 항목의 id 는 서버에서 auth.uid() 로 강제 — 클라가 타인 신원으로 참가 불가.

begin;

-- 1) 참가: 초대코드 검증 → 자신을 participants 에 추가 (멱등)
create or replace function public.join_collab_session(
  p_invite_code text,
  p_name text,
  p_color text default null,
  p_avatar text default null
)
returns public.collab_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_session public.collab_sessions;
  v_participant jsonb;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- 행 잠금으로 동시 참가 race 에서 정원 초과 방지
  select * into v_session
  from public.collab_sessions
  where invite_code = upper(trim(p_invite_code))
    and status in ('waiting', 'active')
    and expires_at > now()
  for update;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  -- 이미 참가한 경우 멱등 반환
  if exists (
    select 1 from jsonb_array_elements(v_session.participants) as p
    where p->>'id' = v_uid::text
  ) then
    return v_session;
  end if;

  if jsonb_array_length(v_session.participants) >= v_session.max_participants then
    raise exception 'SESSION_FULL';
  end if;

  -- 신원(id)은 서버가 강제. 표시 정보만 클라 입력을 받되 길이 제한.
  v_participant := jsonb_build_object(
    'id', v_uid::text,
    'name', left(coalesce(nullif(trim(p_name), ''), '게스트'), 50),
    'color', left(coalesce(p_color, ''), 20),
    'avatar', left(coalesce(p_avatar, ''), 500),
    'zone', null,
    'isHost', false,
    'joinedAt', (extract(epoch from now()) * 1000)::bigint,
    'isOnline', true
  );

  update public.collab_sessions
     set participants = participants || jsonb_build_array(v_participant),
         status = 'active'
   where id = v_session.id
   returning * into v_session;

  return v_session;
end;
$$;

revoke all on function public.join_collab_session(text, text, text, text) from public;
grant execute on function public.join_collab_session(text, text, text, text) to authenticated;

comment on function public.join_collab_session(text, text, text, text) is
  '초대코드로 세션 참가. participants 의 id 는 auth.uid() 강제, 정원/만료 검증, 멱등. '
  '앱: useCollabSession.joinSession (C-5).';

-- 2) 이탈: 자신을 participants 에서 제거. 호스트 이탈 또는 전원 이탈 시 세션 종료.
create or replace function public.leave_collab_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_session public.collab_sessions;
  v_remaining jsonb;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_session
  from public.collab_sessions
  where id = p_session_id
  for update;

  if not found then
    return;
  end if;

  v_remaining := coalesce(
    (
      select jsonb_agg(p)
      from jsonb_array_elements(v_session.participants) as p
      where p->>'id' <> v_uid::text
    ),
    '[]'::jsonb
  );

  if v_session.host_id = v_uid or jsonb_array_length(v_remaining) = 0 then
    -- 호스트 이탈 또는 전원 이탈 → 세션 종료 (듀오 MVP: 호스트 이전 없음)
    update public.collab_sessions
       set participants = v_remaining,
           status = 'completed',
           completed_at = now()
     where id = p_session_id;
  else
    update public.collab_sessions
       set participants = v_remaining
     where id = p_session_id;
  end if;
end;
$$;

revoke all on function public.leave_collab_session(uuid) from public;
grant execute on function public.leave_collab_session(uuid) to authenticated;

comment on function public.leave_collab_session(uuid) is
  '세션에서 자신을 제거. 호스트 이탈/전원 이탈 시 completed 처리. '
  '앱: useCollabSession.leaveSession (C-5).';

commit;

-- 검증:
--   (게스트 토큰) select join_collab_session('ABC123', '민트') → 참가된 세션 행
--   같은 호출 2회 → 동일 행(멱등), 정원 초과 → SESSION_FULL
--   (게스트 토큰) select leave_collab_session('<session-id>') → participants 에서 제거
--   (호스트 토큰) leave → status='completed'
