'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Users, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui'
import { useEditorEntryStore } from '@/stores/editorEntryStore'
import { WordReveal } from '@/components/ui/text-reveal'

interface TitleInputStepProps {
  className?: string
}

const MAX_TITLE_LENGTH = 50

export function TitleInputStep({ className }: TitleInputStepProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    title,
    setTitle,
    selectedTemplate,
    mode,
    isLoading,
    setLoading,
    setError,
    reset,
  } = useEditorEntryStore()

  const [isNavigating, setIsNavigating] = useState(false)
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 자동 포커스
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // 컴포넌트 언마운트 시 reset timeout 정리
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      if (value.length <= MAX_TITLE_LENGTH) {
        setTitle(value)
      }
    },
    [setTitle]
  )

  const handleStart = useCallback(async () => {
    if (!selectedTemplate || !title.trim()) {
      setError('템플릿과 제목을 확인해주세요')
      return
    }

    setIsNavigating(true)
    setLoading(true)

    try {
      const params = new URLSearchParams()
      // NOTE: URLSearchParams.set()이 자동으로 인코딩하므로 encodeURIComponent 불필요
      params.set('title', title.trim())

      // Duo 모드일 경우 세션 자동 생성
      if (mode === 'duo') {
        const sessionId = `collab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        params.set('session', sessionId)
      }

      // 에디터로 이동
      router.push(`/canvas-editor/${selectedTemplate.id}?${params.toString()}`)

      // 진입 스토어 리셋 (약간의 딜레이 후, ref로 추적하여 메모리 누수 방지)
      resetTimeoutRef.current = setTimeout(() => {
        reset()
      }, 500)
    } catch (err) {
      console.error('Failed to start editor:', err)
      setError('에디터를 시작하는 중 오류가 발생했어요')
      setIsNavigating(false)
      setLoading(false)
    }
  }, [selectedTemplate, title, mode, router, setLoading, setError, reset])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && title.trim() && !isNavigating) {
        handleStart()
      }
    },
    [title, isNavigating, handleStart]
  )

  const isValid = title.trim().length > 0
  const isDuo = mode === 'duo'

  return (
    <div className={cn('w-full max-w-xl mx-auto', className)}>
      {/* 헤더 - WordReveal 적용 */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          <WordReveal text="거의 다 됐어요!" wordDelay={0.08} />
        </h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500"
        >
          작업에 이름을 붙여주세요
        </motion.p>
      </div>

      {/* 선택된 템플릿 정보 */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[20px] border border-gray-200 p-6 mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[16px] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-3xl shrink-0">
              {selectedTemplate.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 mb-0.5">선택한 틀</p>
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {selectedTemplate.title}
              </h3>
            </div>
            {isDuo && (
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-100 text-accent-700 text-sm font-medium rounded-full">
                  <Users className="w-4 h-4" />
                  듀오 모드
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 제목 입력 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-[20px] border border-gray-200 p-6"
      >
        <label
          htmlFor="work-title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          작업 제목
        </label>
        <input
          ref={inputRef}
          id="work-title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleKeyDown}
          placeholder="예: 우리의 첫 번째 작품"
          className={cn(
            'w-full px-4 py-3 border rounded-xl text-lg transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent',
            title.trim() ? 'border-primary-300' : 'border-gray-200'
          )}
          maxLength={MAX_TITLE_LENGTH}
          disabled={isNavigating}
          autoComplete="off"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">
            나중에 언제든 변경할 수 있어요
          </p>
          <p
            className={cn(
              'text-xs',
              title.length >= MAX_TITLE_LENGTH * 0.9
                ? 'text-orange-500'
                : 'text-gray-400'
            )}
          >
            {title.length}/{MAX_TITLE_LENGTH}
          </p>
        </div>
      </motion.div>

      {/* Duo 모드 안내 */}
      {isDuo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-4 bg-accent-50 border border-accent-200 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-200 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4 text-accent-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-accent-700 mb-1">
                듀오 모드로 시작해요
              </p>
              <p className="text-xs text-accent-600">
                작업을 시작한 후 초대 링크를 공유하면 친구가 함께 참여할 수 있어요
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 시작 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <Button
          size="lg"
          className="w-full"
          onClick={handleStart}
          disabled={!isValid || isNavigating}
        >
          {isNavigating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              준비 중...
            </>
          ) : (
            <>
              작업 시작하기
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  )
}
