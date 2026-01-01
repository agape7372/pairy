'use client'

/**
 * 사용자 활동 상태 추적 훅
 * 마우스, 키보드, 터치 이벤트를 감지하여 활동/비활동 상태 관리
 */

import { useState, useCallback, useEffect, useRef } from 'react'

// ============================================
// Types
// ============================================

export type ActivityStatus = 'active' | 'idle' | 'away'

interface UseUserActivityOptions {
  /** 비활성화까지의 시간 (ms) - 기본 30초 */
  idleTimeout?: number
  /** 자리비움까지의 시간 (ms) - 기본 5분 */
  awayTimeout?: number
  /** 상태 변경 콜백 */
  onStatusChange?: (status: ActivityStatus) => void
  /** 추적할 이벤트 목록 */
  events?: (keyof WindowEventMap)[]
  /** 활성화 여부 */
  enabled?: boolean
}

interface UseUserActivityReturn {
  /** 현재 활동 상태 */
  status: ActivityStatus
  /** 마지막 활동 시간 */
  lastActivity: number
  /** 비활성 시간 (초) */
  idleTime: number
  /** 수동으로 활성 상태 설정 */
  setActive: () => void
  /** 페이지 가시성 */
  isPageVisible: boolean
}

// ============================================
// Constants
// ============================================

const DEFAULT_EVENTS: (keyof WindowEventMap)[] = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
]

const DEFAULT_IDLE_TIMEOUT = 30 * 1000 // 30초
const DEFAULT_AWAY_TIMEOUT = 5 * 60 * 1000 // 5분

// ============================================
// Hook
// ============================================

export function useUserActivity(
  options: UseUserActivityOptions = {}
): UseUserActivityReturn {
  const {
    idleTimeout = DEFAULT_IDLE_TIMEOUT,
    awayTimeout = DEFAULT_AWAY_TIMEOUT,
    onStatusChange,
    events = DEFAULT_EVENTS,
    enabled = true,
  } = options

  const [status, setStatus] = useState<ActivityStatus>('active')
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [idleTime, setIdleTime] = useState(0)
  const [isPageVisible, setIsPageVisible] = useState(true)

  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const awayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevStatusRef = useRef<ActivityStatus>(status)

  // 타이머 정리
  const clearAllTimers = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current)
      idleTimeoutRef.current = null
    }
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current)
      awayTimeoutRef.current = null
    }
  }, [])

  // 상태 변경 콜백 호출
  useEffect(() => {
    if (status !== prevStatusRef.current) {
      onStatusChange?.(status)
      prevStatusRef.current = status
    }
  }, [status, onStatusChange])

  // 활성 상태로 전환
  const setActive = useCallback(() => {
    const now = Date.now()
    setLastActivity(now)
    setIdleTime(0)
    setStatus('active')
    clearAllTimers()

    // idle 타이머 시작
    idleTimeoutRef.current = setTimeout(() => {
      setStatus('idle')

      // away 타이머 시작
      awayTimeoutRef.current = setTimeout(() => {
        setStatus('away')
      }, awayTimeout - idleTimeout)
    }, idleTimeout)
  }, [clearAllTimers, idleTimeout, awayTimeout])

  // 이벤트 핸들러
  const handleActivity = useCallback(() => {
    if (!enabled) return
    setActive()
  }, [enabled, setActive])

  // 스로틀링된 이벤트 핸들러
  const throttledHandleActivityRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let lastCall = 0
    const throttleMs = 100

    throttledHandleActivityRef.current = () => {
      const now = Date.now()
      if (now - lastCall >= throttleMs) {
        lastCall = now
        handleActivity()
      }
    }
  }, [handleActivity])

  // 이벤트 리스너 등록
  useEffect(() => {
    if (!enabled) return

    const handler = () => throttledHandleActivityRef.current?.()

    events.forEach(event => {
      window.addEventListener(event, handler, { passive: true })
    })

    // 초기 활성 상태
    setActive()

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handler)
      })
      clearAllTimers()
    }
  }, [enabled, events, setActive, clearAllTimers])

  // 비활성 시간 계산
  useEffect(() => {
    if (!enabled) return

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivity) / 1000)
      setIdleTime(elapsed)
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, lastActivity])

  // 페이지 가시성 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible'
      setIsPageVisible(visible)

      if (visible) {
        // 페이지가 다시 보이면 활성 상태로
        setActive()
      } else {
        // 페이지가 숨겨지면 away 상태로
        clearAllTimers()
        setStatus('away')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [setActive, clearAllTimers])

  return {
    status,
    lastActivity,
    idleTime,
    setActive,
    isPageVisible,
  }
}

// ============================================
// 유틸리티 함수
// ============================================

export function getActivityStatusLabel(status: ActivityStatus): string {
  switch (status) {
    case 'active':
      return '활동 중'
    case 'idle':
      return '대기 중'
    case 'away':
      return '자리비움'
    default:
      return '알 수 없음'
  }
}

export function getActivityStatusColor(status: ActivityStatus): string {
  switch (status) {
    case 'active':
      return '#22C55E' // green-500
    case 'idle':
      return '#EAB308' // yellow-500
    case 'away':
      return '#9CA3AF' // gray-400
    default:
      return '#9CA3AF'
  }
}

export function formatIdleTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}초`
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}분`
  } else {
    return `${Math.floor(seconds / 3600)}시간`
  }
}
