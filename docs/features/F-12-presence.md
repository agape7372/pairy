# F-12 Presence(커서/참가자)   [partial]

**WHAT**: 협업 세션 참가자의 커서 위치·온라인 상태 표시. `broadcastProvider.ts`의 presence-join/presence-sync 로직(76-96행, 178-188행)과 `yjsProvider.ts`의 awareness 업데이트(368-380행).

**현재상태**: partial(FACT). broadcastProvider.ts:76-96에서 `this.presence.set(this.user.id, {...})`로 presence 정보(user_id/user_name/user_color/user_avatar/online_at)를 브로드캐스트하나 **송신자의 userId가 실제 인증 세션과 일치하는지 서버측 검증 없음**. yjsProvider.ts:368-380 `handleAwarenessUpdate()`는 `payload: { userId, state }`를 그대로 받아들이며 userId 진위 검증 없이 로컬 상태만 비교(374-379행, 충돌 감지는 값 동등성만 체크). broadcastProvider.ts:178-188의 presence-sync 병합도 동일하게 무검증.

**스펙정합**: 기능 목적(참가자 표시) 자체는 스펙과 일치. 보안 검증 누락은 미문서화 갭.

**문제·리스크**: F-11의 H-2(BroadcastChannel 무인증)와 동일 근본 원인 — 임의 userId로 presence 스푸핑 가능(동일 오리진 내에서). 실피해는 F-11이 실기기 간 동작 안 하므로 현재는 "동일 탭 내 장난" 수준으로 제한적이나, F-11 수정 후엔 실 보안 이슈로 확대.

**Fable판정**: **수정** — F-11과 함께 처리. 단독 우선순위는 낮음(F-11이 먼저 실기기 간 동작해야 이 문제가 실위험이 됨).

**다음작업**:
1. F-11의 Realtime 배선 작업 시 presence/awareness 페이로드에 서버 검증(인증 토큰 대조) 추가 — AC: 위조 userId 거부 확인(F-11의 AC #3과 동일 테스트로 커버). (Sonnet, F-11 작업의 일부로 수행)

**의존·순서**: **선행조건**: F-11의 Supabase Realtime 배선 완료 후 착수(독립 작업 아님, F-11 PR에 포함 권장).
