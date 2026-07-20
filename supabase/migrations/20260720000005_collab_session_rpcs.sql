-- Pairy · H-07 협업 서버 배선 — 로그인 필수 2인 세션 RPC (2026-07-20 · DL-0006 · DL-0007)
--
-- 왜: useCollabSession 이 전량 localStorage/BroadcastChannel stub 이라 다른 기기에서 참여 불가
--     (2차 감사 H-07). collab_sessions 테이블·RLS(H-1 봉합)·Realtime 은 이미 존재하나 미배선.
-- 결정(DL-0007): host·guest 모두 로그인 필수 → 참가자 신원 = auth.uid(서버 진실). 2인 고정.
-- 참가자 JSONB 형식: {id, name, avatar, isHost, joinedAt}. id = auth.uid →
--     기존 RLS "Host or participant can select session"(20260706000000:68-77)의 p->>'id' 와 정합.
-- 모두 SECURITY DEFINER: 참여 전(참가자 아님) 세션 조회·profiles 이름 조회를 위해 owner 권한 필요.
--     각 함수가 auth.uid()·host_id 를 직접 검증하므로 우회 불가. execute 는 authenticated 만.

begin;

-- 내부 헬퍼: 프로필에서 참가자 객체 생성(직접 호출 불가 — 다른 definer 함수 내부에서만)
create or replace function public._collab_participant(p_uid uuid, p_is_host boolean)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'id', p_uid::text,
    'name', coalesce(pr.display_name, pr.username, '사용자'),
    'avatar', pr.avatar_url,
    'isHost', p_is_host,
    'joinedAt', (extract(epoch from now()) * 1000)::bigint
  )
  from public.profiles pr where pr.id = p_uid;
$$;

-- 세션 생성 (host = auth.uid, 2인 고정)
create or replace function public.create_collab_session(
  p_invite_code text,
  p_template_id uuid default null,
  p_work_id uuid default null
)
returns public.collab_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row public.collab_sessions;
begin
  if v_uid is null then raise exception 'auth required'; end if;
  insert into public.collab_sessions
    (host_id, invite_code, template_id, work_id, participants, max_participants, status)
  values
    (v_uid, p_invite_code, p_template_id, p_work_id,
     jsonb_build_array(public._collab_participant(v_uid, true)), 2, 'waiting')
  returning * into v_row;
  return v_row;
end;
$$;

-- 세션 참가 (원자적 정원 체크 + 참가자 추가 — strategy §5 "3인+ 금지" = max 2 강제)
create or replace function public.join_collab_session(p_invite_code text)
returns public.collab_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row public.collab_sessions;
begin
  if v_uid is null then raise exception 'auth required'; end if;

  select * into v_row from public.collab_sessions
   where invite_code = p_invite_code
     and status in ('waiting','active')
     and expires_at > now()
   limit 1;
  if v_row.id is null then raise exception 'session not found'; end if;

  -- 이미 host 이거나 참가자면 멱등 반환
  if v_row.host_id = v_uid
     or exists (select 1 from jsonb_array_elements(v_row.participants) e where e->>'id' = v_uid::text) then
    return v_row;
  end if;

  -- 원자적: 정원 미만일 때만 추가(UPDATE 행 잠금 하 조건부). 동시 join 경합에서 한 명만 통과.
  update public.collab_sessions
     set participants = participants || public._collab_participant(v_uid, false),
         status = 'active'
   where id = v_row.id
     and jsonb_array_length(participants) < max_participants
   returning * into v_row;

  if v_row.id is null then raise exception 'session full'; end if;
  return v_row;
end;
$$;

-- 나가기 (호스트가 나가면 세션 완료, 게스트는 목록서 제거)
create or replace function public.leave_collab_session(p_session_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := (select auth.uid()); v_host uuid;
begin
  if v_uid is null then raise exception 'auth required'; end if;
  select host_id into v_host from public.collab_sessions where id = p_session_id;
  if v_host is null then return; end if;
  if v_host = v_uid then
    update public.collab_sessions set status='completed', completed_at=now() where id=p_session_id;
  else
    update public.collab_sessions
       set participants = coalesce(
         (select jsonb_agg(e) from jsonb_array_elements(participants) e where e->>'id' <> v_uid::text),
         '[]'::jsonb)
     where id=p_session_id;
  end if;
end;
$$;

-- 종료 (호스트만)
create or replace function public.end_collab_session(p_session_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'auth required'; end if;
  update public.collab_sessions set status='completed', completed_at=now()
   where id=p_session_id and host_id=v_uid;
end;
$$;

-- 추방 (호스트만, 본인 제외)
create or replace function public.kick_collab_participant(p_session_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'auth required'; end if;
  if p_user_id = v_uid then return; end if;
  update public.collab_sessions
     set participants = coalesce(
       (select jsonb_agg(e) from jsonb_array_elements(participants) e where e->>'id' <> p_user_id::text),
       '[]'::jsonb)
   where id=p_session_id and host_id=v_uid;
end;
$$;

-- 권한: 직접 실행은 authenticated 만(_collab_participant 는 내부 전용 → grant 안 함)
revoke all on function public._collab_participant(uuid, boolean) from public;
revoke all on function public.create_collab_session(text, uuid, uuid) from public;
revoke all on function public.join_collab_session(text) from public;
revoke all on function public.leave_collab_session(uuid) from public;
revoke all on function public.end_collab_session(uuid) from public;
revoke all on function public.kick_collab_participant(uuid, uuid) from public;
grant execute on function public.create_collab_session(text, uuid, uuid) to authenticated;
grant execute on function public.join_collab_session(text) to authenticated;
grant execute on function public.leave_collab_session(uuid) to authenticated;
grant execute on function public.end_collab_session(uuid) to authenticated;
grant execute on function public.kick_collab_participant(uuid, uuid) to authenticated;

commit;

-- 검증:
--   (A 로그인) select create_collab_session('ABC123', null, null) → host=A, participants=[A], max=2
--   (B 로그인) select join_collab_session('ABC123')             → participants=[A,B], status=active
--   (C 로그인) select join_collab_session('ABC123')             → exception 'session full' (2인 초과 차단)
--   (anon)     select join_collab_session('ABC123')             → exception 'auth required'/권한 거부
--   (B) select kick_collab_participant(id, A)                   → 무변경(호스트 아님)
--   (A) select end_collab_session(id)                           → status=completed
