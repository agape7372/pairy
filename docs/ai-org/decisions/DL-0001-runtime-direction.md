# DL-0001 · 정적 export 결별 방향

- 상태: **CLOSED — 옵션 A(Vercel 이전) 확정·실행 (사용자 승인 2026-07-12)**
- 날짜: 2026-07-06 (결정 확정·실행: 2026-07-12)
- 결정권자: Fable (스파이크 권고) + 사용자 (비용 트레이드오프 승인)

## 실행 결과 (2026-07-12)

- 사용자가 옵션 A 승인(비용: Hobby 무료 시작, 수익화 시 Pro 전환 인지). GitHub Pages 데모는 폐기·Vercel 단일화.
- `output:'export'`·`basePath:'/pairy'`·`trailingSlash` 제거, UGC 동적 라우트 4종(share/collab/creator/templates) 온디맨드 렌더 전환.
- share OG 는 `generateMetadata` 서버 실데이터(제목/썸네일) + 제네릭 폴백.
- H-5 동반 해소: 프로덕션 빌드 env 가드 + 데모모드 배너.
- 배포: Vercel `jirings-projects/pairy`, GitHub 저장소 연동(main push=프로덕션, PR=프리뷰). **프로덕션 도메인: https://pairy-six.vercel.app**.
- 검증: 임의 실 ID 로 4개 라우트 200 응답(구 Pages 404 소멸), og:url 프로덕션 도메인 반영.
- 잔여(이 결정 밖): 결제 웹훅 Route Handler 신설(Tier 0 #6), 이미지 최적화(remotePatterns) 별도 결정, 커스텀 도메인.

## 문제
페어리는 `output:'export'`(정적 GitHub Pages)인데 UGC·거래 플랫폼을 지향한다. 이 불일치가 4대 치명 중 3개의 뿌리:
- UGC 라우트 404: `generateStaticParams`가 데모 ID만 생성 → 실 콘텐츠/공유/크리에이터 URL 접근 불가.
- 결제 웹훅 불가: 서버 런타임 0 → Toss/Stripe 확정 웹훅 수신 불가.
- 협업/공유 OG: 동적 라우트·크롤러 메타 불가.

## 가정
- (A1) UGC를 실 URL로 서빙하려면 서버 렌더 or SPA catch-all + rewrite가 필요하다.
- (A2) 안전한 결제 확정엔 서버 엔드포인트(웹훅)가 필요하다.
- (A3) Supabase 클라이언트 인증·RLS는 정적 SPA서도 동작한다(인증 자체는 정적서 가능).

## 반박
- "정적 유지 + Supabase Edge Function만으로 충분?" → 결제 웹훅은 되지만 UGC 404·OG 언퍼는 SPA rewrite로 별도 해결 필요. 부분해.
- "Vercel 이전이 과한가?" → 이미 Next.js라 마이그레이션 난도 낮음. `basePath:/pairy`·`output:export` 제거 영향만 검증하면 됨.

## 선택지
| | A. Vercel(Next 서버/ISR) 이전 | B. 정적 유지 + 서버리스 결제함수 |
|---|---|---|
| UGC 404 해결 | ✅ 서버/ISR 렌더 | △ SPA catch-all + rewrite 별도 |
| 결제 웹훅 | ✅ Route Handler | ✅ Edge Function |
| OG 언퍼(공유) | ✅ 동적 메타 | ❌ 크롤러 JS 미실행 |
| 호스팅 비용 | Vercel 의존(무료 티어 가능) | GitHub Pages 무료 유지 |
| 마이그레이션 난도 | 낮음(이미 Next) | 중(rewrite·함수 분리) |

## 잠정 권고 (스파이크로 확정)
**A(Vercel/ISR) 유력** — 4대 치명 중 3개를 한 번에 풀고, 이미 Next.js라 전환 비용이 낮다. 단 사용자가 무료 호스팅·의존 최소화를 우선하면 B(하이브리드)도 성립.
→ `docs/audit-2026-07-05/08-runtime-spike.md`의 상세 비교 + PoC 후 이 DL을 CLOSED로 갱신.

## 되돌림 조건
스파이크에서 Vercel 마이그레이션이 예상외로 크거나(대규모 라우트 파손) 비용이 문제면 B로 선회.
