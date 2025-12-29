'use client'

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'

// ============================================
// 애니메이션 모드 타입
// ============================================

export type AnimationMode = 'doodle' | 'premium'

// ============================================
// Spring Physics & Easing Presets
// ============================================

/**
 * Doodle 모드: 쫀득하고 탄성있는 Spring
 * - 빠르게 튀어나오고 출렁거리며 정착
 */
export const DOODLE_SPRING = {
  // 기본 팝 효과 (버튼, 카드)
  pop: { type: 'spring' as const, stiffness: 400, damping: 15, mass: 0.8 },
  // 부드러운 출렁임 (컨테이너, 모달)
  wobble: { type: 'spring' as const, stiffness: 260, damping: 20, mass: 0.5 },
  // 젤리 효과 (아이콘, 작은 요소)
  jelly: { type: 'spring' as const, stiffness: 500, damping: 12, mass: 0.6 },
  // 순차 등장용
  stagger: { staggerChildren: 0.08, delayChildren: 0.1 },
}

/**
 * Premium 모드: 매끄럽고 우아한 Ease
 * - 빠르게 시작, 아주 천천히 감속 (Quartic Out)
 */
export const PREMIUM_EASE = {
  // 기본 전환 (0.4s, Quartic Out)
  smooth: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  // 빠른 반응 (0.25s)
  quick: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
  // 느긋한 전환 (0.6s, 모달/페이지)
  slow: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  // Expo Out (더 급격한 감속)
  expo: { duration: 0.5, ease: [0.19, 1, 0.22, 1] as const },
  // 순차 등장용
  stagger: { staggerChildren: 0.05, delayChildren: 0.05 },
}

// ============================================
// 컨텍스트 타입
// ============================================

interface AnimationContextType {
  mode: AnimationMode
  setMode: (mode: AnimationMode) => void
  toggleMode: () => void
  // 현재 모드에 맞는 트랜지션 프리셋
  spring: typeof DOODLE_SPRING
  ease: typeof PREMIUM_EASE
  // 현재 모드 기반 기본 트랜지션
  transition: {
    default: typeof DOODLE_SPRING.wobble | typeof PREMIUM_EASE.smooth
    fast: typeof DOODLE_SPRING.pop | typeof PREMIUM_EASE.quick
    slow: typeof DOODLE_SPRING.wobble | typeof PREMIUM_EASE.slow
  }
  // CSS 클래스 prefix
  modeClass: string
}

const AnimationContext = createContext<AnimationContextType | null>(null)

// ============================================
// Provider
// ============================================

interface AnimationProviderProps {
  children: ReactNode
  defaultMode?: AnimationMode
}

export function AnimationProvider({
  children,
  defaultMode = 'doodle'
}: AnimationProviderProps) {
  const [mode, setMode] = useState<AnimationMode>(defaultMode)

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'doodle' ? 'premium' : 'doodle'))
  }, [])

  const value = useMemo<AnimationContextType>(() => {
    const isDoodle = mode === 'doodle'

    return {
      mode,
      setMode,
      toggleMode,
      spring: DOODLE_SPRING,
      ease: PREMIUM_EASE,
      transition: {
        default: isDoodle ? DOODLE_SPRING.wobble : PREMIUM_EASE.smooth,
        fast: isDoodle ? DOODLE_SPRING.pop : PREMIUM_EASE.quick,
        slow: isDoodle ? DOODLE_SPRING.wobble : PREMIUM_EASE.slow,
      },
      modeClass: `animation-${mode}`,
    }
  }, [mode])

  return (
    <AnimationContext.Provider value={value}>
      <div className={`animation-${mode}`} data-animation-mode={mode}>
        {children}
      </div>
    </AnimationContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useAnimation() {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error('useAnimation must be used within AnimationProvider')
  }
  return context
}

// ============================================
// 유틸리티: 모드별 값 선택
// ============================================

export function useAnimationValue<T>(doodleValue: T, premiumValue: T): T {
  const { mode } = useAnimation()
  return mode === 'doodle' ? doodleValue : premiumValue
}
