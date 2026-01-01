# Pairy 코드베이스 vs 마스터 프롬프트 분석 보고서

> 작성일: 2025-12-30
> 마지막 업데이트: 2025-12-30 (갭 수정 완료)

---

## Executive Summary (요약)

| 항목 | 수치 |
|------|------|
| **전체 구현율** | ~65% (기능 레벨), ~95% (UI 레벨) |
| **Demo Mode 비율** | 약 85% (실제 백엔드 연동 없음) |
| **기술 스택 일치율** | ~60% (주요 변경 있음) |
| **문서화 최신성** | 낮음 (실제 구현과 차이 큼) |

### 핵심 미구현 기능 TOP 5

| 순위 | 기능 | 문서 우선순위 | 현재 상태 |
|:----:|------|:------------:|----------|
| 1 | 실제 Supabase 연동 (인증/DB) | P0 | Demo 모드만 |
| 2 | 결제 시스템 (토스페이먼츠) | P1 | UI만 존재 |
| 3 | 실시간 협업 (Yjs CRDT) | P0 | BroadcastChannel 데모 |
| 4 | 이미지 서버 처리 (Sharp) | P1 | 클라이언트 사이드만 |
| 5 | 신고/관리자 시스템 | P2 | 미구현 |

---

## 기술 스택 비교

### 주요 기술 변경 사항

| 항목 | 마스터 프롬프트 | 실제 구현 | 변경 사유 |
|------|---------------|----------|----------|
| **프레임워크** | Next.js 14 | Next.js 16.1.1 | 버전 업그레이드 |
| **React** | 18.2.0 | 19.2.3 | 버전 업그레이드 |
| **캔버스 에디터** | Fabric.js 6+ | react-konva 19.2.1 | React 친화적 API |
| **협업 동기화** | Yjs + Supabase Realtime | BroadcastChannel (데모) | 정적 배포 제약 |
| **이미지 처리** | Sharp (서버) | html2canvas (클라이언트) | 정적 배포 제약 |
| **호스팅** | Vercel | GitHub Pages | 비용 절감 |
| **애니메이션** | 미명시 | framer-motion | 디자인 페이즈 추가 |

### package.json 의존성 분석

**문서에 있지만 설치 안 됨:**
- `fabric` (react-konva로 대체)
- `yjs`, `y-protocols` (미구현)
- `sharp` (서버사이드 불가)
- `@radix-ui/*` 대부분 (일부만 사용)
- `date-fns`, `nanoid`, `zod` (미사용)

**문서에 없지만 설치됨:**
- `framer-motion` (애니메이션 시스템)
- `konva`, `react-konva` (캔버스)
- `html2canvas` (내보내기)

---

## 폴더 구조 비교

### 라우트 구조

| 예상 (08-folder-structure.md) | 실제 | 상태 |
|------------------------------|------|------|
| `(auth)/login` | `(main)/login` | 다른 그룹 |
| `(auth)/onboarding` | 미존재 | 미구현 |
| `api/auth/callback` | 미존재 | 정적 배포 |
| `api/payment/*` | 미존재 | 정적 배포 |
| `api/export` | 미존재 | 클라이언트 처리 |
| `actions/*.ts` | 미존재 | 정적 배포 |

### 실제 추가된 라우트

```
src/app/
├── (main)/animation-demo/    # 애니메이션 데모 (문서에 없음)
├── (main)/about/             # 소개 페이지 (문서에 없음)
├── (editor)/canvas-editor/   # react-konva 에디터 (문서와 다름)
```

### lib 구조

| 예상 | 실제 | 상태 |
|------|------|------|
| `lib/editor/fabricCanvas.ts` | `lib/utils/canvasUtils.ts` | 다른 구현 |
| `lib/collab/yjsProvider.ts` | 미존재 | 미구현 |
| `lib/payment/toss.ts` | 미존재 | 미구현 |
| `lib/image/processor.ts` | 미존재 | 클라이언트 처리 |
| `lib/validations/*.ts` | 미존재 | 미구현 |

---

## 기능 구현 현황

### P0 (핵심 기능) - MVP 필수

| 기능 | 상태 | 구현 형태 | 파일 위치 |
|------|:----:|----------|----------|
| 트위터 로그인 | Demo | Supabase Auth 스캐폴딩 | `lib/supabase/client.ts` |
| 구글 로그인 | Demo | Supabase Auth 스캐폴딩 | `lib/supabase/client.ts` |
| 틀 목록/검색 | 구현됨 | Demo 데이터 | `app/(main)/templates/` |
| 틀 상세 페이지 | 구현됨 | Demo 데이터 | `app/(main)/templates/[id]/` |
| 캔버스 에디터 | 구현됨 | react-konva | `components/editor/canvas/` |
| 이미지 편집 | 구현됨 | Konva | `CanvasEditor.tsx` |
| 텍스트 편집 | 구현됨 | Konva | `EditorSidebar.tsx` |
| 자동 저장 | 구현됨 | localStorage | `hooks/useAutoSave.ts` |
| PNG 내보내기 | 구현됨 | html2canvas | `lib/utils/export.ts` |
| 협업 세션 | Demo | Supabase Realtime 스캐폴딩 | `hooks/useCollabSession.ts` |
| 실시간 동기화 | Demo | BroadcastChannel | `components/editor/presence/` |
| 워터마크 | 구현됨 | 내보내기 옵션 | 내보내기 다이얼로그 |

### P1 (중요 기능) - 초기 출시

| 기능 | 상태 | 구현 형태 | 파일 위치 |
|------|:----:|----------|----------|
| 프로필 관리 | Demo | Mock 데이터 | `app/(main)/my/settings/` |
| 틀 등록 | Demo | UI만 | `app/(main)/templates/new/` |
| 좋아요/북마크 | 구현됨 | localStorage | `hooks/useLikes.ts`, `useBookmarks.ts` |
| 테마 컬러 변경 | 구현됨 | Zustand | `EditorSidebar.tsx` |
| 커서 공유 | Partial | Presence UI | `PresenceBar.tsx` |
| 프리미엄 구독 | Demo | Zustand + localStorage | `stores/subscriptionStore.ts` |
| 1일 이용권 | Demo | UI만 | `app/(main)/premium/` |
| 내 작업물 | 구현됨 | localStorage | `app/(main)/my/works/` |
| 내 북마크 | 구현됨 | localStorage | `app/(main)/my/bookmarks/` |
| 크리에이터 대시보드 | Demo | Mock 데이터 | `app/(main)/my/creator/` |

### P2 (부가 기능) - 출시 후

| 기능 | 상태 | 비고 |
|------|:----:|------|
| Apple/Discord 로그인 | 미구현 | - |
| 북마크 폴더 분류 | 미구현 | - |
| 구매 내역 | Demo | UI만 |
| 패턴 오버레이 (AI 방지) | 미구현 | - |
| 우클릭 방지 | 미구현 | - |
| 신고 시스템 | 미구현 | - |
| 관리자 대시보드 | 미구현 | - |
| 인앱 알림 | Demo | `NotificationPanel.tsx` UI만 |

---

## 불일치 및 문제점

### 1. 문서와 다른 구현

| 항목 | 문서 설명 | 실제 구현 | 영향 |
|------|----------|----------|------|
| 에디터 엔진 | Fabric.js 기반 | react-konva 기반 | 문서 업데이트 필요 |
| 협업 | Yjs CRDT 동기화 | 단순 Presence | 실시간 동시편집 불가 |
| 배포 | Vercel + Supabase | GitHub Pages 정적 | API 라우트 불가 |
| 폰트 | 10개 내장 폰트 지정 | 시스템 폰트만 | 디자인 일관성 저하 |

### 2. 데드 코드 / 미사용 파일 - ✅ 정리 완료

| 파일 | 상태 | 조치 |
|------|------|------|
| ~~`stores/editorStore.ts`~~ | 삭제됨 | ✅ 완료 |
| ~~`hooks/useAutoSave.ts`~~ | 삭제됨 | ✅ 완료 |
| ~~`components/pages/EditorClient.tsx`~~ | 삭제됨 | ✅ 완료 |
| `app/(editor)/editor/` 전체 | canvas-editor로 대체 | 리다이렉트만 유지 |

### 3. Demo Mode 의존성

현재 거의 모든 기능이 `IS_DEMO_MODE` 플래그에 의존:

```typescript
// lib/supabase/client.ts
export const IS_DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL;
```

실제 프로덕션 배포를 위해서는:
- Supabase 프로젝트 설정
- 환경 변수 구성
- RLS 정책 설정
- Storage 버킷 생성

---

## 문서에 없는 추가 구현 사항

### 디자인 모션 시스템 (11-design-motion-phase.md 이후 확장)

| 파일 | 기능 | 레벨 |
|------|------|------|
| `useAdvancedInteractions.ts` | 고급 인터랙션 훅 | Level 2-3 |
| `useMagneticHover.ts` | 자석 호버 효과 | Level 2 |
| `useMorphTransition.ts` | 형태 변환 트랜지션 | Level 3 |
| `useStaggeredGrid.ts` | 그리드 순차 애니메이션 | Level 1 |
| `useAccessibility.ts` | 접근성 훅 | - |
| `components/ui/sparkles.tsx` | 반짝이 효과 | Level 3 |
| `components/ui/confetti.tsx` | 축하 효과 | Level 3 |
| `components/ui/text-reveal.tsx` | 텍스트 공개 효과 | Level 2 |

### 추가된 스토어

| 파일 | 용도 | 문서화 |
|------|------|:------:|
| `gamificationStore.ts` | 게이미피케이션 시스템 | 미문서화 |
| `themeStore.ts` | 테마 관리 | 미문서화 |
| `editorEntryStore.ts` | 에디터 진입 플로우 | 미문서화 |

---

## 권장 작업 순서

### 즉시 필요 (문서 정합성) - ✅ 완료

1. **마스터 프롬프트 업데이트** - ✅ 완료
   - `05-tech-stack.md`: Fabric.js -> react-konva ✅
   - `08-folder-structure.md`: 실제 구조 반영 ✅
   - `09-deployment.md`: GitHub Pages 정적 배포 추가 ✅

2. **레거시 코드 정리** - ✅ 완료
   - `stores/editorStore.ts` 삭제 ✅
   - `hooks/useAutoSave.ts` 삭제 ✅
   - `components/pages/EditorClient.tsx` 삭제 ✅

### 프로덕션 전환 시 필요

| 우선순위 | 작업 | 예상 복잡도 |
|:--------:|------|:-----------:|
| 1 | Supabase 실제 연동 | 중 |
| 2 | OAuth 실제 설정 | 하 |
| 3 | Yjs 협업 구현 | 상 |
| 4 | 토스페이먼츠 연동 | 중 |
| 5 | Vercel 배포 전환 | 하 |
| 6 | 관리자 시스템 | 상 |

### 기능 완성도 향상

| 작업 | 현재 | 목표 |
|------|------|------|
| 실시간 협업 | BroadcastChannel | Yjs + Supabase Realtime |
| 이미지 처리 | 클라이언트만 | 서버 사이드 + 워터마크 |
| 내장 폰트 | 0개 | 10개 (문서 기준) |
| 신고 시스템 | 없음 | 신고 + 관리자 검토 |

---

## 결론

Pairy 프로젝트는 **UI/UX 완성도는 높으나**, 대부분의 기능이 **Demo 모드**로 구현되어 있습니다.

### 강점
- react-konva 기반 에디터 완성도 높음
- 디자인 모션 시스템 잘 구축됨
- 모바일 반응형 지원
- 코드 품질 (모듈화, 타입 안전성)

### 개선 필요
- ~~마스터 프롬프트 문서 현행화 필요~~ ✅ 완료
- 실제 백엔드 연동 (Supabase, 결제)
- 협업 기능 고도화 (Yjs CRDT)
- ~~레거시 코드 정리~~ ✅ 완료

---

## 수정 이력

| 날짜 | 변경 사항 |
|------|----------|
| 2025-12-30 | 초기 분석 보고서 작성 |
| 2025-12-30 | 문서 갭 수정: 05-tech-stack.md, 08-folder-structure.md, 09-deployment.md |
| 2025-12-30 | 레거시 코드 삭제: editorStore.ts, useAutoSave.ts, EditorClient.tsx |

*이 보고서는 코드베이스와 마스터 프롬프트를 비교 분석한 결과입니다.*
