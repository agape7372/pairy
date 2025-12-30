'use client'

/**
 * themeStore.ts - 테마 관리 스토어
 *
 * UX 서사: "창작의 시간은 다양하다. 밤늦은 영감의 순간도,
 *          햇살 아래 스케치하는 오후도. 모든 순간에 맞는 빛을 제공한다."
 *
 * 다크모드는 단순한 색상 반전이 아니라,
 * Pairy의 따뜻한 파스텔 톤을 유지하면서 눈의 피로를 줄입니다.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'
export type AnimationMode = 'doodle' | 'premium'

interface ThemeState {
  /** 현재 테마 모드 설정 */
  mode: ThemeMode
  /** 실제 적용되는 테마 (system일 때 시스템 설정 반영) */
  resolvedMode: 'light' | 'dark'
  /** 애니메이션 모드 (doodle: 귀여운 스타일, premium: 세련된 스타일) */
  animationMode: AnimationMode
  /** 테마 모드 설정 */
  setMode: (mode: ThemeMode) => void
  /** 애니메이션 모드 설정 */
  setAnimationMode: (mode: AnimationMode) => void
  /** 시스템 테마 변경 감지 핸들러 */
  handleSystemThemeChange: (prefersDark: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      resolvedMode: 'light',
      animationMode: 'doodle',

      setMode: (mode) => {
        let resolvedMode: 'light' | 'dark' = 'light'

        if (mode === 'system') {
          // 시스템 설정 확인
          if (typeof window !== 'undefined') {
            resolvedMode = window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
          }
        } else {
          resolvedMode = mode
        }

        set({ mode, resolvedMode })

        // DOM에 클래스 적용
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', resolvedMode === 'dark')
          document.documentElement.setAttribute('data-theme', resolvedMode)
        }
      },

      setAnimationMode: (animationMode) => {
        set({ animationMode })

        // DOM에 애니메이션 모드 적용
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-animation-mode', animationMode)
        }
      },

      handleSystemThemeChange: (prefersDark) => {
        const { mode } = get()
        if (mode === 'system') {
          const resolvedMode = prefersDark ? 'dark' : 'light'
          set({ resolvedMode })

          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', resolvedMode === 'dark')
            document.documentElement.setAttribute('data-theme', resolvedMode)
          }
        }
      },
    }),
    {
      name: 'pairy-theme',
      partialize: (state) => ({
        mode: state.mode,
        animationMode: state.animationMode,
      }),
    }
  )
)

/**
 * 테마 초기화 훅 - 앱 시작 시 호출
 */
export function useThemeInitializer() {
  const { mode, animationMode, setMode, handleSystemThemeChange, setAnimationMode } = useThemeStore()

  // 클라이언트에서 한 번만 실행
  if (typeof window !== 'undefined') {
    // 시스템 테마 변경 리스너
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      handleSystemThemeChange(e.matches)
    })

    // 초기 테마 적용
    setMode(mode)
    setAnimationMode(animationMode)
  }
}
