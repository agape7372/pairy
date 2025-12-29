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

interface CanvasEditorState {
  // 템플릿 설정
  templateConfig: TemplateConfig | null
  isLoading: boolean
  error: string | null

  // 사용자 입력 데이터
  formData: FormData
  images: ImageData
  colors: ColorData

  // UI 상태
  selectedSlotId: string | null
  selectedTextId: string | null
  zoom: number

  // 저장 상태
  isDirty: boolean
  lastSavedAt: Date | null

  // 히스토리
  history: Array<{ formData: FormData; images: ImageData; colors: ColorData }>
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
  }
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

          set({
            templateConfig: config,
            colors,
            formData,
            images: {},
            selectedSlotId: config.layers.slots[0]?.id || null,
            selectedTextId: null,
            isDirty: false,
            history: [{ formData, images: {}, colors }],
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

        // UI 상태
        selectSlot: (slotId) => set({ selectedSlotId: slotId, selectedTextId: null }),
        selectText: (textId) => set({ selectedTextId: textId, selectedSlotId: null }),
        setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),

        // 히스토리
        pushHistory: () => {
          const state = get()
          const currentSnapshot = {
            formData: { ...state.formData },
            images: { ...state.images },
            colors: { ...state.colors },
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
            historyIndex: newIndex,
            isDirty: true,
          })
        },

        canUndo: () => get().historyIndex > 0,
        canRedo: () => get().historyIndex < get().history.length - 1,

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
          }
        },
      }),
      {
        name: 'pairy-canvas-editor',
        partialize: (state) => ({
          formData: state.formData,
          images: state.images,
          colors: state.colors,
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
