# F-28 프리미엄 게이팅   [demo(클라)]

**WHAT**: 프리미엄/크리에이터 티어 전용 기능 접근 제어. 게이팅 체크는 여러 컴포넌트에 분산 — `src/components/pages/TemplateDetailClient.tsx`(458·685행대), `src/components/layout/header.tsx`(104행대), `src/components/editor/ExportDialog.tsx`(47행대).

**현재상태**: demo(FACT, 전량 클라이언트 검증). TemplateDetailClient.tsx:458행대 `if (resource.isPremium && subscription.tier === 'free') { toast.warning(...); return }` — `subscription.tier`를 클라이언트 스토어(F-26)에서 읽어 판단, 서버측 RLS 확인 없음. :685행대의 다운로드 한도(`remainingDownloads <= 5`) 경고도 동일하게 클라이언트 상태(`subscriptionStore.incrementDownloads()`)에만 의존. header.tsx:104행대의 티어 배지(P/2/C 표시)도 클라이언트 상태 그대로 노출.

**스펙정합**: "프리미엄 기능 잠금"이라는 개념은 스펙과 일치하나, 강제(enforcement) 메커니즘이 전무 — 이름만 게이팅이지 실제로는 UI 안내 수준.

**문제·리스크**: **High** — F-26(C-3)의 localStorage 조작이 그대로 이 게이팅을 무력화. 서버(Supabase RLS/entitlement 체크)가 프리미엄 전용 리소스(예: 프리미엄 템플릿, 유료 자료) 접근을 실제로 차단하지 않으므로, 클라이언트 코드를 우회(devtools에서 직접 API 호출 등)하면 프리미엄 콘텐츠에 무단 접근 가능.

**Fable판정**: **수정 — 서버 검증**. RLS 정책 또는 entitlement 테이블 기반 서버측 강제가 반드시 필요 — 클라이언트 체크는 UX 힌트로만 남기고 실 방어선은 서버로 이관.

**다음작업**:
1. 프리미엄 전용 리소스(템플릿·자료)에 대한 Supabase RLS 정책 신설 — 사용자의 실 구독 상태(서버 테이블 기반, F-26 결제백엔드 완료 후)를 조건으로 SELECT 제한 — AC: free 티어 사용자가 API를 직접 호출해도 프리미엄 콘텐츠 body를 받지 못함. (Opus)
2. 클라이언트 체크(TemplateDetailClient.tsx 등)는 UX 안내용으로 유지하되 "유일한 방어선"이 아님을 명확히. (Sonnet)

**의존·순서**: **선행조건**: F-26(구독 서버검증)이 먼저 성립해야 이 게이팅이 참조할 "진짜 티어 정보"가 서버에 존재. F-24·F-27과 함께 결제 백엔드 구축이라는 동일 선행 작업에 종속.

---

## 갱신 · 2026-07-12 (서버 진실 확보 + 콘텐츠 RLS는 정직한 defer)

- **선행조건 F-26 부분 성립**: 구독 진실이 서버(`profiles.subscription_tier`)로 이전됨 + `is_premium_active(uid)` SECURITY DEFINER 함수 신설(`20260712000002`) — 프리미엄 리소스 RLS 가 참조할 "진짜 티어"가 서버에 존재하게 됨.
- **프리미엄 콘텐츠 RLS 는 defer(코드가 증명)**: 감사 시점 가정과 달리, 편집 데이터가 DB `templates.editor_data` 가 아니라 **로컬 `public/templates/*.json`** 에서 로드됨(CanvasEditor.tsx, 정적 export 잔재). 즉 지금 editor_data 에 RLS 를 걸어도 **아무 편집 경로도 그 데이터를 안 써서 "죽은 데이터 보호"**. 실 방어선은 (1) editor_data 실서빙 배선 + (2) 결제 구매이력이 선행. `is_premium_active()` 를 참조점으로 그때 배선.
- **현 상태의 안전성**: 클라 게이팅(TemplateDetailClient 등)은 UX 힌트로 유지. 프리미엄 콘텐츠가 아직 서버에서 서빙되지 않으므로 무단 접근 대상 자체가 없음 = 현재 노출 0.
