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
  CharacterColors,
} from '@/types/template'
import type { Character } from '@/types/database.types'
import {
  extractCharacterColors,
  mergeCharacterColorsToColorData,
  clearCharacterColors,
  extractCharacterTextData,
  mergeCharacterTextToFormData,
  clearCharacterTextFromFormData,
} from '@/lib/utils/characterColors'
import { DEFAULT_SLOT_TRANSFORM } from '@/types/template'
import {
  type HistorySnapshot,
  type HistoryState,
  type HistoryActions,
  type LayerStates,
  type LayerSliceState,
  type LayerSliceActions,
  initialHistoryState,
  createSnapshot,
  pushSnapshot,
  createHistoryActions,
  defaultLayerState,
  createLayerActions,
} from './middleware'

export interface CanvasEditorData {
  templateConfig: TemplateConfig | null
  formData: FormData
  images: ImageData
  colors: ColorData
  slotTransforms: SlotTransforms
}

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

  // Sprint 33: 캐릭터 퍼스널 컬러 바인딩
  selectedCharacter: Character | null
  characterColors: CharacterColors | null

  // UI 상태
  selectedSlotId: string | null
  selectedTextId: string | null
  selectedStickerId: string | null // Sprint 31
  zoom: number

  // 저장 상태
  isDirty: boolean
  lastSavedAt: Date | null
  /** 템플릿 로드/복구/전체 초기화 세대. 비동기 업로드 무효화에 사용한다. */
  documentGeneration: number
}

interface CanvasEditorActions extends HistoryActions, LayerSliceActions {
  // 템플릿 로드
  loadTemplate: (config: TemplateConfig) => void
  loadEditorData: (data: CanvasEditorData) => void
  restoreEditorData: (data: CanvasEditorData) => void
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
  /**
   * 화면의 의미는 바꾸지 않고 임시 asset URL만 영속 URL로 승격한다.
   * 현재 상태와 undo/redo 스냅샷을 함께 치환한다.
   */
  replaceAssetUrls: (replacements: Record<string, string>) => void

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

  // Sprint 33: 캐릭터 퍼스널 컬러 바인딩
  applyCharacter: (character: Character | null) => void
  clearCharacter: () => void
  updateCharacterColor: (colorType: 'hair' | 'eye' | 'theme', value: string) => void

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
  getEditorData: () => CanvasEditorData
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

type ComparableRecord = Record<string, unknown>

function isComparableRecord(value: unknown): value is ComparableRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function areEditorValuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true

  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((value, index) => areEditorValuesEqual(value, b[index]))
    )
  }

  if (isComparableRecord(a) && isComparableRecord(b)) {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    return (
      keysA.length === keysB.length &&
      keysA.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(b, key) &&
          areEditorValuesEqual(a[key], b[key])
      )
    )
  }

  return false
}

function getChangedPaths(
  current: unknown,
  patch: object,
  prefix = ''
): string[] {
  const currentRecord = isComparableRecord(current) ? current : {}
  const patchRecord = patch as ComparableRecord
  const changedPaths: string[] = []

  for (const key of Object.keys(patchRecord).sort()) {
    const path = prefix ? `${prefix}.${key}` : key
    const currentValue = currentRecord[key]
    const nextValue = patchRecord[key]

    if (areEditorValuesEqual(currentValue, nextValue)) continue

    if (isComparableRecord(currentValue) && isComparableRecord(nextValue)) {
      const nestedPaths = getChangedPaths(currentValue, nextValue, path)
      changedPaths.push(...(nestedPaths.length > 0 ? nestedPaths : [path]))
    } else {
      changedPaths.push(path)
    }
  }

  return changedPaths
}

function createHistoryGroup(
  prefix: string,
  targetId: string,
  changedPaths: string[]
): string {
  return `${prefix}:${targetId}:${changedPaths.join('|')}`
}

function collectBlobUrls(value: unknown, urls: Set<string>, seen: Set<object>): void {
  if (typeof value === 'string') {
    if (value.startsWith('blob:')) urls.add(value)
    return
  }

  if (typeof value !== 'object' || value === null || seen.has(value)) return
  seen.add(value)

  if (Array.isArray(value)) {
    value.forEach((item) => collectBlobUrls(item, urls, seen))
    return
  }

  Object.values(value as Record<string, unknown>).forEach((item) => {
    collectBlobUrls(item, urls, seen)
  })
}

function getReferencedBlobUrls(state: {
  templateConfig: TemplateConfig | null
  images: ImageData
  history: HistorySnapshot[]
}): Set<string> {
  const urls = new Set<string>()
  const seen = new Set<object>()

  collectBlobUrls(state.templateConfig, urls, seen)
  collectBlobUrls(state.images, urls, seen)
  state.history.forEach((snapshot) => {
    collectBlobUrls(snapshot.templateConfig, urls, seen)
    collectBlobUrls(snapshot.images, urls, seen)
  })

  return urls
}

function revokeUnreferencedBlobUrls(
  previousUrls: Set<string>,
  retainedUrls: Set<string> = new Set()
): void {
  if (
    typeof URL === 'undefined' ||
    typeof URL.revokeObjectURL !== 'function'
  ) {
    return
  }

  previousUrls.forEach((url) => {
    if (retainedUrls.has(url)) return
    try {
      URL.revokeObjectURL(url)
    } catch {
      // 이미 해제됐거나 브라우저가 관리하지 않는 URL은 무시한다.
    }
  })
}

function replaceImageUrls(
  images: ImageData,
  replacements: Record<string, string>
): ImageData {
  let changed = false
  const nextImages = Object.fromEntries(
    Object.entries(images).map(([key, url]) => {
      const nextUrl = url ? replacements[url] : undefined
      if (nextUrl && nextUrl !== url) changed = true
      return [key, nextUrl || url]
    })
  ) as ImageData

  return changed ? nextImages : images
}

function replaceTemplateAssetUrls(
  config: TemplateConfig | null,
  replacements: Record<string, string>
): TemplateConfig | null {
  if (!config?.layers.stickers?.length) return config

  let changed = false
  const stickers = config.layers.stickers.map((sticker) => {
    const imageUrl = replacements[sticker.imageUrl]
    if (!imageUrl || imageUrl === sticker.imageUrl) return sticker
    changed = true
    return { ...sticker, imageUrl }
  })

  if (!changed) return config
  return {
    ...config,
    layers: {
      ...config.layers,
      stickers,
    },
  }
}

const initialState: CanvasEditorState = {
  templateConfig: null,
  isLoading: false,
  error: null,

  formData: {},
  images: {},
  colors: { ...DEFAULT_COLORS },
  slotTransforms: {},

  // Sprint 33: 캐릭터 퍼스널 컬러
  selectedCharacter: null,
  characterColors: null,

  selectedSlotId: null,
  selectedTextId: null,
  selectedStickerId: null, // Sprint 31
  zoom: 1,

  isDirty: false,
  lastSavedAt: null,
  documentGeneration: 0,

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
        ...createHistoryActions(set, get, (previousHistory) => {
          const discardedBlobUrls = new Set<string>()
          const seen = new Set<object>()

          previousHistory.forEach((snapshot) => {
            collectBlobUrls(snapshot.templateConfig, discardedBlobUrls, seen)
            collectBlobUrls(snapshot.images, discardedBlobUrls, seen)
          })

          revokeUnreferencedBlobUrls(
            discardedBlobUrls,
            getReferencedBlobUrls(get())
          )
        }),

        // 레이어 액션 (슬라이스에서 생성)
        ...createLayerActions(set, get),

        // 템플릿 로드
        loadTemplate: (config) => {
          const previousState = get()
          const previousBlobUrls = getReferencedBlobUrls(previousState)
          get().cancelScheduledHistory()

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
            templateConfig: config,
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
            selectedStickerId: null,
            isDirty: false,
            documentGeneration: previousState.documentGeneration + 1,
            history: [initialSnapshot],
            historyIndex: 0,
          })

          const retainedBlobUrls = getReferencedBlobUrls(get())
          revokeUnreferencedBlobUrls(previousBlobUrls, retainedBlobUrls)
        },

        loadEditorData: (data) => {
          const previousState = get()
          const previousBlobUrls = getReferencedBlobUrls(previousState)
          get().cancelScheduledHistory()

          const snapshot = createSnapshot(data)
          const config = snapshot.templateConfig
          const layerStates: LayerStates = {}
          config?.layers.slots.forEach((slot) => {
            layerStates[slot.id] = { ...defaultLayerState }
          })

          set({
            templateConfig: config,
            formData: snapshot.formData,
            images: snapshot.images,
            colors: snapshot.colors,
            slotTransforms: snapshot.slotTransforms,
            layerStates,
            selectedSlotId: config?.layers.slots[0]?.id || null,
            selectedTextId: null,
            selectedStickerId: null,
            isDirty: false,
            lastSavedAt: new Date(),
            documentGeneration: previousState.documentGeneration + 1,
            history: [snapshot],
            historyIndex: 0,
            hasPendingHistory: false,
          })

          const retainedBlobUrls = getReferencedBlobUrls(get())
          revokeUnreferencedBlobUrls(previousBlobUrls, retainedBlobUrls)
        },

        restoreEditorData: (data) => {
          const previousState = get()
          const previousBlobUrls = getReferencedBlobUrls(previousState)
          const currentSnapshot = createSnapshot(previousState)

          // 타이머만 취소하고 복구 직전 화면은 Undo 기준점으로 보존한다.
          get().cancelScheduledHistory()

          // redo 분기를 먼저 버린 뒤 아직 커밋되지 않은 현재 화면을 기존
          // pending 단계 대신 확정하고, 복구 결과를 정확히 한 단계 추가한다.
          const truncatedHistory = previousState.history.slice(
            0,
            previousState.historyIndex + 1
          )
          const currentHistory = pushSnapshot(
            truncatedHistory,
            truncatedHistory.length - 1,
            currentSnapshot
          )
          const restoredSnapshot = createSnapshot(data)
          const restoredHistory = pushSnapshot(
            currentHistory.history,
            currentHistory.historyIndex,
            restoredSnapshot
          )

          const restoredConfig = restoredSnapshot.templateConfig
          const restoredSlotIds = new Set(
            restoredConfig?.layers.slots.map((slot) => slot.id) ?? []
          )
          const restoredTextIds = new Set(
            restoredConfig?.layers.texts.map((text) => text.id) ?? []
          )
          const restoredStickerIds = new Set(
            restoredConfig?.layers.stickers?.map((sticker) => sticker.id) ?? []
          )
          const restoredLayerStates: LayerStates = {}
          restoredConfig?.layers.slots.forEach((slot) => {
            restoredLayerStates[slot.id] = {
              ...(previousState.layerStates[slot.id] || defaultLayerState),
            }
          })

          set({
            templateConfig: restoredConfig,
            formData: restoredSnapshot.formData,
            images: restoredSnapshot.images,
            colors: restoredSnapshot.colors,
            slotTransforms: restoredSnapshot.slotTransforms,
            layerStates: restoredLayerStates,
            selectedSlotId:
              previousState.selectedSlotId &&
              restoredSlotIds.has(previousState.selectedSlotId)
                ? previousState.selectedSlotId
                : null,
            selectedTextId:
              previousState.selectedTextId &&
              restoredTextIds.has(previousState.selectedTextId)
                ? previousState.selectedTextId
                : null,
            selectedStickerId:
              previousState.selectedStickerId &&
              restoredStickerIds.has(previousState.selectedStickerId)
                ? previousState.selectedStickerId
                : null,
            history: restoredHistory.history,
            historyIndex: restoredHistory.historyIndex,
            hasPendingHistory: false,
            isDirty: true,
            documentGeneration: previousState.documentGeneration + 1,
          })

          const retainedBlobUrls = getReferencedBlobUrls(get())
          revokeUnreferencedBlobUrls(previousBlobUrls, retainedBlobUrls)
        },

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),

        // 폼 데이터 업데이트
        updateFormField: (key, value) => {
          set((state) => ({
            formData: { ...state.formData, [key]: value },
            isDirty: true,
          }))
          get().scheduleHistory(`form:${key}`)
        },

        updateImage: (dataKey, url) => {
          // Blob URLs are owned by the current state plus history, not one slot value.
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
          get().scheduleHistory(`color:${String(colorKey)}`)
        },

        setFormData: (data) => set({ formData: data, isDirty: true }),
        setImages: (data) => {
          // Replaced URLs remain alive while any Undo snapshot can restore them.
          set({ images: data, isDirty: true })
        },
        setColors: (data) => set({ colors: data, isDirty: true }),
        replaceAssetUrls: (replacements) => {
          if (Object.keys(replacements).length === 0) return

          const previousState = get()
          const previousBlobUrls = getReferencedBlobUrls(previousState)
          set((state) => ({
            templateConfig: replaceTemplateAssetUrls(
              state.templateConfig,
              replacements
            ),
            images: replaceImageUrls(state.images, replacements),
            history: state.history.map((snapshot) => ({
              ...snapshot,
              templateConfig: replaceTemplateAssetUrls(
                snapshot.templateConfig,
                replacements
              ),
              images: replaceImageUrls(snapshot.images, replacements),
            })),
          }))

          revokeUnreferencedBlobUrls(
            previousBlobUrls,
            getReferencedBlobUrls(get())
          )
        },

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
          get().scheduleHistory(`image-opacity:${slotId}`)
        },

        setImageFilters: (slotId, filters) => {
          const current = get().slotTransforms[slotId] || DEFAULT_SLOT_TRANSFORM
          const changedPaths = getChangedPaths(
            current.filters,
            filters
          )
          if (changedPaths.length === 0) return

          set((state) => {
            const currentTransform =
              state.slotTransforms[slotId] || DEFAULT_SLOT_TRANSFORM
            return {
              slotTransforms: {
                ...state.slotTransforms,
                [slotId]: {
                  ...currentTransform,
                  filters: { ...currentTransform.filters, ...filters },
                },
              },
              isDirty: true,
            }
          })
          get().scheduleHistory(
            createHistoryGroup('image-filters', slotId, changedPaths)
          )
        },

        // Sprint 30: 텍스트 편집 고도화
        updateTextEffects: (textId, effects) => {
          const text = get().templateConfig?.layers.texts.find(
            (item) => item.id === textId
          )
          if (!text) return

          const changedPaths = getChangedPaths(
            text.effects,
            effects
          )
          if (changedPaths.length === 0) return

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
          get().scheduleHistory(
            createHistoryGroup('text-effects', textId, changedPaths)
          )
        },

        updateTextStyle: (textId, style) => {
          const text = get().templateConfig?.layers.texts.find(
            (item) => item.id === textId
          )
          if (!text) return

          const changedPaths = getChangedPaths(
            text.style,
            style
          )
          if (changedPaths.length === 0) return

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
          get().scheduleHistory(
            createHistoryGroup('text-style', textId, changedPaths)
          )
        },

        clearTextEffects: (textId) => {
          const text = get().templateConfig?.layers.texts.find(
            (item) => item.id === textId
          )
          if (!text?.effects || Object.keys(text.effects).length === 0) return

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
          const stickers = get().templateConfig?.layers.stickers || []
          if (!stickers.some((sticker) => sticker.id === stickerId)) return

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
          const sticker = (
            get().templateConfig?.layers.stickers || []
          ).find((item) => item.id === stickerId)
          if (!sticker) return

          const changedPaths = getChangedPaths(
            sticker.transform,
            transform
          )
          if (changedPaths.length === 0) return

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

        // Sprint 33: 캐릭터 퍼스널 컬러 + 텍스트 데이터 바인딩
        applyCharacter: (character) => {
          const characterColors = extractCharacterColors(character)
          const characterTextData = extractCharacterTextData(character)

          set((state) => ({
            selectedCharacter: character,
            characterColors,
            colors: mergeCharacterColorsToColorData(state.colors, characterColors),
            // 텍스트 데이터도 formData에 자동 병합 (기존 값이 없는 필드만)
            formData: mergeCharacterTextToFormData(state.formData, characterTextData, false),
            isDirty: true,
          }))
          get().pushHistory()
        },

        clearCharacter: () => {
          set((state) => ({
            selectedCharacter: null,
            characterColors: null,
            colors: clearCharacterColors(state.colors),
            // 캐릭터 텍스트 데이터도 제거
            formData: clearCharacterTextFromFormData(state.formData),
            isDirty: true,
          }))
          get().pushHistory()
        },

        updateCharacterColor: (colorType, value) => {
          const colorKeyMap = {
            hair: 'characterHairColor',
            eye: 'characterEyeColor',
            theme: 'characterThemeColor',
          } as const

          set((state) => {
            const colorKey = colorKeyMap[colorType]
            const newCharacterColors = state.characterColors
              ? {
                  ...state.characterColors,
                  [`${colorType}Color`]: value,
                }
              : {
                  hairColor: colorType === 'hair' ? value : null,
                  eyeColor: colorType === 'eye' ? value : null,
                  themeColor: colorType === 'theme' ? value : null,
                }

            return {
              characterColors: newCharacterColors,
              colors: {
                ...state.colors,
                [colorKey]: value,
              },
              isDirty: true,
            }
          })
          get().scheduleHistory(`character-color:${colorType}`)
        },

        // UI 상태
        selectSlot: (slotId) => set({ selectedSlotId: slotId, selectedTextId: null, selectedStickerId: null }),
        selectText: (textId) => set({ selectedTextId: textId, selectedSlotId: null, selectedStickerId: null }),
        setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),

        // 이미지 삭제
        removeImage: (dataKey) => {
          set((state) => {
            const newImages = { ...state.images }
            delete newImages[dataKey]
            return { images: newImages, isDirty: true }
          })
          get().pushHistory()
        },

        // 저장
        markDirty: () => set({ isDirty: true }),
        markSaved: () => set({ isDirty: false, lastSavedAt: new Date() }),

        // 초기화
        reset: () => {
          const previousState = get()
          const previousBlobUrls = getReferencedBlobUrls(previousState)
          get().cancelScheduledHistory()
          set({
            ...initialState,
            documentGeneration: previousState.documentGeneration + 1,
          })
          revokeUnreferencedBlobUrls(previousBlobUrls)
        },

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
        // TOP50 #15 · 스키마 변경 시 여기서 버전 올리고 migrate 로 변환 (v0=버전 표기 이전 데이터)
        version: 1,
        migrate: (persistedState) => persistedState,
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

// Sprint 33: 캐릭터 퍼스널 컬러 셀렉터
export const useSelectedCharacter = () => useCanvasEditorStore((state) => state.selectedCharacter)
export const useCharacterColors = () => useCanvasEditorStore((state) => state.characterColors)
export const useApplyCharacter = () => useCanvasEditorStore((state) => state.applyCharacter)
export const useClearCharacter = () => useCanvasEditorStore((state) => state.clearCharacter)

// 타입 재익스포트
export type { LayerState, LayerStates } from './middleware'
