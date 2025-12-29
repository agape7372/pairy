'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

/**
 * UX 서사: "사용자의 시선이 닿는 곳마다 콘텐츠가 피어나는 경험"
 * 스크롤 위치에 따라 요소가 자연스럽게 나타나는 효과를 제공합니다.
 */

interface UseScrollRevealOptions {
  /** 뷰포트에 얼마나 들어와야 트리거될지 (0-1) */
  threshold?: number
  /** 한 번만 애니메이션할지 */
  once?: boolean
  /** 루트 마진 (CSS 마진 형식) */
  rootMargin?: string
  /** 시작 시 비활성화 */
  disabled?: boolean
}

interface UseScrollRevealReturn {
  ref: React.RefObject<HTMLElement | null>
  isVisible: boolean
  hasAnimated: boolean
}

/**
 * 단일 요소의 스크롤 기반 애니메이션을 위한 훅
 * @example
 * const { ref, isVisible } = useScrollReveal({ threshold: 0.2 })
 * <div ref={ref} className={isVisible ? 'revealed' : ''}>...</div>
 */
export function useScrollReveal(
  options: UseScrollRevealOptions = {}
): UseScrollRevealReturn {
  const { threshold = 0.15, once = true, rootMargin = '0px', disabled = false } = options

  const ref = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (disabled || !ref.current) return

    // 이미 애니메이션됐고 once가 true면 스킵
    if (once && hasAnimated) return

    const element = ref.current

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            setHasAnimated(true)

            // once가 true면 관찰 중단
            if (once) {
              observer.unobserve(entry.target)
            }
          } else if (!once) {
            setIsVisible(false)
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, once, hasAnimated, disabled])

  return { ref, isVisible, hasAnimated }
}

/**
 * 여러 요소의 순차적 스크롤 애니메이션을 위한 훅
 * 컨테이너가 보이면 자식들이 순차적으로 나타납니다.
 * @example
 * const { containerRef, isRevealed } = useStaggerReveal()
 * <div ref={containerRef} className={`stagger-children ${isRevealed ? 'revealed' : ''}`}>
 *   <div>1</div>
 *   <div>2</div>
 * </div>
 */
export function useStaggerReveal(options: UseScrollRevealOptions = {}) {
  const { ref: containerRef, isVisible, hasAnimated } = useScrollReveal(options)

  return {
    containerRef,
    isRevealed: isVisible,
    hasAnimated,
  }
}

/**
 * 카운터 애니메이션을 위한 훅
 * 숫자가 0부터 목표값까지 부드럽게 증가합니다.
 * @example
 * const { ref, count, isAnimating } = useCountUp(1200, { duration: 2000 })
 * <span ref={ref}>{count.toLocaleString()}</span>
 */
interface UseCountUpOptions {
  /** 애니메이션 지속 시간 (ms) */
  duration?: number
  /** 시작 값 */
  startValue?: number
  /** 화면에 보일 때만 시작 */
  startOnView?: boolean
  /** 애니메이션 이징 */
  easing?: 'linear' | 'easeOut' | 'easeInOut'
}

interface UseCountUpReturn {
  ref: React.RefObject<HTMLElement | null>
  count: number
  isAnimating: boolean
}

export function useCountUp(
  endValue: number,
  options: UseCountUpOptions = {}
): UseCountUpReturn {
  const {
    duration = 2000,
    startValue = 0,
    startOnView = true,
    easing = 'easeOut',
  } = options

  const ref = useRef<HTMLElement>(null)
  const [count, setCount] = useState(startOnView ? startValue : endValue)
  const [isAnimating, setIsAnimating] = useState(false)
  const hasStarted = useRef(false)

  const easingFns = useMemo(() => ({
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  }), [])

  const startAnimation = useCallback(() => {
    if (hasStarted.current) return
    hasStarted.current = true
    setIsAnimating(true)

    const startTime = Date.now()
    const easeFn = easingFns[easing]

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeFn(progress)
      const currentValue = Math.round(
        startValue + (endValue - startValue) * easedProgress
      )

      setCount(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    requestAnimationFrame(animate)
  }, [duration, startValue, endValue, easing, easingFns])

  useEffect(() => {
    if (!startOnView) {
      // 비동기로 실행하여 cascading render 방지
      const frameId = requestAnimationFrame(() => startAnimation())
      return () => cancelAnimationFrame(frameId)
    }

    if (!ref.current) return

    const element = ref.current

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted.current) {
            startAnimation()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [startOnView, startAnimation])

  return { ref, count, isAnimating }
}

/**
 * 패럴랙스 스크롤 효과를 위한 훅
 * 스크롤에 따라 요소가 다른 속도로 움직입니다.
 * @example
 * const { ref, offset } = useParallax(0.5)
 * <div ref={ref} style={{ transform: `translateY(${offset}px)` }}>...</div>
 */
interface UseParallaxOptions {
  /** 움직임 속도 (음수면 반대 방향) */
  speed?: number
  /** 활성화 여부 */
  disabled?: boolean
}

interface UseParallaxReturn {
  ref: React.RefObject<HTMLElement | null>
  offset: number
}

export function useParallax(options: UseParallaxOptions = {}): UseParallaxReturn {
  const { speed = 0.5, disabled = false } = options

  const ref = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (disabled || !ref.current) return

    const element = ref.current

    const handleScroll = () => {
      const rect = element.getBoundingClientRect()
      const scrolled = window.scrollY
      const elementTop = rect.top + scrolled
      const viewportCenter = scrolled + window.innerHeight / 2
      const distanceFromCenter = elementTop - viewportCenter

      setOffset(distanceFromCenter * speed * 0.1)
    }

    // 초기값 설정
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed, disabled])

  return { ref, offset }
}

/**
 * 마우스 따라가기 효과를 위한 훅
 * 컨테이너 내에서 마우스 위치에 반응하는 효과를 만듭니다.
 * @example
 * const { ref, position, isHovering } = useMouseFollow()
 * <div ref={ref} style={{ background: `radial-gradient(at ${position.x}% ${position.y}%, ...)` }}>
 */
interface UseMouseFollowReturn {
  ref: React.RefObject<HTMLElement | null>
  position: { x: number; y: number }
  isHovering: boolean
}

export function useMouseFollow(): UseMouseFollowReturn {
  const ref = useRef<HTMLElement>(null)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const element = ref.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setPosition({ x, y })
    }

    const handleMouseEnter = () => setIsHovering(true)
    const handleMouseLeave = () => {
      setIsHovering(false)
      // 부드럽게 중앙으로 복귀
      setPosition({ x: 50, y: 50 })
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return { ref, position, isHovering }
}

export default useScrollReveal
