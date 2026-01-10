'use client'

/**
 * 히스토리 미들웨어
 * 변경 이유: canvasEditorStore에서 분리하여 단일 책임 원칙 준수 및 재사용성 향상
 */

import type { FormData, ImageData, ColorData, SlotTransforms } from '@/types/template'

// ============================================
// 히스토리 스냅샷 타입
// ============================================

export interface HistorySnapshot {
  formData: FormData
  images: ImageData
  colors: ColorData
  slotTransforms: SlotTransforms
}

export interface HistoryState {
  history: HistorySnapshot[]
  historyIndex: number
}

export interface HistoryActions {
  pushHistory: () => void
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
}

// ============================================
// 히스토리 유틸리티 함수
// ============================================

const MAX_HISTORY_SIZE = 50

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
 * 두 스냅샷이 동일한지 비교
 * 최적화: 참조 동일성 먼저 체크 후 얕은 비교 수행
 */
export function areSnapshotsEqual(a: HistorySnapshot, b: HistorySnapshot): boolean {
  // 빠른 참조 비교
  if (a === b) return true
  if (a.formData === b.formData &&
      a.images === b.images &&
      a.colors === b.colors &&
      a.slotTransforms === b.slotTransforms) {
    return true
  }

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
  formData: FormData
  images: ImageData
  colors: ColorData
  slotTransforms: SlotTransforms
}): HistorySnapshot {
  return {
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
): HistoryState {
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
  formData: FormData
  images: ImageData
  colors: ColorData
  slotTransforms: SlotTransforms
  isDirty: boolean
}>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  get: () => T
): HistoryActions {
  return {
    pushHistory: () => {
      const state = get()
      const snapshot = createSnapshot(state)
      const { history, historyIndex } = pushSnapshot(
        state.history,
        state.historyIndex,
        snapshot
      )
      set({ history, historyIndex } as Partial<T>)
    },

    undo: () => {
      const state = get()
      if (state.historyIndex <= 0) return

      const newIndex = state.historyIndex - 1
      const snapshot = state.history[newIndex]

      set({
        formData: snapshot.formData,
        images: snapshot.images,
        colors: snapshot.colors,
        slotTransforms: snapshot.slotTransforms || {},
        historyIndex: newIndex,
        isDirty: true,
      } as Partial<T>)
    },

    redo: () => {
      const state = get()
      if (state.historyIndex >= state.history.length - 1) return

      const newIndex = state.historyIndex + 1
      const snapshot = state.history[newIndex]

      set({
        formData: snapshot.formData,
        images: snapshot.images,
        colors: snapshot.colors,
        slotTransforms: snapshot.slotTransforms || {},
        historyIndex: newIndex,
        isDirty: true,
      } as Partial<T>)
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    getHistoryInfo: () => {
      const state = get()
      return {
        current: state.historyIndex + 1,
        total: state.history.length,
        canUndo: state.historyIndex,
        canRedo: state.history.length - 1 - state.historyIndex,
      }
    },
  }
}
