# 5. 보안 감사 결과

> 출처: `polymorphic-greeting-gizmo.md` §5 (§5.1 포함)

**정정·전제(FACT)**: 페어리는 "백엔드 없음"이 아니다 — `supabase/schema.sql` + `supabase/migrations/`(RLS 정책 포함)이 실존하고 라이브 프로젝트(`cqmukwbwuzqgkpgogmby`)가 있다. 문제는 **RLS의 구멍**과, "백엔드 로직처럼 생겼지만 서버 강제가 0인 클라이언트 localStorage"의 혼재다. 근본 테마: 정적·서버리스 프론트 + Supabase 단일 백엔드 구조에서 결제·수익·크리에이터 게이팅·협업 세션이 localStorage로 구현됨.

## 5.1 인증·개인정보 최소화 결정 (DL-0002 · 사용자 질문 응답)

**질문**: 구글/카카오 등 PII 많은 소셜 로그인을 꼭 써야 하나? 아이디·비번, 많아야 이메일만으로 안 되나? (바이브코딩 사이트 보안 우려 분위기)

**Fable 판정 — 사용자 직관이 옳다. 단, 이유는 "보안"보다 "PII 반경·타깃 정서"다.**

- **현황(FACT)**: 페어리는 **이미 이메일+비밀번호(Supabase Auth)가 주 플로우** — `login/page.tsx:193`(signUp+이메일 인증), `:216`(signInWithPassword), 비번 복잡성 검증(:152), `reset-password/page.tsx:51`(이메일 재설정). OAuth(`:115` signInWithOAuth)는 **선택 추가**일 뿐. 즉 원하는 최소-PII 경로는 이미 구축돼 있고, 소셜은 떼어내면 그만.
- **결정**: **이메일 기반을 기본·유일 권장. Google/Kakao/Naver 소셜 제거(또는 기본 미노출).**
  - 이유 (1) **타깃 정서**: 자캐 팬덤은 가명·익명 문화 — 실명 기반 소셜(구글/카톡/네이버)은 실명-덕질 연결 우려로 **가입 이탈 유발**. 최소-PII가 오히려 전환에 유리.
  - (2) **PII 반경 축소**: 이메일만 보유 → 유출 시 피해·PIPA(개인정보보호법) 부담 최소. 소셜 토큰·프로필 저장은 공격 표면 증가.
- **더 나은 옵션(권장)**: **이메일 매직링크/OTP(passwordless, Supabase `signInWithOtp`)** — 비밀번호를 아예 저장 안 함(유출·재사용·리셋 리스크 0), PII는 이메일 1개. MVP 최적. (비번 방식 유지도 OK — Supabase가 해싱·검증·리밋 관리.)
- **예외**: iOS 앱 심사 요구 시에만 **Apple 로그인("Hide My Email")** 허용(이메일도 안 넘김).
- **핵심 오해 교정**: "바이브코딩 보안 걱정"의 실체는 로그인 방식이 아니다. 실위험은 (a) 자체 인증·암호화 롤유어오운(← Supabase Auth 쓰면 회피, 페어리는 이미 회피 중), (b) **클라이언트 신뢰**(C-1/C-3/C-4), (c) **RLS 구멍**(C-1/H-1). **로그인을 이메일로 바꿔도 이 셋이 그대로면 여전히 안 안전하다.** 최소-PII는 "피해 반경 축소"로 가치 있으나, 헤드라인 방어는 Tier 0(RLS·클라이언트 신뢰 제거)이다.
- **PII 최소 원칙(정본)**: 수집은 **이메일 + 표시명(핸들)** 만. 실명·전화·생년월일 미수집. 성인인증(본인인증)은 성인 콘텐츠 도입 전까지 defer(그 자체가 최중량 PII).
- **하위 모델 인수인계**: ①소셜 버튼 렌더 제거 or feature-flag화(`login/page.tsx` 소셜 섹션), ②`signInWithOtp` 매직링크 경로 추가, ③`profiles` 스키마에 불필요 PII 컬럼 없음 확인(C-2 정본화와 함께), ④CSP의 소셜 도메인 `connect-src` 정리.

## CRITICAL (즉시)

- **C-1 · profiles RLS에 `WITH CHECK` 없음 → 권한 자가승격**(schema.sql:209). `USING ((select auth.uid()) = id)`만 있어 *어느 행*만 통제, *어느 컬럼*은 무통제. 브라우저 콘솔서 `supabase.from('profiles').update({role:'super_admin'})` 통과. `role`·`total_earnings`·`pending_payout` 전부 공격자 변조 가능. **anon key 공개 전제의 유일 방어선이 뚫림.**
- **C-2 · 스키마 드리프트**: 앱 코드는 `profiles.role`(`UserRole`)을 전역 select하나 커밋된 schema.sql엔 `role` 컬럼 없음. 라이브 DB에 비버전 컬럼이 있거나(→ **프로덕션 스키마를 소스로 재현·감사 불가**), 없어서 role 시스템 전체가 죽은 코드. 어느 쪽이든 "우리 실제 인가 모델이 뭔지 모른다".
- **C-3 · 구독=localStorage, 결제 백엔드 0**(subscriptionStore.ts:196-233). `subscribe()`가 `set()` 후 `localStorage['pairy-subscription']` 저장이 전부. `localStorage.setItem`으로 `tier:'creator'` 주입 → 영구 무료 프리미엄(워터마크 제거·무제한 export·프리미엄 템플릿). usePurchase.ts:72 주석 "데모 모드: 실제 결제 없이".
- **C-4 · 수익/정산 위조**(marketplaceStore.ts). 총수익·정산요청이 클라이언트 편집 가능 localStorage 원장서 계산. 가짜 `Sale{netAmount:1억}` 주입 후 `requestPayout` 무조건 성공. 실 정산 붙으면 **없는 매출로 출금 요청** 직결.
- **C-5 · 협업 초대 구조적 미작동**(useCollabSession.ts:294-332). `joinSession`이 네트워크가 아니라 *로컬 기기의* `localStorage` 조회 + invite 코드 비교. Supabase 경로(`collab_sessions` 테이블)와 미연결(TODO 주석). 또 `/collab/[code]`는 `generateStaticParams`가 `'DEMO'`만 → 실 코드는 GitHub Pages서 진짜 404. **핵심 차별점(친구 초대 협업)이 실기기 간 불가.**

## HIGH

- **H-1 · collab_sessions `SELECT USING(true)`**(migrations 20260102). 누구나 전 세션의 participants(유저ID/이름)·host_id·work_id·**invite_code 전량 덤프**. "초대코드는 난수라 안전" 주장은 보안-바이-옵스큐리티 — 코드 자체가 노출되므로 무의미.
- **H-2 · BroadcastChannel 무인증**(broadcastProvider.ts:65). 동일 오리진서 sessionId만 알면 Yjs 업데이트 주입·presence 스푸핑 가능(awareness의 userId 검증 없음).
- **H-3 · 죽은 서버 코드**(auth/index.ts). `cookies()`/server client 쓰는 admin 체크가 호출처 0 + 정적 export라 실행 불가. "서버 인가가 있다"는 착각 유발 — 나중에 이걸로 게이팅하면 침묵 no-op = 가짜 보안.
- **H-4 · 로그인 레이트리밋 localStorage 전용** — 시크릿창/스토리지 삭제로 우회. 크리덴셜 스터핑 무방비(Supabase Auth 자체 리밋에 의존).
- **H-5 · IS_DEMO_MODE 단일 부울**(client.ts:9). 빌드시 env 오설정 하나로 **프로덕션 전체가 조용히 localStorage 데모모드로 강등**(좋아요·댓글·구매 비영속) — 신호는 console.warn뿐.

## MEDIUM

- **M-2** 실 템플릿 업로드가 Supabase 호출 없이 성공 토스트만(침묵 소실).
- **M-3** whisper 상태전이 RLS가 `OLD.status` 미검증(claim 스킵/레이스).
- **M-4** 크리에이터 대시보드가 서버 `is_creator` 아닌 클라이언트 구독 store로 게이팅.
- **M-5** 스토리지 업로드 검증 클라이언트 전용 + 버킷 RLS 정책이 repo에 없어 검증 불가(경로 `${userId}/avatar` 탈취 여지).

## LOW — 확인 결과 "깨끗함"(강점)

- **L-2** `dangerouslySetInnerHTML` src 전역 0건, 댓글은 JSX 이스케이프 + 입력시 `sanitizeXSS()`.
- **L-3** open-redirect 방어 견고(`validateRedirectUrl` — 프로토콜상대/위험스킴/크로스오리진 차단).
- **L-4** service-role key 등 시크릿 유출 0(.env.local 미추적, anon key는 설계상 공개).
- **L-5** `claude-code`는 CLI 포인터 패키지(런타임 무동작) — 단 `dependencies` 오배치(→ devDependencies 이동/제거).
- **L-6 CSP 존재(강점, 개선 여지)**: `layout.tsx:70` meta CSP — `frame-ancestors 'none'`(클릭재킹 차단), `connect-src`를 supabase/fonts로 제한. 단 `script-src`에 **`'unsafe-inline' 'unsafe-eval'`** = XSS 완화 약화(eval 필요 원인 규명 후 제거·nonce화 권장). 메타 CSP는 헤더 CSP보다 약하므로 런타임 결별 시 헤더로 이관.

## 핵심 경고

C-3/C-4/C-5의 "Supabase에 붙이기" TODO를 **C-1/H-1의 RLS 구멍을 먼저 막지 않고** 완성하면, 오늘의 무해한 데모 이슈가 실 익스플로잇으로 전환된다. 보안 수정 순서가 기능 완성보다 앞서야 한다.

---

## 참고 — 보안 회귀 테스트(Tier 0 봉합 검증)

> 출처: 플랜 "★ 테스트 밑작업" 섹션

- **C-1**: 더미 계정 콘솔서 `supabase.from('profiles').update({role:'super_admin'})` → **거부** 확인.
- **C-3**: `localStorage['pairy-subscription']` tier=creator 주입 후 새로고침 → 서버 검증 후 **미반영** 확인.
- **H-1**: `supabase.from('collab_sessions').select('*')` → **차단/스코프** 확인.
