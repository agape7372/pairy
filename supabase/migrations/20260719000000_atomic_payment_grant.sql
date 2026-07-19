-- Pairy · 결제 확정+부여 원자화 (2026-07-19)
--
-- 왜: confirm 라우트가 "payments=paid 전환"과 "부여(grant_subscription/purchases)"를
--     별개 호출로 수행 — 전환 직후 서버가 죽으면 재시도가 already-paid 로 부여를 건너뛰어
--     돈은 냈는데 권한이 없는 상태가 됐다(#104 리뷰에서 주석으로 명시했던 비원자성).
-- 조치: 단일 트랜잭션 SECURITY DEFINER RPC. granted_at 이 멱등 앵커 —
--     행 잠금 후 granted_at 존재 시 'already', 아니면 전환+부여를 함께 커밋.

begin;

-- 부여 완료 시각 = 멱등 앵커. paid 인데 granted_at 이 없으면 "부여 미완" 재시도 대상.
alter table public.payments
  add column if not exists granted_at timestamptz;

-- 백필: 이 마이그레이션 이전에 확정된 결제는 부여도 완료된 상태였다 — 재부여 방지.
update public.payments
   set granted_at = updated_at
 where status = 'paid' and granted_at is null;

create or replace function public.confirm_payment_and_grant(
  p_payment_id uuid,
  p_payment_key text
)
returns text -- 'granted' | 'already'
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.payments;
begin
  select * into v from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;

  -- 이미 부여 완료 — 멱등 (동시 확정 경합의 패자도 여기로)
  if v.granted_at is not null then
    return 'already';
  end if;

  update public.payments
     set status = 'paid',
         payment_key = coalesce(p_payment_key, payment_key),
         granted_at = now(),
         updated_at = now()
   where id = p_payment_id;

  if v.template_id is not null then
    -- 단건구매: 확정 기록 (partial unique 와 함께 이중 멱등)
    insert into public.purchases (buyer_id, template_id, amount, currency, status)
    values (v.user_id, v.template_id, v.amount, 'KRW', 'completed')
    on conflict (buyer_id, template_id) where (status = 'completed') do nothing;
  else
    -- 구독 부여 (기존 SECURITY DEFINER 재사용 — 연장 로직 포함)
    perform public.grant_subscription(v.user_id, v.grant_days);
  end if;

  return 'granted';
end;
$$;

-- service_role(confirm 라우트)만 — 클라이언트 부여 경로 차단.
revoke all on function public.confirm_payment_and_grant(uuid, text) from public;

commit;

-- 검증:
--   (service_role) select confirm_payment_and_grant('<pending-id>', 'pk') → 'granted',
--     payments.status='paid'·granted_at 설정·구독/구매 부여 확인
--   같은 호출 재실행 → 'already', 구독 만료일 불변(이중 연장 없음)
--   (authenticated) 호출 → 42501
