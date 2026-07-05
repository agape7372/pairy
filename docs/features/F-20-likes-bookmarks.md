# F-20 좋아요/북마크   [real]

**WHAT**: 작업물/틀에 대한 좋아요·북마크. `src/hooks/useLikes.ts`, `src/hooks/useBookmarks.ts`.

**현재상태**: 실동작(FACT). 둘 다 `useRef` 기반 더블클릭/레이스 컨디션 방지 패턴 적용(useLikes.ts 44-58행대, useBookmarks.ts 45-46행대). useLikes는 데모스토리지 유틸 사용, useBookmarks는 Supabase 배선 확인. 좋아요/북마크 수 자동 동기화 트리거가 `supabase/migrations/20260102_fix_rls_and_triggers.sql`(35-83행대)에 존재.

**스펙정합**: 표준 소셜 기능으로 스펙과 일치. 이탈 없음.

**문제·리스크**: 직접 확인된 신규 결함 없음. 레이스 컨디션 방지가 이미 구현돼 있어 성숙도 높은 기능.

**Fable판정**: **존치** — 수정 불필요.

**다음작업**: 없음.

**의존·순서**: 독립적.
