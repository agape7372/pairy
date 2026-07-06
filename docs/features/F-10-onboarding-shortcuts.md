# F-10 온보딩/단축키   [real]

**WHAT**: 신규 사용자 에디터 투어 + 키보드 단축키 안내. `src/components/editor/canvas/OnboardingTour.tsx`(378줄), `src/components/editor/canvas/KeyboardShortcutsModal.tsx`(378줄, CanvasEditor.tsx:26행에서 import).

**현재상태**: 실동작(FACT). `DEFAULT_TOUR_STEPS`(OnboardingTour.tsx:36-68행)에 캔버스/슬롯/색상/텍스트/export 5단계 투어 정의. `useOnboarding()` 훅이 완료 상태를 localStorage(`pairy-onboarding-completed`, 74행)에 저장, `hasCompletedTour()`(76행)로 조회. KeyboardShortcutsModal은 CanvasEditor의 로컬 state(247행)로 표시 여부 제어 — 별도의 동적 단축키 등록 훅은 미발견(정적 UI 참조 모달로 보임).

**스펙정합**: 10-roadmap.md·04-page-layouts.md의 온보딩 요구사항과 일치. 별도 이탈 없음.

**문제·리스크**: 특별한 결함 미확인. 다만 KeyboardShortcutsModal이 "실제 등록된 단축키"를 동적으로 반영하는지, 아니면 정적 목록을 하드코딩했는지는 추가 확인 필요(신규 단축키 추가 시 모달이 자동 동기화되는지 불명 — Low, 문서 드리프트 리스크).

**Fable판정**: **존치** — 수정 불필요.

**다음작업**: 없음(— 표시, 감사 원문과 동일). 선택 사항으로 KeyboardShortcutsModal이 정적 목록인지 확인 후 필요시 단축키 등록부와 동기화. (Haiku, 저우선순위)

**의존·순서**: 독립적. 다른 F-01~F-09 작업과 상호 영향 없음.
