# DL-0007 — 2인 협업: 로그인 필수 + 서버 세션 배선 (H-07)

- 상태: DECIDED · 부분 실행(서버 foundation + join 클라이언트; 에디터 바인딩 defer)
- 일자: 2026-07-20
- 판단 주체: Opus(설계·구현) + 사용자(게스트정책 승인)
- 관련: [[DL-0006]], [[DL-0002]](최소 PII), F-11(실시간 협업)·F-13(초대/세션), strategy-genome §4·§5·§6.2, 2차 감사 H-07

## 맥락 / 문제

`useCollabSession` 이 전량 localStorage/BroadcastChannel stub 이라 다른 기기에서 참여 불가(2차 감사 H-07 CONFIRMED). `collab_sessions` 테이블·RLS(H-1 봉합, `20260706000000`)·Realtime publication(base_schema:298)·`get_collab_session_by_invite` RPC 는 존재하나 클라이언트가 미배선. 참가자 신원도 난수(nanoid guest).

## 결정 (사용자 승인)

1. **host·guest 모두 로그인 필수.** 참가자 신원 = `auth.uid`(서버 진실). 비로그인 게스트 흐름 제거.
   - 근거: 서버 RLS(`p->>'id' = auth.uid`)와 정합·최단, 추방/권한 확실. 가명 계정이라 [[DL-0002]] 익명성 원칙 무손상(익명≠무계정).
2. **2인 고정.** RPC 가 `max_participants=2` 강제(strategy §5 "3인+ 금지").
3. **참가자 관리는 SECURITY DEFINER RPC 로.** participants JSONB 를 원자적 조건부 UPDATE(정원 미만일 때만 append)로 갱신 — 동시 join 경합 방지.

## 실행 (이번 세션)

- `20260720000005_collab_session_rpcs.sql`: create/join/leave/end/kick + `_collab_participant` 헬퍼. 전부 definer·authenticated 만·auth.uid/host_id 자체 검증. participants = `{id,name,avatar,isHost,joinedAt}`(RLS 와 정합).
- `useCollabSession` 재작성: localStorage/BroadcastChannel 제거 → RPC 호출 + `collab_sessions` Realtime 구독(참가/추방/종료 동기화) + URL 세션 id 로 복원(`sessionId` 옵션). 공개 API·타입 보존.
- `CollabJoinClient`: 로그인 필수(useUser) + auth 신원 join + 참여완료 상태. 난수 게스트 제거.

## 왜 여기까지만 (에디터 바인딩·F-11 defer)

- **에디터 진입↔세션↔work 파라미터 의미가 얽혀 있음**: `CanvasEditor` 의 `savedWorkIdRef` 가 URL `session` 파라미터를 workId 로 해석(저장 대상). 여기에 collab 세션 id 를 그대로 넘기면 방금 봉합한 저장(C-02)이 깨진다. 올바른 분리는 "에디터가 로드된 세션에서 workId 를 파생"인데, 이는 F-11(Yjs 실시간 캔버스 동기화)과 함께 설계·**실 2브라우저 테스트**가 필요.
- 따라서 **서버 세션 라이프사이클(생성/참가/이탈/종료/추방)** 은 완성했고, **TitleInputStep duo 의 실 세션 생성 + 에디터 세션 바인딩 + 실시간 공동편집**은 F-11 후속으로 명시적 defer(정직한 경계). 그전엔 duo 진입이 실 세션을 만들지 않으므로 join 이 end-to-end 로 닫히지 않음(서버·훅·join 클라이언트는 준비 완료).

## 되돌림 / 후속 (F-11 트리거)

1. TitleInputStep duo → `createSession(authUser)` 로 실 세션 생성, 초대링크 노출.
2. CanvasEditor: `session` 파라미터를 collab 세션 id 로 통일하고 workId 는 로드된 세션에서 파생(savedWorkIdRef 분리).
3. Yjs provider 를 Supabase Realtime 채널에 바인딩(현 BroadcastChannel 대체) → 실 공동편집.
4. 검증: 분리 브라우저 컨텍스트 host/guest join·edit·reconnect·kick·3인 차단.
