-- Pairy · H-09 봉합 — Whisper SECURITY DEFINER 함수·상태전이 공격면 축소 (2026-07-20)
--
-- 왜(2차 감사 H-09 CONFIRMED · .gpt5.6sol.md · DL-0006): Whisper 기능은 defer(DL-0003)이나
--   DB 공격면이 열려 있다. 20250107_create_whispers.sql 의
--   (1) send_scheduled_whispers()·get_unread_whisper_count(uuid) 가 SECURITY DEFINER 인데
--       EXECUTE revoke 가 없어 기본 PUBLIC 실행 가능(형제 함수 get_collab_session_by_invite·
--       grant_subscription 은 revoke 함).
--   (2) get_unread_whisper_count 가 임의 user_id 를 받아 타인 unread count 유출.
--   (3) 수신자 UPDATE 정책이 OLD→NEW 전이를 강제 못 함(RLS WITH CHECK 는 OLD 참조 불가) →
--       SENT 건너뛰고 CLAIMED 로 점프 가능.
-- 조치: EXECUTE 봉인 + 무인자화(auth.uid 고정) + BEFORE UPDATE 상태전이 트리거.
-- 범위: 기능은 defer 유지 — 페이지·훅·전송 플로우는 건드리지 않는다(DL-0003 존중).

begin;

-- (1) 예약 발송 함수: service_role(크론/엣지) 만 실행
revoke all on function public.send_scheduled_whispers() from public;
revoke all on function public.send_scheduled_whispers() from anon, authenticated;
grant execute on function public.send_scheduled_whispers() to service_role;

-- (2) 미확인 카운트: 임의 user_id 제거 → auth.uid() 고정. 앱 호출 0건이라 시그니처 변경 안전.
drop function if exists public.get_unread_whisper_count(uuid);

create or replace function public.get_unread_whisper_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int
  from public.whispers
  where receiver_id = (select auth.uid())
    and status = 'SENT'
    and read_at is null;
$$;

revoke all on function public.get_unread_whisper_count() from public;
grant execute on function public.get_unread_whisper_count() to authenticated;

-- (3) 상태전이 강제: PENDING→SENT(발송) · SENT→READ→CLAIMED(수신자) · *→EXPIRED(만료)만 허용.
--     SENT→CLAIMED(READ 건너뛰기)·역방향 전이 차단. RLS WITH CHECK 가 못 하는 순서를 트리거로.
create or replace function public.enforce_whisper_transition()
returns trigger
language plpgsql
as $$
begin
  if NEW.status is distinct from OLD.status then
    if not (
      (OLD.status = 'PENDING' and NEW.status in ('SENT', 'EXPIRED'))
      or (OLD.status = 'SENT' and NEW.status in ('READ', 'EXPIRED'))
      or (OLD.status = 'READ' and NEW.status in ('CLAIMED', 'EXPIRED'))
    ) then
      raise exception 'invalid whisper status transition: % -> %', OLD.status, NEW.status;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists whispers_enforce_transition on public.whispers;
create trigger whispers_enforce_transition
  before update on public.whispers
  for each row
  execute function public.enforce_whisper_transition();

commit;

-- 검증:
--   (authenticated) select public.send_scheduled_whispers()            → 42501/permission denied
--   (authenticated) select public.get_unread_whisper_count()           → 본인 count (타인 조회 불가)
--   (authenticated) select public.get_unread_whisper_count('<uuid>')   → 함수 없음(시그니처 제거)
--   whispers UPDATE status SENT→CLAIMED                                → invalid transition 예외
--   whispers UPDATE status SENT→READ, READ→CLAIMED                     → 정상
