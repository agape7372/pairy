'use client'

/**
 * useAccessibility.ts
 *
 * UX 서사: "모든 창작자가 Pairy의 정원에 편안하게 들어올 수 있도록,
 *          보이지 않는 문턱을 낮추는 섬세한 배려"
 *
 * 이 훅들은 접근성을 향상시키면서도 사용자 경험을 해치지 않습니다.
 * - 모션 감소 설정 감지 및 대응
 * - 키보드 네비게이션 감지
 * - 대비 설정 감지
 */

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * prefers-reduced-motion 미디어 쿼리를 감지하는 훅
 *
 * 사용자가 시스템 설정에서 모션 감소를 켰을 때,
 * 화려한 애니메이션 대신 부드러운 페이드로 대체합니다.
 *
 * @returns {boolean} 모션 감소 선호 여부
 *
 * @example
 * const prefersReducedMotion = usePrefersReducedMotion()
 *
 * return (
 *   <div className={prefersReducedMotion ? 'fade-in' : 'bounce-in'}>
 *     ...
 *   </div>
 * )
 */
export function usePrefersReducedMotion(): boolean {
  // 초기값을 함수로 계산하여 SSR 호환성 유지
  const getInitialValue = () => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialValue)

  useEffect(() => {
    // SSR 환경에서는 matchMedia가 없을 수 있음
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    // 변경 감지 리스너
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // 모던 브라우저용 addEventListener 사용
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return prefersReducedMotion
}

/**
 * 키보드 사용자를 감지하는 훅
 *
 * Tab 키로 네비게이션하는 사용자에게만 포커스 링을 표시하고,
 * 마우스 사용자에게는 깔끔한 UI를 유지합니다.
 *
 * @returns {boolean} 키보드 사용 중 여부
 */
export function useKeyboardUser(): boolean {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true)
      }
    }

    const handleMouseDown = () => {
      setIsKeyboardUser(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleMouseDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return isKeyboardUser
}

/**
 * 고대비 모드를 감지하는 훅
 *
 * 시각 장애가 있는 사용자를 위해 더 선명한 색상과
 * 명확한 구분선을 제공합니다.
 *
 * @returns {boolean} 고대비 선호 여부
 */
export function usePrefersHighContrast(): boolean {
  const getInitialValue = () => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false
    }
    return window.matchMedia('(prefers-contrast: more)').matches
  }

  const [prefersHighContrast, setPrefersHighContrast] = useState(getInitialValue)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    // Windows 고대비 모드 감지
    const mediaQuery = window.matchMedia('(prefers-contrast: more)')

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return prefersHighContrast
}

/**
 * 다크 모드 시스템 설정을 감지하는 훅
 *
 * @returns {boolean} 다크 모드 선호 여부
 */
export function usePrefersColorScheme(): 'light' | 'dark' {
  const getInitialValue = (): 'light' | 'dark' => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(getInitialValue)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event: MediaQueryListEvent) => {
      setColorScheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return colorScheme
}

/**
 * 포커스 트랩 훅 - 모달이나 드롭다운 내에서 포커스를 가둡니다.
 *
 * 키보드 사용자가 모달 밖으로 실수로 나가지 않도록
 * 부드럽게 안내합니다.
 *
 * @param isActive 트랩 활성화 여부
 * @returns ref를 붙일 컨테이너 참조
 */
export function useFocusTrap(isActive: boolean) {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  const setRef = useCallback((node: HTMLElement | null) => {
    setContainer(node)
  }, [])

  useEffect(() => {
    if (!isActive || !container) return

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    // 첫 번째 요소에 포커스
    firstFocusable?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        // Shift + Tab: 첫 번째에서 마지막으로
        if (document.activeElement === firstFocusable) {
          event.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        // Tab: 마지막에서 첫 번째로
        if (document.activeElement === lastFocusable) {
          event.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, container])

  return setRef
}

/**
 * 스크린 리더를 위한 라이브 리전 알림 훅
 *
 * 시각적 변화만으로는 알 수 없는 정보를
 * 스크린 리더 사용자에게 음성으로 전달합니다.
 *
 * @returns announce 함수
 */
export function useAnnounce() {
  const announcerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // 라이브 리전 요소 생성
    const element = document.createElement('div')
    element.setAttribute('aria-live', 'polite')
    element.setAttribute('aria-atomic', 'true')
    element.className = 'sr-only' // 시각적으로 숨김
    element.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    document.body.appendChild(element)
    announcerRef.current = element

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current)
      }
    }
  }, [])

  const announce = useCallback((message: string) => {
    const announcer = announcerRef.current
    if (!announcer) return

    // 이전 메시지 지우기 (스크린 리더가 변경을 감지하도록)
    announcer.textContent = ''

    // 약간의 지연 후 새 메시지 설정
    requestAnimationFrame(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = message
      }
    })
  }, [])

  return announce
}

/**
 * 탭 영역 최소 크기 보장을 위한 스타일 생성 유틸리티
 * WCAG 2.2 기준: 최소 24x24 CSS 픽셀
 */
export const minTapTarget = {
  // 작은 아이콘 버튼에 적용
  small: 'min-w-[24px] min-h-[24px]',
  // 일반 버튼에 적용
  medium: 'min-w-[44px] min-h-[44px]',
  // 큰 터치 타겟
  large: 'min-w-[48px] min-h-[48px]',
}

/**
 * 대비율 검사 유틸리티
 * WCAG AA: 4.5:1 (일반 텍스트), 3:1 (큰 텍스트)
 * WCAG AAA: 7:1 (일반 텍스트), 4.5:1 (큰 텍스트)
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = hex.replace('#', '').match(/.{2}/g)
    if (!rgb) return 0

    const [r, g, b] = rgb.map((c) => {
      const value = parseInt(c, 16) / 255
      return value <= 0.03928
        ? value / 12.92
        : Math.pow((value + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * 대비율이 WCAG 기준을 충족하는지 확인
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background)

  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7
  }

  return isLargeText ? ratio >= 3 : ratio >= 4.5
}
