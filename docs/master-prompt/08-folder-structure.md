# 🧚 Pairy - 폴더 구조 & 코딩 컨벤션

> 마지막 업데이트: 2025-12-30

## 프로젝트 구조

```
pairy/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages 배포
│
├── public/
│   ├── fonts/                   # 커스텀 폰트
│   ├── images/                  # 정적 이미지
│   │   ├── templates/           # 샘플 템플릿 이미지
│   │   └── avatars/             # 샘플 아바타
│   └── favicon.ico
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (editor)/            # 에디터 레이아웃 그룹 (헤더 없음)
│   │   │   ├── canvas-editor/
│   │   │   │   └── [templateId]/
│   │   │   │       └── page.tsx # react-konva 에디터
│   │   │   ├── editor/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx # 새 작업 생성
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (main)/              # 메인 레이아웃 그룹 (헤더/푸터)
│   │   │   ├── page.tsx         # 홈
│   │   │   ├── layout.tsx
│   │   │   │
│   │   │   ├── templates/       # 틀 탐색
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── my/              # 마이페이지
│   │   │   │   ├── page.tsx
│   │   │   │   ├── works/
│   │   │   │   ├── bookmarks/
│   │   │   │   ├── library/
│   │   │   │   ├── purchases/
│   │   │   │   ├── creator/
│   │   │   │   ├── subscription/
│   │   │   │   └── settings/
│   │   │   │
│   │   │   ├── creator/         # 크리에이터 프로필
│   │   │   │   └── [username]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── followers/
│   │   │   │       └── following/
│   │   │   │
│   │   │   ├── collab/          # 협업 세션
│   │   │   │   └── [code]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── premium/         # 구독 안내
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── login/           # 로그인
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   └── callback/    # OAuth 콜백
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── about/           # 소개
│   │   │   ├── animation-demo/  # 애니메이션 데모
│   │   │   ├── button-interactions/
│   │   │   └── physics-buttons/ # UI 인터랙션 데모
│   │   │
│   │   ├── error.tsx            # 에러 바운더리
│   │   ├── not-found.tsx        # 404
│   │   ├── layout.tsx           # 루트 레이아웃
│   │   └── globals.css          # 전역 스타일
│   │
│   ├── components/
│   │   ├── ui/                  # 기본 UI 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── glass-card.tsx
│   │   │   ├── bento-grid.tsx
│   │   │   ├── confetti.tsx
│   │   │   ├── sparkles.tsx
│   │   │   ├── blob.tsx
│   │   │   ├── filter.tsx
│   │   │   ├── tag.tsx
│   │   │   ├── text-reveal.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── image-upload.tsx
│   │   │   └── onboarding.tsx
│   │   │
│   │   ├── layout/              # 레이아웃 컴포넌트
│   │   │   ├── header.tsx
│   │   │   └── footer.tsx
│   │   │
│   │   ├── editor/              # 에디터 컴포넌트
│   │   │   ├── canvas/          # react-konva 캔버스
│   │   │   │   ├── CanvasEditor.tsx
│   │   │   │   ├── EditorSidebar.tsx
│   │   │   │   ├── TemplateRenderer.tsx
│   │   │   │   ├── KeyboardShortcutsModal.tsx
│   │   │   │   └── renderers/   # 개별 렌더러
│   │   │   │       ├── BackgroundRenderer.tsx
│   │   │   │       ├── ImageSlotRenderer.tsx
│   │   │   │       ├── TextFieldRenderer.tsx
│   │   │   │       ├── DynamicShapeRenderer.tsx
│   │   │   │       └── OverlayImageRenderer.tsx
│   │   │   │
│   │   │   ├── entry/           # 에디터 진입 플로우
│   │   │   │   ├── EditorEntryFlow.tsx
│   │   │   │   ├── ModeSelectionStep.tsx
│   │   │   │   ├── TemplateSelectionStep.tsx
│   │   │   │   └── TitleInputStep.tsx
│   │   │   │
│   │   │   ├── presence/        # 실시간 프레젠스
│   │   │   │   ├── PresenceBar.tsx
│   │   │   │   └── ActivityFeed.tsx
│   │   │   │
│   │   │   ├── CollabPanel.tsx
│   │   │   ├── ExportDialog.tsx
│   │   │   ├── InviteModal.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   │
│   │   ├── social/              # 소셜 기능
│   │   │   ├── LikeButton.tsx
│   │   │   ├── FollowButton.tsx
│   │   │   └── CommentSection.tsx
│   │   │
│   │   ├── marketplace/         # 마켓플레이스
│   │   │   ├── PurchaseButton.tsx
│   │   │   ├── PricingBadge.tsx
│   │   │   ├── EarningsCard.tsx
│   │   │   ├── SalesChart.tsx
│   │   │   └── PayoutRequestModal.tsx
│   │   │
│   │   ├── interactions/        # 인터랙션 데모
│   │   │   ├── LikeButtonVariants.tsx
│   │   │   ├── BookmarkButtonVariants.tsx
│   │   │   ├── PhysicsLikeButtons.tsx
│   │   │   └── PhysicsBookmarkButtons.tsx
│   │   │
│   │   ├── premium/             # 프리미엄 관련
│   │   │   └── UpgradeModal.tsx
│   │   │
│   │   ├── notifications/       # 알림
│   │   │   └── NotificationPanel.tsx
│   │   │
│   │   ├── providers/           # Context Providers
│   │   │   ├── Providers.tsx
│   │   │   └── ErrorBoundaryProvider.tsx
│   │   │
│   │   ├── pages/               # 페이지별 클라이언트 컴포넌트
│   │   │   ├── HomeClient.tsx
│   │   │   ├── MainPageClient.tsx
│   │   │   ├── TemplateDetailClient.tsx
│   │   │   ├── CreatorProfileClient.tsx
│   │   │   ├── CollabJoinClient.tsx
│   │   │   ├── AnimationDemoClient.tsx
│   │   │   ├── ButtonInteractionsClient.tsx
│   │   │   └── PhysicsButtonsClient.tsx
│   │   │
│   │   └── common/              # 공통 컴포넌트
│   │       └── ErrorBoundary.tsx
│   │
│   ├── hooks/                   # 커스텀 훅
│   │   ├── useUser.ts           # 사용자 정보
│   │   ├── useTemplates.ts      # 템플릿 CRUD
│   │   ├── useWorks.ts          # 작업 관리
│   │   ├── useBookmarks.ts      # 북마크
│   │   │
│   │   ├── useLikes.ts          # 좋아요 시스템
│   │   ├── useFollow.ts         # 팔로우/언팔로우
│   │   ├── useComments.ts       # 댓글/답글
│   │   │
│   │   ├── usePurchase.ts       # 구매 처리
│   │   ├── useCreatorEarnings.ts # 크리에이터 수익
│   │   │
│   │   ├── useCollabSession.ts  # 협업 세션
│   │   ├── useKonvaImage.ts     # Konva 이미지 로드
│   │   │
│   │   ├── useMagneticHover.ts  # 마그네틱 호버 효과
│   │   ├── useMorphTransition.ts # 모프 트랜지션
│   │   ├── useScrollReveal.ts   # 스크롤 reveal
│   │   ├── useStaggeredGrid.ts  # 스태거드 그리드
│   │   ├── useAccessibility.ts  # 접근성
│   │   ├── useAdvancedInteractions.ts
│   │   ├── useDoodleEffects.tsx # 낙서 효과
│   │   ├── useParticle.tsx      # 파티클 효과
│   │   └── useTypewriter.tsx    # 타이프라이터
│   │
│   ├── lib/                     # 유틸리티 & 라이브러리
│   │   ├── supabase/
│   │   │   ├── client.ts        # 브라우저 클라이언트 + IS_DEMO_MODE
│   │   │   ├── server.ts        # 서버 클라이언트
│   │   │   └── storage.ts       # 이미지 업로드
│   │   │
│   │   └── utils/
│   │       ├── cn.ts            # className 병합
│   │       ├── canvasUtils.ts   # 캔버스 유틸
│   │       ├── editorUtils.ts   # 에디터 유틸
│   │       ├── export.ts        # 내보내기 유틸
│   │       ├── clipboard.ts     # 클립보드 유틸
│   │       └── demoStorage.ts   # 데모 모드 localStorage
│   │
│   ├── stores/                  # Zustand 스토어
│   │   ├── canvasEditorStore.ts # 캔버스 에디터 상태 (슬롯, 히스토리, 줌)
│   │   ├── editorEntryStore.ts  # 에디터 진입 플로우 상태
│   │   ├── subscriptionStore.ts # 구독 상태 (localStorage 동기화)
│   │   ├── marketplaceStore.ts  # 구매/판매/수익 상태
│   │   ├── themeStore.ts        # 테마 상태
│   │   ├── gamificationStore.ts # 게이미피케이션 상태
│   │   │
│   │   └── middleware/          # Zustand 미들웨어
│   │       ├── index.ts
│   │       ├── historyMiddleware.ts
│   │       └── layerSlice.ts
│   │
│   ├── types/                   # TypeScript 타입
│   │   ├── database.types.ts    # Supabase 스키마 타입
│   │   ├── template.ts          # 템플릿 관련 타입
│   │   ├── editor-entry.ts      # 에디터 진입 타입
│   │   └── resources.ts         # 리소스 타입
│   │
│   └── styles/                  # 추가 스타일
│       ├── physics.module.css   # 물리 버튼 스타일
│       └── animations.css       # 애니메이션 스타일
│
├── docs/                        # 문서
│   ├── PROGRESS.md              # 개발 진행 상황
│   ├── ANALYSIS-REPORT-*.md     # 분석 리포트
│   ├── master-prompt/           # 기획/설계 문서
│   └── research/                # 리서치 자료
│
├── .env.local                   # 로컬 환경 변수
├── .env.example                 # 환경 변수 템플릿
├── CLAUDE.md                    # Claude Code 가이드
├── components.json              # shadcn/ui 설정
├── next.config.ts               # Next.js 설정 (static export)
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 핵심 아키텍처 패턴

### 라우트 그룹

| 그룹 | 용도 | 특징 |
|------|------|------|
| `(main)` | 일반 페이지 | 헤더/푸터 포함 |
| `(editor)` | 에디터 페이지 | 헤더 없음, 전체 화면 |

### 데모 모드 패턴

```typescript
// src/lib/supabase/client.ts
export const IS_DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL

// 훅에서 사용
if (IS_DEMO_MODE) {
  // localStorage 또는 목업 데이터 사용
} else {
  // Supabase API 호출
}
```

### 스토어 구조 (Zustand)

| 스토어 | 용도 | 특징 |
|--------|------|------|
| `canvasEditorStore` | 캔버스 에디터 상태 | 히스토리, 줌, 선택 |
| `editorEntryStore` | 에디터 진입 플로우 | 스텝 관리 |
| `subscriptionStore` | 구독 상태 | localStorage 동기화 |
| `marketplaceStore` | 마켓플레이스 | 구매/판매/수익 |

---

## 코딩 컨벤션

### 1. 네이밍 규칙

#### 파일 & 폴더
| 유형 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `TemplateCard.tsx` |
| 훅 | camelCase + use 접두사 | `useFollow.ts` |
| 유틸 | camelCase | `canvasUtils.ts` |
| 타입 | camelCase | `template.ts` |
| 페이지 | Next.js 규칙 | `page.tsx`, `layout.tsx` |

#### 변수 & 함수
```typescript
// 변수: camelCase
const userName = 'pairy';
const isLoggedIn = true;

// 함수: camelCase, 동사로 시작
function getUserById(id: string) { }
function handleClick() { }
async function fetchTemplates() { }

// 상수: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 타입/인터페이스: PascalCase
interface UserProfile { }
type TemplateCategory = 'pair' | 'imeres';
```

### 2. 컴포넌트 구조

```typescript
// src/components/social/LikeButton.tsx

// 1. 임포트 순서
import { memo, useCallback } from 'react';          // React
import { Heart } from 'lucide-react';               // 외부 라이브러리
import { Button } from '@/components/ui/button';    // 내부 컴포넌트
import { useLikes } from '@/hooks/useLikes';        // 훅
import { cn } from '@/lib/utils/cn';                // 유틸
import type { Template } from '@/types';            // 타입

// 2. Props 타입 정의
interface LikeButtonProps {
  templateId: string;
  initialCount: number;
  className?: string;
}

// 3. 컴포넌트 정의
function LikeButton({ templateId, initialCount, className }: LikeButtonProps) {
  // 4. 훅 호출
  const { isLiked, likeCount, toggleLike, isLoading } = useLikes(templateId, initialCount);

  // 5. 이벤트 핸들러
  const handleClick = useCallback(() => {
    toggleLike();
  }, [toggleLike]);

  // 6. 렌더링
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={cn('gap-1', className)}
    >
      <Heart className={cn('w-4 h-4', isLiked && 'fill-red-500 text-red-500')} />
      <span>{likeCount}</span>
    </Button>
  );
}

// 7. 메모이제이션 (필요시)
export default memo(LikeButton);
```

### 3. 훅 패턴 (데모 모드 지원)

```typescript
// src/hooks/useLikes.ts
import { useState, useCallback } from 'react';
import { IS_DEMO_MODE } from '@/lib/supabase/client';

export function useLikes(templateId: string, initialCount: number) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = useCallback(async () => {
    setIsLoading(true);

    // 낙관적 업데이트
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      if (IS_DEMO_MODE) {
        // 데모 모드: localStorage 사용
        const likes = JSON.parse(localStorage.getItem('likes') || '[]');
        // ...
      } else {
        // 프로덕션: Supabase API 호출
        // ...
      }
    } catch (error) {
      // 롤백
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLoading(false);
    }
  }, [templateId, isLiked]);

  return { isLiked, likeCount, toggleLike, isLoading };
}
```

### 4. Zustand 스토어 패턴

```typescript
// src/stores/canvasEditorStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface CanvasEditorState {
  slots: ImageSlot[];
  selectedSlotId: string | null;
  zoom: number;

  // Actions
  setSlotImage: (slotId: string, imageUrl: string) => void;
  selectSlot: (slotId: string | null) => void;
  setZoom: (zoom: number) => void;
}

export const useCanvasEditorStore = create<CanvasEditorState>()(
  immer((set) => ({
    slots: [],
    selectedSlotId: null,
    zoom: 1,

    setSlotImage: (slotId, imageUrl) =>
      set((state) => {
        const slot = state.slots.find((s) => s.id === slotId);
        if (slot) slot.imageUrl = imageUrl;
      }),

    selectSlot: (slotId) =>
      set((state) => {
        state.selectedSlotId = slotId;
      }),

    setZoom: (zoom) =>
      set((state) => {
        state.zoom = Math.max(0.1, Math.min(3, zoom));
      }),
  }))
);
```

### 5. Import 순서 규칙

```typescript
// 1. React/Next.js 코어
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// 2. 외부 라이브러리
import { Heart, Share } from 'lucide-react';
import Konva from 'konva';

// 3. 내부 - 컴포넌트 (절대 경로)
import { Button } from '@/components/ui/button';
import { LikeButton } from '@/components/social/LikeButton';

// 4. 내부 - 훅/스토어/유틸 (절대 경로)
import { useLikes } from '@/hooks/useLikes';
import { useCanvasEditorStore } from '@/stores/canvasEditorStore';
import { cn } from '@/lib/utils/cn';

// 5. 내부 - 타입 (type import 사용)
import type { Template } from '@/types';

// 6. 상대 경로 (같은 모듈 내)
import { helper } from './helper';

// 7. 스타일
import styles from './Component.module.css';
```

### 6. Git 커밋 메시지

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type
- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서
- `style`: 코드 포맷팅 (기능 변화 X)
- `refactor`: 리팩토링
- `test`: 테스트
- `chore`: 빌드/설정

#### 예시
```
feat(social): 댓글/답글 시스템 구현

- useComments 훅 추가
- CommentSection 컴포넌트 구현
- 댓글 좋아요 기능 추가

Closes #123
```
