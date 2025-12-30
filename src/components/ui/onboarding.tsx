'use client'

/**
 * Onboarding - 온보딩 튜토리얼 컴포넌트
 *
 * UX 서사: "새로운 창작의 세계에 오신 것을 환영해요.
 *          손을 잡고 천천히, 함께 첫 발을 내딛어요."
 *
 * 3-5 스텝의 가벼운 튜토리얼로
 * 새로운 사용자가 서비스를 빠르게 이해하도록 안내합니다.
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'
import { usePrefersReducedMotion } from '@/hooks/useAccessibility'
import { Button } from './button'
import {
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Palette,
  Heart,
  Download,
  Users,
  type LucideIcon,
} from 'lucide-react'

// 온보딩 스텝 정의
interface OnboardingStep {
  id: string
  icon: LucideIcon
  title: string
  description: string
  illustration: 'welcome' | 'explore' | 'create' | 'connect' | 'celebrate'
  color: string
}

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Pairy에 오신 것을 환영해요!',
    description: '커플 자캐러들을 위한 창작 공간이에요.\n자료를 찾고, 만들고, 나눌 수 있어요.',
    illustration: 'welcome',
    color: 'from-pink-400 to-rose-400',
  },
  {
    id: 'explore',
    icon: Download,
    title: '멋진 자료를 탐험해요',
    description: '다양한 템플릿과 이메레스를 둘러보고,\n마음에 드는 것을 다운로드하세요.',
    illustration: 'explore',
    color: 'from-blue-400 to-cyan-400',
  },
  {
    id: 'create',
    icon: Palette,
    title: '나만의 작품을 만들어요',
    description: '템플릿을 활용해 쉽게 작품을 완성하고,\n크리에이터가 되어 공유해보세요.',
    illustration: 'create',
    color: 'from-purple-400 to-violet-400',
  },
  {
    id: 'connect',
    icon: Users,
    title: '함께 창작해요',
    description: '마음이 맞는 창작자들을 팔로우하고,\n서로의 작품에 하트를 남겨보세요.',
    illustration: 'connect',
    color: 'from-green-400 to-emerald-400',
  },
  {
    id: 'celebrate',
    icon: Heart,
    title: '준비 완료!',
    description: '이제 Pairy에서 창작의 즐거움을\n마음껏 누려보세요.',
    illustration: 'celebrate',
    color: 'from-amber-400 to-orange-400',
  },
]

// 일러스트 SVG 컴포넌트들
function WelcomeIllustration({ className }: { className?: string }) {
  return (
    <svg className={cn('w-40 h-40', className)} viewBox="0 0 160 160" fill="none">
      {/* 하트 모양 */}
      <path
        d="M80 130 C30 90, 20 50, 50 35 C65 28, 80 40, 80 55 C80 40, 95 28, 110 35 C140 50, 130 90, 80 130"
        className="fill-pink-200 stroke-pink-300"
        strokeWidth="2"
      />
      {/* 별들 */}
      <circle cx="40" cy="45" r="4" className="fill-amber-300 animate-twinkle" />
      <circle cx="120" cy="40" r="3" className="fill-pink-300 animate-twinkle" style={{ animationDelay: '0.3s' }} />
      <circle cx="30" cy="80" r="2" className="fill-cyan-300 animate-twinkle" style={{ animationDelay: '0.6s' }} />
      {/* 얼굴 */}
      <circle cx="60" cy="65" r="5" className="fill-gray-600" />
      <circle cx="100" cy="65" r="5" className="fill-gray-600" />
      <path d="M70 85 Q80 95, 90 85" className="stroke-gray-600" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function ExploreIllustration({ className }: { className?: string }) {
  return (
    <svg className={cn('w-40 h-40', className)} viewBox="0 0 160 160" fill="none">
      {/* 카드들 */}
      <rect x="20" y="40" width="50" height="70" rx="8" className="fill-blue-100 stroke-blue-200" strokeWidth="2" transform="rotate(-10 45 75)" />
      <rect x="55" y="35" width="50" height="70" rx="8" className="fill-cyan-100 stroke-cyan-200" strokeWidth="2" />
      <rect x="90" y="40" width="50" height="70" rx="8" className="fill-purple-100 stroke-purple-200" strokeWidth="2" transform="rotate(10 115 75)" />
      {/* 돋보기 */}
      <circle cx="80" cy="115" r="20" className="fill-none stroke-gray-400" strokeWidth="4" />
      <line x1="95" y1="130" x2="110" y2="145" className="stroke-gray-400" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function CreateIllustration({ className }: { className?: string }) {
  return (
    <svg className={cn('w-40 h-40', className)} viewBox="0 0 160 160" fill="none">
      {/* 캔버스 */}
      <rect x="30" y="30" width="100" height="80" rx="8" className="fill-white stroke-gray-200" strokeWidth="2" />
      {/* 그리기 */}
      <path d="M50 70 Q70 50, 90 70 T130 70" className="stroke-purple-300" strokeWidth="3" fill="none" />
      <circle cx="60" cy="55" r="10" className="fill-pink-200" />
      <circle cx="100" cy="60" r="8" className="fill-amber-200" />
      {/* 브러시 */}
      <g transform="translate(110, 100) rotate(45)">
        <rect x="-5" y="-30" width="10" height="40" rx="3" className="fill-amber-400" />
        <rect x="-5" y="-30" width="10" height="15" rx="3" className="fill-purple-400" />
      </g>
    </svg>
  )
}

function ConnectIllustration({ className }: { className?: string }) {
  return (
    <svg className={cn('w-40 h-40', className)} viewBox="0 0 160 160" fill="none">
      {/* 두 사람 */}
      <circle cx="55" cy="50" r="20" className="fill-pink-200 stroke-pink-300" strokeWidth="2" />
      <circle cx="105" cy="50" r="20" className="fill-cyan-200 stroke-cyan-300" strokeWidth="2" />
      {/* 몸체 */}
      <ellipse cx="55" cy="100" rx="25" ry="30" className="fill-pink-100" />
      <ellipse cx="105" cy="100" rx="25" ry="30" className="fill-cyan-100" />
      {/* 연결선 */}
      <path d="M75 80 Q80 60, 85 80" className="stroke-rose-300" strokeWidth="3" fill="none" />
      {/* 하트 */}
      <path d="M80 65 C85 55, 95 60, 80 75 C65 60, 75 55, 80 65" className="fill-rose-400" />
    </svg>
  )
}

function CelebrateIllustration({ className }: { className?: string }) {
  return (
    <svg className={cn('w-40 h-40', className)} viewBox="0 0 160 160" fill="none">
      {/* 폭죽 */}
      <line x1="80" y1="80" x2="50" y2="40" className="stroke-pink-400" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="80" x2="110" y2="40" className="stroke-amber-400" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="80" x2="30" y2="70" className="stroke-cyan-400" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="80" x2="130" y2="70" className="stroke-purple-400" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="80" x2="60" y2="120" className="stroke-green-400" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="80" x2="100" y2="120" className="stroke-rose-400" strokeWidth="3" strokeLinecap="round" />
      {/* 별들 */}
      <circle cx="50" cy="35" r="5" className="fill-pink-300 animate-twinkle" />
      <circle cx="110" cy="35" r="4" className="fill-amber-300 animate-twinkle" style={{ animationDelay: '0.2s' }} />
      <circle cx="25" cy="68" r="4" className="fill-cyan-300 animate-twinkle" style={{ animationDelay: '0.4s' }} />
      <circle cx="135" cy="68" r="5" className="fill-purple-300 animate-twinkle" style={{ animationDelay: '0.6s' }} />
      <circle cx="55" cy="125" r="4" className="fill-green-300 animate-twinkle" style={{ animationDelay: '0.8s' }} />
      <circle cx="105" cy="125" r="4" className="fill-rose-300 animate-twinkle" style={{ animationDelay: '1s' }} />
      {/* 중앙 하트 */}
      <circle cx="80" cy="80" r="15" className="fill-rose-400" />
    </svg>
  )
}

const illustrations = {
  welcome: WelcomeIllustration,
  explore: ExploreIllustration,
  create: CreateIllustration,
  connect: ConnectIllustration,
  celebrate: CelebrateIllustration,
}

interface OnboardingProps {
  /** 열림 여부 */
  isOpen: boolean
  /** 닫기 콜백 */
  onClose: () => void
  /** 완료 콜백 */
  onComplete?: () => void
  /** 커스텀 스텝 (기본값 사용 시 생략) */
  steps?: OnboardingStep[]
}

export function Onboarding({
  isOpen,
  onClose,
  onComplete,
  steps = DEFAULT_STEPS,
}: OnboardingProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [currentStep, setCurrentStep] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  // 클라이언트 마운트
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 스텝 변경 핸들러
  const goToStep = useCallback((newStep: number) => {
    if (isAnimating) return

    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep(newStep)
      setIsAnimating(false)
    }, prefersReducedMotion ? 0 : 200)
  }, [isAnimating, prefersReducedMotion])

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.()
      onClose()
    } else {
      goToStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      goToStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  if (!isMounted || !isOpen) return null

  const Icon = step.icon
  const Illustration = illustrations[step.illustration]

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      {/* 오버레이 */}
      <div
        className={cn(
          'absolute inset-0 bg-gray-900/60 backdrop-blur-sm',
          !prefersReducedMotion && 'animate-fade-in'
        )}
        onClick={handleSkip}
      />

      {/* 모달 */}
      <div
        className={cn(
          'relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden',
          !prefersReducedMotion && 'animate-scale-in'
        )}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="닫기"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* 상단 그라데이션 배경 */}
        <div
          className={cn(
            'relative h-48 flex items-center justify-center bg-gradient-to-br',
            step.color,
            !prefersReducedMotion && 'transition-all duration-500'
          )}
        >
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '20px 20px',
              }}
            />
          </div>

          {/* 일러스트 */}
          <div
            className={cn(
              'relative z-10',
              !prefersReducedMotion && 'transition-all duration-300',
              isAnimating && 'opacity-0 scale-95'
            )}
          >
            <Illustration className="drop-shadow-lg" />
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 pt-8">
          <div
            className={cn(
              'text-center mb-8',
              !prefersReducedMotion && 'transition-all duration-300',
              isAnimating && 'opacity-0 translate-y-2'
            )}
          >
            {/* 아이콘 */}
            <div
              className={cn(
                'inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br mb-4 text-white',
                step.color
              )}
            >
              <Icon className="w-6 h-6" />
            </div>

            {/* 제목 & 설명 */}
            <h2
              id="onboarding-title"
              className="text-xl font-bold text-gray-800 mb-2"
            >
              {step.title}
            </h2>
            <p className="text-gray-500 whitespace-pre-line">
              {step.description}
            </p>
          </div>

          {/* 진행 인디케이터 */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToStep(idx)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  idx === currentStep
                    ? 'w-8 bg-gradient-to-r ' + step.color
                    : 'w-2 bg-gray-200 hover:bg-gray-300'
                )}
                aria-label={`스텝 ${idx + 1}로 이동`}
              />
            ))}
          </div>

          {/* 버튼들 */}
          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <Button
                variant="ghost"
                onClick={handlePrev}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                이전
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleNext}
              className={cn(
                'flex-1',
                isFirstStep && 'flex-[2]',
                !prefersReducedMotion && 'btn-cute-primary'
              )}
            >
              {isLastStep ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  시작하기
                </>
              ) : (
                <>
                  다음
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* 건너뛰기 */}
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              나중에 보기
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

/**
 * 온보딩 상태 관리 훅
 */
export function useOnboarding(key: string = 'pairy-onboarding-completed') {
  const [isOpen, setIsOpen] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(true) // 기본값 true (SSR)

  useEffect(() => {
    // 로컬스토리지에서 완료 여부 확인
    const completed = localStorage.getItem(key)
    setHasCompleted(!!completed)

    // 완료하지 않았으면 자동으로 열기
    if (!completed) {
      setIsOpen(true)
    }
  }, [key])

  const complete = useCallback(() => {
    localStorage.setItem(key, 'true')
    setHasCompleted(true)
    setIsOpen(false)
  }, [key])

  const reset = useCallback(() => {
    localStorage.removeItem(key)
    setHasCompleted(false)
    setIsOpen(true)
  }, [key])

  return {
    isOpen,
    setIsOpen,
    hasCompleted,
    complete,
    reset,
  }
}

export default Onboarding
