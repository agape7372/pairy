# 페어리 테스트 — 더미 계정으로 실제 돌려보기

> 목적: 감사(2026-07-05) 후 실제로 **더미 아이디를 만들어 전 기능을 눌러보며** 검증. 무엇이 진짜 동작하고 무엇이 데모/미배선인지 [E2E-CHECKLIST.md](./E2E-CHECKLIST.md)로 구분.

## 두 경로 중 선택

### 경로 A — 데모 모드 (로그인 불필요, 가장 빠름)
로그인·백엔드 없이 UI/에디터를 클릭 테스트.
1. `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY` 두 줄을 주석(#) 처리 → `IS_DEMO_MODE=true`.
2. `npm run dev` → http://localhost:3000
3. 전 기능이 localStorage로 동작. **제약**: 로그인/소셜/실 협업은 "데모 모드에서는…"으로 막힘.

### 경로 B — 실 모드 + 더미 계정 (로그인 포함 전 플로우)
실제 Supabase에 로그인 가능한 더미 유저를 만들어 크리에이터 플로우까지 테스트.
1. **DB 준비**(Supabase SQL Editor 또는 `supabase db push`):
   1. `supabase/schema.sql` 실행(테이블·RLS·트리거).
   2. `supabase/migrations/20260706000000_tier0_security_hardening.sql` 실행(**Tier 0 보안 봉합** — 적용 전 백업).
   3. `supabase/seed.sql` 실행(열람용 콘텐츠: 크리에이터 5·템플릿 8·댓글·좋아요·팔로우).
2. **더미 계정 생성**(로그인 가능):
   - `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY` 추가(대시보드 > API > service_role, **커밋 금지**).
   - `node --env-file=.env.local scripts/seed-dummy-auth.mjs`
   - 출력된 이메일/비번으로 `/login`.
3. `npm run dev` → 가입/로그인/에디터/업로드/협업 전 플로우.

> ⚠ 안전: 계정 생성·비번 입력은 AI가 직접 하지 않는다(헌법 §2). 위 스크립트는 **사용자가** 실행한다. service_role 키는 로컬 `.env.local`(gitignored)에만.

## 알려진 미배선 (테스트 시 "버그 아님, 감사서 확인된 결함")
빈 화면·no-op·404를 만나면 먼저 [E2E-CHECKLIST.md](./E2E-CHECKLIST.md)의 "알려진 결함" 열을 확인. 대표:
- 자캐 10개 제한 안 걸림(canCreateMore 버그, F-17) · 자료 업로드가 어디에도 안 보임(F-16b) · 위스퍼 전송 no-op(F-18) · 공유 링크 새 탭 404(F-23) · 다크모드 미작동(F-32) · 게이미피케이션 안 변함(F-29).

## 자동 테스트
- 유닛: `npm test` (Jest, ~13종) · e2e: `npm run test:e2e` (Playwright, `e2e/canvas-editor.spec.ts`).
- ⚠ CI(`.github/workflows/deploy.yml`)는 현재 build만 — 테스트·lint 게이트 없음(TOP50 #9).

## 보안 회귀 (Tier 0 봉합 후)
[E2E-CHECKLIST.md](./E2E-CHECKLIST.md) 하단 "보안 회귀" 3종(C-1/C-3/H-1)으로 봉합 확인.
