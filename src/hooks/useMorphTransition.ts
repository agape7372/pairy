'use client'

import { useCallback, useRef, useState, useEffect, useMemo } from 'react'

/**
 * Morph Transition Hook
 *
 * UX 서사: "형태가 자연스럽게 변화하며 이야기가 전환되는 순간"
 *
 * 특징:
 * - FLIP 애니메이션 기법 (First, Last, Invert, Play)
 * - GPU 가속 transform 사용
 * - 부드러운 상태 전환
 *
 * 사용 사례:
 * - 카드 확대/축소 트랜지션
 * - 리스트 → 상세 전환
 * - 레이아웃 변경 애니메이션
 * - 모달 열기/닫기
 */

// ============================================
// TYPES
// ============================================

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface MorphState {
  /** 현재 위치/크기 */
  rect: Rect | null
  /** 애니메이션 중인지 */
  isAnimating: boolean
  /** 현재 상태 (source/target) */
  currentState: 'source' | 'target' | null
}

export interface MorphTransitionOptions {
  /** 애니메이션 지속 시간 (ms) */
  duration?: number
  /** 이징 함수 */
  easing?: string
  /** 애니메이션 시작 콜백 */
  onStart?: () => void
  /** 애니메이션 완료 콜백 */
  onComplete?: () => void
  /** 스케일 애니메이션 포함 */
  scale?: boolean
  /** 페이드 애니메이션 포함 */
  fade?: boolean
  /** 지연 시간 (ms) */
  delay?: number
}

export interface MorphTransitionReturn {
  /** 소스 요소에 연결할 ref */
  sourceRef: React.RefObject<HTMLElement | null>
  /** 타겟 요소에 연결할 ref */
  targetRef: React.RefObject<HTMLElement | null>
  /** 현재 상태 */
  state: MorphState
  /** 소스 → 타겟 전환 */
  morphToTarget: () => void
  /** 타겟 → 소스 전환 */
  morphToSource: () => void
  /** 애니메이션 토글 */
  toggle: () => void
  /** 애니메이션 중단 */
  cancel: () => void
  /** 소스 요소 스타일 */
  sourceStyle: React.CSSProperties
  /** 타겟 요소 스타일 */
  targetStyle: React.CSSProperties
  /** 오버레이/클론 스타일 (중간 애니메이션용) */
  cloneStyle: React.CSSProperties | null
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/** 요소의 절대 위치/크기 가져오기 */
function getRect(element: HTMLElement | null): Rect | null {
  if (!element) return null

  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  }
}

/** FLIP 역변환 계산 */
function calculateInvert(first: Rect, last: Rect): {
  x: number
  y: number
  scaleX: number
  scaleY: number
} {
  return {
    x: first.x - last.x,
    y: first.y - last.y,
    scaleX: first.width / last.width,
    scaleY: first.height / last.height,
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
 * FLIP 기반 모프 트랜지션 훅
 *
 * @example
 * ```tsx
 * const {
 *   sourceRef,
 *   targetRef,
 *   morphToTarget,
 *   morphToSource,
 *   state
 * } = useMorphTransition({ duration: 400 })
 *
 * return (
 *   <>
 *     <div ref={sourceRef} onClick={morphToTarget}>
 *       Small Card
 *     </div>
 *     {state.currentState === 'target' && (
 *       <div ref={targetRef} onClick={morphToSource}>
 *         Large Card
 *       </div>
 *     )}
 *   </>
 * )
 * ```
 */
export function useMorphTransition(
  options: MorphTransitionOptions = {}
): MorphTransitionReturn {
  const {
    duration = 400,
    easing = 'cubic-bezier(0.23, 1, 0.32, 1)',
    onStart,
    onComplete,
    scale: _scale = true, // 향후 확장용
    fade = true,
    delay = 0,
  } = options
  void _scale // ESLint unused 방지

  const sourceRef = useRef<HTMLElement>(null)
  const targetRef = useRef<HTMLElement>(null)
  const animationRef = useRef<Animation | null>(null)

  const [state, setState] = useState<MorphState>({
    rect: null,
    isAnimating: false,
    currentState: null,
  })

  const [cloneStyle, setCloneStyle] = useState<React.CSSProperties | null>(null)

  // 모션 감소 설정
  const reducedMotion = useMemo(() => prefersReducedMotion(), [])

  // 애니메이션 취소
  const cancel = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.cancel()
      animationRef.current = null
    }
    setState((prev) => ({ ...prev, isAnimating: false }))
    setCloneStyle(null)
  }, [])

  // FLIP 애니메이션 실행
  const performFlip = useCallback(
    (from: HTMLElement, to: HTMLElement, direction: 'toTarget' | 'toSource') => {
      if (reducedMotion) {
        // 모션 감소 시 즉시 전환
        setState({
          rect: getRect(to),
          isAnimating: false,
          currentState: direction === 'toTarget' ? 'target' : 'source',
        })
        onComplete?.()
        return
      }

      cancel()

      // First: 현재 위치 기록
      const firstRect = getRect(from)
      if (!firstRect) return

      onStart?.()
      setState((prev) => ({
        ...prev,
        isAnimating: true,
        currentState: direction === 'toTarget' ? 'target' : 'source',
      }))

      // 다음 프레임에서 Last 측정
      requestAnimationFrame(() => {
        // Last: 최종 위치 측정
        const lastRect = getRect(to)
        if (!lastRect) {
          setState((prev) => ({ ...prev, isAnimating: false }))
          return
        }

        // Invert: 역변환 계산
        const invert = calculateInvert(firstRect, lastRect)

        // 클론 스타일 설정 (중간 애니메이션 요소)
        setCloneStyle({
          position: 'fixed',
          left: lastRect.x,
          top: lastRect.y,
          width: lastRect.width,
          height: lastRect.height,
          transform: `translate(${invert.x}px, ${invert.y}px) scale(${invert.scaleX}, ${invert.scaleY})`,
          transformOrigin: 'top left',
          opacity: fade ? 0.8 : 1,
          zIndex: 9999,
          pointerEvents: 'none',
        })

        // Play: Web Animations API로 애니메이션
        const keyframes: Keyframe[] = [
          {
            transform: `translate(${invert.x}px, ${invert.y}px) scale(${invert.scaleX}, ${invert.scaleY})`,
            opacity: fade ? 0.8 : 1,
          },
          {
            transform: 'translate(0, 0) scale(1, 1)',
            opacity: 1,
          },
        ]

        // to 요소에 애니메이션 적용
        animationRef.current = to.animate(keyframes, {
          duration,
          easing,
          delay,
          fill: 'forwards',
        })

        animationRef.current.onfinish = () => {
          setState({
            rect: lastRect,
            isAnimating: false,
            currentState: direction === 'toTarget' ? 'target' : 'source',
          })
          setCloneStyle(null)
          onComplete?.()
        }

        animationRef.current.oncancel = () => {
          setState((prev) => ({ ...prev, isAnimating: false }))
          setCloneStyle(null)
        }
      })
    },
    [reducedMotion, cancel, duration, easing, delay, fade, onStart, onComplete]
  )

  // 소스 → 타겟 전환
  const morphToTarget = useCallback(() => {
    const source = sourceRef.current
    const target = targetRef.current

    if (!source) return

    if (target) {
      performFlip(source, target, 'toTarget')
    } else {
      // 타겟이 아직 없으면 상태만 변경
      setState({
        rect: getRect(source),
        isAnimating: false,
        currentState: 'target',
      })
    }
  }, [performFlip])

  // 타겟 → 소스 전환
  const morphToSource = useCallback(() => {
    const source = sourceRef.current
    const target = targetRef.current

    if (!target || !source) return

    performFlip(target, source, 'toSource')
  }, [performFlip])

  // 토글
  const toggle = useCallback(() => {
    if (state.currentState === 'target') {
      morphToSource()
    } else {
      morphToTarget()
    }
  }, [state.currentState, morphToTarget, morphToSource])

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel()
      }
    }
  }, [])

  // 기본 스타일
  const baseTransitionStyle: React.CSSProperties = {
    transition: state.isAnimating
      ? 'none' // FLIP 중에는 CSS transition 비활성화
      : `all ${duration}ms ${easing}`,
  }

  const sourceStyle: React.CSSProperties = {
    ...baseTransitionStyle,
    visibility: state.currentState === 'target' ? 'hidden' : 'visible',
    opacity: state.currentState === 'target' ? 0 : 1,
  }

  const targetStyle: React.CSSProperties = {
    ...baseTransitionStyle,
    visibility: state.currentState === 'source' ? 'hidden' : 'visible',
    opacity: state.currentState === 'source' ? 0 : 1,
  }

  return {
    sourceRef,
    targetRef,
    state,
    morphToTarget,
    morphToSource,
    toggle,
    cancel,
    sourceStyle,
    targetStyle,
    cloneStyle,
  }
}

// ============================================
// SHARED ELEMENT TRANSITION (다중 요소)
// ============================================

export interface SharedElementOptions extends MorphTransitionOptions {
  /** 공유 요소 ID */
  sharedId: string
}

/**
 * 공유 요소 트랜지션 레지스트리
 * 여러 컴포넌트 간 요소 공유를 관리
 */
const sharedElementRegistry = new Map<
  string,
  {
    sourceRect: Rect | null
    sourceElement: HTMLElement | null
  }
>()

/**
 * 공유 요소 트랜지션 훅
 * 페이지 간 또는 컴포넌트 간 요소 공유 애니메이션
 *
 * @example
 * ```tsx
 * // 리스트 페이지
 * const { ref: cardRef, registerAsSource } = useSharedElement('card-1')
 *
 * useEffect(() => {
 *   registerAsSource()
 * }, [])
 *
 * // 상세 페이지
 * const { ref: detailRef, animateFromSource } = useSharedElement('card-1')
 *
 * useEffect(() => {
 *   animateFromSource()
 * }, [])
 * ```
 */
export function useSharedElement(
  sharedId: string,
  options: MorphTransitionOptions = {}
): {
  ref: React.RefObject<HTMLElement | null>
  registerAsSource: () => void
  animateFromSource: () => void
  clearRegistry: () => void
} {
  const ref = useRef<HTMLElement>(null)
  const { duration = 400, easing = 'cubic-bezier(0.23, 1, 0.32, 1)' } = options

  const registerAsSource = useCallback(() => {
    if (!ref.current) return

    sharedElementRegistry.set(sharedId, {
      sourceRect: getRect(ref.current),
      sourceElement: ref.current,
    })
  }, [sharedId])

  const animateFromSource = useCallback(() => {
    if (!ref.current) return

    const source = sharedElementRegistry.get(sharedId)
    if (!source?.sourceRect) return

    const targetRect = getRect(ref.current)
    if (!targetRect) return

    const invert = calculateInvert(source.sourceRect, targetRect)

    ref.current.animate(
      [
        {
          transform: `translate(${invert.x}px, ${invert.y}px) scale(${invert.scaleX}, ${invert.scaleY})`,
          opacity: 0.8,
        },
        {
          transform: 'translate(0, 0) scale(1, 1)',
          opacity: 1,
        },
      ],
      {
        duration,
        easing,
        fill: 'forwards',
      }
    )

    // 사용 후 레지스트리에서 제거
    sharedElementRegistry.delete(sharedId)
  }, [sharedId, duration, easing])

  const clearRegistry = useCallback(() => {
    sharedElementRegistry.delete(sharedId)
  }, [sharedId])

  return {
    ref,
    registerAsSource,
    animateFromSource,
    clearRegistry,
  }
}

// ============================================
// LAYOUT MORPH (레이아웃 변경 애니메이션)
// ============================================

export interface LayoutMorphOptions {
  /** 애니메이션 지속 시간 (ms) */
  duration?: number
  /** 이징 함수 */
  easing?: string
}

/**
 * 레이아웃 변경 애니메이션 훅
 * 요소의 위치/크기가 변경될 때 부드럽게 애니메이션
 *
 * @example
 * ```tsx
 * const { ref, requestLayoutAnimation } = useLayoutMorph()
 *
 * // 레이아웃 변경 전 호출
 * requestLayoutAnimation()
 *
 * // 레이아웃 변경
 * setLayout('grid')
 * ```
 */
export function useLayoutMorph(
  options: LayoutMorphOptions = {}
): {
  ref: React.RefObject<HTMLElement | null>
  requestLayoutAnimation: () => void
} {
  const { duration = 300, easing = 'cubic-bezier(0.23, 1, 0.32, 1)' } = options

  const ref = useRef<HTMLElement>(null)
  const firstRectRef = useRef<Rect | null>(null)

  const requestLayoutAnimation = useCallback(() => {
    if (!ref.current) return

    // First: 현재 위치 저장
    firstRectRef.current = getRect(ref.current)

    // 다음 프레임에서 Last 측정 및 애니메이션
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!ref.current || !firstRectRef.current) return

        const lastRect = getRect(ref.current)
        if (!lastRect) return

        const invert = calculateInvert(firstRectRef.current, lastRect)

        // 변화가 없으면 스킵
        if (
          Math.abs(invert.x) < 1 &&
          Math.abs(invert.y) < 1 &&
          Math.abs(invert.scaleX - 1) < 0.01 &&
          Math.abs(invert.scaleY - 1) < 0.01
        ) {
          return
        }

        ref.current.animate(
          [
            {
              transform: `translate(${invert.x}px, ${invert.y}px) scale(${invert.scaleX}, ${invert.scaleY})`,
            },
            {
              transform: 'translate(0, 0) scale(1, 1)',
            },
          ],
          {
            duration,
            easing,
            fill: 'forwards',
          }
        )

        firstRectRef.current = null
      })
    })
  }, [duration, easing])

  return {
    ref,
    requestLayoutAnimation,
  }
}

// ============================================
// EXPORTS
// ============================================

export default useMorphTransition
