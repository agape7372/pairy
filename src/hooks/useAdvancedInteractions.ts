'use client'

// 변경 이유: 미사용 useCallback 제거
import { useRef, useEffect, useState } from 'react'
import { useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion'

/**
 * 고급 인터랙션 훅 모음
 * - Magnetic Effect: 마우스가 근처에 오면 요소가 끌려오는 효과
 * - Tilt Effect: 마우스 위치에 따라 3D 기울기 효과
 * - Smooth Spring: 고급 스프링 물리 설정
 */

// ============================================
// 스프링 설정 프리셋
// ============================================

export const springPresets = {
  // 기본 부드러운 스프링
  smooth: { stiffness: 260, damping: 20, mass: 0.5 },
  // 탄력있는 바운스
  bouncy: { stiffness: 400, damping: 15, mass: 0.8 },
  // 매우 부드러운 (고급스러운 느낌)
  gentle: { stiffness: 120, damping: 14, mass: 0.5 },
  // 빠른 반응
  snappy: { stiffness: 500, damping: 30, mass: 0.5 },
  // 액체 같은 느낌
  liquid: { stiffness: 180, damping: 25, mass: 1 },
}

// ============================================
// Quartic Out 이징 (고급 감속)
// ============================================

export const easingPresets = {
  // Quartic Out - 시작 빠르고 끝 아주 미세하게 감속
  quarticOut: [0.16, 1, 0.3, 1] as const,
  // Expo Out - 더 극적인 감속
  expoOut: [0.19, 1, 0.22, 1] as const,
  // Smooth - 부드러운 전환
  smooth: [0.4, 0, 0.2, 1] as const,
  // Anticipate - 살짝 뒤로 갔다 앞으로
  anticipate: [0.68, -0.55, 0.265, 1.55] as const,
}

// ============================================
// Magnetic Effect Hook
// ============================================

interface UseMagneticOptions {
  /** 자석 효과 강도 (0-1, 기본 0.3) */
  strength?: number
  /** 효과 범위 (px, 기본 100) */
  range?: number
  /** 스프링 설정 */
  springConfig?: typeof springPresets.smooth
  /** 비활성화 */
  disabled?: boolean
}

interface UseMagneticReturn {
  ref: React.RefObject<HTMLElement | null>
  x: MotionValue<number>
  y: MotionValue<number>
  isHovering: boolean
}

export function useMagnetic(options: UseMagneticOptions = {}): UseMagneticReturn {
  const {
    strength = 0.3,
    range = 100,
    springConfig = springPresets.gentle,
    disabled = false,
  } = options

  const ref = useRef<HTMLElement>(null)
  const [isHovering, setIsHovering] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  useEffect(() => {
    if (disabled || !ref.current) return

    const element = ref.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const distanceX = e.clientX - centerX
      const distanceY = e.clientY - centerY
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)

      if (distance < range) {
        setIsHovering(true)
        // 거리가 가까울수록 더 강하게 끌림
        const pull = (1 - distance / range) * strength
        x.set(distanceX * pull)
        y.set(distanceY * pull)
      } else if (isHovering) {
        setIsHovering(false)
        x.set(0)
        y.set(0)
      }
    }

    const handleMouseLeave = () => {
      setIsHovering(false)
      x.set(0)
      y.set(0)
    }

    // 전역 마우스 이벤트 리스너
    window.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [disabled, range, strength, x, y, isHovering])

  return { ref, x: springX, y: springY, isHovering }
}

// ============================================
// Tilt Effect Hook (3D 기울기)
// ============================================

interface UseTiltOptions {
  /** 최대 기울기 각도 (deg, 기본 10) */
  maxTilt?: number
  /** 원근 거리 (px, 기본 1000) */
  perspective?: number
  /** 스프링 설정 */
  springConfig?: typeof springPresets.smooth
  /** 비활성화 */
  disabled?: boolean
}

// 변경 이유: style.transform이 정적 값이 아닌 MotionValue를 반환하도록 수정
// 사용 방법: <motion.div style={{ transform, transformStyle: 'preserve-3d' }}>
interface UseTiltReturn {
  ref: React.RefObject<HTMLElement | null>
  rotateX: MotionValue<number>
  rotateY: MotionValue<number>
  isHovering: boolean
  /** MotionValue로 반환 - motion 컴포넌트의 style prop에 직접 사용 */
  transform: MotionValue<string>
  /** CSS transformStyle 속성값 */
  transformStyle: 'preserve-3d'
}

export function useTilt(options: UseTiltOptions = {}): UseTiltReturn {
  const {
    maxTilt = 10,
    perspective = 1000,
    springConfig = springPresets.gentle,
    disabled = false,
  } = options

  const ref = useRef<HTMLElement>(null)
  const [isHovering, setIsHovering] = useState(false)

  const rotateXValue = useMotionValue(0)
  const rotateYValue = useMotionValue(0)

  const rotateX = useSpring(rotateXValue, springConfig)
  const rotateY = useSpring(rotateYValue, springConfig)

  useEffect(() => {
    if (disabled || !ref.current) return

    const element = ref.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()

      // 0-1 범위로 정규화
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height

      // -maxTilt ~ +maxTilt 범위로 변환
      const tiltX = (0.5 - y) * maxTilt * 2
      const tiltY = (x - 0.5) * maxTilt * 2

      rotateXValue.set(tiltX)
      rotateYValue.set(tiltY)
    }

    const handleMouseEnter = () => setIsHovering(true)
    const handleMouseLeave = () => {
      setIsHovering(false)
      rotateXValue.set(0)
      rotateYValue.set(0)
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [disabled, maxTilt, rotateXValue, rotateYValue])

  // 변경 이유: useTransform 결과를 MotionValue로 직접 반환하여 반응형 업데이트 지원
  const transform = useTransform(
    [rotateX, rotateY],
    ([rx, ry]) => `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg)`
  )

  return {
    ref,
    rotateX,
    rotateY,
    isHovering,
    transform,
    transformStyle: 'preserve-3d' as const,
  }
}

// ============================================
// Staggered Children Hook
// ============================================

interface UseStaggerOptions {
  /** 각 자식 간 딜레이 (초, 기본 0.05) */
  staggerDelay?: number
  /** 시작 딜레이 (초, 기본 0) */
  initialDelay?: number
  /** 스프링 설정 */
  springConfig?: typeof springPresets.smooth
}

export function useStaggerConfig(childCount: number, options: UseStaggerOptions = {}) {
  const {
    staggerDelay = 0.05,
    initialDelay = 0,
    springConfig = springPresets.smooth,
  } = options

  return {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          delayChildren: initialDelay,
          staggerChildren: staggerDelay,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: 'spring',
          ...springConfig,
        },
      },
    },
  }
}

// ============================================
// Text Reveal Animation Config
// ============================================

interface TextRevealOptions {
  /** 각 글자 간 딜레이 (초) */
  charDelay?: number
  /** 각 단어 간 딜레이 (초) */
  wordDelay?: number
  /** 회전 각도 */
  rotateX?: number
  /** Y 이동 거리 */
  yOffset?: number
}

export function useTextRevealConfig(options: TextRevealOptions = {}) {
  const {
    charDelay = 0.03,
    wordDelay = 0.1,
    rotateX = 45,
    yOffset = 20,
  } = options

  return {
    container: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: charDelay,
        },
      },
    },
    char: {
      hidden: {
        opacity: 0,
        y: yOffset,
        rotateX: rotateX,
      },
      visible: {
        opacity: 1,
        y: 0,
        rotateX: 0,
        transition: {
          type: 'spring',
          ...springPresets.gentle,
        },
      },
    },
    word: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: charDelay,
          delayChildren: wordDelay,
        },
      },
    },
  }
}

// ============================================
// Smooth Value Hook (부드러운 값 전환)
// ============================================

export function useSmoothValue(
  value: number,
  springConfig: typeof springPresets.smooth = springPresets.gentle
) {
  const motionValue = useMotionValue(value)
  const springValue = useSpring(motionValue, springConfig)

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  return springValue
}
