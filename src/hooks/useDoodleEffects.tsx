'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAnimation } from '@/contexts/AnimationContext'

/**
 * Doodle 모드 전용 효과 훅 모음
 * - 커서 트레일: 마우스 뒤로 점들이 따라옴
 * - Confetti: 성공/완료 시 별과 하트가 터짐
 * - 하이라이터: 텍스트 호버 시 형광펜 효과
 */

// ============================================
// 커서 트레일 효과
// ============================================

interface CursorTrailOptions {
  /** 트레일 점 개수 (기본 4, 최대 6) */
  count?: number
  /** 활성화 여부 */
  enabled?: boolean
  /** Doodle 모드에서만 활성화 */
  doodleOnly?: boolean
}

interface TrailDot {
  x: number
  y: number
}

// 변경 이유: count 최대값을 6으로 제한하여 ease가 음수가 되는 것 방지
const MAX_TRAIL_COUNT = 6

export function useCursorTrail(options: CursorTrailOptions = {}) {
  // 변경 이유: count를 MAX_TRAIL_COUNT로 제한하여 ease 음수 방지
  const { count: rawCount = 4, enabled = true, doodleOnly = true } = options
  const count = Math.min(rawCount, MAX_TRAIL_COUNT)
  const { mode } = useAnimation()

  const [isActive, setIsActive] = useState(false)
  const dotsRef = useRef<HTMLDivElement[]>([])
  const positionsRef = useRef<TrailDot[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number | undefined>(undefined)

  // Doodle 모드 체크
  const shouldRun = enabled && (!doodleOnly || mode === 'doodle')

  useEffect(() => {
    if (!shouldRun) {
      setIsActive(false)
      // 변경 이유: ref 배열 정리하여 메모리 누수 방지
      dotsRef.current = []
      return
    }

    // 초기 위치 설정
    positionsRef.current = Array.from({ length: count }, () => ({ x: 0, y: 0 }))

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      setIsActive(true)
    }

    const handleMouseLeave = () => {
      setIsActive(false)
    }

    // 애니메이션 루프
    const animate = () => {
      const { x: mouseX, y: mouseY } = mouseRef.current

      positionsRef.current.forEach((pos, i) => {
        const target = i === 0
          ? { x: mouseX, y: mouseY }
          : positionsRef.current[i - 1]

        // 변경 이유: ease 최소값을 0.05로 보장하여 항상 양수 유지
        const ease = Math.max(0.05, 0.2 - (i * 0.03))
        pos.x += (target.x - pos.x) * ease
        pos.y += (target.y - pos.y) * ease

        // DOM 업데이트
        const dot = dotsRef.current[i]
        if (dot) {
          dot.style.left = `${pos.x}px`
          dot.style.top = `${pos.y}px`
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      // 변경 이유: cleanup 시 ref 배열 정리
      dotsRef.current = []
    }
  }, [shouldRun, count])

  // 트레일 점 요소 생성
  const TrailDots = useCallback(() => {
    if (!shouldRun) return null

    return (
      <>
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              // 변경 이유: null 체크 후 할당, 언마운트 시 정리
              if (el) {
                dotsRef.current[i] = el
              }
            }}
            className={`cursor-trail-dot ${isActive ? 'active' : ''}`}
          />
        ))}
      </>
    )
  }, [count, isActive, shouldRun])

  return { TrailDots, isActive }
}

// ============================================
// Confetti 효과 (성공/완료 시)
// ============================================

interface ConfettiOptions {
  /** 파티클 개수 */
  count?: number
  /** 이모지 목록 */
  emojis?: string[]
  /** 지속 시간 (ms) */
  duration?: number
}

interface ConfettiParticle {
  id: string
  emoji: string
  x: number
  y: number
  tx: number
  ty: number
  tr: number
}

export function useConfetti(options: ConfettiOptions = {}) {
  const {
    count = 12,
    emojis = ['⭐', '✨', '💖', '🌟', '💫', '🎀'],
    duration = 800
  } = options

  const [particles, setParticles] = useState<ConfettiParticle[]>([])
  const { mode } = useAnimation()
  // 변경 이유: 언마운트 시 setTimeout 정리를 위한 ref
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 변경 이유: 컴포넌트 언마운트 시 timeout 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const trigger = useCallback((originX?: number, originY?: number) => {
    // Premium 모드에서는 다른 효과 사용
    if (mode === 'premium') {
      return
    }

    const x = originX ?? window.innerWidth / 2
    const y = originY ?? window.innerHeight / 2

    const newParticles: ConfettiParticle[] = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5)
      const distance = 60 + Math.random() * 80

      return {
        id: `confetti-${Date.now()}-${i}`,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x,
        y,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance - 30, // 위쪽으로 편향
        tr: Math.random() * 360,
      }
    })

    setParticles(newParticles)

    // 변경 이유: 이전 timeout 정리 후 새로 설정
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setParticles([])
    }, duration)
  }, [count, emojis, duration, mode])

  const ConfettiContainer = useCallback(() => {
    if (particles.length === 0) return null

    return (
      <div className="confetti-container">
        {particles.map((p) => (
          <span
            key={p.id}
            className="confetti"
            style={{
              left: p.x,
              top: p.y,
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              '--tr': `${p.tr}deg`,
            } as React.CSSProperties}
          >
            {p.emoji}
          </span>
        ))}
      </div>
    )
  }, [particles])

  return { trigger, ConfettiContainer, isActive: particles.length > 0 }
}

// ============================================
// Premium 성공 맥동 효과
// ============================================

export function useSuccessPulse() {
  const [isPulsing, setIsPulsing] = useState(false)
  const { mode } = useAnimation()
  // 변경 이유: 언마운트 시 setTimeout 정리를 위한 ref
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 변경 이유: 컴포넌트 언마운트 시 timeout 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const trigger = useCallback(() => {
    if (mode !== 'premium') return

    setIsPulsing(true)
    // 변경 이유: 이전 timeout 정리 후 새로 설정
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => setIsPulsing(false), 800)
  }, [mode])

  return { trigger, isPulsing, className: isPulsing ? 'success-pulse' : '' }
}

// ============================================
// 하이라이터 효과
// ============================================

interface UseHighlighterOptions {
  /** 자동 활성화 (호버 시) */
  autoActivate?: boolean
  /** 색상 (primary | accent) */
  variant?: 'primary' | 'accent'
}

export function useHighlighter(options: UseHighlighterOptions = {}) {
  const { autoActivate = true, variant = 'primary' } = options
  const [isActive, setIsActive] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!autoActivate || !ref.current) return

    const element = ref.current

    const handleMouseEnter = () => setIsActive(true)
    const handleMouseLeave = () => {
      // 유지 - 한 번 활성화되면 유지됨
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [autoActivate])

  const className = variant === 'accent'
    ? `highlighter-accent ${isActive ? 'active' : ''}`
    : `highlighter ${isActive ? 'active' : ''}`

  return { ref, isActive, setIsActive, className }
}

// ============================================
// 마우스 글로우 트래킹 (Premium)
// ============================================

interface UseMouseGlowOptions {
  /** 활성화 여부 */
  enabled?: boolean
  /** Premium 모드에서만 활성화 */
  premiumOnly?: boolean
}

export function useMouseGlow(options: UseMouseGlowOptions = {}) {
  const { enabled = true, premiumOnly = true } = options
  const { mode } = useAnimation()
  const ref = useRef<HTMLElement>(null)

  const shouldRun = enabled && (!premiumOnly || mode === 'premium')

  useEffect(() => {
    if (!shouldRun || !ref.current) return

    const element = ref.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      element.style.setProperty('--mouse-x', `${x}px`)
      element.style.setProperty('--mouse-y', `${y}px`)
    }

    element.addEventListener('mousemove', handleMouseMove)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
    }
  }, [shouldRun])

  const className = shouldRun ? 'mouse-glow-premium' : ''

  return { ref, className }
}

export default useCursorTrail
