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

---

## 갱신 · 2026-07-20 (2차 감사 재검증 — [[../ai-org/decisions/DL-0006-audit2-reflection]] C-02)

⚠ **"수정 불필요" 정정.** autosave 타이머 자체는 정상이나, **수동 Save가 sample/non-UUID 틀에서 데이터를 안 쓰고 성공을 표시**한다(2차 감사 C-02 CONFIRMED). `CanvasEditor.tsx:612-623` 데모/비서버 분기는 `markSaved()`+토스트만 호출하고 localStorage write가 없다. `markSaved()`가 `isDirty=false`로 만들고 그게 autosave effect의 deps라, 마지막 편집 30초 내 Save하면 대기 중 debounce가 cleanup으로 취소돼 **아무것도 저장 안 됨**. 게다가 autosave payload(`editorUtils.ts:15-22`)에 `images` 없음.

**수정(Tier B, S)**: 데모/비서버 Save 분기에서 `markSaved()` 전에 `safeSetAutoSaveData(...)` 동기 write, quota 실패 시 경고 토스트+dirty 유지. 이미지는 blob URL이라 로컬 복구서 제외. AC: 30초 전 Save→reload 복구, QuotaExceeded 시 성공 표시 안 함.
