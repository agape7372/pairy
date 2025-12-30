'use client'

import { useCallback, useRef, useState, useEffect, useMemo } from 'react'

/**
 * CSS Particle System Hook
 *
 * UX 서사: "마법 같은 순간에 반짝이는 축하의 빛"
 *
 * 특징:
 * - CSS 애니메이션 기반 (GPU 가속)
 * - JavaScript 최소화로 성능 최적화
 * - 접근성: prefers-reduced-motion 존중
 *
 * 사용 사례:
 * - 좋아요/북마크 성공 피드백
 * - 구매/결제 완료 축하
 * - 레벨업/업적 달성
 * - 협업 완료 축하
 */

// ============================================
// TYPES
// ============================================

export type ParticleType =
  | 'confetti'    // 색종이
  | 'sparkle'     // 반짝임
  | 'heart'       // 하트
  | 'star'        // 별
  | 'emoji'       // 이모지
  | 'bubble'      // 거품
  | 'snow'        // 눈송이

export type ParticleDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'radial'      // 원형으로 퍼짐
  | 'fountain'    // 분수처럼 위로 솟았다 내려옴

export interface Particle {
  id: string
  x: number
  y: number
  size: number
  color: string
  rotation: number
  duration: number
  delay: number
  type: ParticleType
  emoji?: string
  direction: ParticleDirection
  distance: number
}

export interface ParticleOptions {
  /** 파티클 개수 */
  count?: number
  /** 파티클 종류 */
  type?: ParticleType
  /** 이동 방향 */
  direction?: ParticleDirection
  /** 색상 배열 (랜덤 선택) */
  colors?: string[]
  /** 파티클 크기 범위 [min, max] */
  sizeRange?: [number, number]
  /** 애니메이션 지속 시간 (ms) */
  duration?: number
  /** 이동 거리 범위 [min, max] */
  distanceRange?: [number, number]
  /** 지속 파티클 (계속 생성) */
  continuous?: boolean
  /** 지속 파티클 간격 (ms) */
  interval?: number
  /** 이모지 배열 (emoji 타입일 때) */
  emojis?: string[]
  /** 중력 효과 */
  gravity?: boolean
  /** 스핀 효과 */
  spin?: boolean
  /** 페이드 아웃 */
  fadeOut?: boolean
  /** 시작 위치 랜덤화 범위 (px) */
  spread?: number
}

export interface ParticleContainerProps {
  particles: Particle[]
  className?: string
}

export interface UseParticleReturn {
  /** 파티클 컨테이너 ref */
  containerRef: React.RefObject<HTMLElement | null>
  /** 현재 활성 파티클들 */
  particles: Particle[]
  /** 파티클 생성 (특정 위치) */
  emit: (x?: number, y?: number, customOptions?: Partial<ParticleOptions>) => void
  /** 연속 파티클 시작 */
  startContinuous: () => void
  /** 연속 파티클 중지 */
  stopContinuous: () => void
  /** 모든 파티클 제거 */
  clear: () => void
  /** 활성화 여부 */
  isActive: boolean
  /** 연속 모드 활성화 여부 */
  isContinuous: boolean
  /** 파티클 컨테이너 컴포넌트 props */
  containerProps: ParticleContainerProps
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_COLORS = [
  '#FFD9D9', // primary-200
  '#FFCACA', // primary-300
  '#D7FAFA', // accent-200
  '#B8F0F0', // accent-300
  '#E8A8A8', // primary-400
  '#9FD9D9', // accent-400
]

const EMOJI_SETS: Record<string, string[]> = {
  celebration: ['🎉', '🎊', '✨', '💫', '🌟'],
  love: ['❤️', '💕', '💖', '💗', '💝'],
  nature: ['🌸', '🌺', '🌷', '🌹', '🌻'],
  stars: ['⭐', '🌟', '✨', '💫', '✦'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜'],
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/** 고유 ID 생성 */
function generateId(): string {
  return `particle-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** 범위 내 랜덤 숫자 */
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/** 배열에서 랜덤 선택 */
function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 방향에 따른 각도 계산 */
function getAngleForDirection(
  direction: ParticleDirection,
  index: number,
  total: number
): number {
  switch (direction) {
    case 'up':
      return -90 + randomInRange(-30, 30)
    case 'down':
      return 90 + randomInRange(-30, 30)
    case 'left':
      return 180 + randomInRange(-30, 30)
    case 'right':
      return randomInRange(-30, 30)
    case 'radial':
      return (360 / total) * index + randomInRange(-15, 15)
    case 'fountain':
      return -90 + randomInRange(-45, 45)
    default:
      return randomInRange(0, 360)
  }
}

/** 모션 감소 설정 확인 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * CSS 파티클 시스템 훅
 *
 * @example
 * ```tsx
 * const { containerRef, emit, containerProps } = useParticle({
 *   type: 'confetti',
 *   count: 30,
 *   direction: 'radial'
 * })
 *
 * return (
 *   <div ref={containerRef} className="relative">
 *     <button onClick={() => emit()}>Celebrate!</button>
 *     <ParticleContainer {...containerProps} />
 *   </div>
 * )
 * ```
 */
export function useParticle(options: ParticleOptions = {}): UseParticleReturn {
  const {
    count = 20,
    type = 'confetti',
    direction = 'radial',
    colors = DEFAULT_COLORS,
    sizeRange = [8, 16],
    duration = 1000,
    distanceRange = [50, 150],
    continuous: _continuous = false, // 향후 확장용
    interval = 100,
    emojis = EMOJI_SETS.celebration,
    gravity: _gravity = false, // 향후 확장용
    spin = true,
    fadeOut: _fadeOut = true, // 향후 확장용
    spread = 20,
  } = options
  void _continuous
  void _gravity
  void _fadeOut

  const containerRef = useRef<HTMLElement>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [isActive, setIsActive] = useState(false)
  const [isContinuous, setIsContinuous] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const cleanupTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())

  // 모션 감소 설정 확인
  const reducedMotion = useMemo(() => prefersReducedMotion(), [])

  // 파티클 생성
  const createParticles = useCallback(
    (
      originX: number,
      originY: number,
      customOptions?: Partial<ParticleOptions>
    ): Particle[] => {
      const opts = { ...options, ...customOptions }
      const particleCount = opts.count || count
      const particleColors = opts.colors || colors

      return Array.from({ length: particleCount }, (_, index) => {
        const angle = getAngleForDirection(
          opts.direction || direction,
          index,
          particleCount
        )
        const radians = (angle * Math.PI) / 180
        const distance = randomInRange(
          opts.distanceRange?.[0] || distanceRange[0],
          opts.distanceRange?.[1] || distanceRange[1]
        )

        return {
          id: generateId(),
          x: originX + randomInRange(-spread, spread),
          y: originY + randomInRange(-spread, spread),
          size: randomInRange(
            opts.sizeRange?.[0] || sizeRange[0],
            opts.sizeRange?.[1] || sizeRange[1]
          ),
          color: randomFromArray(particleColors),
          rotation: spin ? randomInRange(0, 360) : 0,
          duration: (opts.duration || duration) + randomInRange(-200, 200),
          delay: index * 20,
          type: opts.type || type,
          emoji:
            (opts.type || type) === 'emoji'
              ? randomFromArray(opts.emojis || emojis)
              : undefined,
          direction: opts.direction || direction,
          distance,
        }
      })
    },
    [
      options,
      count,
      colors,
      direction,
      distanceRange,
      spread,
      sizeRange,
      spin,
      duration,
      type,
      emojis,
    ]
  )

  // 파티클 발사
  const emit = useCallback(
    (x?: number, y?: number, customOptions?: Partial<ParticleOptions>) => {
      if (reducedMotion) return

      let originX = x ?? 0
      let originY = y ?? 0

      // 컨테이너 기준 좌표 계산
      if (containerRef.current && (x === undefined || y === undefined)) {
        const rect = containerRef.current.getBoundingClientRect()
        originX = x ?? rect.width / 2
        originY = y ?? rect.height / 2
      }

      const newParticles = createParticles(originX, originY, customOptions)
      setParticles((prev) => [...prev, ...newParticles])
      setIsActive(true)

      // 파티클 정리 타이머
      const maxDuration = Math.max(...newParticles.map((p) => p.duration + p.delay))
      const cleanupTimeout = setTimeout(() => {
        setParticles((prev) =>
          prev.filter((p) => !newParticles.some((np) => np.id === p.id))
        )
        cleanupTimeoutsRef.current.delete(cleanupTimeout)

        // 모든 파티클이 제거되면 비활성화
        setParticles((current) => {
          if (current.length === 0) {
            setIsActive(false)
          }
          return current
        })
      }, maxDuration + 100)

      cleanupTimeoutsRef.current.add(cleanupTimeout)
    },
    [reducedMotion, createParticles]
  )

  // 연속 파티클 시작
  const startContinuous = useCallback(() => {
    if (reducedMotion || isContinuous) return

    setIsContinuous(true)
    emit()

    intervalRef.current = setInterval(() => {
      emit()
    }, interval)
  }, [reducedMotion, isContinuous, emit, interval])

  // 연속 파티클 중지
  const stopContinuous = useCallback(() => {
    setIsContinuous(false)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // 모든 파티클 제거
  const clear = useCallback(() => {
    stopContinuous()
    setParticles([])
    setIsActive(false)

    // 모든 정리 타이머 취소
    cleanupTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
    cleanupTimeoutsRef.current.clear()
  }, [stopContinuous])

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      cleanupTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  // 컨테이너 props
  const containerProps: ParticleContainerProps = useMemo(
    () => ({
      particles,
      className: 'particle-container',
    }),
    [particles]
  )

  return {
    containerRef,
    particles,
    emit,
    startContinuous,
    stopContinuous,
    clear,
    isActive,
    isContinuous,
    containerProps,
  }
}

// ============================================
// PRESET HOOKS
// ============================================

/**
 * 축하 파티클 프리셋
 */
export function useCelebrationParticle() {
  return useParticle({
    type: 'confetti',
    count: 40,
    direction: 'fountain',
    colors: DEFAULT_COLORS,
    duration: 1200,
    distanceRange: [80, 200],
  })
}

/**
 * 좋아요 파티클 프리셋
 */
export function useLikeParticle() {
  return useParticle({
    type: 'heart',
    count: 8,
    direction: 'up',
    colors: ['#FFD9D9', '#FFCACA', '#E8A8A8'],
    sizeRange: [12, 20],
    duration: 800,
    distanceRange: [30, 60],
  })
}

/**
 * 반짝임 파티클 프리셋
 */
export function useSparkleParticle() {
  return useParticle({
    type: 'sparkle',
    count: 12,
    direction: 'radial',
    colors: ['#FFFFFF', '#FFD9D9', '#D7FAFA'],
    sizeRange: [4, 8],
    duration: 600,
    distanceRange: [20, 50],
  })
}

/**
 * 성공 파티클 프리셋
 */
export function useSuccessParticle() {
  return useParticle({
    type: 'emoji',
    count: 15,
    direction: 'radial',
    emojis: ['✨', '🎉', '💫', '⭐'],
    sizeRange: [16, 24],
    duration: 1000,
    distanceRange: [60, 120],
  })
}

// ============================================
// PARTICLE CONTAINER COMPONENT
// ============================================

/**
 * 파티클 렌더링 컴포넌트
 *
 * @example
 * ```tsx
 * <ParticleContainer particles={particles} />
 * ```
 */
export function ParticleContainer({
  particles,
  className = '',
}: ParticleContainerProps): React.ReactElement | null {
  if (particles.length === 0) return null

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none z-50 ${className}`}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <ParticleElement key={particle.id} particle={particle} />
      ))}
    </div>
  )
}

/**
 * 개별 파티클 엘리먼트
 */
function ParticleElement({ particle }: { particle: Particle }): React.ReactElement {
  const {
    x,
    y,
    size,
    color,
    rotation,
    duration,
    delay,
    type,
    emoji,
    direction,
    distance,
  } = particle

  // 방향에 따른 이동 좌표 계산
  const angle = useMemo(() => {
    switch (direction) {
      case 'up':
        return -90 + (Math.random() - 0.5) * 60
      case 'down':
        return 90 + (Math.random() - 0.5) * 60
      case 'left':
        return 180 + (Math.random() - 0.5) * 60
      case 'right':
        return (Math.random() - 0.5) * 60
      case 'fountain':
        return -90 + (Math.random() - 0.5) * 90
      default:
        return Math.random() * 360
    }
  }, [direction])

  const radians = (angle * Math.PI) / 180
  const endX = Math.cos(radians) * distance
  const endY = Math.sin(radians) * distance

  const style: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width: size,
    height: size,
    color,
    backgroundColor: type !== 'emoji' ? color : undefined,
    borderRadius: type === 'confetti' ? '2px' : '50%',
    transform: `rotate(${rotation}deg)`,
    animation: `particle-move ${duration}ms cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms forwards`,
    // CSS 변수로 이동 좌표 전달
    '--particle-x': `${endX}px`,
    '--particle-y': `${endY}px`,
    '--particle-rotate': `${rotation + (Math.random() * 360)}deg`,
  } as React.CSSProperties

  // 타입별 렌더링
  const renderContent = () => {
    switch (type) {
      case 'emoji':
        return (
          <span style={{ fontSize: size, lineHeight: 1 }}>
            {emoji}
          </span>
        )
      case 'heart':
        return <span style={{ fontSize: size }}>❤️</span>
      case 'star':
        return <span style={{ fontSize: size }}>⭐</span>
      case 'sparkle':
        return <span style={{ fontSize: size }}>✨</span>
      default:
        return null
    }
  }

  return (
    <div className="particle" style={style}>
      {renderContent()}
    </div>
  )
}

// ============================================
// EXPORTS
// ============================================

export default useParticle
