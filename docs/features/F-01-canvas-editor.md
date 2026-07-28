# F-01 Canvas 에디터 (Konva)   [real]

**WHAT**:페어틀(템플릿) 편집의 중심 캔버스 엔진. `src/components/editor/canvas/CanvasEditor.tsx`(1530줄) — 슬롯/이미지/텍스트/스티커 배치·변형·저장을 총괄하는 god-component.

**현재상태**: 실동작(FACT). `useCanvasEditorStore()`를 셀렉터 없이 통째로 구조분해(202-233행) — `templateConfig`부터 `updateFormField`까지 약 25개 상태·액션을 매 렌더마다 재구독. 6개 Konva 렌더러(`TemplateRenderer`(78행 동적 import), `BackgroundRenderer`·`ImageSlotRenderer`·`TextFieldRenderer`·`DynamicShapeRenderer`·`OverlayImageRenderer`(160행대 배럴 import), `StickerRenderer`(166행))는 전부 `React.memo` 미적용, 부모로부터 스토어 전체 상태를 prop으로 전달받음. 자동저장은 자체 구현(468-502행, 30초 디바운스 setTimeout, `editorUtils.ts`의 `safeGetAutoSaveData`/`safeSetAutoSaveData` 사용, 키 `pairy-autosave-${templateId}`).

**스펙정합**: 05-tech-stack.md의 react-konva 채택과 일치. 다만 단일 컴포넌트에 8-10개 관심사(로드/저장/선택/변형/히스토리/자동저장/협업훅/접근성)가 혼재 — 폴더구조 문서(08-folder-structure.md)의 관심사 분리 원칙 이탈.

**문제·리스크**: (1) 전역 스토어 통구독(202-233행) + 6개 렌더러 memo 없음 → 무관 필드 변경에도 캔버스 전체 리렌더(성능, High). (2) god-component 1530줄 — 유지보수·테스트 비용 증가(Medium). (3) `useCollabSession`(195-199행)·`useReducedMotion`(239행) 등 다수 훅이 한 컴포넌트에 응집 — 관심사 분리 실패.

**Fable판정**: **존치·성능수정** — 최고 자산. 재설계 금지, 셀렉터화·렌더러 memo화·god분해만 수행. Konva 마스킹·PSD 임포트 등 핵심 기능은 그대로 유지.

**다음작업**:
1. `useCanvasEditorStore` 호출을 개별 셀렉터(or `useShallow`)로 전환 — AC: 무관 필드 변경 시 CanvasEditor 리렌더 카운트 감소(React DevTools Profiler로 before/after 측정). (Sonnet)
2. 6개 Konva 렌더러에 `React.memo` + prop 안정화(부모 인라인 클로저 제거) 적용 — AC: 동일 props 재전달 시 렌더러 skip 확인. (Sonnet)
3. god-component 분해 — 로드/저장/자동저장/협업훅 로직을 커스텀 훅으로 추출(TemplateRenderer 1187→259줄 선례 참고) — AC: CanvasEditor.tsx 700줄 이하로 축소, 기능 회귀 없음(e2e canvas-editor.spec.ts 통과). (Opus)

**의존·순서**: F-07(히스토리 디바운스)과 함께 처리 권장(같은 스토어 파일 canvasEditorStore.ts 수정). F-02·F-03·F-04·F-06의 렌더러들이 이 컴포넌트에 종속 — 셀렉터화 순서를 먼저 잡아야 하위 기능 수정이 리렌더 회귀를 안 만든다.

---

## 갱신 · 2026-07-28 (TOP50 #11 성능 스윕)

- **완료**: `CanvasEditor`, `EditorSidebar`, `CollabContext`, `LayerPanel`,
  `ColorPresets`의 스토어 통구독을 `useShallow` 셀렉터 구독으로 전환했다.
- **완료**: `TemplateRenderer`와 6개 Konva 렌더러를 memo화하고, 슬롯·텍스트·
  스티커의 부모 인라인 콜백을 ID 전달형 안정 콜백으로 교체했다.
- **정정·완료**: 로그인 사용자는 세션 전환 중 같은 Provider 트리를 유지하되
  `autoConnect=false`로 두고 실제 세션은 한 인스턴스만 연결한다. 협업 시작 시 페이지
  reload/remount가 없어 미저장 캔버스가 보존된다. context value도 실제 협업 상태가
  바뀔 때만 갱신하고 충돌 알림 타이머의 교체·언마운트 정리를 보장했다.
- **검증**: TypeScript, Jest 에디터 스토어 회귀 테스트, ESLint 대상 파일 통과.
- **잔여**: god-component 훅 분해는 기능 회귀 위험이 더 큰 별도 작업으로 유지한다.

## 갱신 · 2026-07-28 (DL-0007 문서 무결성)

- `workId`·`draftId`·실제 `sessionId`를 문서 경계로 사용하고 비동기 로드·저장을
  generation/revision/mutex로 보호한다.
- UUID 작품은 소유자 검증 후 서버 `editor_data`를 다시 열며 첫 저장 뒤 URL도 work
  정본으로 전환한다.
- 저장·복구·협업 전환·붙여넣기까지 하나의 문서 상태를 보존한다.
- 구조 분해는 이번 무결성 작업과 섞지 않았고 후속 성능 리팩터로 유지한다.
