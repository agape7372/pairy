# 8. 런타임 방향 스파이크 — 정적 export 결별 옵션 비교

> **이 문서는 원 플랜(`polymorphic-greeting-gizmo.md`)에 없던 신규 작성분이다.** §9 Tier 0 항목 4("정적 export 결별")·§10 로드맵 M0–M2의 실행 판단을 뒷받침하기 위한 의사결정 지원 분석이며, **DL-0001(런타임 방향 결정)**의 입력 자료로 쓰인다. 전면 이전은 아직 착수하지 않음 — 이 문서는 스파이크(비교·권고)이지 실행이 아니다.

## 0. 전제 — 지금 무엇이 막혀 있나 (FACT, 코드 직접 검증)

- **`next.config.ts`**: `output: 'export'` + `basePath: '/pairy'` + `images.unoptimized: true` + `trailingSlash: true`. 서버 런타임 0, 이미지 최적화 0, 배포 경로가 `/pairy` 하위로 고정.
- **`.github/workflows/deploy.yml`**: `npm run build` → `./out` 산출물을 GitHub Pages(`actions/deploy-pages@v4`)로 업로드하는 순수 정적 배포. 서버 프로세스·Edge Function·Serverless Function 개념 자체가 파이프라인에 없음.
- **UGC 라우트 4종의 `generateStaticParams`가 전부 데모 ID만 사전생성** (직접 확인):
  - `src/app/(main)/share/[shareId]/page.tsx:5-9` → `[{ shareId: 'demo' }]`
  - `src/app/(main)/collab/[code]/page.tsx:3-7` → `[{ code: 'DEMO' }]`
  - `src/app/(main)/templates/[id]/page.tsx:3-…` → `{ id: '1' }`~`{ id: '8' }` 8개 고정
  - `src/app/(main)/creator/[username]/page.tsx:3-…` → `strawberry123`/`fairy_art`/`moonlight`/`mintchoco`/`roseberry` 등 데모 8명 고정
  → 이 4개 경로 밖의 실제 사용자 ID·공유 코드·초대 코드·크리에이터 핸들은 **빌드 시점에 존재하지 않으므로 정적 export 산출물에 페이지 자체가 없다.** GitHub Pages는 없는 경로를 404로 응답 — "느리다"가 아니라 "그 URL이 아예 없다".
- **결제 관련 코드 0건**: `grep -ri "toss\|stripe" src` → 매치 0. `grep -ri "webhook" src` → 매치 0. 결제를 구현할 서버 진입점 자체가 없다(정적 export라 애초에 API Route/webhook 핸들러를 둘 수 없음).
- **OG 메타데이터는 이미 잘 만들어져 있으나 정적이라 무의미**: `share/[shareId]/page.tsx`의 `generateMetadata()`는 `openGraph`/`twitter` 카드를 제대로 구성하지만, 주석에 스스로 "기본 메타데이터 (클라이언트에서 실제 데이터 로드)"라고 적혀 있다 — 즉 **빌드 시 고정된 제목/설명("공유된 작품 | Pairy")만 나가고, 실제 공유 대상 작품의 썸네일·제목은 절대 서버 렌더 메타에 반영되지 않는다.** 카카오톡/트위터/디스코드 언퍼(unfurl) 봇은 클라이언트 JS를 실행하지 않으므로 항상 제네릭 카드만 본다.

## 1. 옵션 A — Vercel 이전 (Next 서버/ISR/SSR)

### 마이그레이션 난이도

- **`next.config.ts` 변경**: `output: 'export'` 제거(또는 미지정 = 기본 하이브리드 렌더링), `basePath: '/pairy'` 제거(커스텀 도메인 또는 `pairy.vercel.app`으로 이전 시 불필요), `images.unoptimized: true` 제거하고 Next Image Optimization 활성화(단, Supabase Storage 이미지 도메인을 `images.remotePatterns`에 등록 필요).
- **동적 라우트 4종**: `generateStaticParams`를 제거하거나 ISR(`export const revalidate = N` 또는 `dynamicParams: true` + on-demand)로 전환 — Supabase에서 실제 데이터를 조회해 요청 시(또는 재검증 주기로) 렌더링. 코드 변경량은 크지 않음(각 페이지 1~2줄 삭제/추가) — **단 "이미 존재하는 데이터 페칭 훅(`useTemplates`, `useShareWork` 등)을 서버 컴포넌트/`generateMetadata`에서도 재사용 가능하게 리팩터"가 실제 공수**. `useShareWork`(567줄)는 감사 결과 "hook은 real·최고품질"로 평가됨 — 서버측 재사용 가능성 높음.
- **API Routes 신설**: 결제 웹훅(`/api/webhooks/toss` 등), OG 이미지 생성(`/api/og`)을 위한 Route Handler 추가. 정적 export에서는 애초에 존재할 수 없던 파일 유형이라 "이전"이 아니라 "신설".
- **CI/CD 교체**: `.github/workflows/deploy.yml`(GitHub Pages 전용)을 Vercel Git 연동으로 대체 또는 병행 제거. GitHub Actions에서 `NEXT_PUBLIC_*` env를 Vercel 프로젝트 설정으로 이관.
- **배포 도메인 변경**: 현재 `https://agape7372.github.io/pairy`(deploy.yml의 `NEXT_PUBLIC_SITE_URL`) → Vercel 도메인 또는 커스텀 도메인으로 전 링크 체계 변경. `basePath` 제거로 URL 구조 자체가 `/pairy/...` → `/...`로 바뀜(리다이렉트 설계 필요, 기존 공유 링크 하위호환 이슈).
- **난이도 총평**: **중간**. Next.js 자체가 하이브리드 렌더링을 기본 지원하므로 프레임워크 마이그레이션은 아니다(React Router나 다른 프레임워크로 갈아타는 것과 다름). 실제 공수는 (1) 각 데이터 훅을 서버에서도 호출 가능하게 다듬기, (2) 결제/OG API Route 신설, (3) 배포 파이프라인 교체, (4) URL 구조 변경에 따른 하위호환 처리.

### 비용

- Vercel Hobby(무료) 티어로 시작 가능하나 상업 서비스(수익화 예정)는 이용약관상 Pro 이상 권장. Pro는 팀당 월 $20~ 기본 + 함수 실행시간/대역폭 초과 종량. 트래픽이 낮은 초기(자캐 커뮤러 협소 타깃)엔 Pro 1석으로 충분할 가능성 높음.
- GitHub Pages(현재, 무료)에서 유료 플랫폼으로 전환 → **월 고정비 발생이 확정적 변화**. 단, 결제·서버 렌더가 아예 불가능한 현재 대비 "매출 라인 0개 확실"(§1)과 "월 $20~"를 비교하면 사업 성립 조건.

### `basePath:'/pairy'` + `output:'export'` 제거 영향

- **긍정**: URL이 `/pairy/...`에서 `/...`로 단순화(공유 링크·SEO·소셜 카드에 유리). 이미지 최적화 활성화(현재 `unoptimized: true`로 전량 원본 크기 서빙 — 성능 손실). 서버 컴포넌트에서 Supabase 직접 조회 가능(현재는 클라이언트 전용).
- **부정/리스크**: 기존에 이미 공유된 `/pairy/...` 링크(있다면)가 깨짐 — 단, §1에서 확인했듯 실사용자 공유 링크가 애초에 데모 ID 외엔 404였으므로 **깨질 "살아있는" 링크가 사실상 없다**(오히려 지금이 전환 비용이 가장 싼 시점). `NEXT_PUBLIC_BASE_PATH`/`NEXT_PUBLIC_SITE_URL`을 참조하는 코드 전량(CSP `connect-src`, OG `baseUrl` 등) 점검 필요.

### UGC-404 문제 해결 여부

- **해결됨.** ISR/동적 렌더로 전환 시 `templates/[id]`, `share/[shareId]`, `collab/[code]`, `creator/[username]`은 Supabase에서 실 데이터를 조회해 요청 시점에 페이지를 생성 — 사전에 알 수 없는 실 사용자 ID·공유 코드·초대 코드가 더 이상 "빌드 시 존재하지 않아서 404"가 되지 않는다. 이것이 **Tier 0 근본 원인 해결**(§9 항목 4·5)에 해당하는 옵션.

### 결제 웹훅 실현성

- **가능.** Route Handler(`app/api/webhooks/toss/route.ts` 등)로 서버 진입점 확보 → Toss/Stripe 서명 검증 후 Supabase에 안전하게 반영 가능. 이는 정적 export에서는 구조적으로 불가능했던 것(§4 C-3/C-4 "서버 신뢰경계 부재"의 근본 해소 경로).

### SEO/OG 언퍼

- **해결됨.** `generateMetadata`를 서버에서 실제 작품 데이터로 채울 수 있음(현재 이미 함수 골격은 있으나 정적이라 무의미했던 것을 실동작으로 전환) — 카카오톡/트위터 공유 시 실제 썸네일·제목 노출.

## 2. 옵션 B — 정적 유지 + 결제 웹훅/OG 전용 서버리스 함수만 추가

구조: 프론트는 그대로 GitHub Pages 정적 export 유지, 결제 웹훅·OG 이미지 생성 등 "서버가 반드시 필요한 최소 기능"만 별도 서버리스(Supabase Edge Functions, 또는 Cloudflare Workers 등)로 분리.

### 마이그레이션 난이도

- **`next.config.ts`/배포는 무변경.** 프론트 코드 자체는 지금처럼 정적 export + 클라이언트 Supabase 호출 유지.
- **Supabase Edge Functions(Deno) 신설**: 결제 웹훅 수신·서명 검증·`purchases`/`subscriptions` 테이블 반영을 Edge Function 1~2개로 구현. Supabase 프로젝트가 이미 있으므로(`cqmukwbwuzqgkpgogmby`) 인프라 추가 계정 없이 가능.
- **OG 이미지**: 별도 서버리스(예: Cloudflare Workers + `@vercel/og` 유사 라이브러리, 또는 Supabase Edge Function에서 이미지 생성)로 `/api/og?shareId=...` 형태 엔드포인트를 만들어야 하나, **이 엔드포인트를 카카오/트위터 언퍼 봇이 참조하려면 결국 그 URL을 프론트가 서빙하는 HTML의 `<meta property="og:image">`에 넣어야 한다** — 그런데 정적 export의 `generateMetadata`는 빌드 시점에 고정되므로, 실 공유 URL(`share/{실제ID}`)에 대한 메타 태그 자체를 서버가 요청 시 못 바꾼다. **즉 OG 메타 문제는 이 옵션 B로는 근본 해결되지 않는다** — 언퍼 봇용 메타를 동적으로 내보내려면 결국 그 라우트의 HTML 서빙 자체가 동적이어야 하는데, 그게 안 되는 게 정적 export의 정의다.
- **UGC-404 문제**: 마찬가지로 **근본 해결 안 됨.** `templates/[id]`·`share/[shareId]`·`collab/[code]`·`creator/[username]`은 여전히 `generateStaticParams`가 빌드 시 알 수 없는 실 ID를 사전생성할 수 없다. 우회책으로 "SPA catch-all 라우팅"(§9 항목 4의 대안으로 명시된 것)을 쓸 수는 있음 — 즉 정적 `index.html` 하나를 모든 동적 경로에 서빙하고 클라이언트 JS가 라우팅·데이터 페칭을 전담하는 방식. 이러면 404는 면하지만 **SEO/OG 문제는 여전히 미해결**(언퍼 봇은 JS를 실행하지 않으므로 클라이언트 라우팅으로 채운 메타를 못 봄).

### 비용

- Supabase Edge Functions: 이미 있는 Supabase 프로젝트에 포함(무료 티어에도 일정 호출량 포함, 초과 시 종량 — Vercel Pro 고정비보다 낮은 초기 비용일 가능성). GitHub Pages 배포는 계속 무료.
- **총비용은 옵션 A보다 낮음** — 단, 아래 "해결 안 되는 것" 대가.

### 결제 웹훅 실현성

- **가능.** 이 옵션의 핵심 목적이 바로 이것 — 결제 웹훅만큼은 서버리스로 분리하면 되므로, **§9 Tier 0 항목 6(결제 백엔드)만 놓고 보면 옵션 B로도 해결 가능.**

### UGC-404 / SEO-OG 해결 여부

- **UGC-404**: SPA catch-all 우회는 가능하나 "정적 파일 사전생성" 자체의 근본 해결은 아님(우회이지 해소가 아님).
- **SEO/OG**: **근본 미해결.** 정적 HTML의 메타 태그가 요청별로 바뀔 수 없다는 제약이 그대로 남음 — 공유 링크 바이럴(§1 치명 테마 1)의 절반(라우트 자체 404)은 catch-all로 완화되어도, 나머지 절반(소셜 언퍼 시 실제 썸네일 노출)은 이 옵션으로 못 고친다.

## 3. 비교 요약

| 항목 | A. Vercel 이전 | B. 정적 유지 + 서버리스 함수만 |
|---|---|---|
| 마이그레이션 난이도 | 중간(하이브리드 렌더링 전환 + API Route 신설 + 배포 파이프라인 교체) | 낮음(기존 정적 배포 무변경 + Edge Function 추가) |
| 비용 | 중간(월 고정비, Pro~) | 낮음(기존 Supabase 포함 한도 활용) |
| `basePath`/`output:export` 제거 영향 | 제거함 — URL 단순화, 이미지 최적화 활성화, 서버 데이터 페칭 가능 | 유지함 — 기존 제약 그대로 |
| UGC-404 (templates/share/collab/creator) | **근본 해결** | 우회만 가능(catch-all), 근본 미해결 |
| 결제 웹훅 | 가능 (Route Handler) | 가능 (Edge Function) |
| SEO/OG 언퍼 (share 링크 실제 썸네일) | **해결** | **미해결** (구조적으로 불가) |
| 스코프 | 파운데이션 전체 교체 | 최소 침습, 국소 패치 |

## 4. 권고

**옵션 A(Vercel 이전)를 권고한다.** 근거:

1. §1 치명 4대 테마 중 "UGC 라우트 붕괴"와 "결제 전무"는 모두 **서버 렌더링 부재**라는 동일 원인에서 갈라져 나온 증상이다. 옵션 B는 결제만 국소 해결하고 UGC-404·SEO/OG는 우회 또는 미해결로 남긴다 — §9 Tier 0가 "정적 export 결별(항목 4)"과 "동적 서빙 복구(항목 5)"를 결제(항목 6)보다 먼저·같이 묶어 놓은 것과 정합적으로, **결제만 고치는 것은 근본 처방이 아니라 대증 치료**다.
2. 공유 링크 바이럴(트위터 자캐 커뮤니티가 핵심 타깃, §2.7에서 확인된 X/트위터 중심 유통 채널)은 라우트 존재 여부뿐 아니라 **언퍼 시 실제 썸네일이 보이는지**가 전환율을 좌우한다 — 옵션 B로는 이 절반이 영구 미해결.
3. 마이그레이션 공수는 "중간"이지 프레임워크 재작성이 아니다 — Next.js가 정적/하이브리드를 같은 프로젝트 내에서 지원하므로, 이미 존재하는 데이터 훅(`useTemplates`, `useShareWork` 등— 감사에서 "hook은 real·최고품질"로 평가됨)을 재사용할 여지가 크다.
4. **단, 비용 증가(월 고정비)는 사실이며 사용자 확인이 필요한 트레이드오프다.** 결제 라인이 아직 없는 현재(§1 "매출 라인 0개 확실") 시점에 고정비를 먼저 지출하는 순서가 맞는지는 사업 판단 영역 — 이는 Fable의 기술 판정 밖이므로 **DL-0001에 "비용 감수 여부"를 사용자 결정 항목으로 명시**할 것을 제안한다.

**옵션 B는 대안이 아니라 "당장 Vercel 이전이 불가할 때의 임시 완화책"으로만 위치시켜야 한다** — 결제 웹훅 하나만 급하게 열어야 하는 상황이라면 옵션 B로 그 항목만 국소 해결 후, 옵션 A 이전을 늦추지 않는 것이 맞다. 두 옵션을 "택1로 영구 고정"하는 것은 권장하지 않는다.

## 5. 이 결정이 어디로 이어지는가 (DL-0001)

이 문서는 **DL-0001(런타임 방향 결정)**의 근거 자료다. 원 플랜의 실행계획(§실행계획-D)은 "런타임 스파이크(결정만, 전면 이전 안 함)"으로 스코프를 한정했다 — 즉 이 문서 작성으로 스파이크 단계는 완료되나, **실제 Vercel 이전 착수는 별도 승인을 요한다.** `docs/ai-org/decisions/DL-0001.md`(정본화 시)에는 이 문서의 권고(옵션 A) + 비용 트레이드오프에 대한 사용자 결정을 함께 기록해야 한다.
