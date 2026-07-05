# F-32 테마(라이트/다크)+애니모드(doodle/premium)   [orphan(정정!)]

**WHAT**: 라이트/다크모드 전환 + doodle/premium 애니메이션 모드. `src/stores/themeStore.ts`(114줄, 직접 확인), `src/contexts/AnimationContext.tsx`(135줄).

**현재상태**: orphan(FACT, 직접 확인 완료 — 이중으로 재검증됨). `useThemeInitializer()`(themeStore.ts:99-114행)가 앱 시작 시 시스템 테마 리스너 등록 + 초기 `setMode`/`setAnimationMode` 호출을 담당하도록 설계됐으나, **`src/components/providers/Providers.tsx`(전체 24줄 직접 확인)에 `ErrorBoundary`+`ToastProvider`만 있고 `useThemeInitializer` 호출이 없음** — `layout.tsx`에도 없음. 즉 이 훅은 **정의만 되고 앱의 어떤 곳에서도 마운트되지 않아 다크모드가 실제로 전혀 작동 안 함**(CSS 변수·`data-theme` 속성이 절대 세팅되지 않음). 다크모드 토글 UI 버튼 자체도 발견되지 않음(별도 결함). `AnimationContext.tsx`의 `AnimationProvider`(79-82행대)도 마찬가지로 `Providers.tsx`에 마운트 안 됨 — **애니메이션 시스템이 themeStore(animationMode 필드)와 AnimationContext 두 곳에 이중 존재**하며 둘 다 실제 앱 트리에 연결 안 됨.

**추가 확인(직접)**: `useThemeInitializer()`의 리스너 등록 로직(105-108행)이 `if (typeof window !== 'undefined')` 블록 안에서 매 렌더마다 실행되도록 작성돼 있어(조건부 훅 호출과 유사한 패턴 — 컴포넌트 body에 직접 있고 useEffect로 감싸여 있지 않음), 이 훅을 나중에 그냥 호출하기만 해도 `addEventListener`가 클린업 없이 반복 등록되는 **리스너 누수** 위험이 있음(감사 원문 "리스너 leak 수정 후 배선"의 근거).

**스펙정합**: 03-design-system.md의 다크모드 반전 스펙(딸기크림 파스텔 톤 유지) 자체는 themeStore·CSS 변수 설계에 반영됐으나, 초기화 미호출로 **스펙이 문서화된 그대로 코드에 존재하는데 실행되지 않는** 가장 순수한 "완성-미배선" 사례.

**문제·리스크**: 사용자 관점에서 다크모드가 전혀 작동 안 함(Medium — 기능 결손이나 데이터 손실은 아님). 리스너 leak은 배선 시점에 즉시 고쳐야 할 선행 버그.

**Fable판정**: **수정(저비용 고가치)** — 메타 발견의 "완성-미배선 즉시 연결" 원칙의 대표 사례. TOP50 #20에도 명시적으로 등재됨.

**다음작업**:
1. **(선행)** `useThemeInitializer()`(themeStore.ts:99-114)의 리스너 등록을 `useEffect` + 클린업(`removeEventListener`)으로 재작성 — AC: 컴포넌트 리마운트/재렌더 시 리스너 중복 등록 없음(수동 카운트 확인). (Sonnet)
2. `Providers.tsx`(또는 `layout.tsx`)에 `useThemeInitializer()` 호출 추가 — AC: 페이지 로드 시 시스템 다크모드 설정이 실제로 `document.documentElement`에 `dark` 클래스로 반영. (Sonnet)
3. 다크모드 수동 토글 UI 컴포넌트 신규 작성(라이트/다크/시스템 3단 전환) — AC: 토글 클릭 시 즉시 테마 전환, localStorage(`pairy-theme`)에 영속. (Sonnet)
4. `AnimationContext`와 `themeStore.animationMode`의 역할 중복 정리 — 하나로 통합하거나 명확히 역할 분리 후 `AnimationProvider`를 `Providers.tsx`에 마운트. (Sonnet)

**의존·순서**: 1→2 순서 필수(리스너 누수 수정 없이 배선하면 즉시 신규 버그 생성). 3·4번은 2번 이후 독립적으로 진행 가능. 다른 기능과 의존관계 없음 — 즉시 착수 가능한 고립된 저비용 작업.
