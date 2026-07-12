# DL-0004 — 구독 2티어 확정 + 서버 진실 이전 (C-3 봉합)

- 상태: DECIDED · 부분 실행(결제 웹훅 defer)
- 일자: 2026-07-12
- 판단 주체: Fable(티어 구조·설계) + 사용자(범위·티어 승인)
- 관련: F-26·F-28, 감사 C-3/C-4, strategy-genome "4단계 구독 난립 지양", [[DL-0002]]

## 맥락 / 문제
구독 tier 가 클라이언트 localStorage(`pairy-subscription`)에만 존재 → 브라우저 콘솔로 `tier='creator'` 조작 시 영구 프리미엄(감사 C-3 확정 익스플로잇). 게다가 티어 4종(free/premium/duo/creator)은 MVP 원칙("2인 페어틀 올인")과 충돌하는 스코프 스프롤.

## 결정
1. **서버 구독 티어 = free + premium 2티어.** creator 는 구독 티어가 아니라 `is_creator` 플래그(판매 자격)로 분리. duo(2인 공동구독)는 게놈대로 **동결**.
2. **구독 진실의 원천 = `profiles.subscription_tier`·`subscription_valid_until` 서버 컬럼**(별도 entitlements 테이블 대신 profiles 확장 — `role` 과 동일 패턴, 배선 최소). 클라 UPDATE 차단(컬럼 GRANT 제외), 부여는 결제 웹훅/service_role 만.
3. 클라 `SubscriptionTier`(4종)·duo/creator 훅은 **삭제하지 않고 유지**(광범위 소비처 파손 방지) — 단 서버 동기화(`syncFromServer`)는 2티어만 주입하고, tier 변경 액션은 프로덕션에서 no-op.

## 왜 이렇게
- **왜 profiles 확장(별도 테이블 X)**: `role` 자가승격 차단을 이미 갖춘 테이블이라 동일 REVOKE 패턴 재사용 + `useUser` 가 이미 profiles 를 읽어 클라 배선이 1곳. 구독-역할 정합도 한 행에서 관측.
- **왜 타입 삭제 안 함**: `SubscriptionTier`/`useIsDuo` 등이 14개 파일에서 소비됨. 이번 목표는 C-3 봉합이지 리팩터가 아니므로, 동결(신규 경로 차단)이 삭제보다 리스크·범위 면에서 옳다.
- **왜 결제 웹훅 defer**: 실 구독 부여엔 결제 백엔드가 필요(Tier 0 #6). 결제 없이도 "클라가 tier 를 진실로 주장"하는 C-3 뿌리는 서버 컬럼+REVOKE 로 지금 끊긴다. 결제 전엔 아무도 premium 이 아닌 게 정상(안전 상태).
- **왜 F-28 콘텐츠 RLS defer**: 편집 데이터가 로컬 JSON 서빙이라 보호 대상이 서버에 없음(F-28 갱신 참조). `is_premium_active()` 참조점만 미리 심어둠.

## 실행 (완료)
- `20260712000002_subscription_entitlement.sql`: subscription_tier enum·컬럼, 컬럼 REVOKE(자가승격 차단), `is_premium_active(uid)` definer.
- 클라: `useUser`→`syncFromServer`, subscribe/startTrial/setDemoTier/toggleDemoMode 데모 가드, 프로덕션 subscription persist 제외.
- 라이브 검증: anon PATCH `subscription_tier`/`subscription_valid_until` → 42501. jest 3종.

## 되돌림 기준
duo/creator 를 정식 상품으로 되살리면 이 결정의 "2티어" 부분을 재검토(서버 enum 확장). 서버 진실·자가승격 차단 자체는 유지.
