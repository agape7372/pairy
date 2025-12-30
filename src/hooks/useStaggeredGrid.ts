'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

/**
 * Staggered Grid Animation Hook
 *
 * UX 서사: "순차적으로 피어나는 카드들, 마치 꽃밭이 열리듯"
 *
 * 사용 사례:
 * - 템플릿 그리드 목록의 순차 등장
 * - 갤러리 이미지들의 캐스케이드 애니메이션
 * - 대시보드 카드들의 로드 시퀀스
 */

// ============================================
// TYPES
// ============================================

export interface StaggeredGridOptions {
  /** 그리드가 뷰포트에 얼마나 들어와야 시작할지 (0-1) */
  threshold?: number
  /** 각 아이템 사이의 딜레이 (ms) */
  staggerDelay?: number
  /** 기본 애니메이션 지속 시간 (ms) */
  duration?: number
  /** 한 번만 애니메이션할지 */
  once?: boolean
  /** 루트 마진 */
  rootMargin?: string
  /** 활성화 여부 */
  disabled?: boolean
  /** 초기 지연 (ms) */
  initialDelay?: number
  /** 애니메이션 방향 */
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'
}

export interface StaggeredGridReturn {
  /** 컨테이너에 연결할 ref */
  containerRef: React.RefObject<HTMLElement | null>
  /** 그리드가 보이는지 여부 */
  isVisible: boolean
  /** 애니메이션이 완료되었는지 */
  hasAnimated: boolean
  /** 개별 아이템의 스타일 계산 함수 */
  getItemStyle: (index: number) => React.CSSProperties
  /** 개별 아이템의 클래스 계산 함수 */
  getItemClass: (index: number) => string
  /** 수동으로 애니메이션 트리거 */
  triggerAnimation: () => void
  /** 애니메이션 리셋 */
  resetAnimation: () => void
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * 스태거드 그리드 애니메이션 훅
 *
 * @example
 * ```tsx
 * const { containerRef, isVisible, getItemStyle } = useStaggeredGrid({
 *   staggerDelay: 50,
 *   direction: 'up'
 * })
 *
 * return (
 *   <div ref={containerRef} className="grid grid-cols-4 gap-4">
 *     {items.map((item, index) => (
 *       <div key={item.id} style={getItemStyle(index)}>
 *         {item.content}
 *       </div>
 *     ))}
 *   </div>
 * )
 * ```
 */
export function useStaggeredGrid(
  options: StaggeredGridOptions = {}
): StaggeredGridReturn {
  const {
    threshold = 0.1,
    staggerDelay = 50,
    duration = 500,
    once = true,
    rootMargin = '0px 0px -50px 0px',
    disabled = false,
    initialDelay = 0,
    direction = 'up',
  } = options

  const containerRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)

  // 수동 트리거
  const triggerAnimation = useCallback(() => {
    setIsVisible(true)
    setHasAnimated(true)
  }, [])

  // 리셋
  const resetAnimation = useCallback(() => {
    setIsVisible(false)
    setHasAnimated(false)
  }, [])

  // IntersectionObserver 설정
  useEffect(() => {
    if (disabled || !containerRef.current) return
    if (once && hasAnimated) return

    const element = containerRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 초기 지연 후 애니메이션 시작
            if (initialDelay > 0) {
              const timeoutId = setTimeout(() => {
                setIsVisible(true)
                setHasAnimated(true)
              }, initialDelay)
              return () => clearTimeout(timeoutId)
            } else {
              setIsVisible(true)
              setHasAnimated(true)
            }

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

    return () => observer.disconnect()
  }, [threshold, rootMargin, once, hasAnimated, disabled, initialDelay])

  // 방향별 초기 transform 값
  const getInitialTransform = useMemo(() => {
    const transforms: Record<string, string> = {
      up: 'translateY(30px)',
      down: 'translateY(-30px)',
      left: 'translateX(30px)',
      right: 'translateX(-30px)',
      scale: 'scale(0.9)',
      fade: 'none',
    }
    return transforms[direction] || transforms.up
  }, [direction])

  // 개별 아이템 스타일 계산
  const getItemStyle = useCallback(
    (index: number): React.CSSProperties => {
      const delay = index * staggerDelay

      if (!isVisible) {
        return {
          opacity: 0,
          transform: getInitialTransform,
          transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        }
      }

      return {
        opacity: 1,
        transform: 'none',
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }
    },
    [isVisible, staggerDelay, duration, getInitialTransform]
  )

  // 개별 아이템 클래스 계산 (CSS 기반 애니메이션용)
  const getItemClass = useCallback(
    (index: number): string => {
      const baseClass = 'stagger-item'
      const visibleClass = isVisible ? 'is-visible' : ''
      const delayClass = `stagger-delay-${index}`
      return `${baseClass} ${visibleClass} ${delayClass}`.trim()
    },
    [isVisible]
  )

  return {
    containerRef,
    isVisible,
    hasAnimated,
    getItemStyle,
    getItemClass,
    triggerAnimation,
    resetAnimation,
  }
}

// ============================================
// ADVANCED STAGGERED GRID (성능 최적화)
// ============================================

export interface AdvancedStaggeredGridOptions extends StaggeredGridOptions {
  /** 동시에 애니메이션할 최대 아이템 수 */
  maxConcurrent?: number
  /** 청크 단위 애니메이션 (성능 최적화) */
  chunkSize?: number
  /** 청크 간 딜레이 */
  chunkDelay?: number
}

/**
 * 고급 스태거드 그리드 (대량 아이템 최적화)
 *
 * 대량의 아이템을 청크 단위로 나누어 순차 애니메이션
 * 메모리/CPU 사용량 최적화
 */
export function useAdvancedStaggeredGrid(
  itemCount: number,
  options: AdvancedStaggeredGridOptions = {}
): StaggeredGridReturn & {
  /** 현재 보이는 아이템 인덱스들 */
  visibleIndices: Set<number>
  /** 특정 아이템이 보이는지 확인 */
  isItemVisible: (index: number) => boolean
} {
  const {
    chunkSize = 8,
    chunkDelay = 100,
    staggerDelay = 40,
    ...baseOptions
  } = options

  const baseReturn = useStaggeredGrid({
    ...baseOptions,
    staggerDelay,
  })

  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set())
  const animationRef = useRef<number | null>(null)

  // 청크 기반 순차 표시
  useEffect(() => {
    if (!baseReturn.isVisible) {
      setVisibleIndices(new Set())
      return
    }

    let currentChunk = 0
    const totalChunks = Math.ceil(itemCount / chunkSize)

    const animateNextChunk = () => {
      if (currentChunk >= totalChunks) return

      const startIndex = currentChunk * chunkSize
      const endIndex = Math.min(startIndex + chunkSize, itemCount)

      setVisibleIndices((prev) => {
        const next = new Set(prev)
        for (let i = startIndex; i < endIndex; i++) {
          next.add(i)
        }
        return next
      })

      currentChunk++

      if (currentChunk < totalChunks) {
        animationRef.current = window.setTimeout(animateNextChunk, chunkDelay)
      }
    }

    animateNextChunk()

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [baseReturn.isVisible, itemCount, chunkSize, chunkDelay])

  const isItemVisible = useCallback(
    (index: number): boolean => visibleIndices.has(index),
    [visibleIndices]
  )

  // 청크 기반 스타일 계산
  const getItemStyle = useCallback(
    (index: number): React.CSSProperties => {
      const indexInChunk = index % chunkSize
      const delay = indexInChunk * staggerDelay

      if (!visibleIndices.has(index)) {
        return {
          opacity: 0,
          transform: 'translateY(20px)',
          transition: `opacity 400ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 400ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        }
      }

      return {
        opacity: 1,
        transform: 'none',
        transition: `opacity 400ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 400ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }
    },
    [visibleIndices, chunkSize, staggerDelay]
  )

  return {
    ...baseReturn,
    getItemStyle,
    visibleIndices,
    isItemVisible,
  }
}

// ============================================
// EXPORTS
// ============================================

export default useStaggeredGrid
