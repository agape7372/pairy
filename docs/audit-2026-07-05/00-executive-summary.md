# 1. Executive Summary

> 출처: `polymorphic-greeting-gizmo.md` §1

**한 줄 결론:** 페어리는 "잘 만든 데모"다. 에디터 UI·디자인 시스템·애니메이션은 실제로 정교하나, **제품을 성립시키는 3대 축(실서버로 서빙되는 UGC, 결제, 실기기 간 협업)이 아키텍처 레벨에서 막혀 있고**, 그 위에 **권한·결제·수익이 클라이언트에서 위조 가능한 보안 구조**가 겹쳐 있다. 정적 export(`output:'export'`) 위에 UGC·거래 플랫폼을 올린 근본 불일치가 거의 모든 치명 결함의 뿌리다.

## 치명 4대 테마

1. **UGC 라우트 붕괴** — `generateStaticParams`가 데모 ID만 사전생성. `templates/[id]`는 1~8, `creator/[username]`은 데모 8명, `share/[shareId]`는 `'demo'`, `collab/[code]`는 `'DEMO'`만. 실 사용자 콘텐츠·공유링크·크리에이터 URL 전부 CDN 404. (FACT, `out/` 빌드 검증) — 공유·SEO·유입 구조적 불가.
2. **결제 전무 + 정적 export로 웹훅 불가** — Toss/Stripe 구현 0건, 서버 런타임 부재로 안전한 결제 확정 원천 불가. 모든 매출 라인 오늘 수금 불가. (FACT)
3. **플래그십 협업이 동일기기 한정** — invite join이 네트워크 아닌 로컬 localStorage 조회(C-5), Supabase 미설정 시 `BroadcastChannel` 폴백 = 같은 브라우저 탭만 동기화. 최대 차별점이 실동작 안 함. (FACT)
4. **보안: 클라이언트 신뢰 + RLS 구멍** — `profiles` UPDATE에 `WITH CHECK` 없음 → 콘솔 한 줄로 `role='super_admin'` 자가승격(C-1). 구독·수익이 localStorage → 무료 프리미엄·가짜 정산(C-3/C-4). `collab_sessions` `SELECT USING(true)` → 전 세션 초대코드 덤프(H-1). anon key는 공개가 정상이나 유일 방어선 RLS가 뚫림. (FACT, Critical 5 / High 5)

## 전략 판정

"2인 페어틀 하나에 올인" MVP 원칙(00-overview.md:144)이 코드로 위반됨 — PSD 임포트, 스티커, 4단계 구독, 게이미피케이션(스펙 문서 부재), 마켓이 반쯤 병렬 구축. 아무도 "안 함"을 결정하지 않았다. **스코프 스프롤이 파운데이션 미완성을 가리고 있다** — PROGRESS.md "6단계 100% 완료"와 ANALYSIS-REPORT "기능 65%/데모 85%"가 둘 다 참이며 서로 다른 것을 측정한다(전자=스프린트 티켓 소진, 후자=실사용자 대상 실동작). 2025-12-30 이후 후자 측정이 끊겼다.

## 한 문장 처방

신기능을 멈추고 — 정적 export 결별(실 UGC 서빙+결제 웹훅 가능한 런타임으로) → RLS 구멍 봉합 → 클라이언트 신뢰 제거, 이 3단계를 파운데이션으로 먼저 세운 뒤에만 나머지가 의미를 가진다.

## Context — 왜 이 작업인가

페어리는 자캐(OC) 창작자를 위한 **틀 아카이브 + 페어틀 웹 에디터 + 실시간 협업** 플랫폼을 표방한다(00-overview.md:9). 6개월간 298커밋(Claude 168 + agape7372 134 — AI 대량 구축), 70k LOC로 UI 완성도는 높다. 그러나 문서(docs/master-prompt 13종 + PROGRESS.md)와 실제 구현 사이 간극이 크고, 스스로 작성한 ANALYSIS-REPORT-2025-12-30이 "기능 65% / 데모모드 85%"를 인정한다.

사용자 요청: (1) 포스타입 전수조사 벤치마킹, (2) 페어리 전 계층 적대적 감사, (3) Fable을 두뇌로 하위 모델(Opus/Sonnet/Haiku)을 실행 에이전트로 쓰는 AI 조직 설계, (4) Fable 이후에도 하위 모델이 Fable처럼 사고하도록 계승 구조 준비.

목표 산출물: 이 감사를 repo 정본 문서로 남기고(`docs/audit-2026-07-05/`, `docs/ai-org/`), 최우선 결함을 로드맵으로 실행 착수.
