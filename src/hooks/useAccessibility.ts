'use client'

/**
 * Sprint 34: 접근성 관련 훅
 * 모션 감소, 고대비 모드 등 시스템 설정 감지
 */

import { useState, useEffect, useCallback } from 'react'

// ============================================
// 모션 감소 설정
// ============================================

/**
 * prefers-reduced-motion 미디어 쿼리 감지
 * 사용자가 시스템에서 모션 감소를 설정했는지 확인
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // SSR 환경에서는 기본값 사용
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// 별칭 (하위 호환성)
export const usePrefersReducedMotion = useReducedMotion

// ============================================
// 고대비 모드 설정
// ============================================

export type ContrastPreference = 'no-preference' | 'more' | 'less' | 'custom'

/**
 * prefers-contrast 미디어 쿼리 감지
 */
export function usePrefersContrast(): ContrastPreference {
  const [contrast, setContrast] = useState<ContrastPreference>('no-preference')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkContrast = () => {
      if (window.matchMedia('(prefers-contrast: more)').matches) {
        setContrast('more')
      } else if (window.matchMedia('(prefers-contrast: less)').matches) {
        setContrast('less')
      } else if (window.matchMedia('(prefers-contrast: custom)').matches) {
        setContrast('custom')
      } else {
        setContrast('no-preference')
      }
    }

    checkContrast()

    const moreQuery = window.matchMedia('(prefers-contrast: more)')
    const lessQuery = window.matchMedia('(prefers-contrast: less)')

    const handleChange = () => checkContrast()

    moreQuery.addEventListener('change', handleChange)
    lessQuery.addEventListener('change', handleChange)

    return () => {
      moreQuery.removeEventListener('change', handleChange)
      lessQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return contrast
}

// ============================================
// 스크린 리더 전용 텍스트
// ============================================

export const srOnlyStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

// ============================================
// 라이브 리전 알림
// ============================================

/**
 * 스크린 리더에 동적 알림 전달
 */
export function useAnnounce() {
  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    let liveRegion = document.getElementById(`sr-live-${politeness}`)

    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = `sr-live-${politeness}`
      liveRegion.setAttribute('aria-live', politeness)
      liveRegion.setAttribute('aria-atomic', 'true')
      Object.assign(liveRegion.style, srOnlyStyles)
      document.body.appendChild(liveRegion)
    }

    liveRegion.textContent = ''
    requestAnimationFrame(() => {
      if (liveRegion) {
        liveRegion.textContent = message
      }
    })
  }, [])

  return announce
}

// ============================================
// 통합 접근성 훅
// ============================================

export interface AccessibilityState {
  reducedMotion: boolean
  contrast: ContrastPreference
}

export function useAccessibility(): AccessibilityState {
  const reducedMotion = useReducedMotion()
  const contrast = usePrefersContrast()

  return {
    reducedMotion,
    contrast,
  }
}
