'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Home, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui'
import { useEditorEntryStore } from '@/stores/editorEntryStore'
import { useUser } from '@/hooks/useUser'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { ModeSelectionStep } from './ModeSelectionStep'
import { TemplateSelectionStep } from './TemplateSelectionStep'
import { TitleInputStep } from './TitleInputStep'
import { ENTRY_STEPS, PAGE_TRANSITION_VARIANTS } from '@/types/editor-entry'

// ============================================
// 애니메이션 설정
// ============================================

const pageVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
}

const pageTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
}

// ============================================
// 메인 컴포넌트
// ============================================

interface EditorEntryFlowProps {
  className?: string
}

export function EditorEntryFlow({ className }: EditorEntryFlowProps) {
  const router = useRouter()
  const { user, isLoading: userLoading } = useUser()
  const isDemoMode = !isSupabaseConfigured()

  const {
    step,
    mode,
    error,
    isLoading,
    goBack,
    canGoBack,
    clearError,
    reset,
    getProgressPercent,
  } = useEditorEntryStore()

  // 로그인 체크 (데모 모드에서는 스킵)
  useEffect(() => {
    if (!isDemoMode && !userLoading && !user) {
      router.push('/login?redirectTo=/editor/new')
    }
  }, [user, userLoading, router, isDemoMode])

  // 컴포넌트 언마운트 시 리셋
  useEffect(() => {
    return () => {
      // 페이지 이탈 시 리셋하지 않음 (에디터로 이동 중일 수 있음)
    }
  }, [])

  const handleBack = () => {
    if (canGoBack()) {
      goBack()
    } else {
      router.push('/')
    }
  }

  const handleClose = () => {
    reset()
    router.push('/')
  }

  // 현재 단계 인덱스
  const currentStepIndex = ENTRY_STEPS.indexOf(step)
  const progressPercent = getProgressPercent()

  // 단계별 타이틀
  const getStepTitle = () => {
    switch (step) {
      case 'mode-select':
        return '새 작업 만들기'
      case 'template-select':
        return mode === 'duo' ? '듀오 작업 템플릿' : '솔로 작업 템플릿'
      case 'title-input':
        return '작업 정보 입력'
      default:
        return '새 작업 만들기'
    }
  }

  // 로딩 중
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">로딩 중...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* 뒤로가기 */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">뒤로</span>
            </button>

            {/* 타이틀 */}
            <h1 className="text-lg font-semibold text-gray-900">
              {getStepTitle()}
            </h1>

            {/* 닫기 */}
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 진행 바 */}
          <div className="h-1 bg-gray-100 -mx-4">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-400 to-accent-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
        </div>
      </header>

      {/* 에러 알림 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
          >
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="p-1 text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 스텝 인디케이터 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2">
          {ENTRY_STEPS.map((s, index) => {
            const isActive = index === currentStepIndex
            const isCompleted = index < currentStepIndex

            return (
              <div key={s} className="flex items-center gap-2">
                <motion.div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-400 text-white'
                      : isCompleted
                      ? 'bg-primary-200 text-primary-600'
                      : 'bg-gray-200 text-gray-400'
                  )}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {index + 1}
                </motion.div>
                {index < ENTRY_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-8 h-0.5',
                      isCompleted ? 'bg-primary-300' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-4 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            {step === 'mode-select' && <ModeSelectionStep />}
            {step === 'template-select' && <TemplateSelectionStep />}
            {step === 'title-input' && <TitleInputStep />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 홈 버튼 (고정) */}
      <div className="fixed bottom-6 left-6">
        <Button
          variant="secondary"
          size="sm"
          className="shadow-lg"
          asChild
        >
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            홈으로
          </Link>
        </Button>
      </div>
    </div>
  )
}
