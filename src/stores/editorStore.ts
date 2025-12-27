'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// 슬롯 타입 정의
export interface Slot {
  id: string
  type: 'image' | 'text'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  locked: boolean
  visible: boolean
  // 이미지 슬롯용
  imageUrl?: string
  placeholder?: string
  // 텍스트 슬롯용
  text?: string
  fontSize?: number
  fontFamily?: string
  fontColor?: string
  textAlign?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
}

// 에디터 상태 타입
export interface EditorState {
  // 작업 정보
  workId: string | null
  templateId: string | null
  title: string

  // 캔버스 상태
  slots: Slot[]
  selectedSlotId: string | null
  canvasWidth: number
  canvasHeight: number
  zoom: number

  // 히스토리
  history: Slot[][]
  historyIndex: number
  maxHistoryLength: number

  // 저장 상태
  isDirty: boolean
  lastSavedAt: Date | null
  isSaving: boolean

  // 에디터 설정
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
}

// 에디터 액션 타입
export interface EditorActions {
  // 초기화
  initEditor: (data: {
    workId?: string
    templateId?: string
    title?: string
    slots?: Slot[]
    canvasWidth?: number
    canvasHeight?: number
  }) => void
  resetEditor: () => void

  // 슬롯 관리
  addSlot: (slot: Omit<Slot, 'id'>) => void
  updateSlot: (id: string, updates: Partial<Slot>) => void
  deleteSlot: (id: string) => void
  duplicateSlot: (id: string) => void

  // 선택
  selectSlot: (id: string | null) => void

  // 슬롯 순서
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  bringForward: (id: string) => void
  sendBackward: (id: string) => void

  // 히스토리 (Undo/Redo)
  pushHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // 줌
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void

  // 저장
  setDirty: (dirty: boolean) => void
  setSaving: (saving: boolean) => void
  markSaved: () => void

  // 설정
  toggleGrid: () => void
  toggleSnapToGrid: () => void
  setGridSize: (size: number) => void

  // 제목
  setTitle: (title: string) => void

  // JSON 내보내기/가져오기
  exportToJSON: () => string
  importFromJSON: (json: string) => void
}

// 초기 상태
const initialState: EditorState = {
  workId: null,
  templateId: null,
  title: '새 작업',

  slots: [],
  selectedSlotId: null,
  canvasWidth: 1200,
  canvasHeight: 800,
  zoom: 1,

  history: [],
  historyIndex: -1,
  maxHistoryLength: 50,

  isDirty: false,
  lastSavedAt: null,
  isSaving: false,

  showGrid: false,
  snapToGrid: false,
  gridSize: 20,
}

// UUID 생성
const generateId = () => crypto.randomUUID()

// 에디터 스토어 생성
export const useEditorStore = create<EditorState & EditorActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // 초기화
    initEditor: (data) => {
      set({
        workId: data.workId ?? null,
        templateId: data.templateId ?? null,
        title: data.title ?? '새 작업',
        slots: data.slots ?? [],
        canvasWidth: data.canvasWidth ?? 1200,
        canvasHeight: data.canvasHeight ?? 800,
        history: [data.slots ?? []],
        historyIndex: 0,
        isDirty: false,
        lastSavedAt: null,
      })
    },

    resetEditor: () => {
      set(initialState)
    },

    // 슬롯 추가
    addSlot: (slotData) => {
      const state = get()
      const newSlot: Slot = {
        ...slotData,
        id: generateId(),
      }
      const newSlots = [...state.slots, newSlot]
      set({ slots: newSlots, isDirty: true })
      get().pushHistory()
    },

    // 슬롯 업데이트
    updateSlot: (id, updates) => {
      const state = get()
      const newSlots = state.slots.map((slot) =>
        slot.id === id ? { ...slot, ...updates } : slot
      )
      set({ slots: newSlots, isDirty: true })
    },

    // 슬롯 삭제
    deleteSlot: (id) => {
      const state = get()
      const newSlots = state.slots.filter((slot) => slot.id !== id)
      set({
        slots: newSlots,
        selectedSlotId: state.selectedSlotId === id ? null : state.selectedSlotId,
        isDirty: true,
      })
      get().pushHistory()
    },

    // 슬롯 복제
    duplicateSlot: (id) => {
      const state = get()
      const slot = state.slots.find((s) => s.id === id)
      if (!slot) return

      const newSlot: Slot = {
        ...slot,
        id: generateId(),
        x: slot.x + 20,
        y: slot.y + 20,
      }
      const newSlots = [...state.slots, newSlot]
      set({ slots: newSlots, selectedSlotId: newSlot.id, isDirty: true })
      get().pushHistory()
    },

    // 선택
    selectSlot: (id) => {
      set({ selectedSlotId: id })
    },

    // 레이어 순서 변경
    bringToFront: (id) => {
      const state = get()
      const index = state.slots.findIndex((s) => s.id === id)
      if (index === -1 || index === state.slots.length - 1) return

      const slot = state.slots[index]
      const newSlots = [...state.slots.filter((s) => s.id !== id), slot]
      set({ slots: newSlots, isDirty: true })
      get().pushHistory()
    },

    sendToBack: (id) => {
      const state = get()
      const index = state.slots.findIndex((s) => s.id === id)
      if (index === -1 || index === 0) return

      const slot = state.slots[index]
      const newSlots = [slot, ...state.slots.filter((s) => s.id !== id)]
      set({ slots: newSlots, isDirty: true })
      get().pushHistory()
    },

    bringForward: (id) => {
      const state = get()
      const index = state.slots.findIndex((s) => s.id === id)
      if (index === -1 || index === state.slots.length - 1) return

      const newSlots = [...state.slots]
      ;[newSlots[index], newSlots[index + 1]] = [newSlots[index + 1], newSlots[index]]
      set({ slots: newSlots, isDirty: true })
      get().pushHistory()
    },

    sendBackward: (id) => {
      const state = get()
      const index = state.slots.findIndex((s) => s.id === id)
      if (index === -1 || index === 0) return

      const newSlots = [...state.slots]
      ;[newSlots[index], newSlots[index - 1]] = [newSlots[index - 1], newSlots[index]]
      set({ slots: newSlots, isDirty: true })
      get().pushHistory()
    },

    // 히스토리 관리
    pushHistory: () => {
      const state = get()
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push([...state.slots])

      // 최대 길이 제한
      if (newHistory.length > state.maxHistoryLength) {
        newHistory.shift()
      }

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      })
    },

    undo: () => {
      const state = get()
      if (state.historyIndex <= 0) return

      const newIndex = state.historyIndex - 1
      set({
        slots: [...state.history[newIndex]],
        historyIndex: newIndex,
        isDirty: true,
      })
    },

    redo: () => {
      const state = get()
      if (state.historyIndex >= state.history.length - 1) return

      const newIndex = state.historyIndex + 1
      set({
        slots: [...state.history[newIndex]],
        historyIndex: newIndex,
        isDirty: true,
      })
    },

    canUndo: () => {
      const state = get()
      return state.historyIndex > 0
    },

    canRedo: () => {
      const state = get()
      return state.historyIndex < state.history.length - 1
    },

    // 줌
    setZoom: (zoom) => {
      set({ zoom: Math.max(0.25, Math.min(2, zoom)) })
    },

    zoomIn: () => {
      const state = get()
      get().setZoom(state.zoom + 0.1)
    },

    zoomOut: () => {
      const state = get()
      get().setZoom(state.zoom - 0.1)
    },

    resetZoom: () => {
      set({ zoom: 1 })
    },

    // 저장 상태
    setDirty: (dirty) => {
      set({ isDirty: dirty })
    },

    setSaving: (saving) => {
      set({ isSaving: saving })
    },

    markSaved: () => {
      set({
        isDirty: false,
        isSaving: false,
        lastSavedAt: new Date(),
      })
    },

    // 설정
    toggleGrid: () => {
      set((state) => ({ showGrid: !state.showGrid }))
    },

    toggleSnapToGrid: () => {
      set((state) => ({ snapToGrid: !state.snapToGrid }))
    },

    setGridSize: (size) => {
      set({ gridSize: size })
    },

    // 제목
    setTitle: (title) => {
      set({ title, isDirty: true })
    },

    // JSON 내보내기
    exportToJSON: () => {
      const state = get()
      return JSON.stringify({
        version: 1,
        title: state.title,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        slots: state.slots,
      })
    },

    // JSON 가져오기
    importFromJSON: (json) => {
      try {
        const data = JSON.parse(json)
        if (data.version === 1) {
          set({
            title: data.title || '가져온 작업',
            canvasWidth: data.canvasWidth || 1200,
            canvasHeight: data.canvasHeight || 800,
            slots: data.slots || [],
            isDirty: true,
          })
          get().pushHistory()
        }
      } catch (err) {
        console.error('Failed to import JSON:', err)
      }
    },
  }))
)

// 편의 셀렉터
export const useSelectedSlot = () => {
  return useEditorStore((state) => {
    if (!state.selectedSlotId) return null
    return state.slots.find((s) => s.id === state.selectedSlotId) ?? null
  })
}

export const useCanUndo = () => useEditorStore((state) => state.historyIndex > 0)
export const useCanRedo = () => useEditorStore((state) => state.historyIndex < state.history.length - 1)
export const useIsDirty = () => useEditorStore((state) => state.isDirty)
export const useIsSaving = () => useEditorStore((state) => state.isSaving)
