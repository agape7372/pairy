'use client'

import { create } from 'zustand'
import type {
  EditorMode,
  EntryStep,
  SelectedTemplate,
  EditorEntryState,
} from '@/types/editor-entry'
import { INITIAL_ENTRY_STATE, ENTRY_STEPS } from '@/types/editor-entry'

// ============================================
// 스토어 인터페이스
// ============================================

interface EditorEntryStore extends EditorEntryState {
  // 모드 선택 액션
  selectMode: (mode: EditorMode) => void

  // 템플릿 선택 액션
  selectTemplate: (template: SelectedTemplate) => void
  clearTemplate: () => void

  // 제목 액션
  setTitle: (title: string) => void

  // 단계 네비게이션
  goToStep: (step: EntryStep) => void
  goNext: () => void
  goBack: () => void
  canGoBack: () => boolean
  canGoNext: () => boolean

  // 상태 관리
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // 리셋
  reset: () => void

  // 유틸리티
  getStepIndex: () => number
  isStepCompleted: (step: EntryStep) => boolean
  getProgressPercent: () => number
}

// ============================================
// 단계 인덱스 맵
// ============================================

const STEP_INDEX: Record<EntryStep, number> = {
  'mode-select': 0,
  'template-select': 1,
  'title-input': 2,
}

// ============================================
// 스토어 생성
// ============================================

export const useEditorEntryStore = create<EditorEntryStore>()((set, get) => ({
  // 초기 상태
  ...INITIAL_ENTRY_STATE,

  // 모드 선택
  selectMode: (mode) => {
    set({
      mode,
      step: 'template-select',
      error: null,
    })
  },

  // 템플릿 선택
  selectTemplate: (template) => {
    // 템플릿 선택 시 기본 제목 설정
    const defaultTitle = `나의 ${template.title}`
    set({
      selectedTemplate: template,
      title: defaultTitle,
      step: 'title-input',
      error: null,
    })
  },

  clearTemplate: () => {
    set({
      selectedTemplate: null,
      title: '',
    })
  },

  // 제목 설정
  setTitle: (title) => {
    set({ title })
  },

  // 단계 직접 이동
  goToStep: (step) => {
    const { mode, selectedTemplate } = get()

    // 단계별 필수 조건 검증
    if (step === 'template-select' && !mode) {
      set({ error: '먼저 모드를 선택해주세요' })
      return
    }

    if (step === 'title-input' && !selectedTemplate) {
      set({ error: '먼저 템플릿을 선택해주세요' })
      return
    }

    set({ step, error: null })
  },

  // 다음 단계로 이동
  goNext: () => {
    const { step, mode, selectedTemplate } = get()
    const currentIndex = STEP_INDEX[step]
    const nextIndex = currentIndex + 1

    if (nextIndex >= ENTRY_STEPS.length) {
      return // 마지막 단계
    }

    const nextStep = ENTRY_STEPS[nextIndex]

    // 조건 검증
    if (nextStep === 'template-select' && !mode) {
      set({ error: '먼저 모드를 선택해주세요' })
      return
    }

    if (nextStep === 'title-input' && !selectedTemplate) {
      set({ error: '먼저 템플릿을 선택해주세요' })
      return
    }

    set({ step: nextStep, error: null })
  },

  // 이전 단계로 이동
  goBack: () => {
    const { step } = get()
    const currentIndex = STEP_INDEX[step]

    if (currentIndex <= 0) {
      return // 첫 단계
    }

    const prevStep = ENTRY_STEPS[currentIndex - 1]
    set({ step: prevStep, error: null })
  },

  // 뒤로 갈 수 있는지 확인
  canGoBack: () => {
    const { step } = get()
    return STEP_INDEX[step] > 0
  },

  // 다음으로 갈 수 있는지 확인
  canGoNext: () => {
    const { step, mode, selectedTemplate, title } = get()

    switch (step) {
      case 'mode-select':
        return mode !== null
      case 'template-select':
        return selectedTemplate !== null
      case 'title-input':
        return title.trim().length > 0
      default:
        return false
    }
  },

  // 로딩 상태 설정
  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  // 에러 설정
  setError: (error) => {
    set({ error })
  },

  clearError: () => {
    set({ error: null })
  },

  // 전체 리셋
  reset: () => {
    set(INITIAL_ENTRY_STATE)
  },

  // 현재 단계 인덱스 가져오기
  getStepIndex: () => {
    const { step } = get()
    return STEP_INDEX[step]
  },

  // 특정 단계가 완료되었는지 확인
  isStepCompleted: (step) => {
    const { mode, selectedTemplate, title } = get()

    switch (step) {
      case 'mode-select':
        return mode !== null
      case 'template-select':
        return selectedTemplate !== null
      case 'title-input':
        return title.trim().length > 0
      default:
        return false
    }
  },

  // 진행률 퍼센트 (0-100)
  getProgressPercent: () => {
    const { step, mode, selectedTemplate, title } = get()
    const currentIndex = STEP_INDEX[step]
    const totalSteps = ENTRY_STEPS.length

    // 기본 진행률: 현재 단계까지
    let progress = (currentIndex / totalSteps) * 100

    // 현재 단계 완료 시 추가 점수
    const isCurrentComplete = (() => {
      switch (step) {
        case 'mode-select':
          return mode !== null
        case 'template-select':
          return selectedTemplate !== null
        case 'title-input':
          return title.trim().length > 0
        default:
          return false
      }
    })()

    if (isCurrentComplete) {
      progress += (1 / totalSteps) * 100 * 0.5 // 현재 단계의 절반 추가
    }

    return Math.min(100, progress)
  },
}))

// ============================================
// 편의 훅
// ============================================

/** 현재 선택된 모드 */
export function useEditorMode() {
  return useEditorEntryStore((state) => state.mode)
}

/** 현재 선택된 템플릿 */
export function useSelectedTemplate() {
  return useEditorEntryStore((state) => state.selectedTemplate)
}

/** 현재 단계 */
export function useCurrentStep() {
  return useEditorEntryStore((state) => state.step)
}

/** 진입 흐름 완료 여부 */
export function useIsEntryComplete() {
  return useEditorEntryStore((state) => {
    const { mode, selectedTemplate, title } = state
    return mode !== null && selectedTemplate !== null && title.trim().length > 0
  })
}

/** Duo 모드 선택 여부 */
export function useIsDuoMode() {
  return useEditorEntryStore((state) => state.mode === 'duo')
}
