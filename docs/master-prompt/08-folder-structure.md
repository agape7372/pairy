# 🧚 Pairy - 폴더 구조 & 코딩 컨벤션

## 프로젝트 구조

```
pairy/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD 워크플로우
│
├── public/
│   ├── fonts/                  # 커스텀 폰트
│   ├── images/                 # 정적 이미지
│   │   ├── logo.svg
│   │   ├── watermark.png
│   │   └── og-image.png
│   └── favicon.ico
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 인증 관련 라우트 그룹
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── onboarding/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (main)/             # 메인 레이아웃 그룹
│   │   │   ├── templates/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── my/
│   │   │   │   ├── works/
│   │   │   │   ├── bookmarks/
│   │   │   │   └── page.tsx
│   │   │   ├── creator/
│   │   │   │   ├── [id]/
│   │   │   │   └── dashboard/
│   │   │   ├── page.tsx        # 홈
│   │   │   └── layout.tsx
│   │   │
│   │   ├── editor/
│   │   │   ├── [templateId]/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx      # 에디터 전용 레이아웃
│   │   │
│   │   ├── collab/
│   │   │   ├── [sessionId]/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── callback/
│   │   │   │       └── route.ts
│   │   │   ├── payment/
│   │   │   │   ├── confirm/
│   │   │   │   │   └── route.ts
│   │   │   │   └── webhook/
│   │   │   │       └── route.ts
│   │   │   └── export/
│   │   │       └── route.ts
│   │   │
│   │   ├── actions/            # Server Actions
│   │   │   ├── auth.ts
│   │   │   ├── templates.ts
│   │   │   ├── works.ts
│   │   │   ├── collab.ts
│   │   │   └── payment.ts
│   │   │
│   │   ├── error.tsx           # 에러 바운더리
│   │   ├── not-found.tsx       # 404
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   └── globals.css         # 전역 스타일
│   │
│   ├── components/
│   │   ├── ui/                 # 기본 UI 컴포넌트 (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── card.tsx
│   │   │   └── index.ts        # 배럴 export
│   │   │
│   │   ├── layout/             # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Container.tsx
│   │   │
│   │   ├── templates/          # 틀 관련 컴포넌트
│   │   │   ├── TemplateCard.tsx
│   │   │   ├── TemplateGrid.tsx
│   │   │   ├── TemplateDetail.tsx
│   │   │   ├── TemplateFilters.tsx
│   │   │   ├── TemplateSearch.tsx
│   │   │   ├── LikeButton.tsx
│   │   │   ├── BookmarkButton.tsx
│   │   │   └── TagList.tsx
│   │   │
│   │   ├── editor/             # 에디터 컴포넌트
│   │   │   ├── Canvas.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── PropertiesPanel.tsx
│   │   │   ├── LayerPanel.tsx
│   │   │   ├── ThemeColorPanel.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── TextEditor.tsx
│   │   │   ├── ExportModal.tsx
│   │   │   └── AutoSaveIndicator.tsx
│   │   │
│   │   ├── collab/             # 협업 컴포넌트
│   │   │   ├── CollabCanvas.tsx
│   │   │   ├── CollabToolbar.tsx
│   │   │   ├── ParticipantList.tsx
│   │   │   ├── CursorOverlay.tsx
│   │   │   ├── InviteModal.tsx
│   │   │   └── CollabChat.tsx
│   │   │
│   │   ├── auth/               # 인증 컴포넌트
│   │   │   ├── LoginModal.tsx
│   │   │   ├── SocialLoginButton.tsx
│   │   │   ├── ProfileForm.tsx
│   │   │   └── AuthGuard.tsx
│   │   │
│   │   ├── payment/            # 결제 컴포넌트
│   │   │   ├── PaymentModal.tsx
│   │   │   ├── SubscriptionCard.tsx
│   │   │   └── PremiumBadge.tsx
│   │   │
│   │   └── common/             # 공통 컴포넌트
│   │       ├── Logo.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorMessage.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── Tooltip.tsx
│   │
│   ├── hooks/                  # 커스텀 훅
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   ├── useEditor.ts
│   │   ├── useCollab.ts
│   │   ├── useAutoSave.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useDebounce.ts
│   │   └── useToast.ts
│   │
│   ├── lib/                    # 유틸리티 & 라이브러리
│   │   ├── supabase/
│   │   │   ├── client.ts       # 브라우저 클라이언트
│   │   │   ├── server.ts       # 서버 클라이언트
│   │   │   ├── middleware.ts   # 미들웨어용
│   │   │   └── admin.ts        # 서비스 롤 클라이언트
│   │   │
│   │   ├── editor/
│   │   │   ├── fabricCanvas.ts # Fabric.js 래퍼
│   │   │   ├── exportUtils.ts
│   │   │   └── historyManager.ts
│   │   │
│   │   ├── collab/
│   │   │   ├── yjsProvider.ts  # Yjs 프로바이더
│   │   │   └── awareness.ts
│   │   │
│   │   ├── image/
│   │   │   └── processor.ts    # Sharp 이미지 처리
│   │   │
│   │   ├── payment/
│   │   │   └── toss.ts         # 토스페이먼츠 유틸
│   │   │
│   │   ├── validations/        # Zod 스키마
│   │   │   ├── auth.ts
│   │   │   ├── template.ts
│   │   │   └── common.ts
│   │   │
│   │   ├── utils.ts            # 일반 유틸 함수
│   │   ├── cn.ts               # className 병합
│   │   └── config.ts           # 환경 설정
│   │
│   ├── stores/                 # Zustand 스토어
│   │   ├── useEditorStore.ts
│   │   ├── useCollabStore.ts
│   │   ├── useAuthStore.ts
│   │   └── useUIStore.ts
│   │
│   ├── types/                  # TypeScript 타입
│   │   ├── database.ts         # Supabase 자동 생성
│   │   ├── editor.ts
│   │   ├── template.ts
│   │   ├── user.ts
│   │   ├── collab.ts
│   │   └── index.ts
│   │
│   └── styles/                 # 추가 스타일
│       └── editor.css          # 에디터 전용
│
├── supabase/
│   ├── migrations/             # DB 마이그레이션
│   │   ├── 20240101000000_init.sql
│   │   └── ...
│   ├── seed.sql                # 시드 데이터
│   └── config.toml             # Supabase 설정
│
├── tests/                      # 테스트
│   ├── e2e/                    # E2E 테스트
│   └── unit/                   # 유닛 테스트
│
├── .env.local                  # 로컬 환경 변수
├── .env.example                # 환경 변수 템플릿
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── components.json             # shadcn/ui 설정
├── middleware.ts               # Next.js 미들웨어
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 코딩 컨벤션

### 1. 네이밍 규칙

#### 파일 & 폴더
| 유형 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `TemplateCard.tsx` |
| 훅 | camelCase + use 접두사 | `useEditor.ts` |
| 유틸 | camelCase | `formatDate.ts` |
| 타입 | camelCase or PascalCase | `template.ts`, `User.ts` |
| 상수 | SCREAMING_SNAKE | `constants/API_ENDPOINTS.ts` |
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
const API_BASE_URL = '/api';

// 타입/인터페이스: PascalCase
interface UserProfile { }
type TemplateCategory = 'pair' | 'imeres';

// enum: PascalCase
enum TemplateStatus {
  Draft = 'draft',
  Published = 'published',
}
```

### 2. 컴포넌트 구조

```typescript
// src/components/templates/TemplateCard.tsx

// 1. 임포트 순서
// - React/Next.js
// - 외부 라이브러리
// - 내부 컴포넌트
// - 훅/유틸
// - 타입
// - 스타일

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Heart, Bookmark } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { LikeButton } from './LikeButton';

import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/utils';

import type { Template } from '@/types';

// 2. Props 타입 정의
interface TemplateCardProps {
  template: Template;
  className?: string;
  showActions?: boolean;
}

// 3. 컴포넌트 정의
function TemplateCard({
  template,
  className,
  showActions = true,
}: TemplateCardProps) {
  // 4. 훅 호출
  const { user } = useUser();

  // 5. 상태/파생 값
  const isLiked = template.likes?.some((l) => l.userId === user?.id);

  // 6. 이벤트 핸들러
  const handleClick = () => {
    // ...
  };

  // 7. 렌더링
  return (
    <article className={cn('group cursor-pointer', className)}>
      {/* 썸네일 */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
        <Image
          src={template.thumbnailUrl}
          alt={template.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform"
        />
        {!template.isFree && (
          <Badge className="absolute top-2 right-2">
            ₩{formatNumber(template.price)}
          </Badge>
        )}
      </div>

      {/* 정보 */}
      <div className="mt-3 space-y-1">
        <h3 className="font-medium truncate">{template.title}</h3>
        <p className="text-sm text-gray-500">@{template.creator.nickname}</p>

        {showActions && (
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <LikeButton templateId={template.id} isLiked={isLiked} />
            <span>{formatNumber(template.usesCount)}</span>
          </div>
        )}
      </div>
    </article>
  );
}

// 8. 메모이제이션 (필요시)
export default memo(TemplateCard);
```

### 3. Server Action 패턴

```typescript
// src/app/actions/templates.ts
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// 1. 입력 스키마 정의
const LikeSchema = z.object({
  templateId: z.string().uuid(),
});

// 2. 반환 타입 정의
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// 3. Action 함수
export async function toggleLike(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult<{ liked: boolean }>> {
  try {
    // 4. 인증 체크
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'LOGIN_REQUIRED' };
    }

    // 5. 입력 검증
    const validated = LikeSchema.safeParse({
      templateId: formData.get('templateId'),
    });

    if (!validated.success) {
      return { success: false, error: 'INVALID_INPUT' };
    }

    // 6. 비즈니스 로직
    const { data: liked } = await supabase.rpc('toggle_like', {
      p_user_id: user.id,
      p_template_id: validated.data.templateId,
    });

    // 7. 캐시 무효화
    revalidatePath(`/templates/${validated.data.templateId}`);

    // 8. 성공 반환
    return { success: true, data: { liked } };
  } catch (error) {
    console.error('toggleLike error:', error);
    return { success: false, error: 'INTERNAL_ERROR' };
  }
}
```

### 4. 커스텀 훅 패턴

```typescript
// src/hooks/useEditor.ts
import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { PairyCanvas } from '@/lib/editor/fabricCanvas';
import type { Template } from '@/types';

interface UseEditorOptions {
  template: Template;
  onSave?: (data: object) => void;
}

export function useEditor({ template, onSave }: UseEditorOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pairyCanvas = useRef<PairyCanvas | null>(null);

  const {
    setCanvas,
    selectedObject,
    setSelectedObject,
    isDirty,
    setIsDirty,
  } = useEditorStore();

  // 캔버스 초기화
  useEffect(() => {
    if (!canvasRef.current) return;

    pairyCanvas.current = new PairyCanvas(canvasRef.current, template);
    setCanvas(pairyCanvas.current.getCanvas());

    // 선택 이벤트
    pairyCanvas.current.getCanvas().on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    pairyCanvas.current.getCanvas().on('selection:cleared', () => {
      setSelectedObject(null);
    });

    // 변경 이벤트
    pairyCanvas.current.getCanvas().on('object:modified', () => {
      setIsDirty(true);
    });

    return () => {
      pairyCanvas.current?.dispose();
    };
  }, [template]);

  // 이미지 추가
  const addImage = useCallback(async (file: File) => {
    if (!pairyCanvas.current) return;
    await pairyCanvas.current.addImage(file);
    setIsDirty(true);
  }, []);

  // 텍스트 추가
  const addText = useCallback(() => {
    if (!pairyCanvas.current) return;
    pairyCanvas.current.addText();
    setIsDirty(true);
  }, []);

  // 저장
  const save = useCallback(() => {
    if (!pairyCanvas.current) return;
    const data = pairyCanvas.current.toJSON();
    onSave?.(data);
    setIsDirty(false);
  }, [onSave]);

  // 내보내기
  const exportImage = useCallback(
    async (options?: { multiplier?: number }) => {
      if (!pairyCanvas.current) return null;
      return pairyCanvas.current.toDataURL(options);
    },
    []
  );

  return {
    canvasRef,
    selectedObject,
    isDirty,
    addImage,
    addText,
    save,
    exportImage,
  };
}
```

### 5. 타입 정의 패턴

```typescript
// src/types/template.ts

// 1. 기본 타입
export interface Template {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  category: TemplateCategory;
  personCount: number;
  thumbnailUrl: string;
  editorData: EditorData;
  isFree: boolean;
  price: number;
  likesCount: number;
  usesCount: number;
  viewsCount: number;
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
}

// 2. enum 대체 union 타입
export type TemplateCategory = 'pair' | 'imeres' | 'trace' | 'profile';
export type TemplateStatus = 'draft' | 'published' | 'hidden' | 'deleted';

// 3. 중첩 타입
export interface EditorData {
  version: string;
  objects: fabric.Object[];
  background: string;
}

export interface EditableArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'image' | 'text';
}

// 4. API 응답 타입
export interface TemplateWithCreator extends Template {
  creator: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
  };
  tags: Tag[];
}

// 5. 폼 입력 타입
export interface CreateTemplateInput {
  title: string;
  description?: string;
  category: TemplateCategory;
  personCount: number;
  tags: string[];
  isFree: boolean;
  price: number;
}

// 6. 유틸 타입
export type TemplateListItem = Pick<
  Template,
  'id' | 'title' | 'thumbnailUrl' | 'likesCount' | 'isFree' | 'price'
> & {
  creatorNickname: string;
};
```

### 6. ESLint & Prettier 설정

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 7. Import 순서 규칙

```typescript
// 1. React/Next.js 코어
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// 2. 외부 라이브러리
import { z } from 'zod';
import { format } from 'date-fns';
import { Heart, Share } from 'lucide-react';

// 3. 내부 - 컴포넌트 (절대 경로)
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TemplateCard } from '@/components/templates/TemplateCard';

// 4. 내부 - 훅/유틸 (절대 경로)
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/utils';

// 5. 내부 - 타입 (type import 사용)
import type { Template } from '@/types';
import type { Database } from '@/types/database';

// 6. 상대 경로 (같은 모듈 내)
import { helper } from './helper';

// 7. 스타일
import styles from './Component.module.css';
```

### 8. Git 커밋 메시지

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
feat(editor): 원클릭 테마컬러 변경 기능 추가

- 작가 지정 색상 영역 지원
- 컬러 피커 UI 구현
- 프리셋 테마 3종 추가

Closes #123
```
