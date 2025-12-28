# Pairy - 함께 채우는 우리만의 이야기

자캐 페어틀을 웹에서 바로 편집하고, 친구와 실시간으로 함께 완성하는 플랫폼입니다.

## 시작하기

### 필수 요구사항

- Node.js 18+
- Supabase 프로젝트

### 설치

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일에 Supabase 정보 입력

# 개발 서버 실행
npm run dev
```

### 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Auth, Database, Storage)
- **State**: Zustand

## 디자인 시스템

딸기크림 파스텔 테마:
- Primary: `#FFD9D9` (파스텔 핑크)
- Accent: `#D7FAFA` (파스텔 민트)

자세한 디자인 가이드는 `/docs/master-prompt/03-design-system.md` 참조

## 프로젝트 구조

```
src/
├── app/                  # Next.js App Router
│   ├── page.tsx          # 랜딩 페이지
│   ├── templates/        # 틀 목록/상세
│   ├── login/            # 로그인
│   └── auth/callback/    # OAuth 콜백
├── components/
│   ├── ui/               # 공통 UI 컴포넌트
│   └── layout/           # 레이아웃 컴포넌트
├── lib/
│   └── supabase/         # Supabase 클라이언트
├── hooks/                # 커스텀 훅
├── stores/               # Zustand 스토어
└── types/                # TypeScript 타입
```

## 라이선스

© 2025 Pairy. All rights reserved.
