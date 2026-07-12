-- Pairy · 결제 백엔드 (Tier 0 #6) — 구독 1회성 결제 스캐폴드 (2026-07-12)
--
-- 흐름: prepare(pending row) → Toss 결제창 → confirm(승인 API + 금액대조) → grant_subscription.
-- 부여는 서버(service_role Route Handler)만 — DL-0004 "부여는 웹훅/service_role 만" 의 실체.

begin;

-- 결제 상태
do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'failed', 'canceled');
exception when duplicate_object then null;
end $$;

-- 결제 이력. order_id 는 서버 발급 unique — 멱등성의 앵커.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id text not null unique,
  payment_key text,
  -- 결제 대상 구독 등급(현재 premium 만). 금액은 서버가 정함 — 클라 위조 차단.
  tier public.subscription_tier not null default 'premium',
  amount integer not null,
  status public.payment_status not null default 'pending',
  -- 부여된 구독 기간(일). 확정 시 profiles.subscription_valid_until 계산에 사용.
  grant_days integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_user on public.payments(user_id);

alter table public.payments enable row level security;

-- 본인 결제 이력만 조회. 쓰기(INSERT/UPDATE)는 정책 없음 = service_role 만(RLS 우회).
drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments"
  on public.payments for select
  using (user_id = (select auth.uid()));

-- 구독 부여 (SECURITY DEFINER). 결제 확정 시에만 service_role Route Handler 가 호출.
-- 만료 전 재구독이면 남은 기간에 이어붙인다(연장).
create or replace function public.grant_subscription(p_uid uuid, p_days integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set subscription_tier = 'premium',
         subscription_valid_until = greatest(
           coalesce(subscription_valid_until, now()),
           now()
         ) + make_interval(days => p_days),
         updated_at = now()
   where id = p_uid;
end;
$$;

-- 클라(authenticated/anon)는 직접 부여 불가 — service_role 만.
revoke all on function public.grant_subscription(uuid, integer) from public;

commit;

-- 검증:
--   anon/authenticated: POST /rpc/grant_subscription → 42501 (권한 없음)
--   POST /rest/v1/payments (anon INSERT) → 42501 (쓰기 정책 없음)
--   GET  /rest/v1/payments (본인) → 본인 행만
