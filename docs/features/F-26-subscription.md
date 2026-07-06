# F-26 구독(free/premium/duo/creator)   [demo(C-3)]

**WHAT**: 4단계 구독 티어 관리. `src/stores/subscriptionStore.ts`(517줄).

**현재상태**: demo(FACT, C-3). 티어 4종(7행 `SubscriptionTier = 'free' | 'premium' | 'creator' | 'duo'`), `TIER_LIMITS`(43-108행, 티어별 export/download/저장/협업자/스토리지 한도), `PRICING`(111-123행: premium 월 2,900원, duo 월 3,900원/인당 1,950원+보너스크레딧5, creator 월 4,900원). `subscribe()`(209-233행)는 상태를 set한 뒤 **결제 백엔드 호출 없이 localStorage(`persist` 미들웨어, 467-474행, 키 `pairy-subscription`)에만 저장** — 즉시 모든 프리미엄 혜택(워터마크 제거·무제한 export·프리미엄 템플릿) 활성화. `isDemoMode: true`가 기본값(201행)이며 `setDemoTier()`(460-464행)로 티어를 임의 조작 가능.

**스펙정합**: 00-overview.md:144의 "2인 페어틀 하나에 올인" MVP 원칙과 정면 충돌 — 4단계 구독(free/premium/duo/creator) 자체가 스코프 스프롤. 가격 모순도 확인: `premium/page.tsx`:87행대는 "수익 배분 70%"를 명시하나 `marketplaceStore.ts`의 `COMMISSION_RATE=0.2`(20% 수수료→80% 크리에이터 몫)와 불일치 — 70% vs 80% 중 어느 것이 정본인지 코드상 확정 불가.

**문제·리스크**: **C-3(치명)** — 브라우저 콘솔에서 `localStorage.setItem('pairy-subscription', ...)`으로 tier를 'creator'로 조작하면 영구 무료 프리미엄 획득(감사 §5 해커 관점 확정 익스플로잇 #2). 가격/수수료 이중 정의(70%/80%)는 별도의 정합성 결함(TOP50 #13).

**Fable판정**: **축소 — 4→2티어 + 서버검증**. 4단계 난립은 MVP 원칙 위반이므로 축소가 우선, 그 위에 서버검증을 얹는다. 구체적으로 몇 개로 줄일지, duo/creator를 어떻게 통폐합할지는 Fable의 재확인이 필요한 전략 판단(하위 모델이 임의로 결정하지 말 것).

**다음작업**:
1. **(Fable 판단 필요)** 4티어(free/premium/duo/creator) 중 어느 것을 유지·병합할지 결정 — strategy-genome.md(§8-4, 예정)에 "4단계 구독 난립 지양"이 이미 확정 원칙으로 기록됨, 구체적 통폐합안만 확정 필요. (Fable)
2. 결정된 티어 구조로 `TIER_LIMITS`·`PRICING` 재정의, 가격/수수료 모순(70%/80%) 해소해 단일 정본화 — AC: premium/page.tsx와 marketplaceStore.ts의 수치가 일치. (Sonnet)
3. `subscribe()`를 서버 검증 경로(결제 완료 웹훅 확인 후에만 티어 변경)로 교체, localStorage는 캐시로 강등 — AC: localStorage 직접 조작으로 티어 변경 불가. (Opus, 결제 백엔드 선행)

**의존·순서**: 1번(Fable 판단)이 최우선 선행 — 이후 2·3번. 3번은 결제 백엔드(F-24~28 전체가 공유하는 선행조건) 완료 후. F-17(캐릭터 프리미엄 제한)도 이 티어 구조에 종속.
