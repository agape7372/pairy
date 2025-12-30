'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

/**
 * Magnetic Hover Effect Hook
 *
 * UX 서사: "마우스가 끌어당기는 자석 같은 인터랙션"
 * 버튼이나 인터랙티브 요소가 마우스를 향해 살짝 이동하는 효과
 *
 * 사용 사례:
 * - CTA 버튼의 주목도 향상
 * - 네비게이션 아이템 강조
 * - 프리미엄 인터랙션 경험
 */

// ============================================
// TYPES
// ============================================

export interface MagneticHoverOptions {
  /** 자석 효과 강도 (0-1) */
  intensity?: number
  /** 효과 반경 (px) - 이 범위 안에 마우스가 들어오면 자석 효과 시작 */
  radius?: number
  /** 복귀 애니메이션 시간 (ms) */
  resetDuration?: number
  /** 활성화 여부 */
  disabled?: boolean
  /** 터치 디바이스에서도 활성화할지 */
  enableTouch?: boolean
  /** 스케일 효과 추가 */
  scale?: number
  /** 회전 효과 추가 (도) */
  rotate?: number
}

export interface MagneticPosition {
  x: number
  y: number
}

export interface MagneticHoverReturn {
  /** 요소에 연결할 ref */
  ref: React.RefObject<HTMLElement | null>
  /** 현재 오프셋 위치 */
  offset: MagneticPosition
  /** 호버 중인지 */
  isHovering: boolean
  /** 자석 범위 안에 있는지 */
  isInRange: boolean
  /** 스타일 객체 (직접 적용용) */
  style: React.CSSProperties
  /** transform 문자열 (수동 적용용) */
  transform: string
  /** 수동 리셋 */
  reset: () => void
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/** 두 점 사이의 거리 계산 */
function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

/** 값을 범위 내로 제한 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** 터치 디바이스 감지 */
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * 자석 효과 훅
 *
 * @example
 * ```tsx
 * const { ref, style, isHovering } = useMagneticHover({
 *   intensity: 0.3,
 *   radius: 100
 * })
 *
 * return (
 *   <button ref={ref} style={style} className="btn-primary">
 *     Click me
 *   </button>
 * )
 * ```
 */
export function useMagneticHover(
  options: MagneticHoverOptions = {}
): MagneticHoverReturn {
  const {
    intensity = 0.3,
    radius = 100,
    resetDuration = 300,
    disabled = false,
    enableTouch = false,
    scale = 1,
    rotate = 0,
  } = options

  const ref = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState<MagneticPosition>({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [isInRange, setIsInRange] = useState(false)
  const animationRef = useRef<number | null>(null)

  // 터치 디바이스에서 비활성화
  const isDisabled = useMemo(() => {
    if (disabled) return true
    if (!enableTouch && isTouchDevice()) return true
    return false
  }, [disabled, enableTouch])

  // 위치 리셋
  const reset = useCallback(() => {
    setOffset({ x: 0, y: 0 })
    setIsHovering(false)
    setIsInRange(false)
  }, [])

  // 마우스 이동 핸들러
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDisabled || !ref.current) return

      const element = ref.current
      const rect = element.getBoundingClientRect()

      // 요소 중심점
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // 마우스와 중심점 사이 거리
      const distance = getDistance(e.clientX, e.clientY, centerX, centerY)

      // 반경 내에 있는지 확인
      if (distance < radius) {
        setIsInRange(true)

        // 거리에 따른 효과 강도 (가까울수록 강함)
        const effectStrength = 1 - distance / radius

        // 오프셋 계산
        const maxOffset = 20 * intensity
        const offsetX = (e.clientX - centerX) * effectStrength * intensity
        const offsetY = (e.clientY - centerY) * effectStrength * intensity

        setOffset({
          x: clamp(offsetX, -maxOffset, maxOffset),
          y: clamp(offsetY, -maxOffset, maxOffset),
        })
      } else {
        setIsInRange(false)
        setOffset({ x: 0, y: 0 })
      }
    },
    [isDisabled, intensity, radius]
  )

  // 마우스 진입 핸들러
  const handleMouseEnter = useCallback(() => {
    if (isDisabled) return
    setIsHovering(true)
  }, [isDisabled])

  // 마우스 이탈 핸들러
  const handleMouseLeave = useCallback(() => {
    if (isDisabled) return
    setIsHovering(false)
    setIsInRange(false)

    // 부드러운 복귀 애니메이션
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const startOffset = { ...offset }
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / resetDuration, 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)

      setOffset({
        x: startOffset.x * (1 - eased),
        y: startOffset.y * (1 - eased),
      })

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [isDisabled, offset, resetDuration])

  // 이벤트 리스너 등록
  useEffect(() => {
    if (isDisabled) return

    // 문서 레벨에서 마우스 이동 추적 (반경 효과를 위해)
    document.addEventListener('mousemove', handleMouseMove, { passive: true })

    const element = ref.current
    if (element) {
      element.addEventListener('mouseenter', handleMouseEnter)
      element.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (element) {
        element.removeEventListener('mouseenter', handleMouseEnter)
        element.removeEventListener('mouseleave', handleMouseLeave)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isDisabled, handleMouseMove, handleMouseEnter, handleMouseLeave])

  // Transform 문자열 생성
  const transform = useMemo(() => {
    const transforms: string[] = []

    if (offset.x !== 0 || offset.y !== 0) {
      transforms.push(`translate(${offset.x}px, ${offset.y}px)`)
    }

    if (isHovering && scale !== 1) {
      transforms.push(`scale(${scale})`)
    }

    if (isHovering && rotate !== 0) {
      transforms.push(`rotate(${rotate}deg)`)
    }

    return transforms.join(' ') || 'none'
  }, [offset, isHovering, scale, rotate])

  // 스타일 객체
  const style = useMemo(
    (): React.CSSProperties => ({
      transform,
      transition: isHovering
        ? 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
        : `transform ${resetDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      willChange: 'transform',
    }),
    [transform, isHovering, resetDuration]
  )

  return {
    ref,
    offset,
    isHovering,
    isInRange,
    style,
    transform,
    reset,
  }
}

// ============================================
// MAGNETIC BUTTON WRAPPER HOOK
// ============================================

export interface MagneticButtonOptions extends MagneticHoverOptions {
  /** 내부 콘텐츠 반대 방향 이동 */
  inverseContent?: boolean
  /** 내부 콘텐츠 이동 강도 */
  contentIntensity?: number
}

/**
 * 자석 버튼 훅 (내부 콘텐츠 반대 이동 효과 포함)
 *
 * 버튼과 내부 텍스트가 서로 반대 방향으로 미세하게 이동하여
 * 더 역동적인 인터랙션 제공
 */
export function useMagneticButton(
  options: MagneticButtonOptions = {}
): MagneticHoverReturn & {
  /** 내부 콘텐츠에 적용할 스타일 */
  contentStyle: React.CSSProperties
  /** 내부 콘텐츠 transform */
  contentTransform: string
} {
  const { inverseContent = true, contentIntensity = 0.5, ...baseOptions } =
    options

  const baseReturn = useMagneticHover(baseOptions)

  // 내부 콘텐츠 transform (반대 방향)
  const contentTransform = useMemo(() => {
    if (!inverseContent) return 'none'

    const inverseX = -baseReturn.offset.x * contentIntensity
    const inverseY = -baseReturn.offset.y * contentIntensity

    if (inverseX === 0 && inverseY === 0) return 'none'

    return `translate(${inverseX}px, ${inverseY}px)`
  }, [inverseContent, contentIntensity, baseReturn.offset])

  const contentStyle = useMemo(
    (): React.CSSProperties => ({
      transform: contentTransform,
      transition: baseReturn.isHovering
        ? 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
        : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    }),
    [contentTransform, baseReturn.isHovering]
  )

  return {
    ...baseReturn,
    contentStyle,
    contentTransform,
  }
}

// ============================================
// EXPORTS
// ============================================

export default useMagneticHover
