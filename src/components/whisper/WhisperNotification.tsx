'use client'

/**
 * Sprint 35: Whisper 알림 컴포넌트
 *
 * 위스퍼 도착 시 화면 한구석에 조용히 나타나는 토스트 알림
 * - 반짝이는 말풍선 아이콘
 * - 부유하는 빛의 입자 효과
 * - 풍경 소리 효과
 */

import React, { useCallback, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { playWhisperSound } from '@/lib/utils/whisperSound'
import type { Whisper, WhisperThemeConfig } from '@/types/whisper'
import { WHISPER_THEMES, getWhisperTypeLabel } from '@/types/whisper'

// ============================================
// 타입 정의
// ============================================

interface WhisperNotificationProps {
  /** 도착한 위스퍼 */
  whisper: Whisper | null
  /** 알림 표시 여부 */
  show: boolean
  /** 알림 닫기 콜백 */
  onClose: () => void
  /** 위스퍼 클릭 콜백 (상세 보기) */
  onClick: (whisper: Whisper) => void
  /** 사운드 재생 여부 */
  playSound?: boolean
}

// ============================================
// 빛의 입자 컴포넌트
// ============================================

const Particle = memo(function Particle({
  index,
  theme,
}: {
  index: number
  theme: WhisperThemeConfig
}) {
  // 랜덤하지만 일관된 위치 (index 기반)
  const left = (index * 17 + 5) % 90 + 5
  const delay = (index * 0.3) % 2
  const duration = 2 + (index % 3)
  const size = 2 + (index % 3)

  return (
    <motion.div
      className={cn(
        'absolute rounded-full',
        theme.id === 'NIGHT' && 'bg-purple-300',
        theme.id === 'LOVE' && 'bg-pink-300',
        theme.id === 'GOLDEN' && 'bg-yellow-300',
        theme.id === 'MYSTIC' && 'bg-violet-300',
        theme.id === 'SPRING' && 'bg-teal-300'
      )}
      style={{
        left: `${left}%`,
        width: size,
        height: size,
      }}
      initial={{ y: '100%', opacity: 0 }}
      animate={{
        y: '-100%',
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  )
})

// ============================================
// 반짝이는 아이콘
// ============================================

const SparklingIcon = memo(function SparklingIcon({
  theme,
}: {
  theme: WhisperThemeConfig
}) {
  return (
    <div className="relative">
      {/* 글로우 효과 */}
      <motion.div
        className={cn(
          'absolute inset-0 rounded-full blur-md',
          theme.id === 'NIGHT' && 'bg-purple-400',
          theme.id === 'LOVE' && 'bg-pink-400',
          theme.id === 'GOLDEN' && 'bg-yellow-400',
          theme.id === 'MYSTIC' && 'bg-violet-400',
          theme.id === 'SPRING' && 'bg-teal-400'
        )}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 메인 아이콘 */}
      <motion.div
        className={cn(
          'relative w-10 h-10 rounded-full flex items-center justify-center',
          'bg-gradient-to-br',
          theme.backgroundGradient
        )}
        animate={{
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Sparkles className="w-5 h-5 text-white" />
      </motion.div>
    </div>
  )
})

// ============================================
// 메인 컴포넌트
// ============================================

export const WhisperNotification = memo(function WhisperNotification({
  whisper,
  show,
  onClose,
  onClick,
  playSound = true,
}: WhisperNotificationProps) {
  const hasPlayedRef = useRef(false)
  const prevShowRef = useRef(show)

  const theme = whisper ? WHISPER_THEMES[whisper.theme] : WHISPER_THEMES.NIGHT

  // 사운드 재생 (useRef로 상태 추적, setState 회피)
  useEffect(() => {
    // show가 false에서 true로 변경될 때 hasPlayed 리셋
    if (!prevShowRef.current && show) {
      hasPlayedRef.current = false
    }
    prevShowRef.current = show

    if (show && whisper && playSound && !hasPlayedRef.current) {
      playWhisperSound()
      hasPlayedRef.current = true
    }
  }, [show, whisper, playSound])

  // 자동 닫기 (10초)
  useEffect(() => {
    if (!show) return

    const timer = setTimeout(() => {
      onClose()
    }, 10000)

    return () => clearTimeout(timer)
  }, [show, onClose])

  const handleClick = useCallback(() => {
    if (whisper) {
      onClick(whisper)
      onClose()
    }
  }, [whisper, onClick, onClose])

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onClose()
    },
    [onClose]
  )

  return (
    <AnimatePresence>
      {show && whisper && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 300,
          }}
        >
          {/* 알림 카드 */}
          <motion.div
            className={cn(
              'relative overflow-hidden rounded-2xl cursor-pointer',
              'bg-gradient-to-br shadow-2xl',
              theme.backgroundGradient,
              theme.glowColor
            )}
            style={{
              minWidth: 280,
              maxWidth: 340,
            }}
            onClick={handleClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleClick()
              }
            }}
            aria-label="위스퍼 알림 열기"
          >
            {/* 빛의 입자들 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 8 }).map((_, i) => (
                <Particle key={i} index={i} theme={theme} />
              ))}
            </div>

            {/* 콘텐츠 */}
            <div className="relative p-4">
              <div className="flex items-start gap-3">
                {/* 반짝이는 아이콘 */}
                <SparklingIcon theme={theme} />

                {/* 텍스트 */}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', theme.textColor)}>
                    누군가의 위스퍼가 도착했습니다
                  </p>
                  <p className={cn('text-xs mt-0.5 opacity-80', theme.textColor)}>
                    {theme.icon} {getWhisperTypeLabel(whisper.whisperType)}
                    {whisper.payload.gift && ' • 선물 포함'}
                  </p>
                </div>

                {/* 닫기 버튼 */}
                <button
                  onClick={handleClose}
                  className={cn(
                    'p-1 rounded-full transition-colors',
                    'hover:bg-white/20',
                    theme.textColor
                  )}
                  aria-label="알림 닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 클릭 유도 텍스트 */}
              <motion.p
                className={cn(
                  'text-xs mt-3 text-center opacity-60',
                  theme.textColor
                )}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                탭하여 확인하기
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export default WhisperNotification
