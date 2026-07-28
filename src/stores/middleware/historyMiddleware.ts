'use client'

/**
 * 히스토리 미들웨어
 * 변경 이유: canvasEditorStore에서 분리하여 단일 책임 원칙 준수 및 재사용성 향상
 */

import type {
  TemplateConfig,
  FormData,
  ImageData,
  ColorData,
  SlotTransforms,
} from '@/types/template'

// ============================================
// 히스토리 스냅샷 타입
// ============================================

export interface HistorySnapshot {
  templateConfig: TemplateConfig | null
  formData: FormData
  images: ImageData
  colors: ColorData
  slotTransforms: SlotTransforms
}

export interface HistoryState {
  history: HistorySnapshot[]
  historyIndex: number
  hasPendingHistory: boolean
}

export interface HistoryActions {
  pushHistory: () => void
  scheduleHistory: (group?: string, delay?: number) => void
  flushHistory: () => void
  cancelScheduledHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  getHistoryInfo: () => {
    current: number
    total: number
    canUndo: number
    canRedo: number
  }
}

// ============================================
// 초기 상태
// ============================================

export const initialHistoryState: HistoryState = {
  history: [],
  historyIndex: -1,
  hasPendingHistory: false,
}

// ============================================
// 히스토리 유틸리티 함수
// ============================================

const MAX_HISTORY_SIZE = 50
export const HISTORY_COMMIT_DELAY_MS = 300

/**
 * 객체의 얕은 비교 (1단계 깊이)
 * 성능 최적화: JSON.stringify 대신 키-값 직접 비교
 */
function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  if (a === b) return true

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    // 값이 객체인 경우 참조 비교, 아닌 경우 값 비교
    if (a[key] !== b[key]) {
      // 중첩 객체는 JSON 비교 (슬롯 변환 등)
      if (
        typeof a[key] === 'object' &&
        a[key] !== null &&
        typeof b[key] === 'object' &&
        b[key] !== null
      ) {
        if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
          return false
        }
      } else {
        return false
      }
    }
  }

  return true
}

/**
 * 불변 업데이트된 JSON형 값을 참조 단축으로 비교한다.
 * 대부분의 템플릿 하위 트리는 같은 참조를 유지하므로, JSON 직렬화 없이
 * 실제로 바뀐 텍스트/스티커 경로만 재귀적으로 확인할 수 있다.
 */
function immutableDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true

  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((value, index) => immutableDeepEqual(value, b[index]))
    )
  }

  if (
    typeof a === 'object' &&
    a !== null &&
    typeof b === 'object' &&
    b !== null
  ) {
    const recordA = a as Record<string, unknown>
    const recordB = b as Record<string, unknown>
    const keysA = Object.keys(recordA)
    const keysB = Object.keys(recordB)

    return (
      keysA.length === keysB.length &&
      keysA.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(recordB, key) &&
          immutableDeepEqual(recordA[key], recordB[key])
      )
    )
  }

  return false
}

/**
 * 두 스냅샷이 동일한지 비교
 * 최적화: 참조 동일성 먼저 체크 후 얕은 비교 수행
 */
export function areSnapshotsEqual(a: HistorySnapshot, b: HistorySnapshot): boolean {
  // 빠른 참조 비교
  if (a === b) return true
  if (a.templateConfig === b.templateConfig &&
      a.formData === b.formData &&
      a.images === b.images &&
      a.colors === b.colors &&
      a.slotTransforms === b.slotTransforms) {
    return true
  }

  // 참조가 달라도 24→40→24처럼 기준값으로 돌아온 편집은 같은 상태다.
  // 불변 구조의 공유 참조를 활용해 바뀐 경로만 비교한다.
  if (!immutableDeepEqual(a.templateConfig, b.templateConfig)) return false

  // 얕은 비교 수행
  return (
    shallowEqual(a.formData, b.formData) &&
    shallowEqual(a.images, b.images) &&
    shallowEqual(a.colors, b.colors) &&
    shallowEqual(a.slotTransforms, b.slotTransforms)
  )
}

/**
 * 현재 상태에서 스냅샷 생성
 */
export function createSnapshot(state: {
  templateConfig: TemplateConfig | null
  formData: FormData
  images: ImageData
  colors: ColorData
  slotTransforms: SlotTransforms
}): HistorySnapshot {
  return {
    templateConfig: state.templateConfig,
    formData: { ...state.formData },
    images: { ...state.images },
    colors: { ...state.colors },
    slotTransforms: { ...state.slotTransforms },
  }
}

/**
 * 히스토리에 스냅샷 추가
 * @returns 새로운 히스토리 상태
 */
export function pushSnapshot(
  currentHistory: HistorySnapshot[],
  currentIndex: number,
  snapshot: HistorySnapshot
): Pick<HistoryState, 'history' | 'historyIndex'> {
  // 이전 스냅샷과 동일하면 추가하지 않음
  const lastSnapshot = currentHistory[currentIndex]
  if (lastSnapshot && areSnapshotsEqual(snapshot, lastSnapshot)) {
    return { history: currentHistory, historyIndex: currentIndex }
  }

  // 현재 인덱스 이후의 히스토리는 삭제
  const newHistory = currentHistory.slice(0, currentIndex + 1)
  newHistory.push(snapshot)

  // 최대 크기 유지
  let newIndex = newHistory.length - 1
  if (newHistory.length > MAX_HISTORY_SIZE) {
    newHistory.shift()
    newIndex = newHistory.length - 1
  }

  return { history: newHistory, historyIndex: newIndex }
}

/**
 * 히스토리 액션 생성자
 */
export function createHistoryActions<T extends HistoryState & {
  templateConfig: TemplateConfig | null
  formData: FormData
  images: ImageData
  colors: ColorData
  slotTransforms: SlotTransforms
  isDirty: boolean
}>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  get: () => T,
  onHistoryReplaced?: (
    previousHistory: HistorySnapshot[],
    nextHistory: HistorySnapshot[]
  ) => void
): HistoryActions {
  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  let pendingSnapshot: HistorySnapshot | null = null
  let pendingGroup: string | null = null

  const clearPendingTimer = () => {
    if (pendingTimer) {
      clearTimeout(pendingTimer)
      pendingTimer = null
    }
  }

  const commitSnapshot = (snapshot: HistorySnapshot) => {
    const state = get()
    const next = pushSnapshot(state.history, state.historyIndex, snapshot)
    if (next.history === state.history && next.historyIndex === state.historyIndex) {
      return
    }
    set(next as Partial<T>)
    onHistoryReplaced?.(state.history, next.history)
  }

  const cancelPending = () => {
    clearPendingTimer()
    pendingSnapshot = null
    pendingGroup = null
    if (get().hasPendingHistory) {
      set({ hasPendingHistory: false } as Partial<T>)
    }
  }

  const flushPending = () => {
    const snapshot = pendingSnapshot
    cancelPending()
    if (snapshot) {
      commitSnapshot(snapshot)
    }
  }

  return {
    pushHistory: () => {
      // 대기 중인 연속 입력과 즉시 액션의 Undo 경계를 보존한다.
      flushPending()
      commitSnapshot(createSnapshot(get()))
    },

    scheduleHistory: (group = 'default', delay = HISTORY_COMMIT_DELAY_MS) => {
      const snapshot = createSnapshot(get())

      // 다른 필드/슬라이더로 이동하면 앞선 입력 묶음을 별도 단계로 확정한다.
      if (pendingSnapshot && pendingGroup !== group) {
        flushPending()
      }

      const state = get()
      const currentSnapshot = state.history[state.historyIndex]
      if (currentSnapshot && areSnapshotsEqual(snapshot, currentSnapshot)) {
        // 사용자가 연속 입력 중 원래 값으로 되돌아온 경우, 이전의 stale
        // pending snapshot이 나중에 커밋되지 않도록 함께 취소한다.
        cancelPending()
        return
      }

      pendingSnapshot = snapshot
      pendingGroup = group
      clearPendingTimer()
      if (!get().hasPendingHistory) {
        set({ hasPendingHistory: true } as Partial<T>)
      }
      pendingTimer = setTimeout(() => {
        flushPending()
      }, Math.max(0, delay))
    },

    flushHistory: () => {
      flushPending()
    },

    cancelScheduledHistory: () => {
      cancelPending()
    },

    undo: () => {
      flushPending()
      const state = get()
      if (state.historyIndex <= 0) return

      const newIndex = state.historyIndex - 1
      const snapshot = state.history[newIndex]

      set({
        templateConfig: snapshot.templateConfig,
        formData: snapshot.formData,
        images: snapshot.images,
        colors: snapshot.colors,
        slotTransforms: snapshot.slotTransforms || {},
        historyIndex: newIndex,
        isDirty: true,
      } as Partial<T>)
    },

    redo: () => {
      flushPending()
      const state = get()
      if (state.historyIndex >= state.history.length - 1) return

      const newIndex = state.historyIndex + 1
      const snapshot = state.history[newIndex]

      set({
        templateConfig: snapshot.templateConfig,
        formData: snapshot.formData,
        images: snapshot.images,
        colors: snapshot.colors,
        slotTransforms: snapshot.slotTransforms || {},
        historyIndex: newIndex,
        isDirty: true,
      } as Partial<T>)
    },

    canUndo: () => get().hasPendingHistory || get().historyIndex > 0,
    canRedo: () =>
      !get().hasPendingHistory && get().historyIndex < get().history.length - 1,

    getHistoryInfo: () => {
      const state = get()
      const pendingCount = state.hasPendingHistory ? 1 : 0
      return {
        current: state.historyIndex + 1 + pendingCount,
        total: state.history.length + pendingCount,
        canUndo: state.historyIndex + pendingCount,
        canRedo: state.hasPendingHistory
          ? 0
          : state.history.length - 1 - state.historyIndex,
      }
    },
  }
}
