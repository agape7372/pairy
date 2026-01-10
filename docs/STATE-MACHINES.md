# Pairy - 컴포넌트 상태 머신 다이어그램

> 생성일: 2026-01-10 | Ultrathink 분석

모든 주요 컴포넌트의 상태 전이를 매핑한 문서입니다.

---

## 목차
1. [인증 시스템](#1-인증-시스템-authentication)
2. [캔버스 에디터](#2-캔버스-에디터-canvas-editor)
3. [구독 시스템](#3-구독-시스템-subscription)
4. [마켓플레이스](#4-마켓플레이스-marketplace)
5. [협업 시스템](#5-협업-시스템-collaboration)
6. [에디터 진입 플로우](#6-에디터-진입-플로우-editor-entry)
7. [게이미피케이션](#7-게이미피케이션-gamification)

---

## 1. 인증 시스템 (Authentication)

### 메인 상태 머신

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LIFECYCLE                      │
└─────────────────────────────────────────────────────────────────┘

                        ┌─────────────┐
                        │ APP_INIT    │
                        │ isLoading   │
                        └──────┬──────┘
                               │ onAuthStateChange()
                               ▼
              ┌────────────────┴────────────────┐
              │                                  │
              ▼                                  ▼
    ┌─────────────────┐               ┌─────────────────┐
    │ UNAUTHENTICATED │               │  AUTHENTICATED  │
    │ user: null      │               │ user: User      │
    │ profile: null   │               │ profile: Profile│
    └────────┬────────┘               └────────┬────────┘
             │                                  │
     ┌───────┼───────┐                         │
     │       │       │                         │
     ▼       ▼       ▼                         ▼
  EMAIL   EMAIL   OAUTH              ┌──────────────────┐
  LOGIN   SIGNUP  REDIRECT           │ Protected Routes │
     │       │       │               │ /my/*            │
     │       │       │               │ Account Mgmt     │
     └───────┼───────┘               └────────┬─────────┘
             │                                 │
             ▼                         ┌───────┴───────┐
    ┌─────────────────┐               │       │       │
    │ AUTH_CALLBACK   │               ▼       ▼       ▼
    │ code exchange   │           PROFILE  SIGNING IDENTITY
    │ profile ensure  │           UPDATE    OUT    LINKING
    └────────┬────────┘               │       │       │
             │                        │       │       │
             └────────────────────────┴───────┴───────┘
                               │
                               ▼
                      STATE RESTORED
```

### 로그인 상태 전이

```
EMAIL_LOGIN_FORM
    │
    ├─ [valid credentials] ─────────────────────────────┐
    │                                                    │
    ├─ [invalid credentials] ──► ERROR_STATE           │
    │                                                    │
    └─ [rate limit exceeded] ──► RATE_LIMITED          │
                                    │                   │
                                    │ [15분 후]         │
                                    │                   │
                                    ▼                   ▼
                              EMAIL_LOGIN_FORM   AUTHENTICATED
```

### OAuth 콜백 상태

```
AUTH_CALLBACK_PROCESSING
    │
    ├─ [hash tokens present] ──► HASH_TOKEN_EXCHANGE
    │                                    │
    ├─ [code parameter] ─────► CODE_EXCHANGE
    │                                    │
    ├─ [existing session] ───► PROFILE_ENSURING
    │                                    │
    └─ [error in URL] ───────► AUTH_ERROR ──► UNAUTHENTICATED
                                         │
                                         └──► [2.5s] ──► /login redirect
```

### 계정 삭제 플로우

```
ACCOUNT_DELETE_CONFIRM
    │ [계속]
    ▼
ACCOUNT_DELETE_VERIFY
    │ [텍스트 입력: "탈퇴합니다"]
    ▼
ACCOUNT_DELETING
    │
    ├─ [삭제 성공] ──► signOut() ──► UNAUTHENTICATED
    │
    └─ [삭제 실패] ──► ACCOUNT_DELETE_ERROR
                            │
                            └─ [다시 시도] ──► ACCOUNT_DELETE_VERIFY
```

### 관련 파일
| 파일 | 역할 |
|------|------|
| `src/hooks/useUser.ts` | 세션 상태 관리 |
| `src/lib/auth/profile.ts` | 프로필 CRUD |
| `src/app/(main)/auth/callback/page.tsx` | OAuth 콜백 처리 |
| `src/app/(main)/login/page.tsx` | 로그인 UI |

---

## 2. 캔버스 에디터 (Canvas Editor)

### 메인 상태 머신

```
┌─────────────────────────────────────────────────────────────────┐
│                    CANVAS EDITOR LIFECYCLE                       │
└─────────────────────────────────────────────────────────────────┘

                        ┌─────────────┐
                        │   EMPTY     │ initialState
                        └──────┬──────┘
                               │ loadTemplate(config)
                               ▼
                ┌──────────────────────────┐
                │    TEMPLATE_LOADED       │
                │ • templateConfig set     │
                │ • firstSlot selected     │
                │ • history initialized    │
                └──────────────┬───────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │ IDLE STATE  │    │  SELECTING  │    │  EDITING    │
    │ 선택 없음    │◄──►│ 요소 선택됨  │◄──►│ 인라인 편집  │
    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
           │                  │                   │
           │                  ▼                   │
           │           ┌─────────────┐           │
           │           │TRANSFORMING │           │
           │           │드래그/리사이즈│           │
           │           └──────┬──────┘           │
           │                  │                   │
           └──────────────────┼───────────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │      DIRTY STATE         │
                │ • isDirty = true         │
                │ • pushHistory()          │
                │ • Auto-save 30s debounce │
                └──────────────┬───────────┘
                               │ markSaved()
                               ▼
                ┌──────────────────────────┐
                │      SAVED STATE         │
                │ • isDirty = false        │
                │ • lastSavedAt = now      │
                └──────────────────────────┘
```

### 선택 상태 (Exclusive Selection)

```
선택 상태는 상호 배타적 (동시에 하나만 선택 가능)

┌──────────────────────────────────────────────────────────────┐
│                     SELECTION STATES                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│    selectedSlotId    selectedTextId    selectedStickerId     │
│         │                  │                   │              │
│         ▼                  ▼                   ▼              │
│    ┌─────────┐       ┌─────────┐        ┌─────────┐         │
│    │  SLOT   │       │  TEXT   │        │ STICKER │         │
│    │ SELECTED│ ────► │ SELECTED│ ─────► │ SELECTED│         │
│    └─────────┘       └─────────┘        └─────────┘         │
│         │                  │                   │              │
│         └──────────────────┴───────────────────┘              │
│                            │                                  │
│                     selectSlot(id)                           │
│                     selectText(id)                           │
│                     selectSticker(id)                        │
│                            │                                  │
│                     다른 선택 자동 해제                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 히스토리 (Undo/Redo) 상태

```
┌─────────────────────────────────────────────────────────────┐
│                    HISTORY STATE                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  history: [S0, S1, S2, S3, S4, S5]                         │
│                          ▲                                   │
│                   historyIndex = 5                          │
│                                                              │
│  ACTIONS:                                                    │
│                                                              │
│  pushHistory() ──► 새 스냅샷 추가 (max 50개)                 │
│       │                                                      │
│       ├─ 중복 감지: 이전 상태와 동일하면 스킵                  │
│       └─ 브랜치 삭제: undo 후 편집 시 미래 히스토리 삭제       │
│                                                              │
│  undo() ◄──────────────────────────────────► redo()         │
│       │                                           │          │
│       │  historyIndex--          historyIndex++   │          │
│       │  restore snapshot        restore snapshot │          │
│       ▼                                           ▼          │
│  [S0, S1, S2, S3, S4, S5]    [S0, S1, S2, S3, S4, S5]       │
│              ▲                               ▲               │
│       index = 4                        index = 6            │
│                                                              │
│  canUndo() = historyIndex > 0                               │
│  canRedo() = historyIndex < history.length - 1              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 레이어 상태

```
┌─────────────────────────────────────────────────────────────┐
│                     LAYER HIERARCHY                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Rendering Order (Bottom to Top):                           │
│                                                              │
│  6. overlay ─────────── 전면 장식 레이어                      │
│  5. texts ───────────── 텍스트 필드                          │
│  4. dynamicShapes ───── 동적 도형                            │
│  3. stickers ────────── 스티커 (Sprint 31)                   │
│  2. slots ───────────── 이미지 영역 (마스킹)                   │
│  1. background ──────── 배경 레이어                          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  layerStates[slotId] = {                                    │
│    visible: boolean,   // 렌더링 여부                        │
│    locked: boolean     // 편집 잠금 여부                      │
│  }                                                           │
│                                                              │
│  toggleLayerVisible() ──► visible = !visible                │
│  toggleLayerLocked() ──► locked = !locked                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 내보내기 상태

```
┌─────────────────────────────────────────────────────────────┐
│                     EXPORT STATE MACHINE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  IDLE ──► Click Export ──► MODAL_OPEN                       │
│                                   │                          │
│                                   ▼                          │
│                           ┌─────────────┐                   │
│                           │ FORMAT_SELECT│                   │
│                           │ • PNG        │                   │
│                           │ • JPG (92%)  │                   │
│                           │ • WebP (90%) │                   │
│                           └──────┬──────┘                   │
│                                   │                          │
│                                   ▼                          │
│                           ┌─────────────┐                   │
│                           │ SCALE_SELECT │                   │
│                           │ • 1x         │                   │
│                           │ • 2x         │                   │
│                           │ • 3x         │                   │
│                           └──────┬──────┘                   │
│                                   │ Click Export             │
│                                   ▼                          │
│                           ┌─────────────┐                   │
│                           │  EXPORTING  │                   │
│                           │ progress:   │                   │
│                           │ 0%→100%     │                   │
│                           └──────┬──────┘                   │
│                                   │                          │
│                          ┌────────┴────────┐                │
│                          │                 │                │
│                          ▼                 ▼                │
│                    ┌─────────┐       ┌─────────┐           │
│                    │ SUCCESS │       │  ERROR  │           │
│                    │ 다운로드  │       │ 재시도   │           │
│                    └─────────┘       └─────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 관련 파일
| 파일 | 역할 |
|------|------|
| `src/stores/canvasEditorStore.ts` | 메인 에디터 상태 |
| `src/stores/middleware/historyMiddleware.ts` | Undo/Redo 로직 |
| `src/stores/middleware/layerSlice.ts` | 레이어 관리 |
| `src/components/editor/canvas/CanvasEditor.tsx` | 메인 UI |

---

## 3. 구독 시스템 (Subscription)

### 티어 상태 머신

```
┌─────────────────────────────────────────────────────────────┐
│                   SUBSCRIPTION TIERS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    ┌──────────┐                             │
│                    │   FREE   │ (기본)                       │
│                    │ 제한적 기능│                             │
│                    └────┬─────┘                             │
│                         │                                    │
│     ┌───────────────────┼───────────────────┐               │
│     │                   │                   │               │
│     ▼                   ▼                   ▼               │
│  startTrial()    subscribe()         subscribe()            │
│     │            'premium'           'duo'/'creator'        │
│     │                   │                   │               │
│     ▼                   ▼                   ▼               │
│ ┌────────┐       ┌──────────┐       ┌──────────┐           │
│ │ TRIAL  │       │ PREMIUM  │       │   DUO    │           │
│ │ 7일    │       │ ₩4,900   │       │ 파트너 연결│           │
│ └───┬────┘       └────┬─────┘       └────┬─────┘           │
│     │                 │                   │                 │
│     │ [만료]          │ [만료/취소]         │ [만료/취소]      │
│     │                 │                   │                 │
│     └─────────────────┴───────────────────┘                │
│                         │                                    │
│                         ▼                                    │
│                    ┌──────────┐                             │
│                    │   FREE   │                             │
│                    └──────────┘                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 티어별 제한

```
┌─────────────────────────────────────────────────────────────┐
│                    TIER LIMITS                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Feature        │ Free  │ Premium │ Creator │ Duo           │
│  ──────────────────────────────────────────────────────────│
│  exports/월     │   5   │   ∞     │   ∞     │  ∞            │
│  downloads/월   │   5   │   ∞     │   ∞     │  ∞            │
│  저장 작업물     │   3   │   ∞     │   ∞     │  ∞            │
│  워터마크       │  Yes  │   No    │   No    │  No           │
│  고해상도       │  No   │   Yes   │   Yes   │  Yes          │
│  PSD 업로드     │  No   │   Yes   │   Yes   │  Yes          │
│  틀 판매        │  No   │   No    │   Yes   │  No           │
│  듀오 크레딧    │   0   │    0    │    0    │  5/월         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 사용량 추적 상태

```
┌─────────────────────────────────────────────────────────────┐
│                  USAGE TRACKING                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  increment*() 호출 시:                                       │
│                                                              │
│  ┌─────────────────┐                                        │
│  │ 월 변경 확인    │                                        │
│  │ lastResetDate   │                                        │
│  │ !== currentMonth│                                        │
│  └────────┬────────┘                                        │
│           │ Yes                                              │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │resetMonthlyUsage│                                        │
│  │• exports = 0    │                                        │
│  │• downloads = 0  │                                        │
│  │• Duo: +5 credit│                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │ 제한 확인       │ ──► │ usage < limit?  │               │
│  └─────────────────┘     └────────┬────────┘               │
│                                   │                          │
│                    ┌──────────────┴──────────────┐          │
│                    │                             │          │
│                    ▼                             ▼          │
│              ┌──────────┐                 ┌──────────┐      │
│              │ SUCCESS  │                 │ REJECTED │      │
│              │ count++  │                 │ 제한 초과  │      │
│              └──────────┘                 └──────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 관련 파일
| 파일 | 역할 |
|------|------|
| `src/stores/subscriptionStore.ts` | 구독 상태 관리 |
| `src/app/(main)/premium/page.tsx` | 프리미엄 페이지 |

---

## 4. 마켓플레이스 (Marketplace)

### 구매 상태 머신

```
┌─────────────────────────────────────────────────────────────┐
│                   PURCHASE FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐                                            │
│  │ NO_PURCHASE │                                            │
│  └──────┬──────┘                                            │
│         │ purchaseTemplate(template)                        │
│         ▼                                                    │
│  ┌─────────────┐                                            │
│  │  PENDING    │                                            │
│  │ status:     │                                            │
│  │ 'pending'   │                                            │
│  └──────┬──────┘                                            │
│         │                                                    │
│    ┌────┴────┐                                              │
│    │         │                                              │
│    ▼         ▼                                              │
│ ┌──────┐  ┌──────┐                                         │
│ │SUCCESS│  │FAILED│                                         │
│ │'완료'  │  │'실패' │                                         │
│ └──────┘  └──────┘                                         │
│                                                              │
│  hasPurchased(templateId) ──► boolean                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 판매자 수익 상태

```
┌─────────────────────────────────────────────────────────────┐
│                   CREATOR EARNINGS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  recordSale(saleData)                                       │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────────────────────┐                   │
│  │ COMMISSION CALCULATION              │                   │
│  │ • amount = 원래 가격                 │                   │
│  │ • commission = amount × 20%         │                   │
│  │ • netAmount = amount × 80%          │                   │
│  └────────────────┬────────────────────┘                   │
│                   │                                          │
│                   ▼                                          │
│  ┌─────────────────────────────────────┐                   │
│  │ EARNINGS UPDATE                     │                   │
│  │ • totalEarnings += netAmount        │                   │
│  │ • pendingPayout += netAmount        │                   │
│  │ • thisMonthEarnings updated         │                   │
│  └────────────────┬────────────────────┘                   │
│                   │                                          │
│                   ▼                                          │
│  ┌─────────────────────────────────────┐                   │
│  │ PAYOUT REQUEST                      │                   │
│  │ requestPayout(amount, bankInfo)     │                   │
│  │ • pendingPayout -= amount           │                   │
│  │ • status: 'pending'                 │                   │
│  └─────────────────────────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 관련 파일
| 파일 | 역할 |
|------|------|
| `src/stores/marketplaceStore.ts` | 마켓플레이스 상태 |
| `src/app/(main)/my/creator/page.tsx` | 크리에이터 대시보드 |

---

## 5. 협업 시스템 (Collaboration)

### 연결 상태 머신

```
┌─────────────────────────────────────────────────────────────┐
│                   CONNECTION STATES                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    ┌──────────────┐                         │
│                    │ DISCONNECTED │                         │
│                    │ (초기 상태)   │                         │
│                    └──────┬───────┘                         │
│                           │ connect()                        │
│                           ▼                                  │
│                    ┌──────────────┐                         │
│                    │  CONNECTING  │                         │
│                    │ (연결 시도 중) │                         │
│                    └──────┬───────┘                         │
│                           │                                  │
│              ┌────────────┴────────────┐                    │
│              │                         │                    │
│              ▼                         ▼                    │
│       ┌──────────────┐         ┌──────────────┐            │
│       │  CONNECTED   │         │    ERROR     │            │
│       │ isConnected  │         │ 연결 실패     │            │
│       │ = true       │         └──────┬───────┘            │
│       └──────┬───────┘                │                     │
│              │                        │ retry (max 5회)     │
│              │ [연결 끊김]             │                     │
│              ▼                        ▼                     │
│       ┌──────────────┐         ┌──────────────┐            │
│       │ RECONNECTING │ ◄───────│ RECONNECTING │            │
│       │ 재연결 시도    │         │ exponential  │            │
│       │ countdown    │         │ backoff      │            │
│       └──────────────┘         └──────────────┘            │
│                                                              │
│  Connection Status Colors:                                  │
│  • connected     = 🟢 Green                                │
│  • connecting    = 🟡 Amber                                │
│  • reconnecting  = 🟡 Amber (with countdown)               │
│  • disconnected  = 🔴 Red                                  │
│  • offline       = ⚫ Gray                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 세션 상태

```
┌─────────────────────────────────────────────────────────────┐
│                   SESSION LIFECYCLE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Host: createSession()                                      │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐                                            │
│  │  WAITING    │ ◄──── 초대 코드 생성 (PAIR-XXXXXX)         │
│  │ 참가자 대기  │                                            │
│  └──────┬──────┘                                            │
│         │ Guest joins                                        │
│         ▼                                                    │
│  ┌─────────────┐                                            │
│  │   ACTIVE    │ ◄──── 실시간 협업 진행                      │
│  │ participants│       • 커서 동기화 (50ms throttle)         │
│  │ syncing     │       • 선택 상태 공유                      │
│  └──────┬──────┘       • 편집 동기화                         │
│         │                                                    │
│    ┌────┴────┐                                              │
│    │         │                                              │
│    ▼         ▼                                              │
│ ┌──────┐  ┌──────┐                                         │
│ │COMPLT│  │EXPIRED│                                         │
│ │ 완료  │  │ 만료   │                                         │
│ └──────┘  └──────┘                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 관련 파일
| 파일 | 역할 |
|------|------|
| `src/hooks/useCollabSession.ts` | 세션 관리 |
| `src/hooks/useReconnect.ts` | 재연결 로직 |
| `src/components/editor/collab/ConnectionIndicator.tsx` | 연결 상태 UI |

---

## 6. 에디터 진입 플로우 (Editor Entry)

### 진입 단계 상태

```
┌─────────────────────────────────────────────────────────────┐
│                   EDITOR ENTRY FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Progress: ████░░░░░░░░░░ 33%                               │
│                                                              │
│  STEP 1                STEP 2                STEP 3         │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │ MODE_SELECT │ ──►  │ TEMPLATE_   │ ──►  │ TITLE_INPUT │ │
│  │             │      │ SELECT      │      │             │ │
│  │ • solo      │      │             │      │ 제목 입력    │ │
│  │ • duo       │      │ 틀 선택      │      │             │ │
│  └──────┬──────┘      └──────┬──────┘      └──────┬──────┘ │
│         │                    │                    │         │
│         │ selectMode()       │ selectTemplate()   │ confirm │
│         │                    │                    │         │
│  ┌──────┴──────────────────────────────────────────┴──────┐│
│  │                    VALIDATION GATES                     ││
│  │                                                         ││
│  │  goNext() from STEP 1: mode 필수                        ││
│  │  goNext() from STEP 2: template 필수                    ││
│  │  goNext() from STEP 3: title.trim().length > 0         ││
│  │                                                         ││
│  │  goToStep('template-select'): mode 없으면 ERROR        ││
│  │  goToStep('title-input'): template 없으면 ERROR        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   EDITOR READY                          ││
│  │  • mode: 'solo' | 'duo'                                 ││
│  │  • template: SelectedTemplate                           ││
│  │  • title: string                                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 관련 파일
| 파일 | 역할 |
|------|------|
| `src/stores/editorEntryStore.ts` | 진입 플로우 상태 |
| `src/types/editor-entry.ts` | 타입 정의 |

---

## 7. 게이미피케이션 (Gamification)

### 레벨 & XP 상태

```
┌─────────────────────────────────────────────────────────────┐
│                   LEVEL PROGRESSION                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Level │  XP Required  │  Name                              │
│  ──────────────────────────────────────────────────────────│
│    0   │       0       │  새싹 크리에이터                    │
│    1   │     100       │  호기심 탐험가                      │
│    2   │     300       │  열정의 화가                        │
│    3   │     600       │  성장하는 아티스트                   │
│    4   │   1,000       │  빛나는 재능                        │
│    5   │   1,500       │  스타 크리에이터                     │
│    6   │   2,200       │  마스터 아티스트                     │
│    7   │   3,000       │  전설의 화가                        │
│    8   │   4,000       │  궁극의 창조자                       │
│    9   │   5,200       │  신화적 존재                        │
│   10   │   6,500       │  우주의 예술가                       │
│   11   │   8,000       │  차원을 넘는 자                      │
│   12   │  10,000       │  무한의 창조자                       │
│                                                              │
│  addXP(amount) ──► Check thresholds ──► Update level       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 출석 체크 상태

```
┌─────────────────────────────────────────────────────────────┐
│                   DAILY CHECK-IN                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    CHECK-IN STATE                       ││
│  │                                                         ││
│  │  lastCheckIn: '2026-01-09'                             ││
│  │  currentStreak: 5                                      ││
│  │  longestStreak: 12                                     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  checkIn() 호출 시:                                         │
│                                                              │
│  ┌───────────────┐                                         │
│  │ 오늘 체크인?   │                                         │
│  │ lastCheckIn   │                                         │
│  │ === today?    │                                         │
│  └───────┬───────┘                                         │
│          │                                                  │
│     ┌────┴────┐                                            │
│     │         │                                            │
│     ▼         ▼                                            │
│   [Yes]     [No]                                           │
│     │         │                                            │
│     ▼         ▼                                            │
│  BLOCKED   ┌────────────┐                                  │
│  (null)    │ 어제 체크인?│                                  │
│            └─────┬──────┘                                  │
│           ┌──────┴──────┐                                  │
│           │             │                                  │
│           ▼             ▼                                  │
│         [Yes]         [No]                                 │
│           │             │                                  │
│           ▼             ▼                                  │
│     STREAK++      STREAK = 1                               │
│           │             │                                  │
│           └─────────────┘                                  │
│                  │                                          │
│                  ▼                                          │
│           ┌────────────┐                                   │
│           │ REWARD XP  │                                   │
│           │ Day 1: 10  │                                   │
│           │ Day 2: 15  │                                   │
│           │ Day 3: 20  │                                   │
│           │ Day 4: 30  │                                   │
│           │ Day 5: 40  │                                   │
│           │ Day 6: 50  │                                   │
│           │ Day 7: 100 │ (7일 주기 반복)                    │
│           └────────────┘                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 배지 해금 상태

```
┌─────────────────────────────────────────────────────────────┐
│                   BADGE UNLOCK CONDITIONS                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Badge ID        │ Condition                                │
│  ──────────────────────────────────────────────────────────│
│  firstSteps      │ totalWorks >= 1                         │
│  explorer        │ totalViews >= 10                        │
│  collector       │ totalDownloads >= 10                    │
│  socialite       │ totalFollowers >= 10                    │
│  risingCreator   │ totalUploads >= 1                       │
│  trendSetter     │ totalLikes >= 50                        │
│  legend          │ (특별 조건)                              │
│                                                              │
│  checkBadgeEligibility() ──► 조건 확인 ──► 자동 해금        │
│                                     │                       │
│                                     ▼                       │
│                              recentBadge = badge            │
│                              (알림 표시용)                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 관련 파일
| 파일 | 역할 |
|------|------|
| `src/stores/gamificationStore.ts` | 게이미피케이션 상태 |

---

## 공통 패턴

### 1. Zustand 미들웨어 패턴

```typescript
// 히스토리 미들웨어
const historyMiddleware = (set, get) => ({
  history: [],
  historyIndex: -1,
  pushHistory: () => { /* 스냅샷 추가 */ },
  undo: () => { /* 이전 상태 복원 */ },
  redo: () => { /* 다음 상태 복원 */ },
})

// 레이어 슬라이스
const layerSlice = (set, get) => ({
  layerStates: {},
  setLayerVisible: (id, visible) => { /* ... */ },
  toggleLayerLocked: (id) => { /* ... */ },
})
```

### 2. 상태 지속성 패턴

```typescript
persist(
  (set, get) => ({ /* store */ }),
  {
    name: 'store-name',
    partialize: (state) => ({
      // 지속할 상태만 선택
      formData: state.formData,
      colors: state.colors,
      // UI 상태 제외
      // selectedSlotId: EXCLUDED
    }),
  }
)
```

### 3. 상호 배타적 선택 패턴

```typescript
selectSlot: (id) => set({
  selectedSlotId: id,
  selectedTextId: null,      // 다른 선택 해제
  selectedStickerId: null,   // 다른 선택 해제
})
```

### 4. 월별 자동 리셋 패턴

```typescript
const checkAndResetMonthly = () => {
  const currentMonth = new Date().toISOString().slice(0, 7)
  if (state.lastResetDate !== currentMonth) {
    // 월별 카운터 리셋
    set({
      exportsThisMonth: 0,
      downloadsThisMonth: 0,
      lastResetDate: currentMonth,
    })
  }
}
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-10 | 초기 문서 생성 (Ultrathink 분석) |

---

*이 문서는 코드 변경에 따라 업데이트되어야 합니다.*
