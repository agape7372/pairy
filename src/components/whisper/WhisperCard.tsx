'use client'

/**
 * Sprint 35: Whisper 카드 컴포넌트
 *
 * 위스퍼 내용을 표시하는 인터랙티브 카드
 * - 블러(Blur) 처리된 상태에서 시작
 * - 호버/클릭 시 안개가 걷히듯 드러나는 애니메이션
 * - 읽은 후 사라지는 위스퍼는 가루처럼 사라지는 효과
 * - 감성적인 손글씨체 폰트 적용
 */

import React, { useCallback, useState, memo, useRef, useMemo } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { Gift, Clock, Sparkles, Check, AlertTriangle, Moon, Heart, Star, Flower2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { playClaimSound } from '@/lib/utils/whisperSound'
import type {
  Whisper,
  WhisperThemeConfig,
  WhisperCardRevealState,
} from '@/types/whisper'
import {
  WHISPER_THEMES,
  getWhisperTypeLabel,
  getGiftTypeLabel,
  hasGift,
  isLimited,
  isSoldOut,
} from '@/types/whisper'

// 테마별 아이콘 매핑
const THEME_ICONS: Record<WhisperThemeConfig['iconName'], typeof Moon> = {
  Moon,
  Heart,
  Star,
  Sparkles,
  Flower2,
}

// ============================================
// 타입 정의
// ============================================

interface WhisperCardProps {
  /** 위스퍼 데이터 */
  whisper: Whisper
  /** 선물 수령 콜백 */
  onClaim?: (whisper: Whisper) => Promise<void>
  /** 읽음 처리 콜백 */
  onRead?: (whisper: Whisper) => void
  /** 카드 닫기 콜백 */
  onClose?: () => void
  /** 읽기 전용 모드 (이미 읽은 위스퍼) */
  readOnly?: boolean
}

// ============================================
// 가루 파티클 컴포넌트 (사라지는 효과)
// ============================================

interface DustParticle {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
  angle: number
}

const DustEffect = memo(function DustEffect({
  show,
  theme,
}: {
  show: boolean
  theme: WhisperThemeConfig
}) {
  // useMemo로 파티클 생성 (show가 true일 때 한 번만 생성)
  const particles = useMemo<DustParticle[]>(() => {
    if (!show) return []
    // 고정된 시드값 사용으로 SSR/CSR 불일치 방지
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: ((i * 37) % 90) + 5, // 의사 랜덤
      y: ((i * 53) % 90) + 5,
      size: 2 + (i % 4),
      delay: (i % 10) * 0.03,
      duration: 0.8 + (i % 5) * 0.1,
      angle: (i * 73) % 360,
    }))
  }, [show])

  if (!show || particles.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={cn(
            'absolute rounded-full',
            theme.id === 'NIGHT' && 'bg-purple-300',
            theme.id === 'LOVE' && 'bg-pink-300',
            theme.id === 'GOLDEN' && 'bg-yellow-300',
            theme.id === 'MYSTIC' && 'bg-violet-300',
            theme.id === 'SPRING' && 'bg-teal-300'
          )}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            opacity: 0,
            scale: 0,
            x: Math.cos((p.angle * Math.PI) / 180) * 100,
            y: Math.sin((p.angle * Math.PI) / 180) * 100 - 50, // 위로 떠오름
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
})

// ============================================
// 안개 오버레이 컴포넌트
// ============================================

const MistOverlay = memo(function MistOverlay({
  revealed,
}: {
  revealed: boolean
}) {
  return (
    <motion.div
      className={cn(
        'absolute inset-0 pointer-events-none',
        'bg-gradient-to-b from-white/80 via-white/60 to-white/80'
      )}
      initial={{ opacity: 1 }}
      animate={{
        opacity: revealed ? 0 : 1,
        backdropFilter: revealed ? 'blur(0px)' : 'blur(8px)',
      }}
      transition={{
        duration: 0.8,
        ease: 'easeOut',
      }}
      style={{
        backdropFilter: revealed ? 'blur(0px)' : 'blur(8px)',
        WebkitBackdropFilter: revealed ? 'blur(0px)' : 'blur(8px)',
      }}
    >
      {/* 안개 효과 텍스트 */}
      {!revealed && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-gray-500 text-sm font-medium">
            탭하여 위스퍼 확인하기
          </p>
        </motion.div>
      )}
    </motion.div>
  )
})

// ============================================
// 선물 표시 컴포넌트
// ============================================

const GiftDisplay = memo(function GiftDisplay({
  whisper,
  theme,
  onClaim,
  isClaiming,
  claimed,
}: {
  whisper: Whisper
  theme: WhisperThemeConfig
  onClaim: () => void
  isClaiming: boolean
  claimed: boolean
}) {
  const gift = whisper.payload.gift
  if (!gift) return null

  const soldOut = isSoldOut(whisper)

  return (
    <motion.div
      className={cn(
        'mt-4 p-4 rounded-xl',
        'bg-white/10 backdrop-blur-sm border border-white/20'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', 'bg-white/20')}>
          <Gift className={cn('w-6 h-6', theme.accentColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('font-medium', theme.textColor)}>
            {getGiftTypeLabel(gift.type)}
          </p>
          <p className={cn('text-sm opacity-70', theme.textColor)}>
            {'stickerName' in gift && gift.stickerName}
            {'templateName' in gift && gift.templateName}
            {'couponCode' in gift && `쿠폰: ${gift.couponCode}`}
            {'contentTitle' in gift && gift.contentTitle}
          </p>
        </div>
      </div>

      {/* 선착순 정보 */}
      {isLimited(whisper) && (
        <div className="mt-3 flex items-center gap-2">
          <AlertTriangle className={cn('w-4 h-4', theme.accentColor)} />
          <p className={cn('text-xs', theme.textColor)}>
            선착순 {whisper.payload.limitedQuantity}명
            {whisper.payload.claimedCount && (
              <span className="opacity-70">
                {' '}
                ({whisper.payload.claimedCount}명 수령)
              </span>
            )}
          </p>
        </div>
      )}

      {/* 수령 버튼 */}
      <motion.button
        className={cn(
          'mt-3 w-full py-2.5 px-4 rounded-lg font-medium',
          'transition-all duration-200',
          claimed
            ? 'bg-white/20 text-white/60 cursor-default'
            : soldOut
            ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
            : 'bg-white/90 text-gray-900 hover:bg-white'
        )}
        onClick={onClaim}
        disabled={claimed || soldOut || isClaiming}
        whileHover={!claimed && !soldOut ? { scale: 1.02 } : {}}
        whileTap={!claimed && !soldOut ? { scale: 0.98 } : {}}
      >
        {isClaiming ? (
          <span className="flex items-center justify-center gap-2">
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            수령 중...
          </span>
        ) : claimed ? (
          <span className="flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            수령 완료
          </span>
        ) : soldOut ? (
          '마감되었습니다'
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            선물 수령하기
          </span>
        )}
      </motion.button>
    </motion.div>
  )
})

// ============================================
// 메인 카드 컴포넌트
// ============================================

export const WhisperCard = memo(function WhisperCard({
  whisper,
  onClaim,
  onRead,
  onClose,
  readOnly = false,
}: WhisperCardProps) {
  const [revealState, setRevealState] = useState<WhisperCardRevealState>(
    readOnly ? 'revealed' : 'blurred'
  )
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimed, setClaimed] = useState(whisper.status === 'CLAIMED')
  const [showDust, setShowDust] = useState(false)

  const theme = WHISPER_THEMES[whisper.theme]
  const cardRef = useRef<HTMLDivElement>(null)

  // 마우스 위치 추적 (광택 효과)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    },
    [mouseX, mouseY]
  )

  // 카드 클릭 (드러나기)
  const handleReveal = useCallback(() => {
    if (revealState === 'blurred') {
      setRevealState('revealing')

      // 애니메이션 후 revealed 상태로
      setTimeout(() => {
        setRevealState('revealed')
        onRead?.(whisper)
      }, 800)
    }
  }, [revealState, whisper, onRead])

  // 선물 수령
  const handleClaim = useCallback(async () => {
    if (!onClaim || isClaiming || claimed) return

    setIsClaiming(true)
    try {
      await onClaim(whisper)
      setClaimed(true)
      playClaimSound()
    } catch (error) {
      console.error('[WhisperCard] Claim failed:', error)
    } finally {
      setIsClaiming(false)
    }
  }, [whisper, onClaim, isClaiming, claimed])

  // 카드 닫기 (사라지는 위스퍼 처리)
  const handleClose = useCallback(() => {
    if (whisper.payload.ephemeral && revealState === 'revealed') {
      setShowDust(true)
      setRevealState('dissolving')

      setTimeout(() => {
        onClose?.()
      }, 1200)
    } else {
      onClose?.()
    }
  }, [whisper.payload.ephemeral, revealState, onClose])

  const isRevealed = revealState === 'revealed' || revealState === 'revealing'

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden rounded-3xl',
        'bg-gradient-to-br shadow-2xl',
        theme.backgroundGradient,
        theme.glowColor,
        revealState === 'blurred' && 'cursor-pointer'
      )}
      style={{
        maxWidth: 400,
        width: '100%',
      }}
      onClick={revealState === 'blurred' ? handleReveal : undefined}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: revealState === 'dissolving' ? 0 : 1,
        scale: revealState === 'dissolving' ? 0.8 : 1,
      }}
      transition={{ duration: 0.5 }}
      role={revealState === 'blurred' ? 'button' : undefined}
      tabIndex={revealState === 'blurred' ? 0 : undefined}
      onKeyDown={(e) => {
        if (revealState === 'blurred' && (e.key === 'Enter' || e.key === ' ')) {
          handleReveal()
        }
      }}
    >
      {/* 가루 효과 */}
      <DustEffect show={showDust} theme={theme} />

      {/* 안개 오버레이 */}
      <MistOverlay revealed={isRevealed} />

      {/* 메인 콘텐츠 */}
      <div className="relative p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {(() => {
              const ThemeIcon = THEME_ICONS[theme.iconName]
              return <ThemeIcon className={cn('w-6 h-6', theme.accentColor)} />
            })()}
            <span className={cn('text-sm font-medium', theme.accentColor)}>
              {getWhisperTypeLabel(whisper.whisperType)}
            </span>
          </div>

          {whisper.sentAt && (
            <div className={cn('flex items-center gap-1 text-xs opacity-60', theme.textColor)}>
              <Clock className="w-3 h-3" />
              {new Date(whisper.sentAt).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>

        {/* 메시지 본문 - 감성 폰트 */}
        <motion.div
          className={cn(
            'min-h-[100px]',
            theme.textColor
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: isRevealed ? 1 : 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p
            className="text-lg leading-relaxed whitespace-pre-wrap"
            style={{
              fontFamily: '"Nanum Myeongjo", serif',
              letterSpacing: '0.02em',
            }}
          >
            {whisper.payload.message}
          </p>
        </motion.div>

        {/* 선물 표시 */}
        {hasGift(whisper) && isRevealed && (
          <GiftDisplay
            whisper={whisper}
            theme={theme}
            onClaim={handleClaim}
            isClaiming={isClaiming}
            claimed={claimed}
          />
        )}

        {/* 닫기 버튼 */}
        {revealState === 'revealed' && onClose && (
          <motion.button
            className={cn(
              'mt-4 w-full py-2 text-sm',
              'rounded-lg border border-white/20',
              'transition-colors hover:bg-white/10',
              theme.textColor
            )}
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {whisper.payload.ephemeral ? '닫기 (이 위스퍼는 사라집니다)' : '닫기'}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
})

export default WhisperCard
