'use client'

/**
 * Confetti - 축하 애니메이션 컴포넌트
 *
 * UX 서사: "작은 성취도 크게 축하받을 자격이 있다.
 *          창작의 매 순간을 특별하게 만드는 마법의 가루"
 *
 * 좋아요, 다운로드, 첫 작품 완성 등
 * 사용자의 작은 성취 순간을 축제로 만듭니다.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'
import { usePrefersReducedMotion } from '@/hooks/useAccessibility'

// 파티클 설정
interface Particle {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
  color: string
  shape: 'circle' | 'star' | 'heart' | 'square' | 'triangle'
  velocityX: number
  velocityY: number
  rotationSpeed: number
  opacity: number
}

// Pairy 테마 색상
const CONFETTI_COLORS = [
  '#FFD9D9', // primary-200
  '#FFCACA', // primary-300
  '#D7FAFA', // accent-200
  '#B8F0F0', // accent-300
  '#FFE8E8', // error-light (핑크)
  '#FFF8E8', // warning-light (옐로우)
  '#E8F5E8', // success-light (그린)
]

/**
 * Confetti 프리셋 상수
 * 상황에 맞는 축하 효과를 쉽게 선택할 수 있습니다.
 */
export const CONFETTI_PRESETS = {
  /** 기본 축하 */
  default: 'default',
  /** 하트 - 좋아요, 팔로우 등 */
  hearts: 'hearts',
  /** 별 - 레벨업, 업적 등 */
  stars: 'stars',
  /** 축제 - 마일스톤 달성 등 */
  celebration: 'celebration',
  /** 성공 - 작업 완료, 저장 등 */
  success: 'success',
} as const

// 파티클 모양 SVG
const shapes = {
  circle: (color: string) => (
    <circle cx="6" cy="6" r="6" fill={color} />
  ),
  star: (color: string) => (
    <path
      d="M6 0 L7.5 4.5 L12 4.5 L8.5 7.5 L10 12 L6 9 L2 12 L3.5 7.5 L0 4.5 L4.5 4.5 Z"
      fill={color}
    />
  ),
  heart: (color: string) => (
    <path
      d="M6 11 C2 7, 0 4, 3 2 C4.5 1.5, 6 2.5, 6 4 C6 2.5, 7.5 1.5, 9 2 C12 4, 10 7, 6 11 Z"
      fill={color}
    />
  ),
  square: (color: string) => (
    <rect x="1" y="1" width="10" height="10" rx="2" fill={color} />
  ),
  triangle: (color: string) => (
    <polygon points="6,0 12,12 0,12" fill={color} />
  ),
}

interface ConfettiProps {
  /** 활성화 여부 */
  isActive: boolean
  /** 파티클 개수 */
  particleCount?: number
  /** 지속 시간 (ms) */
  duration?: number
  /** 애니메이션 완료 콜백 */
  onComplete?: () => void
  /** 발사 위치 (기본: 화면 중앙) */
  origin?: { x: number; y: number }
  /** 축하 종류에 따른 프리셋 */
  preset?: 'default' | 'hearts' | 'stars' | 'celebration' | 'success'
}

export function Confetti({
  isActive,
  particleCount = 50,
  duration = 3000,
  onComplete,
  origin,
  preset = 'default',
}: ConfettiProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [particles, setParticles] = useState<Particle[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const animationRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // 프리셋별 설정
  const getPresetConfig = useCallback(() => {
    switch (preset) {
      case 'hearts':
        return { shapes: ['heart'] as const, colors: ['#FFD9D9', '#FFCACA', '#E8A8A8'] }
      case 'stars':
        return { shapes: ['star'] as const, colors: ['#FFE8E8', '#FFF8E8', '#FFD9D9'] }
      case 'success':
        return { shapes: ['star', 'circle'] as const, colors: ['#E8F5E8', '#6BBF6B', '#D7FAFA'] }
      case 'celebration':
        return { shapes: ['star', 'heart', 'circle'] as const, colors: CONFETTI_COLORS }
      default:
        return { shapes: ['circle', 'square', 'triangle'] as const, colors: CONFETTI_COLORS }
    }
  }, [preset])

  // 파티클 생성
  const createParticles = useCallback(() => {
    const config = getPresetConfig()
    const centerX = origin?.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 500)
    const centerY = origin?.y ?? (typeof window !== 'undefined' ? window.innerHeight / 3 : 200)

    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: centerX + (Math.random() - 0.5) * 100,
      y: centerY,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      shape: config.shapes[Math.floor(Math.random() * config.shapes.length)] as Particle['shape'],
      velocityX: (Math.random() - 0.5) * 15,
      velocityY: -10 - Math.random() * 10,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    }))
  }, [particleCount, origin, getPresetConfig])

  // 애니메이션 루프
  useEffect(() => {
    if (!isActive || prefersReducedMotion) {
      setParticles([])
      return
    }

    // 파티클 생성
    setParticles(createParticles())

    const startTime = performance.now()
    const gravity = 0.3
    const friction = 0.99

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime

      if (elapsed >= duration) {
        setParticles([])
        onComplete?.()
        return
      }

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.velocityX,
          y: p.y + p.velocityY,
          velocityX: p.velocityX * friction,
          velocityY: p.velocityY + gravity,
          rotation: p.rotation + p.rotationSpeed,
          opacity: Math.max(0, 1 - elapsed / duration),
        }))
      )

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, duration, onComplete, createParticles, prefersReducedMotion])

  // 클라이언트 마운트 감지
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 모션 감소 설정 시 아무것도 렌더링하지 않음
  if (prefersReducedMotion || !isMounted || !isActive || particles.length === 0) {
    return null
  }

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <svg
          key={particle.id}
          className="absolute"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          style={{
            left: particle.x,
            top: particle.y,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            opacity: particle.opacity,
            willChange: 'transform, opacity',
          }}
        >
          {shapes[particle.shape](particle.color)}
        </svg>
      ))}
    </div>,
    document.body
  )
}

/**
 * 간편한 축하 훅
 *
 * @example
 * const { celebrate, ConfettiComponent } = useCelebration()
 *
 * return (
 *   <>
 *     <button onClick={() => celebrate('hearts')}>좋아요!</button>
 *     <ConfettiComponent />
 *   </>
 * )
 */
export function useCelebration() {
  const [isActive, setIsActive] = useState(false)
  const [preset, setPreset] = useState<ConfettiProps['preset']>('default')
  const [origin, setOrigin] = useState<{ x: number; y: number } | undefined>()

  const celebrate = useCallback((
    celebrationType: ConfettiProps['preset'] = 'default',
    position?: { x: number; y: number }
  ) => {
    setPreset(celebrationType)
    setOrigin(position)
    setIsActive(true)
  }, [])

  const ConfettiComponent = useCallback(
    () => (
      <Confetti
        isActive={isActive}
        preset={preset}
        origin={origin}
        onComplete={() => setIsActive(false)}
      />
    ),
    [isActive, preset, origin]
  )

  return { celebrate, ConfettiComponent, isActive }
}

/**
 * 작은 성공 펄스 애니메이션 (Confetti의 경량 버전)
 *
 * UX 서사: "작은 성취에도 은은한 빛이 번진다"
 */
export function SuccessPulse({
  isActive,
  className,
  children,
}: {
  isActive: boolean
  className?: string
  children: React.ReactNode
}) {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <span
      className={cn(
        'relative inline-block',
        isActive && !prefersReducedMotion && 'success-pulse',
        className
      )}
    >
      {children}
    </span>
  )
}

export default Confetti
