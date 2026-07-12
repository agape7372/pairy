-- Pairy · 마켓 단건구매 + 정산 원장 (M4/C-4, 2026-07-12)
--
-- 왜: (1) 유료 틀 "구매"가 localStorage 데모 — payments 인프라(DL-0005) 재사용으로 실결제화.
--     (2) purchases 의 기존 INSERT 정책이 금액·상태 무검증이라 클라가 유료 구매를 위조 삽입
--         가능(F-27 구멍) → 유료 기록은 service_role(confirm 라우트)만, 클라는 무료(0원)만.
--     (3) 정산 신청이 localStorage — 서버 원장(payout_requests) 최소 기록.

begin;

-- 1) payments 에 결제 대상 틀 (null = 구독 결제)
alter table public.payments
  add column if not exists template_id uuid references public.templates(id) on delete set null;

-- 2) purchases 위조 삽입 차단: 클라 INSERT 는 무료(0원) 확정 기록만.
--    유료 확정 기록은 /api/payments/confirm (service_role, RLS 우회) 이 삽입.
drop policy if exists "Users can create purchases" on public.purchases;
create policy "Users can record free purchases"
  on public.purchases for insert
  with check (
    buyer_id = (select auth.uid())
    and amount = 0
    and status = 'completed'
  );

-- 같은 틀 중복 구매 방지 (확정 기록 기준)
create unique index if not exists uq_purchases_buyer_template
  on public.purchases(buyer_id, template_id)
  where status = 'completed';

-- 3) 크리에이터가 자기 틀의 판매 기록을 볼 수 있게 (수익 집계 근거, F-27 후속)
drop policy if exists "Creators can view own template sales" on public.purchases;
create policy "Creators can view own template sales"
  on public.purchases for select
  using (
    exists (
      select 1 from public.templates t
      where t.id = template_id
        and t.creator_id = (select auth.uid())
    )
  );

-- 4) 정산 신청 서버 원장 (최소 기록 — 처리는 운영자 수동)
do $$ begin
  create type public.payout_status as enum ('pending', 'processing', 'completed', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount > 0),
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  status public.payout_status not null default 'pending',
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_payout_requests_user
  on public.payout_requests(user_id, created_at desc);

alter table public.payout_requests enable row level security;

drop policy if exists "Users select own payout requests" on public.payout_requests;
create policy "Users select own payout requests"
  on public.payout_requests for select using (user_id = (select auth.uid()));
drop policy if exists "Users insert own payout requests" on public.payout_requests;
create policy "Users insert own payout requests"
  on public.payout_requests for insert
  with check (user_id = (select auth.uid()) and status = 'pending');
-- UPDATE/DELETE 정책 없음 = 상태 전이는 service_role(운영)만.

commit;

-- 검증:
--   (로그인) POST /rest/v1/purchases amount=0,status=completed → 201 / amount>0 → 42501
--   같은 틀 무료 기록 2회 → 23505 (unique)
--   POST /rest/v1/payout_requests 본인+pending → 201 / status=completed → 42501
