# 🧚 Pairy - 기술 스택 & 아키텍처 (Tech Stack & Architecture)

## 기술 선택 원칙

1. **초기 비용 ₩0**: 무료 티어로 MVP 운영 가능
2. **빠른 개발**: 익숙하고 생산성 높은 도구
3. **확장성**: 성장 시 쉽게 스케일 가능
4. **실시간 지원**: 협업 기능을 위한 WebSocket 지원

---

## 1. 기술 스택 요약

| 레이어 | 기술 | 버전 | 선택 이유 |
|--------|------|------|----------|
| **프레임워크** | Next.js | 14+ (App Router) | SSR, SEO, 풀스택 |
| **언어** | TypeScript | 5+ | 타입 안전성 |
| **스타일** | Tailwind CSS | 3+ | 빠른 UI 개발 |
| **UI 컴포넌트** | shadcn/ui | latest | 커스터마이징 용이 |
| **상태 관리** | Zustand | 4+ | 심플, 가벼움 |
| **백엔드/DB** | Supabase | latest | 무료, 실시간 |
| **인증** | Supabase Auth | - | 소셜 로그인 |
| **캔버스 에디터** | react-konva | 18+ | 캔버스 편집 (React 통합) |
| **실시간 협업** | Yjs + Supabase | - | CRDT 동기화 |
| **파일 저장** | Supabase Storage | - | 이미지 호스팅 |
| **이미지 처리** | Sharp | 0.33+ | 워터마크, 리사이즈 |
| **호스팅** | Vercel | - | 무료, 빠름 |
| **결제** | 토스페이먼츠 | - | 국내 최적화 |
| **애널리틱스** | Mixpanel | - | 무료 티어 |

---

## 2. 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                          클라이언트                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Next.js (React)                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│  │  │  Pages  │  │  Editor │  │  Collab │  │   Auth  │    │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │   │
│  │       │            │            │            │          │   │
│  │  ┌────┴────────────┴────────────┴────────────┴────┐    │   │
│  │  │              Zustand (State)                    │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │       │                              │                   │   │
│  │  ┌────┴────┐                   ┌─────┴─────┐            │   │
│  │  │  Konva  │                   │    Yjs    │            │   │
│  │  │(Canvas) │                   │  (CRDT)   │            │   │
│  │  └─────────┘                   └───────────┘            │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel Edge                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Next.js API Routes / Server Actions         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│  │  │Templates│  │  Users  │  │ Collab  │  │ Payment │    │   │
│  │  │   API   │  │   API   │  │   API   │  │   API   │    │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │ PostgreSQL│  │  Storage  │  │  Realtime │  │   Auth    │   │
│  │    (DB)   │  │  (Files)  │  │(WebSocket)│  │  (OAuth)  │   │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 프론트엔드 스택 상세

### 3.1 Next.js 14 (App Router)

#### 설정
```bash
npx create-next-app@latest pairy --typescript --tailwind --eslint --app --src-dir
```

#### 주요 기능 활용
| 기능 | 용도 |
|------|------|
| App Router | 파일 기반 라우팅 |
| Server Components | 초기 로딩 최적화 |
| Server Actions | 폼 처리, 뮤테이션 |
| Image Optimization | 이미지 최적화 |
| Middleware | 인증 체크 |

#### next.config.js
```javascript
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
        hostname: 'pbs.twimg.com', // Twitter 프로필 이미지
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // 이미지 업로드
    },
  },
};

module.exports = nextConfig;
```

### 3.2 TypeScript 설정

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 3.3 Tailwind CSS 설정

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5F7',
          100: '#FFE8EE',
          200: '#FFD1DD',
          300: '#FFB3C7',
          400: '#FF8AAA',
          500: '#FF6B9D',
          600: '#E85A8A',
          700: '#C44569',
          800: '#9E3654',
          900: '#7A2A42',
        },
        // ... 나머지 컬러
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 3.4 상태 관리 (Zustand)

```typescript
// src/stores/useEditorStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorState {
  // Canvas 상태
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas | null) => void;

  // 선택된 객체
  selectedObject: fabric.Object | null;
  setSelectedObject: (obj: fabric.Object | null) => void;

  // 히스토리
  history: string[];
  historyIndex: number;
  pushHistory: (state: string) => void;
  undo: () => void;
  redo: () => void;

  // 테마 컬러
  themeColors: {
    background: string;
    accent: string;
    text: string;
  };
  setThemeColor: (key: string, color: string) => void;

  // 저장 상태
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  lastSaved: Date | null;
  setLastSaved: (date: Date) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      canvas: null,
      setCanvas: (canvas) => set({ canvas }),

      selectedObject: null,
      setSelectedObject: (obj) => set({ selectedObject: obj }),

      history: [],
      historyIndex: -1,
      pushHistory: (state) => {
        const { history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(state);
        set({
          history: newHistory.slice(-50), // 최대 50개
          historyIndex: newHistory.length - 1,
        });
      },
      undo: () => {
        const { historyIndex } = get();
        if (historyIndex > 0) {
          set({ historyIndex: historyIndex - 1 });
        }
      },
      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          set({ historyIndex: historyIndex + 1 });
        }
      },

      themeColors: {
        background: '#FFF5F7',
        accent: '#FF6B9D',
        text: '#2D3436',
      },
      setThemeColor: (key, color) =>
        set((state) => ({
          themeColors: { ...state.themeColors, [key]: color },
        })),

      isDirty: false,
      setIsDirty: (dirty) => set({ isDirty: dirty }),
      lastSaved: null,
      setLastSaved: (date) => set({ lastSaved: date }),
    }),
    {
      name: 'pairy-editor',
      partialize: (state) => ({
        themeColors: state.themeColors,
      }),
    }
  )
);
```

### 3.5 캔버스 에디터 (Fabric.js)

```typescript
// src/lib/editor/fabricCanvas.ts
import { fabric } from 'fabric';

export class PairyCanvas {
  private canvas: fabric.Canvas;
  private templateData: TemplateData;

  constructor(canvasEl: HTMLCanvasElement, template: TemplateData) {
    this.canvas = new fabric.Canvas(canvasEl, {
      width: template.width,
      height: template.height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    });
    this.templateData = template;
    this.initTemplate();
  }

  private async initTemplate() {
    // 배경 레이어 (잠금)
    const bgImage = await this.loadImage(this.templateData.backgroundUrl);
    bgImage.set({
      selectable: false,
      evented: false,
      name: 'background',
    });
    this.canvas.add(bgImage);
    this.canvas.sendToBack(bgImage);

    // 편집 영역 표시
    this.templateData.editableAreas.forEach((area) => {
      const rect = new fabric.Rect({
        left: area.x,
        top: area.y,
        width: area.width,
        height: area.height,
        fill: 'transparent',
        stroke: '#FF6B9D',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        name: `area-${area.id}`,
      });
      this.canvas.add(rect);
    });
  }

  // 이미지 추가
  async addImage(file: File, areaId?: string) {
    const url = URL.createObjectURL(file);
    const img = await this.loadImage(url);

    if (areaId) {
      const area = this.templateData.editableAreas.find((a) => a.id === areaId);
      if (area) {
        img.scaleToWidth(area.width);
        img.set({
          left: area.x,
          top: area.y,
          clipPath: new fabric.Rect({
            width: area.width,
            height: area.height,
            left: area.x,
            top: area.y,
            absolutePositioned: true,
          }),
        });
      }
    }

    this.canvas.add(img);
    this.canvas.setActiveObject(img);
    this.canvas.renderAll();
    return img;
  }

  // 텍스트 추가
  addText(text: string = '텍스트를 입력하세요') {
    const textObj = new fabric.IText(text, {
      left: 100,
      top: 100,
      fontFamily: 'Pretendard',
      fontSize: 24,
      fill: '#2D3436',
    });
    this.canvas.add(textObj);
    this.canvas.setActiveObject(textObj);
    return textObj;
  }

  // 테마 컬러 변경
  applyThemeColor(colorKey: string, color: string) {
    const colorAreas = this.templateData.colorAreas?.filter(
      (a) => a.role === colorKey
    );
    colorAreas?.forEach((area) => {
      const obj = this.canvas.getObjects().find((o) => o.name === area.id);
      if (obj) {
        obj.set('fill', color);
      }
    });
    this.canvas.renderAll();
  }

  // JSON 내보내기 (저장용)
  toJSON() {
    return this.canvas.toJSON(['name', 'clipPath']);
  }

  // JSON 불러오기
  loadFromJSON(json: string) {
    this.canvas.loadFromJSON(json, () => {
      this.canvas.renderAll();
    });
  }

  // 이미지 내보내기
  async toDataURL(options?: { multiplier?: number }) {
    return this.canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: options?.multiplier || 1,
    });
  }

  private loadImage(url: string): Promise<fabric.Image> {
    return new Promise((resolve) => {
      fabric.Image.fromURL(url, (img) => resolve(img), { crossOrigin: 'anonymous' });
    });
  }

  dispose() {
    this.canvas.dispose();
  }
}
```

### 3.6 실시간 협업 (Yjs + Supabase)

```typescript
// src/lib/collab/yjs-provider.ts
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { createClient } from '@supabase/supabase-js';

export class SupabaseYjsProvider {
  private doc: Y.Doc;
  private awareness: Awareness;
  private supabase: ReturnType<typeof createClient>;
  private channel: ReturnType<typeof this.supabase.channel>;
  private sessionId: string;

  constructor(sessionId: string, doc: Y.Doc) {
    this.sessionId = sessionId;
    this.doc = doc;
    this.awareness = new Awareness(doc);
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    this.channel = this.supabase.channel(`collab:${sessionId}`);
    this.setupListeners();
  }

  private setupListeners() {
    // 문서 변경 브로드캐스트
    this.doc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== 'remote') {
        this.channel.send({
          type: 'broadcast',
          event: 'yjs-update',
          payload: { update: Array.from(update) },
        });
      }
    });

    // Awareness (커서 위치 등)
    this.awareness.on('update', ({ added, updated, removed }: any) => {
      const states = this.awareness.getStates();
      this.channel.send({
        type: 'broadcast',
        event: 'awareness',
        payload: {
          clientId: this.doc.clientID,
          state: states.get(this.doc.clientID),
        },
      });
    });

    // 채널 구독
    this.channel
      .on('broadcast', { event: 'yjs-update' }, ({ payload }) => {
        const update = new Uint8Array(payload.update);
        Y.applyUpdate(this.doc, update, 'remote');
      })
      .on('broadcast', { event: 'awareness' }, ({ payload }) => {
        if (payload.clientId !== this.doc.clientID) {
          this.awareness.setLocalStateField('remote', payload.state);
        }
      })
      .subscribe();
  }

  // 커서 위치 업데이트
  updateCursor(x: number, y: number) {
    this.awareness.setLocalStateField('cursor', { x, y });
  }

  // 유저 정보 설정
  setUser(user: { id: string; name: string; color: string }) {
    this.awareness.setLocalStateField('user', user);
  }

  destroy() {
    this.channel.unsubscribe();
    this.awareness.destroy();
  }
}
```

---

## 4. 백엔드 스택 상세

### 4.1 Supabase 설정

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}
```

### 4.2 인증 설정

```typescript
// src/lib/supabase/auth.ts
import { createClient } from './client';

export async function signInWithTwitter() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'twitter',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

### 4.3 이미지 처리 (Sharp)

```typescript
// src/lib/image/processor.ts
import sharp from 'sharp';

export class ImageProcessor {
  // 썸네일 생성
  static async createThumbnail(
    buffer: Buffer,
    width: number = 400
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  // 워터마크 추가
  static async addWatermark(
    imageBuffer: Buffer,
    watermarkBuffer: Buffer,
    options: {
      position?: 'center' | 'bottom-right' | 'tiled';
      opacity?: number;
    } = {}
  ): Promise<Buffer> {
    const { position = 'bottom-right', opacity = 0.3 } = options;
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    let watermark = sharp(watermarkBuffer);

    if (position === 'tiled') {
      // 타일링 워터마크
      const tile = await watermark
        .resize(100)
        .composite([{
          input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: 'dest-in',
        }])
        .toBuffer();

      // 타일 패턴 생성
      const pattern = await sharp({
        create: {
          width: metadata.width!,
          height: metadata.height!,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([{ input: tile, tile: true }])
        .toBuffer();

      return image.composite([{ input: pattern }]).toBuffer();
    }

    // 단일 워터마크
    const wmMetadata = await watermark.metadata();
    const wmWidth = Math.min(200, metadata.width! * 0.3);
    watermark = watermark.resize(wmWidth);

    const positions = {
      'bottom-right': {
        left: metadata.width! - wmWidth - 20,
        top: metadata.height! - (wmMetadata.height! * (wmWidth / wmMetadata.width!)) - 20,
      },
      'center': {
        left: (metadata.width! - wmWidth) / 2,
        top: (metadata.height! - (wmMetadata.height! * (wmWidth / wmMetadata.width!))) / 2,
      },
    };

    return image
      .composite([{
        input: await watermark.toBuffer(),
        ...positions[position as keyof typeof positions],
        blend: 'over',
      }])
      .toBuffer();
  }

  // 패턴 오버레이 (AI 학습 방지)
  static async addPatternOverlay(
    imageBuffer: Buffer,
    patternType: 'grid' | 'noise' = 'grid'
  ): Promise<Buffer> {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    let pattern: Buffer;

    if (patternType === 'grid') {
      // 미세 격자 패턴
      const gridSize = 4;
      const svg = `
        <svg width="${metadata.width}" height="${metadata.height}">
          <defs>
            <pattern id="grid" width="${gridSize}" height="${gridSize}" patternUnits="userSpaceOnUse">
              <rect width="${gridSize}" height="${gridSize}" fill="none" stroke="rgba(0,0,0,0.02)" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      `;
      pattern = Buffer.from(svg);
    } else {
      // 노이즈 패턴 (추후 구현)
      pattern = Buffer.from('');
    }

    return image
      .composite([{ input: pattern }])
      .toBuffer();
  }
}
```

---

## 5. 패키지 의존성

### 5.1 package.json

```json
{
  "name": "pairy",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "supabase gen types typescript --local > src/types/database.ts",
    "db:push": "supabase db push",
    "db:reset": "supabase db reset"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",

    "@supabase/ssr": "^0.1.0",
    "@supabase/supabase-js": "^2.39.0",

    "fabric": "^6.0.0",
    "yjs": "^13.6.0",
    "y-protocols": "^1.0.6",

    "zustand": "^4.4.0",

    "sharp": "^0.33.0",

    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",

    "lucide-react": "^0.303.0",

    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "class-variance-authority": "^0.7.0",
    "tailwindcss-animate": "^1.0.7",

    "date-fns": "^3.0.0",
    "nanoid": "^5.0.4",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/fabric": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",

    "typescript": "^5.3.0",
    "eslint": "^8.55.0",
    "eslint-config-next": "^14.0.0",

    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",

    "supabase": "^1.123.0"
  }
}
```

---

## 6. 환경 변수

### 6.1 .env.local

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth (Supabase Dashboard에서 설정)
# Twitter, Google OAuth는 Supabase에서 관리

# Payment (토스페이먼츠)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxxx
TOSS_SECRET_KEY=test_sk_xxxxx

# Analytics
NEXT_PUBLIC_MIXPANEL_TOKEN=xxxxx
```

### 6.2 환경별 설정

```typescript
// src/lib/config.ts
export const config = {
  app: {
    name: 'Pairy',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://pairy.io',
    description: '페어를 완성하는 마법',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  payment: {
    tossClientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
  },
  limits: {
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxTemplatesPerUser: 50,
    freeWorkLimit: 3,
    freeDailyCollab: 1,
  },
  premium: {
    monthlyPrice: 3900,
    dailyPassPrice: 500,
  },
};
```

---

## 7. 성능 최적화

### 7.1 이미지 최적화

```typescript
// Next.js Image 컴포넌트 활용
import Image from 'next/image';

// 썸네일 로딩
<Image
  src={template.thumbnailUrl}
  alt={template.title}
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL={template.blurHash}
  loading="lazy"
/>
```

### 7.2 코드 스플리팅

```typescript
// 에디터는 동적 임포트 (용량 큼)
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@/components/editor/Editor'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});
```

### 7.3 캐싱 전략

```typescript
// React Query 또는 SWR 사용
import useSWR from 'swr';

function useTemplates(category?: string) {
  return useSWR(
    ['templates', category],
    () => fetchTemplates(category),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분
    }
  );
}
```
