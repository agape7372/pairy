'use client'

/**
 * 캔버스 에디터 스토어
 * 변경 이유: 히스토리/레이어 로직을 분리하여 단일 책임 원칙 준수
 */

import { create } from 'zustand'
import { subscribeWithSelector, persist } from 'zustand/middleware'
import type {
  TemplateConfig,
  FormData,
  ImageData,
  ColorData,
  ColorReference,
  SlotImageTransform,
  SlotTransforms,
  ImageFilters,
  TextEffects,
  TextStyle,
  StickerLayer,
} from '@/types/template'
import { DEFAULT_SLOT_TRANSFORM } from '@/types/template'
import {
  type HistorySnapshot,
  type HistoryState,
  type HistoryActions,
  type LayerStates,
  type LayerSliceState,
  type LayerSliceActions,
  initialHistoryState,
  createHistoryActions,
  defaultLayerState,
  createLayerActions,
} from './middleware'

// ============================================
// 상태 타입
// ============================================

interface CanvasEditorState extends HistoryState, LayerSliceState {
  // 템플릿 설정
  templateConfig: TemplateConfig | null
  isLoading: boolean
  error: string | null

  // 사용자 입력 데이터
  formData: FormData
  images: ImageData
  colors: ColorData

  // 슬롯 내 이미지 변환 상태
  slotTransforms: SlotTransforms

  // UI 상태
  selectedSlotId: string | null
  selectedTextId: string | null
  selectedStickerId: string | null // Sprint 31
  zoom: number

  // 저장 상태
  isDirty: boolean
  lastSavedAt: Date | null
}

interface CanvasEditorActions extends HistoryActions, LayerSliceActions {
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

  // 슬롯 이미지 변환
  updateSlotTransform: (slotId: string, transform: Partial<SlotImageTransform>) => void
  resetSlotTransform: (slotId: string) => void
  getSlotTransform: (slotId: string) => SlotImageTransform

  // Sprint 29: 이미지 편집 강화
  toggleFlipX: (slotId: string) => void
  toggleFlipY: (slotId: string) => void
  setImageOpacity: (slotId: string, opacity: number) => void
  setImageFilters: (slotId: string, filters: ImageFilters) => void

  // Sprint 30: 텍스트 편집 고도화
  updateTextEffects: (textId: string, effects: Partial<TextEffects>) => void
  updateTextStyle: (textId: string, style: Partial<TextStyle>) => void
  clearTextEffects: (textId: string) => void

  // Sprint 31: 스티커 시스템
  addSticker: (sticker: StickerLayer) => void
  removeSticker: (stickerId: string) => void
  updateStickerTransform: (stickerId: string, transform: Partial<StickerLayer['transform']>) => void
  selectSticker: (stickerId: string | null) => void
  selectedStickerId: string | null

  // UI 상태
  selectSlot: (slotId: string | null) => void
  selectText: (textId: string | null) => void
  setZoom: (zoom: number) => void

  // 이미지 삭제
  removeImage: (dataKey: string) => void

  // 저장
  markDirty: () => void
  markSaved: () => void

  // 초기화
  reset: () => void

  // 내보내기용 데이터
  getEditorData: () => {
    templateConfig: TemplateConfig | null
    formData: FormData
    images: ImageData
    colors: ColorData
    slotTransforms: SlotTransforms
  }
}

// ============================================
// 기본값 (중복 제거)
// ============================================

const DEFAULT_COLORS: ColorData = {
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
  colors: { ...DEFAULT_COLORS },
  slotTransforms: {},

  selectedSlotId: null,
  selectedTextId: null,
  selectedStickerId: null, // Sprint 31
  zoom: 1,

  isDirty: false,
  lastSavedAt: null,

  ...initialHistoryState,
  layerStates: {},
}

// ============================================
// 스토어 생성
// ============================================

export const useCanvasEditorStore = create<CanvasEditorState & CanvasEditorActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,

        // 히스토리 액션 (미들웨어에서 생성)
        ...createHistoryActions(set, get),

        // 레이어 액션 (슬라이스에서 생성)
        ...createLayerActions(set, get),

        // 템플릿 로드
        loadTemplate: (config) => {
          // 템플릿의 기본 색상으로 초기화
          const colors: ColorData = { ...DEFAULT_COLORS }
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

          // 초기 히스토리 스냅샷 생성
          const initialSnapshot: HistorySnapshot = {
            formData,
            images: {},
            colors,
            slotTransforms: {},
          }

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
            history: [initialSnapshot],
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

        // 슬롯 이미지 변환
        updateSlotTransform: (slotId, transform) => {
          set((state) => ({
            slotTransforms: {
              ...state.slotTransforms,
              [slotId]: {
                ...(state.slotTransforms[slotId] || DEFAULT_SLOT_TRANSFORM),
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
              [slotId]: { ...DEFAULT_SLOT_TRANSFORM },
            },
            isDirty: true,
          }))
          get().pushHistory()
        },

        getSlotTransform: (slotId) => {
          return get().slotTransforms[slotId] || DEFAULT_SLOT_TRANSFORM
        },

        // Sprint 29: 이미지 편집 강화
        toggleFlipX: (slotId) => {
          set((state) => {
            const current = state.slotTransforms[slotId] || DEFAULT_SLOT_TRANSFORM
            return {
              slotTransforms: {
                ...state.slotTransforms,
                [slotId]: {
                  ...current,
                  flipX: !current.flipX,
                },
              },
              isDirty: true,
            }
          })
          get().pushHistory()
        },

        toggleFlipY: (slotId) => {
          set((state) => {
            const current = state.slotTransforms[slotId] || DEFAULT_SLOT_TRANSFORM
            return {
              slotTransforms: {
                ...state.slotTransforms,
                [slotId]: {
                  ...current,
                  flipY: !current.flipY,
                },
              },
              isDirty: true,
            }
          })
          get().pushHistory()
        },

        setImageOpacity: (slotId, opacity) => {
          set((state) => {
            const current = state.slotTransforms[slotId] || DEFAULT_SLOT_TRANSFORM
            return {
              slotTransforms: {
                ...state.slotTransforms,
                [slotId]: {
                  ...current,
                  opacity: Math.max(0, Math.min(1, opacity)),
                },
              },
              isDirty: true,
            }
          })
          get().pushHistory()
        },

        setImageFilters: (slotId, filters) => {
          set((state) => {
            const current = state.slotTransforms[slotId] || DEFAULT_SLOT_TRANSFORM
            return {
              slotTransforms: {
                ...state.slotTransforms,
                [slotId]: {
                  ...current,
                  filters: { ...current.filters, ...filters },
                },
              },
              isDirty: true,
            }
          })
          get().pushHistory()
        },

        // Sprint 30: 텍스트 편집 고도화
        updateTextEffects: (textId, effects) => {
          set((state) => {
            if (!state.templateConfig) return state
            const texts = state.templateConfig.layers.texts.map((text) => {
              if (text.id !== textId) return text
              return {
                ...text,
                effects: {
                  ...text.effects,
                  ...effects,
                },
              }
            })
            return {
              templateConfig: {
                ...state.templateConfig,
                layers: {
                  ...state.templateConfig.layers,
                  texts,
                },
              },
              isDirty: true,
            }
          })
          get().pushHistory()
        },

        updateTextStyle: (textId, style) => {
          set((state) => {
            if (!state.templateConfig) return state
            const texts = state.templateConfig.layers.texts.map((text) => {
              if (text.id !== textId) return text
              return {
                ...text,
                style: {
                  ...text.style,
                  ...style,
                },
              }
            })
            return {
              templateConfig: {
                ...state.templateConfig,
                layers: {
                  ...state.templateConfig.layers,
                  texts,
                },
              },
              isDirty: true,
            }
          })
          get().pushHistory()
        },

        clearTextEffects: (textId) => {
          set((state) => {
            if (!state.templateConfig) return state
            const texts = state.templateConfig.layers.texts.map((text) => {
              if (text.id !== textId) return text
              return {
                ...text,
                effects: undefined,
              }
            })
            return {
              templateConfig: {
                ...state.templateConfig,
                layers: {
                  ...state.templateConfig.layers,
                  texts,
                },
              },
              isDirty: true,
            }
          })
          get().pushHistory()
        },

        // Sprint 31: 스티커 시스템
        addSticker: (sticker) => {
          set((state) => {
            if (!state.templateConfig) return state
            const stickers = [...(state.templateConfig.layers.stickers || []), sticker]
            return {
              templateConfig: {
                ...state.templateConfig,
                layers: {
                  ...state.templateConfig.layers,
                  stickers,
                },
              },
              selectedStickerId: sticker.id,
              isDirty: true,
            }
          })
          get().pushHistory()
        },

        removeSticker: (stickerId) => {
          set((state) => {
            if (!state.templateConfig) return state
            const stickers = (state.templateConfig.layers.stickers || []).filter(
              (s) => s.id !== stickerId
            )
            return {
              templateConfig: {
                ...state.templateConfig,
                layers: {
                  ...state.templateConfig.layers,
                  stickers,
                },
              },
              selectedStickerId: state.selectedStickerId === stickerId ? null : state.selectedStickerId,
              isDirty: true,
            }
          })
          get().pushHistory()
        },

        updateStickerTransform: (stickerId, transform) => {
          set((state) => {
            if (!state.templateConfig) return state
            const stickers = (state.templateConfig.layers.stickers || []).map((sticker) => {
              if (sticker.id !== stickerId) return sticker
              return {
                ...sticker,
                transform: {
                  ...sticker.transform,
                  ...transform,
                },
              }
            })
            return {
              templateConfig: {
                ...state.templateConfig,
                layers: {
                  ...state.templateConfig.layers,
                  stickers,
                },
              },
              isDirty: true,
            }
          })
          get().pushHistory()
        },

        selectSticker: (stickerId) => set({
          selectedStickerId: stickerId,
          selectedSlotId: null,
          selectedTextId: null,
        }),

        // UI 상태
        selectSlot: (slotId) => set({ selectedSlotId: slotId, selectedTextId: null, selectedStickerId: null }),
        selectText: (textId) => set({ selectedTextId: textId, selectedSlotId: null, selectedStickerId: null }),
        setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),

        // 이미지 삭제
        removeImage: (dataKey) => {
          set((state) => {
            const newImages = { ...state.images }
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
          colors: state.colors,
          slotTransforms: state.slotTransforms,
        }),
      }
    )
  )
)

// ============================================
// 셀렉터 훅
// ============================================

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

// 변경 이유: 자주 사용되는 상태에 대한 최적화된 셀렉터 추가
export const useTemplateConfig = () => useCanvasEditorStore((state) => state.templateConfig)
export const useEditorColors = () => useCanvasEditorStore((state) => state.colors)
export const useEditorImages = () => useCanvasEditorStore((state) => state.images)
export const useEditorFormData = () => useCanvasEditorStore((state) => state.formData)
export const useEditorZoom = () => useCanvasEditorStore((state) => state.zoom)
export const useEditorDirty = () => useCanvasEditorStore((state) => state.isDirty)

// 타입 재익스포트
export type { LayerState, LayerStates } from './middleware'
