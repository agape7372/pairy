# F-18 Whisper(창작자→구독자 선물/메시지)   [stub(전송 no-op)]

**WHAT**: 크리에이터가 구독자에게 은밀한 선물/메시지를 보내는 기능. 훅 2종 — `src/hooks/useWhisper.ts`(722줄, 단수형, **실코드이나 죽음**)과 `src/hooks/useWhispers.ts`(412줄, 복수형, **데모용이나 UI에 실배선**). 마이그레이션 `supabase/migrations/20250107_create_whispers.sql`(191줄, Sprint 35).

**현재상태**: stub(FACT, 전송 no-op). `src/app/(main)/my/whispers/page.tsx`(UI)가 실제로 import하는 것은 **복수형 `useWhispers`뿐**(grep 확인) — 단수형 `useWhisper.ts`(722줄, 더 정교하게 구현된 실코드로 추정)는 **호출처 0건, 완전히 죽은 코드**. 즉 UI는 데모 훅에 배선돼 있어 실제 메시지 작성→전송 시 사용자에겐 성공처럼 보이나 실제로는 저장/전송되지 않고 소실(가짜 성공). 마이그레이션은 `whisper_type`(GIFT/NOTICE/SECRET_EVENT), `whisper_status`(PENDING/SENT/READ/CLAIMED/EXPIRED), `whisper_theme`(NIGHT/LOVE/GOLDEN/MYSTIC/SPRING) enum과 payload JSONB 스키마까지 이미 설계돼 있음(테이블 자체는 존재).

**스펙정합**: 마스터 프롬프트 문서에 Whisper의 상세 스펙 부재("Sprint 35" 코드 주석 외 별도 기획 문서 미확인) — 스펙 문서 부재 상태에서 코드만 3단계(테이블+훅2종+마이그레이션)로 구축된 전형적 스코프 스프롤 사례.

**문제·리스크**: **High** — 사용자가 메시지/선물을 "보냈다"고 믿지만 실제로는 전달되지 않음(신뢰 손상, 감사 §4 파워유저 관점 "약속 미이행"). 훅 이원화(2중 구현) 자체가 유지비 낭비 — 어느 쪽이 정본인지 다음 개발자가 판단 불가.

**Fable판정**: **defer/축소** — 고유한 기능 아이디어이나 MVP("2인 페어틀 협업") 범위 밖의 과설계. 지금 완성으로 밀어붙이기보다 훅 하나로 정리 후 파운데이션(Tier 0) 완료 뒤 재개. 신규 개발 자원을 지금 투입하지 않는다.

**다음작업**:
1. **(즉시, 판단 필요)** 단수형 `useWhisper.ts`(722줄)와 복수형 `useWhispers.ts`(412줄) 중 어느 쪽을 정본으로 삼을지 결정 — 단수형이 더 완성도 높은 실코드로 추정되므로 단수형을 정본화하고 복수형(데모) 제거, UI import를 단수형으로 교체하는 방향 우선 검토. 결정 자체는 하위 모델이 못 내리는 판단이므로 Fable 재확인 필요. (Fable→Sonnet)
2. 훅 통합 후에도 **당장 완전 배선하지 말고** "정직한 상태"(예: "준비 중" 안내 또는 최소 기능만)로 유지 — 완전한 발송/수령 플로우 완성은 Tier 0 파운데이션 이후로 defer. (Sonnet)

**의존·순서**: **선행조건**: 없음(독립적으로 훅 통합 가능). **후행영향**: 완전 배선은 결제 백엔드(F-24~28) 및 프리미엄 게이팅과 얽힐 가능성 있음(선물=유상 아이템일 수 있어) — 그 판단 전까지 축소 상태 유지 권장.

---

## 갱신 · 2026-07-20 (2차 감사 재검증 — [[../ai-org/decisions/DL-0006-audit2-reflection]] H-09)

- 훅 정본화는 [[../ai-org/decisions/DL-0003-whisper-hook-canonical]]로 결정됨(정본=`useWhisper`, 페이지 이관 defer). 기능 defer 유지.
- **신규 발견(H-09, CONFIRMED)**: 기능이 defer여도 **DB 공격면**이 열려 있음. `20250107_create_whispers.sql`의 `send_scheduled_whispers()`·`get_unread_whisper_count(user_id)`가 SECURITY DEFINER인데 EXECUTE revoke 없음(형제 함수 `get_collab_session_by_invite`·`grant_subscription`은 revoke함). `get_unread_whisper_count`는 임의 `user_id`를 받아 타인 unread count 유출. receiver UPDATE 정책이 OLD→NEW 전이 미강제(SENT 건너뛰고 CLAIMED 가능).
- **Tier A 봉합(S, Sonnet — 기능은 defer 유지, 공격면만 축소)**: EXECUTE를 public/authenticated서 revoke(service_role만), `get_unread_whisper_count` param 제거→`auth.uid()`, SENT→READ→CLAIMED BEFORE UPDATE 트리거. **페이지·훅·전송 플로우는 건드리지 않음**(DL-0003 defer 존중).
