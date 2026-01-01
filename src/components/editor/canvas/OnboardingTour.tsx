'use client'

/**
 * Sprint 33: 온보딩 투어 컴포넌트
 * 첫 사용자를 위한 단계별 가이드
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

// ============================================
// 타입 정의
// ============================================

export interface TourStep {
  target: string // CSS 선택자
  title: string
  content: string
  placement: 'top' | 'bottom' | 'left' | 'right'
  highlight?: boolean
}

interface OnboardingTourProps {
  steps: TourStep[]
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

// ============================================
// 기본 투어 스텝
// ============================================

export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="canvas-area"]',
    title: '캔버스 영역',
    content: '여기서 페어틀을 편집해요. 이미지를 클릭하면 편집할 수 있어요!',
    placement: 'right',
    highlight: true,
  },
  {
    target: '[data-tour="slot-panel"]',
    title: '이미지 업로드',
    content: '사이드바에서 이미지를 업로드하거나 드래그해서 놓으세요.',
    placement: 'left',
  },
  {
    target: '[data-tour="color-panel"]',
    title: '테마 색상',
    content: '색상을 바꿔서 나만의 스타일을 만들어보세요!',
    placement: 'left',
  },
  {
    target: '[data-tour="text-panel"]',
    title: '텍스트 입력',
    content: '이름이나 메시지를 입력하세요. 더블클릭으로 직접 편집도 가능해요.',
    placement: 'left',
  },
  {
    target: '[data-tour="export-btn"]',
    title: '저장하기',
    content: '완성된 이미지를 PNG, JPG, WebP로 저장할 수 있어요!',
    placement: 'bottom',
  },
]

// ============================================
// 스토리지 키
// ============================================

const TOUR_COMPLETED_KEY = 'pairy-onboarding-completed'

export function hasCompletedTour(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true'
}

export function markTourCompleted(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
}

export function resetTour(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOUR_COMPLETED_KEY)
}

// ============================================
// 메인 컴포넌트
// ============================================

export function OnboardingTour({
  steps,
  isOpen,
  onClose,
  onComplete,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  // 타겟 요소 위치 계산
  const updatePosition = useCallback(() => {
    if (!step) return

    const targetElement = document.querySelector(step.target)
    if (!targetElement) {
      console.warn(`[OnboardingTour] Target not found: ${step.target}`)
      return
    }

    const rect = targetElement.getBoundingClientRect()
    setTargetRect(rect)

    // 툴팁 위치 계산
    const tooltipWidth = 320
    const tooltipHeight = 180
    const padding = 16

    let top = 0
    let left = 0

    switch (step.placement) {
      case 'top':
        top = rect.top - tooltipHeight - padding
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'bottom':
        top = rect.bottom + padding
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.left - tooltipWidth - padding
        break
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.right + padding
        break
    }

    // 화면 밖으로 나가지 않도록 조정
    const maxLeft = window.innerWidth - tooltipWidth - padding
    const maxTop = window.innerHeight - tooltipHeight - padding
    left = Math.max(padding, Math.min(left, maxLeft))
    top = Math.max(padding, Math.min(top, maxTop))

    setTooltipPosition({ top, left })
  }, [step])

  // 위치 업데이트
  useEffect(() => {
    if (!isOpen) return

    updatePosition()

    // 리사이즈 시 위치 재계산
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [isOpen, currentStep, updatePosition])

  // 키보드 네비게이션
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isLastStep) {
          handleComplete()
        } else {
          setCurrentStep((prev) => prev + 1)
        }
      } else if (e.key === 'ArrowLeft' && !isFirstStep) {
        setCurrentStep((prev) => prev - 1)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isFirstStep, isLastStep, onClose])

  const handleComplete = () => {
    markTourCompleted()
    onComplete()
  }

  const handleSkip = () => {
    markTourCompleted()
    onClose()
  }

  if (!isOpen || !step) return null

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 z-[100]">
        {/* 어두운 배경 */}
        <div className="absolute inset-0 bg-black/50" onClick={handleSkip} />

        {/* 하이라이트 영역 (타겟 요소 주변을 밝게) */}
        {targetRect && (
          <div
            className="absolute bg-transparent pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              borderRadius: 12,
            }}
          />
        )}

        {/* 하이라이트 테두리 */}
        {targetRect && step.highlight && (
          <div
            className="absolute border-2 border-primary-400 rounded-xl pointer-events-none animate-pulse"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        )}

        {/* 툴팁 */}
        <div
          ref={tooltipRef}
          className={cn(
            'absolute w-80 bg-white rounded-2xl shadow-2xl p-5 z-[101]',
            'animate-in fade-in slide-in-from-bottom-2 duration-300'
          )}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="투어 건너뛰기"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 제목 */}
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <h3 className="font-bold text-gray-900">{step.title}</h3>
          </div>

          {/* 내용 */}
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {step.content}
          </p>

          {/* 진행 표시 */}
          <div className="flex items-center gap-1.5 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === currentStep
                    ? 'w-6 bg-primary-400'
                    : index < currentStep
                      ? 'w-1.5 bg-primary-200'
                      : 'w-1.5 bg-gray-200'
                )}
              />
            ))}
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              건너뛰기
            </button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => {
                  if (isLastStep) {
                    handleComplete()
                  } else {
                    setCurrentStep((prev) => prev + 1)
                  }
                }}
              >
                {isLastStep ? (
                  '시작하기!'
                ) : (
                  <>
                    다음
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================
// 훅: 온보딩 상태 관리
// ============================================

export function useOnboarding() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  // 초기 체크 (첫 사용자인지)
  useEffect(() => {
    if (!hasCompletedTour()) {
      // 약간의 딜레이 후 투어 시작 (페이지 로드 완료 대기)
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
    setHasChecked(true)
  }, [])

  const startTour = useCallback(() => {
    resetTour()
    setIsOpen(true)
  }, [])

  const closeTour = useCallback(() => {
    setIsOpen(false)
  }, [])

  const completeTour = useCallback(() => {
    setIsOpen(false)
    setHasChecked(true)
  }, [])

  return {
    isOpen,
    hasChecked,
    startTour,
    closeTour,
    completeTour,
  }
}
