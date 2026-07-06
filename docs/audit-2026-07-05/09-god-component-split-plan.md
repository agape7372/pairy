# 09 — God-Component 분해 계획 (CanvasEditor / EditorSidebar)

> 착수 문서. 실제 코드 seam 기반. 실행은 후속(Sonnet, 각 추출 후 build+test 검증). TOP50 관련.
> **왜 계획만 하고 지금 절개 안 했나**: `CanvasEditor.tsx`(1530줄)·`EditorSidebar.tsx`(1451줄)는 제품의 핵심 편집 경로다. 상태·ref가 다수 핸들러/이펙트에 얽혀 있어, 전체를 정독·검증하지 않은 채 세션 중 대규모 절개하면 에디터 전체가 깨질 위험이 크다(되돌림 비용 큼). 안전 원칙상 **seam을 확정하고 증분 실행을 큐잉**하는 것이 올바른 착수다.

## 대상

| 파일 | 줄수 | 성격 |
|---|---|---|
| `src/components/editor/canvas/CanvasEditor.tsx` | 1530 | 편집 캔버스 오케스트레이터(상태+이펙트+툴바+내보내기+협업) |
| `src/components/editor/canvas/EditorSidebar.tsx` | 1451 | 사이드바(슬롯/텍스트/스티커/레이어 패널 집합) |

## CanvasEditor 확정 seam (실제 라인 기준)

각 그룹을 커스텀 훅/서브컴포넌트로 추출. 순서는 **의존 적고 순수한 것부터**(위→아래).

1. **내보내기 상수/타입** (L62–75: `ExportFormat`·`ExportOption`·`exportFormats`) → `editorExportFormats.ts`. 상태 무의존, **위험 0**. 착수 1번.
2. **포맷 유틸 래퍼** (L292–297: `formatTimeAgo`·`sanitizeFilename` — 이미 `editorUtils` 래핑) → 컴포넌트에서 직접 util 사용으로 제거. 위험 0.
3. **줌** (L539–566: `handleZoomIn/Out/Reset`·`calculateFitZoom`·`handleFitToScreen`) → `useCanvasZoom`. store의 `zoom/setZoom` + 캔버스 dim ref 주입. 저위험.
4. **핀치/터치 줌** (L262–287 상태 + L799–853 `handleTouchStart/Move/End`) → `usePinchZoom`. 자기완결적. 저위험.
5. **자동 저장** (L463–538: 30초 디바운스 이펙트 + `handleRecoverData`) → `useCanvasAutosave`. `safe*AutoSaveData`(editorUtils) 이미 존재. 중위험(이펙트 의존성).
6. **키보드 단축키** (L633–762 이펙트 + L615 `moveSelectedSlot`) → `useEditorKeyboardShortcuts`. **가장 큰 단일 블록(~130줄)**. undo/redo·save·delete·zoom·이동 등 다수 핸들러 참조 → 의존 주입 많음. 중~고위험, **마지막**.
7. **선택 클릭 핸들러** (L301–385: slot/text/sticker/doubleClick/inlineEdit) → `useEditorSelection`. 협업(selection 공유)과 얽힘 — collab 경로 주의. 중위험.

## EditorSidebar (후속 정찰 필요)

패널별(슬롯/텍스트/스티커/레이어)로 이미 분리 가능성 높음 — 각 패널을 `SidebarSlotPanel`·`SidebarTextPanel` 등으로 분리. 착수 전 구조 정독 필요(이 문서엔 seam 미확정).

## 실행 규약 (후속 담당 모델용)

- **1 추출 = 1 커밋.** 각 커밋 후 `npm run build` + `npm test` 통과 확인.
- 추출 훅은 순수 로직만 이동, **동작 불변**(리팩터, 기능 변경 금지). 렌더 JSX는 최대한 그대로.
- 각 훅에 반환 타입 명시. 의존은 인자로 주입(암묵 클로저 캡처 최소화).
- 협업(collab)·자동저장은 side-effect 타이밍이 민감 — 추출 후 수동 시나리오(줌/저장/단축키/내보내기/협업 세션) 회귀 확인.
- 정적 export 제약 유지(`ssr:false` 동적 import 등 그대로).

## 수용 기준(전체 완료 시)

- CanvasEditor 본체 < 700줄, 각 훅 < 200줄.
- build+test 녹색, 에디터 수동 회귀(줌·저장·복구·단축키·내보내기·협업) 이상 없음.
