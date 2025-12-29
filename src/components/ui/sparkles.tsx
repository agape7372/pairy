'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

// ============================================
// 손그림 스타일 별 SVG들 (Doodle Style)
// Vecteezy 레퍼런스: 불규칙한 손그림 느낌의 별
// ============================================

// 4각 별 - 가장 기본적인 반짝임
const StarFour = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
  </svg>
)

// 6각 별 - 조금 더 복잡한 반짝임
const StarSix = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M12 0L13.5 8.5L20 4L15.5 10.5L24 12L15.5 13.5L20 20L13.5 15.5L12 24L10.5 15.5L4 20L8.5 13.5L0 12L8.5 10.5L4 4L10.5 8.5Z" />
  </svg>
)

// 둥근 별 - 부드러운 글로우용
const StarRound = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <circle cx="12" cy="12" r="4" />
  </svg>
)

// 손그림 스타일 5각 별
const StarDoodle = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M12 2L14.5 9L22 9.5L16.5 14L18 21.5L12 17.5L6 21.5L7.5 14L2 9.5L9.5 9Z" />
  </svg>
)

// 작은 점
const Dot = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 8 8" fill="currentColor" className={className} style={style}>
    <circle cx="4" cy="4" r="3" />
  </svg>
)

const STAR_TYPES = {
  four: StarFour,
  six: StarSix,
  round: StarRound,
  doodle: StarDoodle,
  dot: Dot,
} as const

type StarType = keyof typeof STAR_TYPES

// ============================================
// 개별 반짝이 인스턴스
// ============================================

interface StarInstance {
  id: string
  type: StarType
  size: number
  x: number
  y: number
  delay: number
  duration: number
  color: string
  glow: boolean
}

// ============================================
// DoodleStars - 손그림 스타일 깜빡이는 별들
// Vecteezy 레퍼런스와 유사한 효과
// ============================================

interface DoodleStarsProps {
  /** 별 개수 */
  count?: number
  /** 색상 팔레트 */
  colors?: string[]
  /** 최소 크기 (px) */
  minSize?: number
  /** 최대 크기 (px) */
  maxSize?: number
  /** 클래스명 */
  className?: string
  /** 글로우 효과 비율 (0-1) */
  glowRatio?: number
}

export function DoodleStars({
  count = 15,
  colors = ['#FFD9D9', '#FFEAEA', '#D7FAFA', '#FFF5CC', '#E8D7FA'],
  minSize = 8,
  maxSize = 24,
  className,
  glowRatio = 0.4,
}: DoodleStarsProps) {
  const stars = useMemo(() => {
    const starTypes: StarType[] = ['four', 'six', 'doodle', 'dot']

    return Array.from({ length: count }, (_, i) => ({
      id: `star-${i}`,
      type: starTypes[Math.floor(Math.random() * starTypes.length)],
      size: Math.random() * (maxSize - minSize) + minSize,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4, // 0~4초 랜덤 딜레이
      duration: Math.random() * 2 + 1.5, // 1.5~3.5초
      color: colors[Math.floor(Math.random() * colors.length)],
      glow: Math.random() < glowRatio,
    }))
  }, [count, colors, minSize, maxSize, glowRatio])

  return (
    <div className={cn('doodle-stars', className)}>
      {stars.map((star) => {
        const StarComponent = STAR_TYPES[star.type]
        return (
          <div
            key={star.id}
            className={cn('doodle-star', star.glow && 'doodle-star--glow')}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              color: star.color,
              width: star.size,
              height: star.size,
              '--delay': `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            } as React.CSSProperties}
          >
            <StarComponent style={{ width: '100%', height: '100%' }} />
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// Sparkles - Framer Motion 기반 (기존 호환)
// ============================================

interface SparklesProps {
  /** 반짝이 개수 */
  count?: number
  /** 색상 팔레트 */
  colors?: string[]
  /** 최소 크기 (px) */
  minSize?: number
  /** 최대 크기 (px) */
  maxSize?: number
  /** 클래스명 */
  className?: string
  /** children을 감싸며 반짝이 효과 적용 */
  children?: React.ReactNode
}

export function Sparkles({
  count = 12,
  colors = ['#FFD9D9', '#FFEAEA', '#D7FAFA', '#FFF5CC', '#E8D7FA'],
  minSize = 8,
  maxSize = 20,
  className,
  children,
}: SparklesProps) {
  const stars = useMemo(() => {
    const starTypes: StarType[] = ['four', 'six', 'doodle']

    return Array.from({ length: count }, (_, i) => ({
      id: `sparkle-${i}`,
      type: starTypes[Math.floor(Math.random() * starTypes.length)],
      size: Math.random() * (maxSize - minSize) + minSize,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      duration: Math.random() * 1.5 + 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      glow: Math.random() < 0.3,
    }))
  }, [count, colors, minSize, maxSize])

  return (
    <div className={cn('relative', className)}>
      {/* 반짝이 레이어 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => {
          const StarComponent = STAR_TYPES[star.type]
          return (
            <motion.div
              key={star.id}
              className="absolute pointer-events-none"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                color: star.color,
                filter: star.glow ? `drop-shadow(0 0 ${star.size * 0.5}px ${star.color})` : undefined,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0.8, 1, 0],
                scale: [0, 1.2, 0.9, 1.1, 0],
                rotate: [0, 10, -5, 5, 0],
              }}
              transition={{
                duration: star.duration,
                delay: star.delay,
                repeat: Infinity,
                repeatDelay: Math.random() * 2 + 1,
                ease: 'easeInOut',
              }}
            >
              <StarComponent style={{ width: star.size, height: star.size }} />
            </motion.div>
          )
        })}
      </div>
      {/* 컨텐츠 */}
      {children}
    </div>
  )
}

// ============================================
// 글리터 효과 (더 작고 많은 입자)
// ============================================

interface GlitterProps {
  /** 입자 개수 */
  count?: number
  /** 색상 */
  color?: string
  /** 클래스명 */
  className?: string
}

export function Glitter({
  count = 30,
  color = '#FFD9D9',
  className,
}: GlitterProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: `glitter-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1, // 1px ~ 4px
      delay: Math.random() * 5,
      duration: Math.random() * 2 + 0.5,
    }))
  }, [count])

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// 인라인 반짝이 (텍스트 옆에 붙는 작은 별)
// ============================================

interface InlineSparkleProps {
  /** 색상 */
  color?: string
  /** 크기 */
  size?: number
  /** 클래스명 */
  className?: string
}

export function InlineSparkle({
  color = '#FFD9D9',
  size = 16,
  className,
}: InlineSparkleProps) {
  return (
    <motion.span
      className={cn('inline-block', className)}
      style={{ color, filter: `drop-shadow(0 0 4px ${color})` }}
      animate={{
        opacity: [0.5, 1, 0.5],
        scale: [0.9, 1.1, 0.9],
        rotate: [0, 10, -10, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <StarFour style={{ width: size, height: size }} />
    </motion.span>
  )
}

// ============================================
// 버튼/카드 호버 시 반짝이 효과
// ============================================

interface HoverSparkleInstance {
  id: string
  type: StarType
  size: number
  x: number
  y: number
  color: string
}

interface HoverSparklesProps {
  /** 활성화 여부 */
  active?: boolean
  /** 색상 팔레트 */
  colors?: string[]
  /** 클래스명 */
  className?: string
}

export function HoverSparkles({
  active = false,
  colors = ['#FFD9D9', '#D7FAFA', '#FFF5CC'],
  className,
}: HoverSparklesProps) {
  const [sparkles, setSparkles] = useState<HoverSparkleInstance[]>([])

  useEffect(() => {
    if (!active) {
      setSparkles([])
      return
    }

    const starTypes: StarType[] = ['four', 'six', 'doodle']

    // 호버 시 반짝이 생성
    const newSparkles = Array.from({ length: 6 }, (_, i) => ({
      id: `hover-${Date.now()}-${i}`,
      type: starTypes[Math.floor(Math.random() * starTypes.length)],
      size: Math.random() * 12 + 8,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))

    setSparkles(newSparkles)

    // 일정 시간 후 제거
    const timer = setTimeout(() => {
      setSparkles([])
    }, 1000)

    return () => clearTimeout(timer)
  }, [active, colors])

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <AnimatePresence>
        {sparkles.map((sparkle) => {
          const StarComponent = STAR_TYPES[sparkle.type]
          return (
            <motion.div
              key={sparkle.id}
              className="absolute"
              style={{
                left: `${sparkle.x}%`,
                top: `${sparkle.y}%`,
                color: sparkle.color,
                filter: `drop-shadow(0 0 6px ${sparkle.color})`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StarComponent style={{ width: sparkle.size, height: sparkle.size }} />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
