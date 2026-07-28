# F-11 실시간협업(Yjs+BroadcastChannel)   [partial(실기기X)]

**WHAT**: 페어리의 최대 차별점 — 2인 동시 편집. `src/lib/collab/yjsProvider.ts`(440줄, Yjs Y.Doc/Awareness 초기화)와 `src/lib/collab/broadcastProvider.ts`(200줄, Supabase 미설정시 폴백).

**현재상태**: partial(FACT). yjsProvider.ts:70-75에서 Supabase 미설정 시 `BroadcastChannelProvider`로 폴백 — **BroadcastChannel은 동일 브라우저의 다른 탭 간에만 동작**, 다른 기기 간 동기화 불가. broadcastProvider.ts:65에서 `new BroadcastChannel(`pairy-collab:${this.sessionId}`)`로 채널을 여는데 sessionId를 인증 세션과 대조 검증하지 않음(H-2). `src/lib/supabase/*`(client.ts/server.ts/storage.ts)에는 아직 realtime 채널 헬퍼가 없음 — Supabase Realtime 배선은 완전 신규 작업.

**스펙정합**: 00-overview.md의 핵심 차별점(실시간 협업)과 정면 충돌 — 스펙은 "실 기기 간 협업"을 전제하나 구현은 동일기기(탭) 한정.

**문제·리스크**: **C-5(치명)** — 핵심 차별점이 실기기 간 전혀 작동 안 함. 경쟁사에 "우리는 진짜 실시간" 한 줄로 무력화 가능(감사 §4 경쟁사 관점). H-2 — BroadcastChannel sessionId 무인증(동일 오리진에서 sessionId만 알면 Yjs 업데이트 주입·presence 스푸핑 가능).

**Fable판정**: **수정 최우선** — 차별점 복구. 로컬 폴백 자체를 제거하는 게 아니라(오프라인/단일기기 유효 사용례 있음), Supabase Realtime 경로를 신규로 배선해 "설정만 되면 실기기 간 동작"하도록 완성.

**다음작업**:
1. `src/lib/supabase/`에 Realtime 채널 헬퍼 신설(Broadcast/Presence API 또는 Yjs Supabase provider 연동) — AC: 두 개의 다른 브라우저(다른 기기 시뮬레이션)에서 같은 세션 코드로 접속 시 편집 동기화 확인. (Opus)
2. yjsProvider.ts의 폴백 로직을 "Supabase 설정됨→Realtime, 미설정→BroadcastChannel(현행 유지)"로 명확히 분기, 폴백 시 UI에 "동일 기기만 지원" 배너 노출 — AC: 데모모드에서 경고 문구 렌더 확인. (Sonnet)
3. H-2 봉합 — presence/awareness payload에 인증된 userId 서버측 검증 추가(RLS or Edge Function 경유) — AC: 위조된 userId로 awareness 업데이트 시도 시 거부. (Opus)

**의존·순서**: **선행조건**: F-13(초대/세션)의 Supabase 배선과 함께 진행해야 세션 join이 실 네트워크 경로를 타게 됨 — F-11·F-13은 사실상 하나의 작업 단위. **후행영향**: F-12(Presence)·F-14(협업 채팅)가 이 프로바이더에 의존.

## 갱신 · 2026-07-28 (DL-0007)   [source-ready/live-unverified]

- Supabase Realtime private channel과 현재 Auth JWT를 사용하며,
  `realtime.messages` RLS 소스는 host/participant·상태·만료·topic을 서버에서 검증한다.
- 늦은 참가자는 `request-state/state-response`로 전체 상태를 받고, 원격 update는
  remote origin으로 적용해 에코하지 않는다. 이미지 삭제·transform·스티커·텍스트
  스타일/효과까지 동기화한다.
- awareness 부분 변경은 기존 cursor/selection/zone을 보존하고 transport의 실제
  subscribe/error/closed 상태를 UI에 반영한다.
- **미완료 게이트**: `20260728000001_collab_realtime_authorization.sql` 라이브 적용과
  서로 다른 두 브라우저 JWT 실검증. 소스·단위 테스트 통과만으로 real 판정하지 않는다.
