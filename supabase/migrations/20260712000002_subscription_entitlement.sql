-- Pairy · C-3/C-4 서버 entitlement — 구독 상태를 서버 진실로 (2026-07-12)
--
-- 왜: 구독 tier 가 클라이언트 localStorage(pairy-subscription)에만 있어
--     브라우저 콘솔로 tier='creator' 조작 → 영구 프리미엄(감사 C-3 확정 익스플로잇).
-- 조치: 구독 상태를 profiles 서버 컬럼으로. role 과 동일하게 클라 UPDATE 차단(부여는 결제 웹훅/service_role 만).
-- 티어 정책(사용자 승인 2026-07-12): free + premium 2티어. creator 는 is_creator 플래그로 분리.
--     duo/creator 구독 티어는 게놈대로 동결(클라 타입엔 남기되 서버 진실엔 free/premium 만).

begin;

-- 구독 티어 enum (서버 진실은 2티어. 클라 SubscriptionTier 4종은 동결 잔재)
do $$ begin
  create type public.subscription_tier as enum ('free', 'premium');
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists subscription_tier public.subscription_tier not null default 'free',
  add column if not exists subscription_valid_until timestamptz;

comment on column public.profiles.subscription_tier is
  '구독 등급(서버 진실). 클라이언트 직접 변경 불가(GRANT 제외). 부여는 결제 웹훅/service_role 만.';

-- C-3 봉합: 구독 컬럼을 허용 UPDATE 목록에서 제외해 자가승격 차단.
-- 20260712000001 의 "테이블 REVOKE 후 허용 컬럼만 GRANT" 패턴 재적용
-- (subscription_tier·subscription_valid_until·role·earnings 는 GRANT 목록에 없음 = 클라 변경 불가).
revoke update on public.profiles from authenticated, anon;
grant update (username, display_name, avatar_url, bio,
              is_creator, follower_count, following_count, updated_at)
  on public.profiles to authenticated;

-- 구독 유효성 판정 (SECURITY DEFINER — 미래 프리미엄 리소스 RLS 의 참조점).
-- premium 이고 만료 전(또는 무기한)이면 true.
create or replace function public.is_premium_active(p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = p_uid
      and subscription_tier = 'premium'
      and (subscription_valid_until is null or subscription_valid_until > now())
  );
$$;

grant execute on function public.is_premium_active(uuid) to authenticated, anon;

commit;

-- 검증 (anon/authenticated REST):
--   PATCH profiles {"subscription_tier":"premium"}        → 42501 permission denied for table profiles
--   PATCH profiles {"subscription_valid_until":"2099..."} → 42501
--   PATCH profiles {"display_name":"x"} (본인)            → 정상
--   select public.is_premium_active(auth.uid())           → false (결제 전엔 아무도 premium 아님 = 안전 상태)
