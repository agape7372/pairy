# F-13 초대/세션(useCollabSession)   [stub(로컬 C-5)]

**WHAT**: 협업 세션 생성·참가·초대코드 관리. `src/hooks/useCollabSession.ts`(504줄), 라우트 `src/app/(main)/collab/[code]/page.tsx`(16줄).

**현재상태**: stub(FACT, C-5). `joinSession`(294-332행)이 네트워크가 아니라 **로컬 기기의 localStorage**를 조회 — 311-315행이 실제 실행 코드(`localStorage.getItem(SESSION_STORAGE_KEY)` 후 없으면 "세션을 찾을 수 없습니다" 에러), 303-308행의 Supabase 조회 코드는 **주석 처리된 죽은 코드**. TODO 주석 4곳 확인: 288행(`// TODO: Supabase에 세션 저장`), 303행(`// TODO: Supabase에서 세션 조회`), 422행(`// TODO: Supabase에 세션 상태 업데이트`), 484행(`// TODO: Supabase Realtime으로 추방 이벤트 전송`). `collab/[code]/page.tsx`:3-6의 `generateStaticParams()`는 `{ code: 'DEMO' }` 단 하나만 반환 — 실 초대코드는 GitHub Pages에서 404.

**스펙정합**: 00-overview.md 핵심 차별점(친구 초대 협업)과 정면 충돌 — "초대 코드로 참가"가 스펙이나 실제로는 로컬 저장소만 조회하므로 다른 사람이 만든 세션에 참가 불가능.

**문제·리스크**: **C-5(치명)** — 4개 TODO가 이 기능의 핵심 경로(생성/조회/상태갱신/추방) 전부가 미배선임을 증명. **H-1(연계)** — `collab_sessions` 테이블의 RLS가 `SELECT USING(true)`였으나(schema.sql:245, migrations 20260102), **이미 `supabase/migrations/20260706000000_tier0_security_hardening.sql`에 봉합 마이그레이션이 작성되어 있음**(host/participant 스코프 정책 + `get_collab_session_by_invite()` RPC 신설, 66-100행) — 단 **이 마이그레이션은 아직 라이브 DB에 적용되지 않은 상태**(파일 헤더에 "자동 적용되지 않았다" 명시). useCollabSession.joinSession이 이 신규 RPC를 쓰도록 배선하는 것이 마이그레이션 주석(98-100행)에 이미 지정돼 있음.

**Fable판정**: **수정** — Supabase 배선이 최우선. 다행히 서버측 RLS/RPC는 이미 설계·작성 완료 상태라, 하위 모델의 작업은 "SQL 신규 작성"이 아니라 "이미 있는 RPC에 훅을 연결"하는 것으로 범위가 줄어듦.

**다음작업**:
1. **(선행)** `20260706000000_tier0_security_hardening.sql`을 라이브 DB(`cqmukwbwuzqgkpgogmby`)에 적용 — 사용자가 직접 수행(service-role 필요, AI가 대행 안 함). AC: 마이그레이션 파일 하단 "검증" 섹션의 3개 쿼리로 확인.
2. `useCollabSession.ts`의 `joinSession`(294-332행)을 `get_collab_session_by_invite(p_invite_code)` RPC 호출로 교체, TODO 4곳(288·303·422·484행) 실제 Supabase 호출로 대체 — AC: 서로 다른 브라우저 세션에서 초대코드로 join 성공, localStorage 미사용 확인. (Opus)
3. `collab/[code]/page.tsx`의 `generateStaticParams`를 동적 라우팅 방식으로 전환(런타임 결별 종속) — AC: 임의 초대코드로 접근 시 404 아님. (Opus, F-11/F-23과 공동 결정 필요)

**의존·순서**: **선행조건**: 위 1번(마이그레이션 적용, 사용자 수행) → 2번(훅 배선). **후행영향**: F-11(실시간협업)이 이 세션 join 위에서 동작 — F-13 없이는 F-11도 실기기 간 무의미. 3번은 정적 export 결별(Tier 0 #4) 결정에 종속되므로 그 전엔 defer 가능.

## 갱신 · 2026-07-28 (DL-0007)   [source-ready/live-unverified]

- 프로덕션 생성·조회·참가·상태 변경은 Supabase/RPC 경로를 사용하고 localStorage는
  캐시일 뿐 서버 재검증 없이 신뢰하지 않는다. 데모 모드만 로컬 transport를 유지한다.
- 에디터의 “협업 시작”은 가짜 ID나 reload 대신 실제 생성된 세션 ID를 현재 URL과
  Provider에 연결한다. 자동 시작도 문서 로드 후 같은 경로를 탄다.
- 초대 참가자가 저장하면 host work를 갱신하지 않고 자신의 작품 사본을 만든다.
- 라이브 판정은 DL-0007의 private Realtime migration과 타 브라우저 초대/join
  검증을 통과한 뒤 갱신한다.
