'use client'

/**
 * 레이어 슬라이스
 * 변경 이유: canvasEditorStore에서 분리하여 레이어 관련 로직 응집도 향상
 */

// ============================================
// 레이어 상태 타입
// ============================================

export interface LayerState {
  visible: boolean
  locked: boolean
}

export interface LayerStates {
  [slotId: string]: LayerState
}

export interface LayerSliceState {
  layerStates: LayerStates
}

export interface LayerSliceActions {
  setLayerVisible: (slotId: string, visible: boolean) => void
  setLayerLocked: (slotId: string, locked: boolean) => void
  toggleLayerVisible: (slotId: string) => void
  toggleLayerLocked: (slotId: string) => void
  getLayerState: (slotId: string) => LayerState
}

// ============================================
// 기본값
// ============================================

export const defaultLayerState: LayerState = {
  visible: true,
  locked: false,
}

export const initialLayerSliceState: LayerSliceState = {
  layerStates: {},
}

// ============================================
// 레이어 액션 생성자
// ============================================

export function createLayerActions<T extends LayerSliceState>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  get: () => T
): LayerSliceActions {
  return {
    setLayerVisible: (slotId, visible) => {
      set((state) => ({
        layerStates: {
          ...state.layerStates,
          [slotId]: {
            ...(state.layerStates[slotId] || defaultLayerState),
            visible,
          },
        },
      }) as Partial<T>)
    },

    setLayerLocked: (slotId, locked) => {
      set((state) => ({
        layerStates: {
          ...state.layerStates,
          [slotId]: {
            ...(state.layerStates[slotId] || defaultLayerState),
            locked,
          },
        },
      }) as Partial<T>)
    },

    toggleLayerVisible: (slotId) => {
      const state = get()
      const current = state.layerStates[slotId] || defaultLayerState
      set({
        layerStates: {
          ...state.layerStates,
          [slotId]: { ...current, visible: !current.visible },
        },
      } as Partial<T>)
    },

    toggleLayerLocked: (slotId) => {
      const state = get()
      const current = state.layerStates[slotId] || defaultLayerState
      set({
        layerStates: {
          ...state.layerStates,
          [slotId]: { ...current, locked: !current.locked },
        },
      } as Partial<T>)
    },

    getLayerState: (slotId) => {
      const state = get()
      return state.layerStates[slotId] || defaultLayerState
    },
  }
}
