# Pairy 에디터 업그레이드 계획

> 최종 업데이트: 2026-01-01
> 현재 버전: Phase 4 완료 (react-konva 기반)

---

## 1. 현재 에디터 아키텍처

### 1.1 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| 캔버스 렌더링 | react-konva | 18+ |
| 상태 관리 | Zustand | 4+ |
| 템플릿 스키마 | JSON v2 | - |
| 내보내기 | Konva toDataURL/toBlob | - |

### 1.2 핵심 파일 구조

```
src/
├── components/editor/canvas/
│   ├── CanvasEditor.tsx          # 메인 에디터 컴포넌트 (1,056줄)
│   ├── EditorSidebar.tsx         # 편집 사이드바
│   ├── TemplateRenderer.tsx      # 템플릿 렌더러 (227줄, 모듈화)
│   ├── KeyboardShortcutsModal.tsx
│   └── renderers/
│       ├── BackgroundRenderer.tsx
│       ├── ImageSlotRenderer.tsx
│       ├── TextFieldRenderer.tsx
│       ├── DynamicShapeRenderer.tsx
│       └── OverlayImageRenderer.tsx
│
├── stores/
│   ├── canvasEditorStore.ts      # 에디터 상태 (342줄)
│   └── middleware/
│       ├── historyMiddleware.ts  # Undo/Redo 로직
│       └── layerSlice.ts         # 레이어 상태 관리
│
├── hooks/
│   └── useKonvaImage.ts          # 이미지 로딩 훅
│
├── lib/utils/
│   ├── canvasUtils.ts            # 캔버스 유틸리티
│   └── editorUtils.ts            # 에디터 유틸리티
│
└── types/
    └── template.ts               # 템플릿 스키마 v2 (471줄)
```

### 1.3 완성된 기능 (Phase 4)

| 기능 | 상태 | 설명 |
|------|:----:|------|
| react-konva 렌더링 | ✅ | Stage/Layer 기반 렌더링 |
| 템플릿 JSON 스키마 | ✅ | 3단 레이어 (background/slots/overlay) |
| 이미지 마스킹 | ✅ | shape/image 마스크, 7가지 도형 |
| 드래그앤드롭 | ✅ | 슬롯 내 이미지 위치/스케일/회전 |
| 내보내기 | ✅ | PNG/JPG/WebP, 1x/2x/3x 해상도 |
| Undo/Redo | ✅ | 50개 히스토리 스냅샷 |
| 자동 저장 | ✅ | 30초 디바운스, localStorage |
| 복구 알림 | ✅ | 24시간 이내 작업 복구 제안 |
| 키보드 단축키 | ✅ | Ctrl+Z/Y/S/E, 방향키, Delete |
| 핀치 줌 | ✅ | 모바일 2손가락 제스처 |
| 화면 맞춤 | ✅ | 자동/수동 fit-to-screen |
| 모바일 반응형 | ✅ | 사이드바 오버레이, 터치 지원 |

---

## 2. Phase 5: 에디터 고도화 계획

### 2.1 Sprint 29: 이미지 편집 강화

**목표:** 이미지 조작 기능 확장

| 기능 | 우선순위 | 설명 | 예상 작업량 |
|------|:--------:|------|:----------:|
| 클립보드 붙여넣기 | P0 | `Ctrl+V`로 이미지 직접 붙여넣기 | 소 |
| 이미지 반전 | P1 | 좌우/상하 flip 버튼 | 소 |
| 투명도 조절 | P1 | 슬롯 이미지 opacity 슬라이더 (0-100%) | 소 |
| 이미지 필터 | P2 | 흑백, 세피아, 밝기, 대비 조절 | 중 |
| URL 이미지 추가 | P2 | 외부 URL 입력하여 이미지 로드 | 소 |

**구현 상세:**

```typescript
// SlotImageTransform 확장
interface SlotImageTransform {
  x: number          // -1 ~ 1
  y: number          // -1 ~ 1
  scale: number      // 1 = 원본
  rotation: number   // 도 단위

  // 신규 필드
  flipX?: boolean    // 좌우 반전
  flipY?: boolean    // 상하 반전
  opacity?: number   // 0 ~ 1 (기본값: 1)

  filters?: {
    brightness?: number  // -100 ~ 100 (기본값: 0)
    contrast?: number    // -100 ~ 100 (기본값: 0)
    saturation?: number  // 0 ~ 200 (기본값: 100)
    grayscale?: boolean  // 흑백 필터
    sepia?: boolean      // 세피아 필터
    blur?: number        // 0 ~ 20 (기본값: 0)
  }
}
```

**클립보드 붙여넣기 구현:**

```typescript
// CanvasEditor.tsx에 추가
useEffect(() => {
  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file && selectedSlotId) {
          const url = URL.createObjectURL(file)
          updateImage(selectedSlot.dataKey, url)
          toast.success('이미지가 붙여넣기 되었습니다')
        }
        break
      }
    }
  }

  document.addEventListener('paste', handlePaste)
  return () => document.removeEventListener('paste', handlePaste)
}, [selectedSlotId])
```

---

### 2.2 Sprint 30: 텍스트 편집 고도화

**목표:** 텍스트 스타일링 옵션 확장

| 기능 | 우선순위 | 설명 | 예상 작업량 |
|------|:--------:|------|:----------:|
| 텍스트 외곽선 | P1 | stroke 색상/두께 설정 | 소 |
| 텍스트 그림자 | P1 | drop shadow 효과 | 소 |
| 인라인 편집 | P1 | 캔버스에서 직접 텍스트 편집 | 중 |
| 텍스트 그라데이션 | P2 | 2색 그라데이션 채우기 | 중 |
| 커브 텍스트 | P3 | 원형/웨이브 패스 따라가기 | 대 |

**텍스트 효과 확장:**

```typescript
// TextField.effects 확장
interface TextEffects {
  // 기존
  shadow?: {
    color: string
    blur: number
    offsetX: number
    offsetY: number
  }
  stroke?: {
    color: string | ColorReference
    width: number
  }

  // 신규
  glow?: {
    color: string | ColorReference
    blur: number
    strength?: number  // 0-1
  }
  gradient?: {
    type: 'linear' | 'radial'
    colors: [string, string]
    angle?: number  // linear일 때
  }
  outline?: {
    color: string
    width: number
    blur?: number  // 부드러운 외곽선
  }
}
```

---

### 2.3 Sprint 31: 스티커 & 드로잉

**목표:** 장식 요소 추가 기능

| 기능 | 우선순위 | 설명 | 예상 작업량 |
|------|:--------:|------|:----------:|
| 스티커 라이브러리 | P1 | 이모지, 장식 요소 팔레트 | 중 |
| 스티커 검색 | P1 | 키워드로 스티커 검색 | 소 |
| 프리핸드 드로잉 | P2 | 브러시 툴 (펜, 마커) | 대 |
| 도형 그리기 | P2 | 사각형, 원, 선, 화살표 | 중 |
| 지우개 툴 | P2 | 드로잉 요소 삭제 | 소 |

**스티커 시스템 설계:**

```typescript
// types/sticker.ts
interface StickerPack {
  id: string
  name: string
  category: 'emoji' | 'decoration' | 'frame' | 'effect' | 'seasonal'
  thumbnail: string
  stickers: Sticker[]
  isPremium?: boolean
}

interface Sticker {
  id: string
  imageUrl: string
  tags: string[]
  size: { width: number; height: number }
}

// 레이어에 스티커 추가
interface StickerLayer {
  id: string
  stickerId: string
  transform: Transform
  opacity?: number
  flipX?: boolean
  flipY?: boolean
}

// TemplateConfig.layers 확장
interface Layers {
  background: BackgroundLayer
  slots: ImageSlot[]
  stickers?: StickerLayer[]  // 신규
  dynamicShapes?: DynamicShape[]
  texts: TextField[]
  overlays?: OverlayImage[]
}
```

**스티커 UI 컴포넌트:**

```
┌─ 스티커 패널 ─────────────────────────┐
│ [검색: 🔍 하트, 별, 리본...]           │
│                                       │
│ ─── 최근 사용 ───                     │
│ [❤️] [⭐] [🎀] [✨] [🌸]               │
│                                       │
│ ─── 이모지 ───                        │
│ [😊] [😍] [🥰] [💕] [💖] [💗]          │
│                                       │
│ ─── 장식 ─── [프리미엄 🔒]             │
│ [프레임1] [프레임2] [꽃1] [꽃2]        │
│                                       │
└───────────────────────────────────────┘
```

---

### 2.4 Sprint 32: 실시간 협업 (Yjs 통합)

**목표:** 2인 실시간 동시 편집

| 기능 | 우선순위 | 설명 | 예상 작업량 |
|------|:--------:|------|:----------:|
| Yjs 문서 동기화 | P0 | 캔버스 상태 CRDT 동기화 | 대 |
| 커서 공유 | P0 | 상대방 커서 실시간 표시 | 중 |
| Presence 표시 | P1 | 참여자 아바타, 온라인 상태 | 소 |
| 영역 분리 | P1 | A/B 편집 영역 구분 | 중 |
| 충돌 알림 | P2 | "상대방이 편집 중" 표시 | 소 |

**Yjs 통합 아키텍처:**

```typescript
// lib/collab/CollabProvider.ts
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'

interface CollabState {
  // Yjs 문서
  doc: Y.Doc
  provider: SupabaseYjsProvider
  awareness: Awareness

  // 공유 상태 (Y.Map)
  sharedFormData: Y.Map<string>
  sharedImages: Y.Map<string>
  sharedColors: Y.Map<string>
  sharedTransforms: Y.Map<SlotImageTransform>
  sharedStickers: Y.Array<StickerLayer>

  // 로컬 상태
  localUser: {
    id: string
    name: string
    color: string
    avatar?: string
  }

  // 원격 상태
  remoteCursors: Map<number, {
    user: UserInfo
    cursor: { x: number; y: number }
    selectedSlotId?: string
  }>
}

// 커서 공유 훅
function useCollabCursor(awareness: Awareness) {
  const [remoteCursors, setRemoteCursors] = useState<Map<number, CursorState>>()

  useEffect(() => {
    const handleChange = () => {
      const states = awareness.getStates()
      setRemoteCursors(new Map(states))
    }

    awareness.on('change', handleChange)
    return () => awareness.off('change', handleChange)
  }, [awareness])

  const updateCursor = useCallback((x: number, y: number) => {
    awareness.setLocalStateField('cursor', { x, y })
  }, [awareness])

  return { remoteCursors, updateCursor }
}
```

**협업 UI:**

```
┌─ 캔버스 ─────────────────────────────────────────┐
│                                                   │
│    ┌─────────┐           ┌─────────┐             │
│    │ 슬롯 A  │           │ 슬롯 B  │             │
│    │ (내 영역)│           │(상대 영역)│             │
│    └─────────┘           └─────────┘             │
│                                                   │
│         🔵 나                  🟣 상대방          │
│         ↑ 커서                  ↑ 커서           │
│                                                   │
├───────────────────────────────────────────────────┤
│ [👤 strawberry123] [👤 fairy_art ✏️ 편집 중]      │
└───────────────────────────────────────────────────┘
```

---

### 2.5 Sprint 33: UX 고도화

**목표:** 사용자 경험 개선

| 기능 | 우선순위 | 설명 | 예상 작업량 |
|------|:--------:|------|:----------:|
| 온보딩 투어 | P1 | 첫 사용자 3-5단계 가이드 | 중 |
| 컨텍스트 메뉴 | P1 | 우클릭 메뉴 | 소 |
| 레이어 패널 | P1 | 요소 순서 변경, 잠금, 숨김 | 중 |
| 템플릿 프리셋 | P1 | 색상 조합 원클릭 적용 | 소 |
| 버전 히스토리 | P2 | 저장 시점 목록 (프리미엄) | 중 |
| 줌 네비게이터 | P2 | 미니맵 형태 전체 보기 | 중 |

**온보딩 투어:**

```typescript
// components/editor/OnboardingTour.tsx
const ONBOARDING_STEPS: TourStep[] = [
  {
    target: '[data-tour="slot-area"]',
    title: '이미지 영역',
    content: '여기를 클릭하고 이미지를 업로드하세요',
    placement: 'right',
  },
  {
    target: '[data-tour="color-picker"]',
    title: '테마 색상',
    content: '원하는 색상으로 바꿔보세요',
    placement: 'left',
  },
  {
    target: '[data-tour="text-input"]',
    title: '텍스트 입력',
    content: '이름이나 메시지를 입력하세요',
    placement: 'left',
  },
  {
    target: '[data-tour="export-btn"]',
    title: '저장하기',
    content: '완성된 이미지를 저장하세요!',
    placement: 'bottom',
  },
]
```

**레이어 패널:**

```
┌─ 레이어 ─────────────────────┐
│ [+] 스티커 추가               │
├──────────────────────────────┤
│ 📌 오버레이 (잠금)            │
│ ├─ [🖼️] 프레임 장식          │
│                              │
│ 📝 텍스트                     │
│ ├─ [Aa] "strawberry123"      │
│ ├─ [Aa] "2024.01.01"         │
│                              │
│ ⭐ 스티커                     │
│ ├─ [❤️] 하트 스티커           │
│                              │
│ 🖼️ 이미지 슬롯               │
│ ├─ [👤] 캐릭터 A  [👁️][🔒]   │
│ ├─ [👤] 캐릭터 B  [👁️][🔒]   │
│                              │
│ 🎨 배경 (잠금)               │
└──────────────────────────────┘
```

---

### 2.6 Sprint 34: 성능 & 접근성

**목표:** 최적화 및 접근성 준수

| 기능 | 우선순위 | 설명 | 예상 작업량 |
|------|:--------:|------|:----------:|
| 이미지 압축 | P0 | 업로드 시 자동 리사이징 (max 2000px) | 소 |
| 웹워커 내보내기 | P1 | 메인 스레드 블로킹 방지 | 중 |
| 캔버스 가상화 | P2 | 대형 템플릿 성능 최적화 | 대 |
| ARIA 라벨 | P1 | 스크린 리더 지원 | 소 |
| 모션 감소 | P0 | `prefers-reduced-motion` 존중 | 소 |
| 고대비 모드 | P2 | `prefers-contrast` 지원 | 소 |

**이미지 압축:**

```typescript
// lib/utils/imageCompressor.ts
const MAX_DIMENSION = 2000
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

async function compressImage(file: File): Promise<Blob> {
  const img = await createImageBitmap(file)

  let { width, height } = img

  // 최대 크기 제한
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)

  // 품질 조정하며 압축
  let quality = 0.9
  let blob = await canvas.convertToBlob({ type: 'image/jpeg', quality })

  while (blob.size > MAX_FILE_SIZE && quality > 0.5) {
    quality -= 0.1
    blob = await canvas.convertToBlob({ type: 'image/jpeg', quality })
  }

  return blob
}
```

---

## 3. UI/UX 개선 가이드

### 3.1 적용할 디자인 패턴

| 패턴 | 적용 위치 | 효과 |
|------|----------|------|
| **Glassmorphism** | 사이드바, 모달, 툴팁 | 모던한 느낌 |
| **Skeleton Shimmer** | 템플릿/이미지 로딩 | 체감 속도 향상 |
| **Magnetic Button** | 내보내기 CTA | 인터랙티브 재미 |
| **Staggered Animation** | 레이어/스티커 그리드 | 생동감 |
| **Progress Ring** | 내보내기 진행률 | 명확한 피드백 |

### 3.2 사이드바 개선안

```
┌─ 현재 ────────────────────┐    ┌─ 개선안 ─────────────────┐
│ [탭: 슬롯 | 텍스트 | 색상]  │    │ ┌─────────────────────┐ │
│                          │    │ │ 🖼️ 이미지 슬롯 A      │ │
│ 단순 입력 필드 나열        │    │ │ 드래그하여 위치 조정   │ │
│                          │    │ └─────────────────────┘ │
│                          │    │                          │
│                          │    │ ─── 편집 ───             │
│                          │    │ [이미지] [필터] [효과]    │
│                          │    │                          │
│                          │    │ ─── 반전 ───             │
│                          │    │ [↔️ 좌우] [↕️ 상하]       │
│                          │    │                          │
│                          │    │ ─── 투명도 ───           │
│                          │    │ [━━━━━━━●━━] 80%        │
│                          │    │                          │
│                          │    │ ─── 레이어 ───           │
│                          │    │ [미리보기 썸네일]         │
└──────────────────────────┘    └──────────────────────────┘
```

### 3.3 빈 상태(Empty State) 디자인

```
┌─────────────────────────────────────────┐
│                                         │
│            [🖼️ 이미지 아이콘]            │
│                                         │
│      "아직 이미지가 없어요"              │
│                                         │
│    드래그하거나 클릭해서                 │
│    이미지를 추가해보세요                 │
│                                         │
│         [ 📁 파일 선택 ]                │
│                                         │
│    또는 Ctrl+V로 붙여넣기               │
│                                         │
└─────────────────────────────────────────┘
```

---

## 4. 기술 부채 해결

### 4.1 현재 이슈

| 이슈 | 현재 상태 | 영향도 | 해결 방안 |
|------|----------|:------:|----------|
| 이미지 메모리 관리 | Blob URL revoke 부분적 | 중 | ImageManager 클래스 도입 |
| 대용량 이미지 | 클라이언트 부하 | 중 | OffscreenCanvas 압축 |
| 히스토리 메모리 | 50개 전체 스냅샷 | 중 | diff-based 히스토리 |
| 템플릿 로딩 | 전체 JSON fetch | 소 | 점진적 로딩 |

### 4.2 ImageManager 설계

```typescript
// lib/utils/ImageManager.ts
class ImageManager {
  private cache = new Map<string, {
    url: string
    type: 'blob' | 'data' | 'external'
    refCount: number
  }>()

  async load(file: File): Promise<string> {
    const compressed = await compressImage(file)
    const url = URL.createObjectURL(compressed)
    this.cache.set(url, { url, type: 'blob', refCount: 1 })
    return url
  }

  retain(url: string): void {
    const entry = this.cache.get(url)
    if (entry) entry.refCount++
  }

  release(url: string): void {
    const entry = this.cache.get(url)
    if (entry) {
      entry.refCount--
      if (entry.refCount <= 0 && entry.type === 'blob') {
        URL.revokeObjectURL(url)
        this.cache.delete(url)
      }
    }
  }

  cleanup(): void {
    for (const [url, entry] of this.cache) {
      if (entry.type === 'blob') {
        URL.revokeObjectURL(url)
      }
    }
    this.cache.clear()
  }
}

export const imageManager = new ImageManager()
```

### 4.3 Diff-based 히스토리

```typescript
// stores/middleware/diffHistoryMiddleware.ts
import { diff, patch, Delta } from 'jsondiffpatch'

interface DiffHistoryState {
  baseSnapshot: HistorySnapshot
  deltas: Delta[]      // 변경사항만 저장
  deltaIndex: number
  maxDeltas: number    // 100개
}

function createDiffHistoryActions(set, get) {
  return {
    pushHistory: () => {
      const { baseSnapshot, deltas, deltaIndex } = get()
      const currentState = getCurrentSnapshot(get())
      const prevState = reconstructState(baseSnapshot, deltas.slice(0, deltaIndex))

      const delta = diff(prevState, currentState)
      if (!delta) return // 변경 없음

      const newDeltas = [...deltas.slice(0, deltaIndex), delta]

      // 주기적으로 base 리셋 (메모리 최적화)
      if (newDeltas.length > 50) {
        set({
          baseSnapshot: currentState,
          deltas: [],
          deltaIndex: 0,
        })
      } else {
        set({
          deltas: newDeltas.slice(-100),
          deltaIndex: newDeltas.length,
        })
      }
    },

    undo: () => {
      const { deltaIndex } = get()
      if (deltaIndex > 0) {
        set({ deltaIndex: deltaIndex - 1 })
        applyState(get())
      }
    },

    redo: () => {
      const { deltas, deltaIndex } = get()
      if (deltaIndex < deltas.length) {
        set({ deltaIndex: deltaIndex + 1 })
        applyState(get())
      }
    },
  }
}
```

---

## 5. 로드맵

### 5.1 우선순위 매트릭스

```
        ┌─────────────────────────────────────────┐
        │           높은 영향력                    │
        │                                         │
        │   [클립보드 붙여넣기]  [실시간 협업]      │
   쉬움 │   [이미지 반전]       [온보딩 투어]      │ 어려움
        │   [투명도 조절]       [스티커 시스템]    │
        │                                         │
        │   [텍스트 외곽선]     [레이어 패널]      │
        │   [템플릿 프리셋]     [인라인 편집]      │
        │                                         │
        │           낮은 영향력                    │
        └─────────────────────────────────────────┘
```

### 5.2 구현 순서

```
Phase 5 로드맵
═════════════════════════════════════════════════════════════

Sprint 29 ──── Sprint 30 ──── Sprint 31 ──── Sprint 32 ──── Sprint 33
   │              │              │              │              │
   ▼              ▼              ▼              ▼              ▼
┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐
│이미지 │      │텍스트 │      │스티커 │      │실시간 │      │ UX   │
│ 편집  │  →   │ 고도화│  →   │드로잉 │  →   │ 협업  │  →   │고도화│
│ 강화  │      │      │      │      │      │      │      │      │
└──────┘      └──────┘      └──────┘      └──────┘      └──────┘
   │              │              │              │              │
   ├─클립보드     ├─외곽선       ├─스티커팩     ├─Yjs통합      ├─온보딩
   ├─반전/투명도  ├─그림자       ├─검색         ├─커서공유     ├─레이어
   └─필터         └─인라인편집   └─드로잉       └─영역분리     └─프리셋

═════════════════════════════════════════════════════════════
```

### 5.3 Sprint 별 체크리스트

#### Sprint 29: 이미지 편집 강화
```
□ 클립보드 붙여넣기 (Ctrl+V)
□ 이미지 좌우/상하 반전
□ 투명도 조절 슬라이더
□ 이미지 필터 (흑백, 세피아)
□ 밝기/대비 조절
□ 사이드바 UI 업데이트
□ 테스트 케이스 작성
```

#### Sprint 30: 텍스트 고도화
```
□ 텍스트 외곽선 (stroke)
□ 텍스트 그림자 (drop shadow)
□ 인라인 텍스트 편집
□ 텍스트 변환 미리보기
□ 그라데이션 텍스트 (선택)
□ 테스트 케이스 작성
```

#### Sprint 31: 스티커 & 드로잉
```
□ 스티커 팩 데이터 구조
□ 스티커 라이브러리 UI
□ 스티커 검색 기능
□ 캔버스에 스티커 배치
□ 스티커 조작 (이동/회전/크기)
□ 기본 스티커 팩 3개 준비
□ 테스트 케이스 작성
```

#### Sprint 32: 실시간 협업
```
□ Yjs + Supabase Provider 설정
□ 공유 상태 스키마 정의
□ 상태 동기화 로직
□ 커서 공유 구현
□ Presence UI (아바타, 상태)
□ 편집 영역 분리
□ 충돌 감지 알림
□ 협업 세션 관리 UI
□ E2E 테스트
```

#### Sprint 33: UX 고도화
```
□ 온보딩 투어 컴포넌트
□ 첫 사용자 감지 로직
□ 컨텍스트 메뉴 구현
□ 레이어 패널 UI
□ 드래그로 레이어 순서 변경
□ 레이어 잠금/숨김
□ 템플릿 색상 프리셋
□ 버전 히스토리 (프리미엄)
```

---

## 6. 참고 자료

- [기능 명세서](./master-prompt/01-functional-spec.md)
- [기술 스택](./master-prompt/05-tech-stack.md)
- [UI/UX 연구](./research/ui-ux-animation-research-2025.md)
- [페어리 모션 원칙](./master-prompt/12-fairy-motion-principles.md)

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-01 | 1.0 | 초기 문서 작성 |
