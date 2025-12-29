'use client'

import { create } from 'zustand'
import { subscribeWithSelector, persist } from 'zustand/middleware'
import type {
  TemplateConfig,
  FormData,
  ImageData,
  ColorData,
  ColorReference,
} from '@/types/template'

// ============================================
// 상태 타입
// ============================================

/** 슬롯 내 이미지 변환 상태 (드래그/줌/회전) */
interface SlotImageTransform {
  x: number // -1 ~ 1 (중앙 = 0)
  y: number // -1 ~ 1 (중앙 = 0)
  scale: number // 1 = 원본
  rotation: number // 도 단위
}

/** 슬롯별 이미지 변환 데이터 */
interface SlotTransforms {
  [slotId: string]: SlotImageTransform
}

/** 레이어 상태 (표시/잠금) */
interface LayerState {
  visible: boolean
  locked: boolean
}

interface LayerStates {
  [slotId: string]: LayerState
}

interface CanvasEditorState {
  // 템플릿 설정
  templateConfig: TemplateConfig | null
  isLoading: boolean
  error: string | null

  // 사용자 입력 데이터
  formData: FormData
  images: ImageData
  colors: ColorData

  // 슬롯 내 이미지 변환 상태 (드래그/줌)
  slotTransforms: SlotTransforms

  // 레이어 상태 (표시/잠금)
  layerStates: LayerStates

  // UI 상태
  selectedSlotId: string | null
  selectedTextId: string | null
  zoom: number

  // 저장 상태
  isDirty: boolean
  lastSavedAt: Date | null

  // 히스토리
  history: Array<{ formData: FormData; images: ImageData; colors: ColorData; slotTransforms: SlotTransforms }>
  historyIndex: number
}

interface CanvasEditorActions {
  // 템플릿 로드
  loadTemplate: (config: TemplateConfig) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // 폼 데이터 업데이트
  updateFormField: (key: string, value: string) => void
  updateImage: (dataKey: string, url: string | null) => void
  updateColor: (colorKey: ColorReference, value: string) => void

  // 일괄 업데이트
  setFormData: (data: FormData) => void
  setImages: (data: ImageData) => void
  setColors: (data: ColorData) => void

  // 슬롯 이미지 변환 (드래그/줌/회전)
  updateSlotTransform: (slotId: string, transform: Partial<SlotImageTransform>) => void
  resetSlotTransform: (slotId: string) => void
  getSlotTransform: (slotId: string) => SlotImageTransform

  // UI 상태
  selectSlot: (slotId: string | null) => void
  selectText: (textId: string | null) => void
  setZoom: (zoom: number) => void

  // 히스토리
  pushHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  getHistoryInfo: () => { current: number; total: number; canUndo: number; canRedo: number }

  // 레이어 상태
  setLayerVisible: (slotId: string, visible: boolean) => void
  setLayerLocked: (slotId: string, locked: boolean) => void
  toggleLayerVisible: (slotId: string) => void
  toggleLayerLocked: (slotId: string) => void
  getLayerState: (slotId: string) => LayerState

  // 이미지 삭제
  removeImage: (dataKey: string) => void

  // 저장
  markDirty: () => void
  markSaved: () => void

  // 초기화
  reset: () => void

  // 내보내기용 데이터 가져오기
  getEditorData: () => {
    templateConfig: TemplateConfig | null
    formData: FormData
    images: ImageData
    colors: ColorData
    slotTransforms: SlotTransforms
  }
}

// 기본 슬롯 변환값
const defaultSlotTransform: SlotImageTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
}

// 기본 레이어 상태
const defaultLayerState: LayerState = {
  visible: true,
  locked: false,
}

// ============================================
// 초기 상태
// ============================================

const defaultColors: ColorData = {
  primaryColor: '#FFD9D9',
  secondaryColor: '#D7FAFA',
  accentColor: '#FF6B6B',
  textColor: '#3D3636',
}

const initialState: CanvasEditorState = {
  templateConfig: null,
  isLoading: false,
  error: null,

  formData: {},
  images: {},
  colors: defaultColors,
  slotTransforms: {},
  layerStates: {},

  selectedSlotId: null,
  selectedTextId: null,
  zoom: 1,

  isDirty: false,
  lastSavedAt: null,

  history: [],
  historyIndex: -1,
}

// ============================================
// 스토어 생성
// ============================================

export const useCanvasEditorStore = create<CanvasEditorState & CanvasEditorActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,

        // 템플릿 로드
        loadTemplate: (config) => {
          // 기본 색상 설정
          const colors: ColorData = {
            primaryColor: '#FFD9D9',
            secondaryColor: '#D7FAFA',
            accentColor: '#FF6B6B',
            textColor: '#3D3636',
          }

          // 템플릿의 기본 색상으로 덮어쓰기
          config.colors.forEach((c) => {
            if (c.key in colors) {
              colors[c.key] = c.defaultValue
            }
          })

          // 기본 폼 데이터 설정
          const formData: FormData = {}
          config.inputFields.forEach((field) => {
            if (field.defaultValue) {
              formData[field.key] = field.defaultValue
            }
          })

          // 레이어 상태 초기화
          const layerStates: LayerStates = {}
          config.layers.slots.forEach((slot) => {
            layerStates[slot.id] = { ...defaultLayerState }
          })

          set({
            templateConfig: config,
            colors,
            formData,
            images: {},
            slotTransforms: {},
            layerStates,
            selectedSlotId: config.layers.slots[0]?.id || null,
            selectedTextId: null,
            isDirty: false,
            history: [{ formData, images: {}, colors, slotTransforms: {} }],
            historyIndex: 0,
          })
        },

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),

        // 폼 데이터 업데이트
        updateFormField: (key, value) => {
          set((state) => ({
            formData: { ...state.formData, [key]: value },
            isDirty: true,
          }))
          get().pushHistory()
        },

        updateImage: (dataKey, url) => {
          set((state) => ({
            images: { ...state.images, [dataKey]: url },
            isDirty: true,
          }))
          get().pushHistory()
        },

        updateColor: (colorKey, value) => {
          set((state) => ({
            colors: { ...state.colors, [colorKey]: value },
            isDirty: true,
          }))
          get().pushHistory()
        },

        setFormData: (data) => set({ formData: data, isDirty: true }),
        setImages: (data) => set({ images: data, isDirty: true }),
        setColors: (data) => set({ colors: data, isDirty: true }),

        // 슬롯 이미지 변환 (드래그/줌/회전)
        updateSlotTransform: (slotId, transform) => {
          set((state) => ({
            slotTransforms: {
              ...state.slotTransforms,
              [slotId]: {
                ...(state.slotTransforms[slotId] || defaultSlotTransform),
                ...transform,
              },
            },
            isDirty: true,
          }))
          get().pushHistory()
        },

        resetSlotTransform: (slotId) => {
          set((state) => ({
            slotTransforms: {
              ...state.slotTransforms,
              [slotId]: { ...defaultSlotTransform },
            },
            isDirty: true,
          }))
          get().pushHistory()
        },

        getSlotTransform: (slotId) => {
          const state = get()
          return state.slotTransforms[slotId] || defaultSlotTransform
        },

        // UI 상태
        selectSlot: (slotId) => set({ selectedSlotId: slotId, selectedTextId: null }),
        selectText: (textId) => set({ selectedTextId: textId, selectedSlotId: null }),
        setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),

        // 히스토리 (중복 방지 로직 추가)
        pushHistory: () => {
          const state = get()
          const currentSnapshot = {
            formData: { ...state.formData },
            images: { ...state.images },
            colors: { ...state.colors },
            slotTransforms: { ...state.slotTransforms },
          }

          // 버그 수정: 이전 스냅샷과 동일하면 히스토리 추가하지 않음
          const lastSnapshot = state.history[state.historyIndex]
          if (lastSnapshot) {
            const isSameFormData = JSON.stringify(currentSnapshot.formData) === JSON.stringify(lastSnapshot.formData)
            const isSameImages = JSON.stringify(currentSnapshot.images) === JSON.stringify(lastSnapshot.images)
            const isSameColors = JSON.stringify(currentSnapshot.colors) === JSON.stringify(lastSnapshot.colors)
            const isSameTransforms = JSON.stringify(currentSnapshot.slotTransforms) === JSON.stringify(lastSnapshot.slotTransforms)

            if (isSameFormData && isSameImages && isSameColors && isSameTransforms) {
              return // 변경 없으면 히스토리 추가하지 않음
            }
          }

          // 현재 인덱스 이후의 히스토리는 삭제
          const newHistory = state.history.slice(0, state.historyIndex + 1)
          newHistory.push(currentSnapshot)

          // 버그 수정: 최대 50개 유지 시 인덱스도 함께 조정
          let newIndex = newHistory.length - 1
          if (newHistory.length > 50) {
            newHistory.shift()
            newIndex = newHistory.length - 1 // shift 후 인덱스 재계산
          }

          set({
            history: newHistory,
            historyIndex: newIndex,
          })
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
          })
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
          })
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

        // 레이어 상태
        setLayerVisible: (slotId, visible) => {
          set((state) => ({
            layerStates: {
              ...state.layerStates,
              [slotId]: {
                ...(state.layerStates[slotId] || defaultLayerState),
                visible,
              },
            },
          }))
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
          }))
        },

        toggleLayerVisible: (slotId) => {
          const state = get()
          const current = state.layerStates[slotId] || defaultLayerState
          set({
            layerStates: {
              ...state.layerStates,
              [slotId]: { ...current, visible: !current.visible },
            },
          })
        },

        toggleLayerLocked: (slotId) => {
          const state = get()
          const current = state.layerStates[slotId] || defaultLayerState
          set({
            layerStates: {
              ...state.layerStates,
              [slotId]: { ...current, locked: !current.locked },
            },
          })
        },

        getLayerState: (slotId) => {
          const state = get()
          return state.layerStates[slotId] || defaultLayerState
        },

        // 이미지 삭제
        removeImage: (dataKey) => {
          set((state) => {
            const newImages = { ...state.images }
            // blob URL 해제
            const existingUrl = newImages[dataKey]
            if (existingUrl && existingUrl.startsWith('blob:')) {
              URL.revokeObjectURL(existingUrl)
            }
            delete newImages[dataKey]
            return { images: newImages, isDirty: true }
          })
          get().pushHistory()
        },

        // 저장
        markDirty: () => set({ isDirty: true }),
        markSaved: () => set({ isDirty: false, lastSavedAt: new Date() }),

        // 초기화
        reset: () => set(initialState),

        // 내보내기용 데이터
        getEditorData: () => {
          const state = get()
          return {
            templateConfig: state.templateConfig,
            formData: state.formData,
            images: state.images,
            colors: state.colors,
            slotTransforms: state.slotTransforms,
          }
        },
      }),
      {
        name: 'pairy-canvas-editor',
        partialize: (state) => ({
          formData: state.formData,
          // 버그 수정: blob URL은 세션 종료 시 무효화되므로 제외
          // images: state.images,
          colors: state.colors,
          slotTransforms: state.slotTransforms,
        }),
      }
    )
  )
)

// 셀렉터 훅
export const useSelectedSlot = () => {
  return useCanvasEditorStore((state) => {
    if (!state.selectedSlotId || !state.templateConfig) return null
    return state.templateConfig.layers.slots.find((s) => s.id === state.selectedSlotId) || null
  })
}

export const useSelectedText = () => {
  return useCanvasEditorStore((state) => {
    if (!state.selectedTextId || !state.templateConfig) return null
    return state.templateConfig.layers.texts.find((t) => t.id === state.selectedTextId) || null
  })
}
