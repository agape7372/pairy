# 🧚 Pairy - 배포 가이드 (Deployment Guide)

> 마지막 업데이트: 2025-12-30

## 배포 환경 개요

| 환경 | 용도 | 도메인 | 비용 |
|------|------|--------|------|
| Development | 로컬 개발 | localhost:3000 | $0 |
| Production | GitHub Pages (현재) | username.github.io/pairy | **$0** |
| Production | Vercel (백엔드 필요 시) | pairy.io | $0~$20/월 |

**현재 설정**: 정적 사이트 생성(SSG) + GitHub Pages 배포

---

## 1. GitHub Pages 배포 (현재 사용 중)

### 1.1 프로젝트 설정

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'export',           // 정적 HTML 내보내기
  basePath: '/pairy',         // GitHub Pages 경로
  images: {
    unoptimized: true,        // 정적 이미지 사용
  },
  trailingSlash: true,        // URL 끝에 / 추가
};
```

### 1.2 GitHub Actions 워크플로우

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "./out"

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 1.3 GitHub 저장소 설정

1. **GitHub Pages 활성화**
   - Repository Settings > Pages
   - Source: "GitHub Actions" 선택

2. **Secrets 설정** (선택사항)
   - Repository Settings > Secrets > Actions
   - `NEXT_PUBLIC_SUPABASE_URL` (Supabase 연동 시)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase 연동 시)

### 1.4 정적 내보내기 요구사항

동적 라우트에는 `generateStaticParams()` 필수:

```typescript
// src/app/(main)/templates/[id]/page.tsx
export function generateStaticParams() {
  // 사전 정의된 템플릿 ID 목록
  return [
    { id: 'template-pair-1' },
    { id: 'template-pair-2' },
    { id: 'template-imeres-1' },
    // ...
  ];
}

// src/app/(main)/creator/[username]/page.tsx
export function generateStaticParams() {
  return [
    { username: 'strawberry123' },
    { username: 'fairy_art' },
    // ...
  ];
}
```

### 1.5 데모 모드 패턴

GitHub Pages에서는 백엔드 없이 실행:

```typescript
// src/lib/supabase/client.ts
export const IS_DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL;

// 훅에서 사용
if (IS_DEMO_MODE) {
  // localStorage 또는 목업 데이터 사용
  const savedData = localStorage.getItem('pairy_works');
  return JSON.parse(savedData || '[]');
} else {
  // Supabase API 호출
  const { data } = await supabase.from('works').select('*');
  return data;
}
```

---

## 2. Vercel 배포 (백엔드 기능 필요 시)

> Supabase 인증, 서버 액션, API 라우트 등 백엔드 기능이 필요할 때 사용

### 2.1 설정 변경

```typescript
// next.config.ts (Vercel용)
const nextConfig: NextConfig = {
  // output: 'export' 제거
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};
```

### 2.2 프로젝트 연결

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. "Add New Project" 클릭
3. GitHub 저장소 연결
4. 환경 변수 설정

### 2.3 환경 변수

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# App
NEXT_PUBLIC_APP_URL=https://pairy.io

# Payment (추후)
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_xxxxx
TOSS_SECRET_KEY=live_sk_xxxxx
```

---

## 3. Supabase 설정 (Phase 3+)

### 3.1 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. "New Project" 클릭
3. Region: `Northeast Asia (Seoul)` 권장

### 3.2 환경 변수 확보

```bash
# Settings > API에서 확인
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx  # 서버 전용!
```

### 3.3 데이터베이스 마이그레이션

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

### 3.4 OAuth 설정

#### Twitter OAuth
1. [Twitter Developer Portal](https://developer.twitter.com) 앱 생성
2. Callback URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. Supabase > Authentication > Providers > Twitter 활성화

#### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com) 앱 생성
2. Authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. Supabase > Authentication > Providers > Google 활성화

---

## 4. 로컬 개발

### 4.1 명령어

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드 (정적 내보내기)
npm run build

# 정적 파일 서빙 테스트
npx serve out

# 린트
npm run lint
```

### 4.2 환경 변수

```bash
# .env.local (선택사항 - 데모 모드에서는 불필요)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
```

---

## 5. 비용 관리

### 5.1 현재 비용 (GitHub Pages)

| 서비스 | 한도 | 월 비용 |
|--------|------|---------|
| GitHub Pages | 100GB 대역폭/월, 1GB 저장소 | **$0** |
| GitHub Actions | 2,000분/월 (Public Repo 무제한) | **$0** |

### 5.2 확장 시 비용 (Supabase + Vercel)

| MAU | GitHub Pages | Vercel | Supabase | 총 비용 |
|-----|-------------|--------|----------|---------|
| ~1,000 | $0 | $0 | $0 | $0 |
| ~10,000 | $0 | $0 | $25 | $25 |
| ~50,000 | - | $20 | $75 | $95 |

### 5.3 비용 최적화

- [x] 정적 사이트 생성 (SSG) → 서버 비용 제거
- [x] 클라이언트 사이드 이미지 처리 → 서버 부하 없음
- [x] 데모 모드 → 백엔드 없이 테스트 가능
- [ ] 이미지 압축 (WebP) → 대역폭 절감
- [ ] CDN 캐싱 → 반복 요청 비용 절감

---

## 6. 프로덕션 체크리스트

### 6.1 빌드 검증

- [ ] `npm run build` 성공
- [ ] `npm run lint` 통과
- [ ] 모든 동적 라우트에 `generateStaticParams()` 구현

### 6.2 성능

- [ ] Lighthouse 점수 90+ (Performance)
- [ ] 첫 로드 < 3초
- [ ] 번들 사이즈 최적화

### 6.3 SEO

```typescript
// src/app/layout.tsx
export const metadata = {
  metadataBase: new URL('https://username.github.io/pairy'),
  title: {
    default: 'Pairy - 페어를 완성하는 마법',
    template: '%s | Pairy',
  },
  description: '자캐러를 위한 틀 아카이브 + 페어틀 웹 에디터',
  openGraph: {
    title: 'Pairy',
    description: '포토샵 없이, 친구와 함께 페어틀을 채워보세요',
    images: ['/pairy/og-image.png'],
    locale: 'ko_KR',
  },
};
```

---

## 7. 트러블슈팅

### 7.1 404 오류 (GitHub Pages)

**문제**: 새로고침 시 404
**해결**: `trailingSlash: true` 설정 확인

### 7.2 이미지 로드 실패

**문제**: next/image 404
**해결**: `images: { unoptimized: true }` 설정

### 7.3 basePath 문제

**문제**: 링크/이미지 경로 오류
**해결**: 모든 절대 경로에 basePath 포함
```tsx
// 잘못된 예
<Image src="/images/logo.png" />

// 올바른 예
<Image src="/pairy/images/logo.png" />
// 또는 public 폴더의 상대 경로 사용
```

---

## 8. 마이그레이션 가이드

### GitHub Pages → Vercel

1. `next.config.ts`에서 `output: 'export'` 제거
2. `basePath` 제거 (커스텀 도메인 사용 시)
3. Vercel 프로젝트 생성 및 연결
4. 환경 변수 설정
5. 도메인 연결

### 데모 모드 → Supabase

1. Supabase 프로젝트 생성
2. 환경 변수 설정
3. DB 마이그레이션 실행
4. localStorage 데이터 마이그레이션 (필요 시)
