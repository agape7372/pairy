# DL-0005 — 결제 백엔드 스캐폴드 (구독 1회성, Toss 테스트모드)

- 상태: DECIDED · 실행(env 주입 후 실 E2E)
- 일자: 2026-07-12
- 판단 주체: Fable(설계) + 사용자(스코프·방식 승인)
- 관련: Tier 0 #6, [[DL-0004]](구독 서버 진실), F-24·F-26·F-27·F-28, 감사 C-3/C-4

## 맥락
DL-0004 로 구독 진실을 서버 컬럼(`profiles.subscription_tier`)으로 옮기고 클라 부여를 42501 로 막았으나, **정당한 부여 경로(결제)가 없어** 아무도 premium 이 될 수 없었다(안전하나 미완). 결제 백엔드가 C-3 봉합의 마지막 조각.

## 결정 (사용자 승인)
1. **스코프 = 구독(premium)만.** 마켓 단건 구매(F-24/F-27)는 결제 인프라 재사용해 후속.
2. **결제 방식 = 1회성 30일.** Toss 빌링(자동결제)은 사업자+심사 문턱이 높아 제외 — 만료 후 재결제.
3. **Toss 테스트모드 스캐폴드.** 사업자·실키 없음 → 공개 테스트 키로 전체 흐름 구축. 실 상점 계약 후 `TOSS_SECRET_KEY`/`NEXT_PUBLIC_TOSS_CLIENT_KEY` 교체만으로 실결제 전환.

## 설계 — 보안 3방어선
- **금액 위조 차단**: `prepare` 에서 서버가 orderId·amount 발급(클라는 tier 만). `confirm` 은 payments row 금액으로 Toss 승인·대조.
- **멱등**: `payments.order_id` unique + `confirm` 의 `status='paid'` 가드 + `update ... where status='pending'`(경합 1회). Toss `Idempotency-Key`=orderId.
- **부여는 service_role Route Handler 만**: `grant_subscription` definer 는 public REVOKE. 웹훅은 **부여하지 않음**(취소/실패 동기화만) — 위조 웹훅이 프리미엄을 부여하지 못하게.

## 구성
- 마이그레이션 `20260712000003_payments`: payments 테이블·RLS·grant_subscription.
- Route Handler: `app/api/payments/{prepare,confirm,webhook}`.
- 클라: `useSubscriptionCheckout`(Toss 결제창), `/payments/success`(confirm)·`/fail`, premium 페이지 프로덕션 분기.
- env: `NEXT_PUBLIC_TOSS_CLIENT_KEY`·`TOSS_SECRET_KEY`(테스트), `SUPABASE_SERVICE_ROLE_KEY`(서버 부여).

## 왜 웹훅으로 부여 안 하나
웹훅은 서명/IP 검증 전엔 위조 가능. 부여를 웹훅에 두면 위조 1건 = 무료 프리미엄. 그래서 **부여는 오직 confirm(로그인 유저 = 주문 소유자 + Toss 승인 재조회)**. 웹훅은 이미 확정된 결제를 뒤집지 않고(`neq status paid`), 취소/만료만 반영.

## 되돌림 / 후속
- 실 상점 계약 시: 키 교체 + 웹훅 서명 검증 강화 + 환불/정산.
- 자동결제 필요 시: Toss 빌링키 전환(별도 DL).
- 마켓 단건(F-24/F-27): payments 테이블에 template_id·종류 추가해 재사용.
