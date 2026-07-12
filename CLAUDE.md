# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start Next.js development server
npm run build    # Build for production (static export, uses --webpack)
npm run lint     # Run ESLint checks
npm start        # Start production server
```

**Note**: Build uses `--webpack` flag to avoid Turbopack Korean path bug (Next.js 16.x).

**Note**: This project uses static export (`output: 'export'`) for GitHub Pages. All pages must support static generation or use `generateStaticParams()` for dynamic routes.

## Architecture Overview

### Route Structure (Next.js App Router)
- `(main)/` - Standard layout with header/footer
- `(editor)/` - Editor layout without header (full-screen focused)

### Core Layers
| Layer | Location | Purpose |
|-------|----------|---------|
| Pages | `src/app/` | Route handlers and page components |
| Components | `src/components/` | Reusable UI and feature components |
| Hooks | `src/hooks/` | Custom React hooks for data fetching/state |
| Stores | `src/stores/` | Zustand global state (editor, subscription, marketplace) |
| Types | `src/types/` | TypeScript types and domain models |

### State Management (Zustand)
- `editorStore.ts` - Editor canvas state (slots, history, selection, zoom)
- `subscriptionStore.ts` - Premium tier state (localStorage persisted)
- `marketplaceStore.ts` - Purchases, sales, creator earnings

### Backend Integration (Supabase)
- `lib/supabase/client.ts` - Browser client with demo mode support
- `lib/supabase/server.ts` - Server-side client
- `lib/supabase/storage.ts` - Image upload utilities

## Demo Mode Pattern

The app supports running without Supabase backend using `IS_DEMO_MODE` flag:

```typescript
import { IS_DEMO_MODE } from '@/lib/supabase/client'

if (IS_DEMO_MODE) {
  // Use localStorage or mock data
} else {
  // Use Supabase
}
```

This enables GitHub Pages static hosting without a backend.

## Key Conventions

### Design System
- **Primary**: `#FFD9D9` (pastel pink) - Strawberry Cream theme
- **Accent**: `#D7FAFA` (pastel mint)
- Uses Tailwind CSS v4 with custom color tokens

### Component Patterns
- Server Components by default (App Router)
- Client Components marked with `'use client'`
- Page-specific client components in `components/pages/`
- Reusable UI in `components/ui/`

### Hook Pattern
All data hooks follow this structure:
- Support demo mode with localStorage fallback
- Return `{ data, isLoading, error }` states
- Handle Supabase operations with proper error handling

### Path Alias
```typescript
import { Button } from '@/components/ui'  // @/* maps to ./src/*
```

## Static Export Requirements

For dynamic routes, implement `generateStaticParams()`:

```typescript
// Required for [username] routes
export function generateStaticParams() {
  return [
    { username: 'strawberry123' },
    { username: 'fairy_art' },
    // ... predefined paths
  ]
}
```

## Documentation

```
docs/
├── PROGRESS.md                    # 개발 진행 상황 추적
├── EDITOR-UPGRADE-PLAN.md         # 에디터 업그레이드 계획 (Phase 5)
├── ANALYSIS-REPORT-2025-12-30.md  # 문서-구현 갭 분석
│
├── master-prompt/                 # 핵심 기획/설계 문서
│   ├── 00-overview.md             # 프로젝트 개요
│   ├── 01-functional-spec.md      # 기능 명세
│   ├── 02-user-flow.md            # 사용자 흐름
│   ├── 03-design-system.md        # 디자인 시스템
│   ├── 04-page-layouts.md         # 페이지 레이아웃
│   ├── 05-tech-stack.md           # 기술 스택 (react-konva)
│   ├── 06-database-schema.md      # DB 스키마
│   ├── 07-api-design.md           # API 설계
│   ├── 08-folder-structure.md     # 폴더 구조/컨벤션
│   ├── 09-deployment.md           # 배포 가이드
│   ├── 10-roadmap.md              # 개발 로드맵
│   ├── 12-fairy-motion-principles.md  # 모션 디자인 원칙
│   └── 13-operations.md           # 운영/수익 모델
│
└── research/                      # 리서치 자료
    ├── competitor-analysis.md     # 경쟁사 분석
    └── ui-ux-animation-research-2025.md  # UI/UX 트렌드
```

## Quality Settings

### 기본 모드: 고품질 분석
모든 작업에서 다음을 기본으로 수행:

1. **코드 변경 전 심층 분석**
   - 관련 파일 폭넓게 탐색 (최소 5-10개 파일 컨텍스트 확보)
   - 기존 패턴과 아키텍처 파악 후 일관성 있게 수정
   - Edge case, 에러 핸들링, 타입 안전성 사전 검토

2. **보안 및 성능 체크리스트**
   - XSS, SQL Injection 등 OWASP Top 10 취약점 점검
   - 메모리 누수, race condition, 무한 루프 위험 검토
   - 불필요한 리렌더링, 번들 사이즈 영향 고려

3. **코드 리뷰 시 ultrathink 적용**
   - 여러 관점에서 5-6회 반복 검토
   - 잠재적 버그와 개선점 proactive하게 제안
   - 테스트 케이스 및 시나리오 함께 제시

4. **커밋 전 검증**
   - `npm run build` 성공 확인
   - `npm run lint` 통과 확인
   - 변경사항이 기존 기능에 영향 없는지 검토

### 모드 전환 키워드
- `"빠르게"` / `"간단히"` → 핵심만 빠르게 처리
- `"ultrathink"` / `"꼼꼼히"` → 최고 품질 심층 분석
- 기본 → 위 고품질 분석 모드 적용

## AI 조직 · 모델 라우팅 (2026-07-06 신설)

이 프로젝트는 Fable(두뇌)이 판단하고 하위 모델(Opus/Sonnet/Haiku)이 실행하는 조직 규약을 따른다. 정본: `docs/ai-org/`.

- **작업 전 필독**: `docs/ai-org/strategy-genome.md`의 "안 할 것" 목록(스코프 스프롤 방지). 새 기능/요청은 게놈과 대조 후 진행.
- **모델 라우팅**: 판단·아키텍처·보안설계·적대검증=Fable · 기능구현/리팩터/테스트=Sonnet · 대량 기계수정/탐색=Haiku · 난제=Opus. 상세 `docs/ai-org/routing.md`.
- **사고 방식**: `docs/ai-org/thinking-protocol.md`(실패 먼저·사실/추정 구분·가정 반박·되돌림 기준·정직 보고·미배선부터 잇기).
- **의사결정 기록**: 의미 있는 판단은 `docs/ai-org/decisions/DL-####.md`에 1결정=1파일("왜 안 했나"까지).
- **기능별 밑작업**: 기능 착수 전 `docs/features/F-##`의 Fable 판정·다음작업 확인.

### 품질 게이트 (커밋/PR 전 필수)
- `npm run build` + `npm run lint` + `npm test` 통과 확인. (현재 CI는 build만 실행 — TOP50 #9로 test+lint 게이트 추가 예정.)
- 보안: `docs/audit-2026-07-05/04-security.md`의 C-1~C-5·H-1~H-5 회귀 안 나는지. 특히 **클라이언트 신뢰(구독·수익·권한 localStorage) 확대 금지** — 서버 검증으로.
- 커밋 말미 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

### 현재 최우선 (파운데이션 — 신기능보다 우선)
~~1. 정적 export 결별~~ ✅ 2026-07-12 완료(DL-0001 CLOSED — Vercel 이전, 프로덕션 https://pairy-six.vercel.app, Pages 폐기)
~~2. RLS 봉합~~ ✅ 2026-07-12 완료 — **Supabase 새 프로젝트 `bbvuqbzbniappgsxajkd`(서울) 클린 재구축**(구 프로젝트 90일 초과 정지). 마이그레이션 6종 적용·anon 실검증 통과. DB 비밀번호는 로컬 `.remember/tmp/new-db-password.txt`(사용자 보관 필요).
3. **클라이언트 신뢰 제거(C-3/C-4)** — 이제 서버 런타임 있음. 구독·구매·수익을 RLS 테이블/Route Handler 검증으로. (다음 최우선)
4. 결제 백엔드(Toss 웹훅 Route Handler) — Tier 0 #6.
- 주의: 컬럼 REVOKE 는 테이블 레벨 GRANT 가 살아있으면 무효 — `20260712000001_fix_column_privileges.sql` 패턴(테이블 REVOKE 후 허용 컬럼만 GRANT) 준수..
