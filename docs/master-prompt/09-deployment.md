# 🧚 Pairy - 배포 가이드 (Deployment Guide)

## 배포 환경 개요

| 환경 | 용도 | 도메인 |
|------|------|--------|
| Development | 로컬 개발 | localhost:3000 |
| Preview | PR 미리보기 | *.vercel.app |
| Production | 실서비스 | pairy.io |

---

## 1. Supabase 설정

### 1.1 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `pairy`
   - Database Password: 강력한 비밀번호 생성
   - Region: `Northeast Asia (Seoul)` 권장
4. 프로젝트 생성 완료 대기 (약 2분)

### 1.2 환경 변수 확보

```bash
# Settings > API에서 확인

# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# anon (public) key - 클라이언트용
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx

# service_role key - 서버용 (비밀로 유지!)
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

### 1.3 데이터베이스 마이그레이션

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref YOUR_PROJECT_REF

# 마이그레이션 실행
supabase db push

# 타입 생성
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### 1.4 OAuth 설정

#### Twitter OAuth
1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) 접속
2. 새 앱 생성 또는 기존 앱 선택
3. User authentication settings 설정:
   - App permissions: Read
   - Type of App: Web App
   - Callback URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Website URL: `https://pairy.io`
4. Client ID와 Client Secret 복사
5. Supabase Dashboard > Authentication > Providers > Twitter 활성화
6. Client ID, Client Secret 입력

#### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 선택
3. APIs & Services > Credentials > Create Credentials > OAuth client ID
4. Application type: Web application
5. Authorized redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
6. Client ID와 Client Secret 복사
7. Supabase Dashboard > Authentication > Providers > Google 활성화
8. Client ID, Client Secret 입력

### 1.5 Storage 버킷 설정

Supabase Dashboard > Storage에서:

```sql
-- SQL Editor에서 실행

-- 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('thumbnails', 'thumbnails', true),
  ('works', 'works', false);

-- RLS 정책은 06-database-schema.md 참조
```

### 1.6 Realtime 설정

```sql
-- templates 테이블 Realtime 활성화
ALTER publication supabase_realtime ADD TABLE templates;

-- collab_sessions Realtime 활성화
ALTER publication supabase_realtime ADD TABLE collab_sessions;
```

---

## 2. Vercel 배포

### 2.1 프로젝트 연결

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. "Add New Project" 클릭
3. GitHub 저장소 연결
4. 프로젝트 설정:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 2.2 환경 변수 설정

Vercel Dashboard > Settings > Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# App
NEXT_PUBLIC_APP_URL=https://pairy.io

# Payment
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_xxxxx
TOSS_SECRET_KEY=live_sk_xxxxx

# Analytics (선택)
NEXT_PUBLIC_MIXPANEL_TOKEN=xxxxx
```

### 2.3 도메인 설정

1. Vercel Dashboard > Settings > Domains
2. "Add Domain" 클릭
3. `pairy.io` 입력
4. DNS 레코드 설정:
   ```
   Type: A
   Name: @
   Value: 76.76.19.19

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### 2.4 빌드 설정

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // 프로덕션 빌드 최적화
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
```

---

## 3. 토스페이먼츠 설정

### 3.1 사업자 등록

1. [토스페이먼츠](https://developers.tosspayments.com) 가입
2. 사업자 정보 등록 (개인 사업자 가능)
3. 심사 완료 대기 (1~3일)

### 3.2 API 키 발급

```bash
# 테스트 키 (개발용)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxxx
TOSS_SECRET_KEY=test_sk_xxxxx

# 라이브 키 (프로덕션용)
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_xxxxx
TOSS_SECRET_KEY=live_sk_xxxxx
```

### 3.3 웹훅 설정

1. 토스페이먼츠 개발자센터 > 웹훅 설정
2. 웹훅 URL: `https://pairy.io/api/payment/webhook`
3. 이벤트: 결제 승인, 취소, 환불

---

## 4. 모니터링 설정

### 4.1 Vercel Analytics

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 4.2 에러 트래킹 (Sentry)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 4.3 로깅

```typescript
// src/lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message: string, data?: object) => {
    if (isDev) console.log(`[INFO] ${message}`, data);
    // 프로덕션: 외부 로깅 서비스로 전송
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // Sentry 전송 등
  },
  warn: (message: string, data?: object) => {
    console.warn(`[WARN] ${message}`, data);
  },
};
```

---

## 5. CI/CD 설정

### 5.1 GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Test
        run: npm test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  build:
    runs-on: ubuntu-latest
    needs: lint-and-test

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

### 5.2 Preview 배포

Vercel에서 자동으로 PR마다 Preview 배포 생성됨.

```yaml
# vercel.json (선택적 설정)
{
  "github": {
    "enabled": true,
    "autoJobCancelation": true
  },
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

---

## 6. 프로덕션 체크리스트

### 6.1 보안

- [ ] 환경 변수가 Vercel에 올바르게 설정됨
- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 클라이언트에 노출되지 않음
- [ ] OAuth redirect URI가 프로덕션 도메인으로 설정됨
- [ ] CORS 설정 확인
- [ ] Rate limiting 활성화

### 6.2 성능

- [ ] 이미지 최적화 (next/image 사용)
- [ ] 코드 스플리팅 적용
- [ ] 캐싱 전략 설정
- [ ] CDN 활용 (Vercel Edge Network)

### 6.3 SEO

- [ ] 메타 태그 설정
- [ ] OG 이미지 설정
- [ ] robots.txt 설정
- [ ] sitemap.xml 생성

```typescript
// src/app/layout.tsx
export const metadata = {
  metadataBase: new URL('https://pairy.io'),
  title: {
    default: 'Pairy - 페어를 완성하는 마법',
    template: '%s | Pairy',
  },
  description: '자캐러를 위한 틀 아카이브 + 페어틀 웹 에디터',
  openGraph: {
    title: 'Pairy - 페어를 완성하는 마법',
    description: '포토샵 없이, 친구와 함께 페어틀을 채워보세요',
    url: 'https://pairy.io',
    siteName: 'Pairy',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pairy - 페어를 완성하는 마법',
    description: '자캐러를 위한 틀 아카이브 + 페어틀 웹 에디터',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### 6.4 법적 요구사항

- [ ] 이용약관 페이지
- [ ] 개인정보처리방침 페이지
- [ ] 사업자 정보 표시 (결제 서비스 시)

---

## 7. 비용 관리

### 7.1 무료 티어 한도

| 서비스 | 무료 한도 | 초과 시 비용 |
|--------|----------|-------------|
| Vercel | 100GB 대역폭/월 | $20/100GB |
| Supabase | 500MB DB, 1GB Storage | Pro $25/월 |
| Supabase | 2GB 대역폭/월 | $0.09/GB |

### 7.2 확장 시 비용 예상

| 유저 수 | Vercel | Supabase | 총 월 비용 |
|---------|--------|----------|-----------|
| ~500명 | $0 | $0 | ₩0 |
| ~2,000명 | $0 | $0~$25 | ₩0~₩35,000 |
| ~5,000명 | $20 | $25 | ₩60,000 |
| ~10,000명 | $20 | $75 | ₩120,000 |

### 7.3 비용 최적화 팁

1. **이미지 최적화**: 썸네일 압축, WebP 형식 사용
2. **캐싱 활용**: Vercel Edge Cache, SWR
3. **DB 쿼리 최적화**: 인덱스 활용, N+1 방지
4. **Storage 정리**: 미사용 파일 정기 삭제

---

## 8. 백업 & 복구

### 8.1 데이터베이스 백업

```bash
# Supabase 자동 백업 (Pro 플랜)
# 또는 수동 백업:
pg_dump -h YOUR_HOST -U postgres -d postgres > backup.sql
```

### 8.2 Storage 백업

```typescript
// 중요 파일 외부 백업 스크립트
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(URL, SERVICE_KEY);

async function backupBucket(bucketName: string) {
  const { data: files } = await supabase.storage
    .from(bucketName)
    .list();

  for (const file of files) {
    const { data } = await supabase.storage
      .from(bucketName)
      .download(file.name);

    fs.writeFileSync(`backup/${bucketName}/${file.name}`, data);
  }
}
```

---

## 9. 롤백 절차

### 9.1 Vercel 롤백

1. Vercel Dashboard > Deployments
2. 이전 성공한 배포 선택
3. "..." > "Promote to Production" 클릭

### 9.2 데이터베이스 롤백

```bash
# 마이그레이션 롤백
supabase db reset

# 또는 특정 버전으로 복원
psql -h YOUR_HOST -U postgres -d postgres < backup.sql
```

---

## 10. 운영 명령어

```bash
# 로컬 개발
npm run dev

# 프로덕션 빌드 테스트
npm run build && npm run start

# 타입 체크
npm run type-check

# 린트
npm run lint

# Supabase 타입 생성
npm run db:generate

# Supabase 마이그레이션
npm run db:push

# Supabase 로컬 시작
supabase start

# Supabase 로컬 중지
supabase stop
```
