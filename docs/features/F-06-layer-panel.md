# F-06 레이어 패널   [real]

**WHAT**: 캔버스 내 레이어(슬롯/텍스트/스티커) 잠금·표시/숨김·순서 관리 UI. `src/components/editor/canvas/LayerPanel.tsx`(433줄).

**현재상태**: 실동작(FACT). 잠금·표시 상태의 소스가 이중화— `layerStates`(canvasEditorStore.ts:183 스토어 상태)가 권위 소스(authoritative)로 실제 사용됨: LayerPanel.tsx:305-306(`layerStates[slot.id]?.locked ?? false`), :314-315(`layerStates[text.id]?.visible === false`), :322-323(`layerStates[sticker.id]?.locked ?? false`). 반면 `templateConfig.layers`(템플릿 구성 데이터)에는 visibility/lock 속성 자체가 없음 — 즉 "이중 소스"라기보다 "설정용 config vs 런타임 상태용 layerStates"가 서로 다른 목적으로 존재하나, 이름이 유사해 혼동 소지.

**스펙정합**: 기능 자체는 04-page-layouts.md 에디터 레이아웃과 일치. 이중 명명 체계는 미문서화.

**문제·리스크**: `layerStates`와 `templateConfig`가 서로 다른 스키마(하나는 편집 중 상태, 하나는 템플릿 정의)를 갖는데 이름·역할이 명확히 문서화되어 있지 않아 신규 기여자가 "어느 것이 진짜 상태인지" 혼동 가능(Medium, 버그라기보다 가독성/유지보수 리스크). 실제 런타임 오작동 증거는 미확인.

**Fable판정**: **존치** — 오작동 증거 없음, 리팩터링 수준의 정리만 필요.

**다음작업**:
1. `layerStates`(런타임 잠금/표시 상태)와 `templateConfig.layers`(템플릿 정의)의 역할 차이를 코드 주석 또는 타입 문서로 명시 — AC: 두 구조체 옆에 JSDoc 주석 추가, 신규 기여자가 5분 내 구분 가능한지 리뷰. (Sonnet)
2. (선택) 두 구조가 실제로 병합 가능한지 검토 — 병합 시 스토어 스키마 변경 영향범위 큼, 이번 주기엔 defer 권장. (Sonnet)

**의존·순서**: 독립적. canvasEditorStore.ts 스키마 변경(F-07 히스토리 리팩터 등)과 겹치지 않도록 순서 조율.
