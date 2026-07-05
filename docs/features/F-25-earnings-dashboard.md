# F-25 수익/정산 대시보드   [demo(C-4 위조)]

**WHAT**: 크리에이터가 누적 수익·정산 내역을 확인하는 대시보드. `src/app/(main)/my/creator/page.tsx`(312줄), `src/hooks/useCreatorEarnings.ts`(115줄), `src/components/marketplace/EarningsCard.tsx`(175줄).

**현재상태**: demo(FACT, C-4 연계). creator/page.tsx:63-65행대가 `subscription.tier === 'creator'`를 클라이언트 스토어에서 읽어 대시보드 접근 여부 결정(서버 검증 없음). useCreatorEarnings.ts:25-27행대가 `useMarketplaceStore()`에서 `sales`·`payoutRequests`를 읽음 — 즉 F-24의 가짜/데모 데이터를 그대로 표시. EarningsCard.tsx:30행대는 "수수료 20% 차감 후"를 표시하나 이 20%는 하드코딩값(marketplaceStore.ts의 `COMMISSION_RATE`)이지 서버에서 계산된 실 수치가 아님.

**스펙정합**: 06-database-schema.md의 정산 스펙과 괴리 — 화면에 보이는 숫자가 F-24와 마찬가지로 클라이언트 시뮬레이션 값.

**문제·리스크**: F-24와 동일 근본 원인(C-4) — 대시보드 자체는 "보여주기"만 하므로 단독으로는 신규 익스플로잇 표면이 아니나, 위조된 숫자를 크리에이터에게 실제 수익인 것처럼 표시하는 것 자체가 신뢰 문제(High).

**Fable판정**: **defer — 결제 성립 후**. 대시보드 UI 자체를 지금 다듬는 건 낭비 — 표시할 실 데이터가 없는 상태에서 UI 개선은 우선순위 낮음.

**다음작업**:
1. F-24의 서버 원장(실 결제 웹훅 기반 판매/정산 기록)이 성립한 뒤, 이 대시보드를 그 실 데이터에 재연결 — AC: 표시되는 수익 합계가 서버 계산값과 일치(클라이언트 재계산 없음). (Opus, F-24와 사실상 같은 작업)
2. 그 전까지 "데모 데이터입니다" 배너를 대시보드 상단에 명시(F-33의 데모모드 배너 작업과 통합 가능). (Sonnet, 즉시 가능)

**의존·순서**: **선행조건**: F-24(마켓플레이스 서버검증) 완료 — 완전히 종속적인 관계, F-24 없이 이 항목만 단독 진행 무의미.
