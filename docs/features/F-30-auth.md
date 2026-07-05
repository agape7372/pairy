# F-30 인증/로그인(이메일+비번+OAuth)   [real]

**WHAT**: 회원가입·로그인·비밀번호 재설정·소셜 로그인. `src/app/(main)/login/page.tsx`(632줄), `src/app/(main)/reset-password/page.tsx`(256줄).

**현재상태**: 실동작(FACT). login/page.tsx:115행대 `signInWithOAuth()`(구글·X/Twitter 버튼, `/auth/callback` 리다이렉트), :152-157행대 회원가입 시 비밀번호 복잡성 검증(`validatePassword()`, 최소 8자+대문자+소문자+숫자), :193행대 `signUp()`(이메일 인증 링크 발송, `confirmed_at` 대기), :216행대 `signInWithPassword()`. reset-password/page.tsx:51행대 `resetPasswordForEmail()`. **`signInWithOtp`(매직링크) 코드는 저장소 전체에 없음 — DL-0002가 요구하는 패스워드리스 경로는 완전 신규 구현 필요.**

**스펙정합**: DL-0002(플랜 §5.1, 2026-07-05 결정) — "이메일 기반을 기본·유일 권장, Google/Kakao/Naver 소셜 제거(또는 기본 미노출), 매직링크/OTP 권장"과 현재 구현 사이 갭: 현재는 소셜 버튼이 노출 상태이고 매직링크는 없음.

**문제·리스크**: PII 반경 확대(Medium, DL-0002 근거) — 자캐 팬덤의 가명 문화상 실명 연동 소셜(구글 등)이 가입 이탈을 유발할 수 있다는 것이 Fable의 정성적 판단(코드 버그 아님, 전략적 판단). CSP `unsafe-eval`(L-6, layout.tsx의 메타 CSP) 규명 필요성이 이 영역과 인접.

**Fable판정**: **수정 — 소셜 제거·매직링크(DL-0002)**. 코드 버그 수정이 아니라 DL-0002라는 **이미 확정된 Fable 결정**의 실행 단계 — 하위 모델은 "왜"를 재고민할 필요 없이 실행만 하면 됨.

**다음작업**:
1. login/page.tsx의 소셜 로그인 섹션(구글·X/Twitter 버튼, 115행대 인근)을 제거 또는 feature-flag로 숨김 — AC: 기본 노출 UI에 이메일 폼만 표시(단, X/Twitter는 DL-0002 및 §2.7 벤치마킹에서 "페어리의 실차별 진입점"으로 별도 언급됐으므로 완전 제거보다 feature-flag 보류 권장 — Fable 재확인 대상). (Sonnet)
2. `signInWithOtp` 기반 매직링크 로그인 경로 신규 추가(비밀번호 저장 자체를 없애는 옵션) — AC: 이메일 입력→링크 클릭→로그인 성공, 비밀번호 필드 없이 완결. (Sonnet)
3. `profiles` 스키마에 불필요 PII 컬럼(실명·전화·생년월일) 없는지 확인(F-17/F-26의 테이블 신설 작업과 함께 점검) — AC: 스키마 리뷰 완료. (Sonnet)
4. CSP의 소셜 도메인 `connect-src` 정리(소셜 제거 시 해당 도메인 항목 삭제). (Haiku)

**의존·순서**: DL-0002 자체는 이미 확정(재논의 불필요). X/Twitter OAuth의 완전제거 여부만 Fable 재확인 후 1번 진행. 2번은 독립적으로 즉시 착수 가능.
