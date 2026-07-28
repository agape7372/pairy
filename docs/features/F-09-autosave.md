# F-09 자동저장(localStorage)   [real]

**WHAT**: 편집 중인 작업물을 주기적으로 로컬 저장해 새로고침/충돌 시 복구. CanvasEditor.tsx(468-502행) 내 구현, `src/lib/utils/editorUtils.ts`의 `safeGetAutoSaveData`/`safeSetAutoSaveData` 사용.

**현재상태**: 실동작(FACT). 30초 디바운스(setTimeout, `autoSaveTimerRef` 265·277행)로 localStorage에 저장, 키 형식 `pairy-autosave-${templateId}`. 페이지 로드시 430행에서 `safeGetAutoSaveData(autoSaveKey)`로 복구 시도.

**스펙정합**: 09-deployment.md 및 에디터 UX 관례와 일치(정적 export 환경에서 클라우드 저장 불가하므로 로컬 자동저장이 현실적 대안).

**문제·리스크**: 현재로선 localStorage 한정 — 기기 변경·브라우저 데이터 삭제 시 복구 불가(Low, 정적 export 근본 제약의 하위 증상). 별도 신규 결함 없음.

**Fable판정**: **존치** — 정적 export 하에서 합리적 구현. 런타임 결별(Tier 0 #4) 이후 클라우드 동기화로 승격 대상.

**다음작업**:
1. (즉시) 수정 불필요 — 정상 동작.
2. (런타임 결별 후) Supabase 기반 클라우드 자동저장으로 이전 — AC: 로그인 사용자는 서버에도 주기 저장, 기기 간 복구 가능. (Sonnet)

**의존·순서**: **선행조건**: 정적 export 결별(TOP50 Tier 0 #4) — 그 전까지는 localStorage 유지가 최선. 독자적으로 먼저 손댈 필요 없음.

## 갱신 · 2026-07-28 (DL-0007)

- 자동저장 스키마를 v2로 올려 이미지와 텍스트/스티커 템플릿 편집까지 보존하고,
  읽을 때 런타임 스키마 검증을 수행한다.
- 키는 `session` 또는 UUID `work/draft` 단위다. 같은 템플릿으로 연 두 작업이 서로의
  복구본을 덮지 않는다.
- 서버 작품은 `works.editor_data`에서 다시 열고, 서버 실패 시 동일 snapshot을
  브라우저 복구본으로 남긴다.
- 로그인 프로덕션의 새 이미지는 Storage URL로 저장해 localStorage quota와
  기기 간 blob 무효화를 줄인다. 마이그레이션 라이브 적용 전에는 완료로 보지 않는다.
