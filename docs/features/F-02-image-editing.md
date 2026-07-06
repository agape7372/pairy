# F-02 이미지편집(마스킹/필터/투명도/플립)   [real]

**WHAT**: 슬롯 이미지의 마스킹·밝기/대비 등 필터·투명도·플립 조정. UI는 `src/components/editor/canvas/EditorSidebar.tsx`(1451줄)의 슬라이더 섹션, 렌더링은 CanvasEditor(F-01)의 `ImageSlotRenderer`.

**현재상태**: 실동작(FACT). 슬라이더 onChange 핸들러 3곳이 디바운스 없이 스토어 액션을 즉시 호출: EditorSidebar.tsx:737(`onOpacityChange` → `setImageOpacity`), :786·:802(`onFiltersChange` → `setImageFilters`, brightness/contrast). 각 호출은 F-07의 `pushHistory()`를 즉시 트리거.

**스펙정합**: 기능 자체(마스킹/필터/투명도/플립)는 스펙(01-functional-spec.md 에디터 섹션)과 일치. 디바운스 부재는 성능 요구사항 미문서화 지점.

**문제·리스크**: 밝기 슬라이더를 -100→100 드래그 시 ~100회 store set + JSON-diff 히스토리 스냅샷 + 오프스크린 canvas 재도색 발생(High, 실사용 체감 저하). 코드베이스 전체에 `debounce`/`throttle` 유틸 부재(grep 결과 0건) — 재사용 가능한 디바운스 헬퍼가 없어 각 슬라이더가 직접 구현해야 하는 상태.

**Fable판정**: **존치** — 기능은 정상, 성능만 수정. 신규 기능 추가 없음.

**다음작업**:
1. 공용 `useDebounce`(또는 `debounce` 유틸) 신설 — AC: 최소 1곳(F-02) 이상에서 실사용, 단위테스트로 debounce 타이밍 검증. (Sonnet)
2. EditorSidebar.tsx:737,786,802의 onChange를 "즉시 시각 반영 + 디바운스된 히스토리 커밋"으로 분리(시각 상태는 로컬 or 즉시 set, `pushHistory`만 디바운스) — AC: 슬라이더 드래그 100틱에 히스토리 스냅샷 1-2개만 생성 확인. (Sonnet)

**의존·순서**: F-07(Undo/Redo 디바운스+ring buffer)과 동일 근본 원인(무조건 `pushHistory` 호출) — 같은 작업에서 함께 해결 권장. 선행: F-01의 셀렉터화가 먼저면 리렌더 측정이 더 명확.
