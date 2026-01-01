'use client'

/**
 * 재연결 로직 훅
 * 네트워크 연결이 끊겼을 때 자동 재연결 및 상태 복구
 */

import { useState, useCallback, useEffect, useRef } from 'react'

// ============================================
// Types
// ============================================

export type ConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'reconnecting'
  | 'disconnected'
  | 'offline'
  | 'error'

interface UseReconnectOptions {
  /** 재연결 시도 함수 */
  onReconnect: () => Promise<boolean>
  /** 연결 해제 콜백 */
  onDisconnect?: () => void
  /** 연결 성공 콜백 */
  onConnected?: () => void
  /** 최대 재시도 횟수 */
  maxRetries?: number
  /** 초기 재시도 딜레이 (ms) */
  initialDelay?: number
  /** 최대 재시도 딜레이 (ms) */
  maxDelay?: number
  /** 백오프 배수 */
  backoffMultiplier?: number
  /** 자동 재연결 활성화 */
  autoReconnect?: boolean
}

interface UseReconnectReturn {
  /** 현재 연결 상태 */
  status: ConnectionStatus
  /** 재시도 횟수 */
  retryCount: number
  /** 다음 재시도까지 남은 시간 (초) */
  retryIn: number | null
  /** 마지막 에러 메시지 */
  lastError: string | null
  /** 수동 재연결 */
  reconnect: () => Promise<void>
  /** 재연결 취소 */
  cancelReconnect: () => void
  /** 연결 해제 */
  disconnect: () => void
  /** 온라인 상태 */
  isOnline: boolean
}

// ============================================
// Hook
// ============================================

export function useReconnect(options: UseReconnectOptions): UseReconnectReturn {
  const {
    onReconnect,
    onDisconnect,
    onConnected,
    maxRetries = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    autoReconnect = true,
  } = options

  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [retryCount, setRetryCount] = useState(0)
  const [retryIn, setRetryIn] = useState<number | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  )

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMountedRef = useRef(true)

  // 클린업
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      clearTimers()
    }
  }, [])

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    setRetryIn(null)
  }, [])

  // 지수 백오프 딜레이 계산
  const calculateDelay = useCallback((attempt: number): number => {
    const delay = initialDelay * Math.pow(backoffMultiplier, attempt)
    // 약간의 랜덤성 추가 (jitter)
    const jitter = delay * 0.2 * Math.random()
    return Math.min(delay + jitter, maxDelay)
  }, [initialDelay, backoffMultiplier, maxDelay])

  // 재연결 시도
  const attemptReconnect = useCallback(async (attempt: number = 0) => {
    if (!isMountedRef.current) return

    if (attempt >= maxRetries) {
      setStatus('error')
      setLastError('최대 재시도 횟수를 초과했습니다')
      return
    }

    setStatus(attempt === 0 ? 'connecting' : 'reconnecting')
    setRetryCount(attempt)
    setLastError(null)

    try {
      const success = await onReconnect()

      if (!isMountedRef.current) return

      if (success) {
        setStatus('connected')
        setRetryCount(0)
        clearTimers()
        onConnected?.()
      } else {
        throw new Error('연결에 실패했습니다')
      }
    } catch (error) {
      if (!isMountedRef.current) return

      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      setLastError(errorMessage)

      if (autoReconnect && attempt < maxRetries - 1) {
        const delay = calculateDelay(attempt)
        const delaySeconds = Math.ceil(delay / 1000)

        setRetryIn(delaySeconds)

        // 카운트다운
        countdownRef.current = setInterval(() => {
          setRetryIn(prev => {
            if (prev === null || prev <= 1) {
              if (countdownRef.current) {
                clearInterval(countdownRef.current)
                countdownRef.current = null
              }
              return null
            }
            return prev - 1
          })
        }, 1000)

        // 다음 재시도 예약
        timeoutRef.current = setTimeout(() => {
          attemptReconnect(attempt + 1)
        }, delay)
      } else {
        setStatus('error')
      }
    }
  }, [maxRetries, onReconnect, autoReconnect, calculateDelay, clearTimers, onConnected])

  // 수동 재연결
  const reconnect = useCallback(async () => {
    clearTimers()
    await attemptReconnect(0)
  }, [clearTimers, attemptReconnect])

  // 재연결 취소
  const cancelReconnect = useCallback(() => {
    clearTimers()
    setStatus('disconnected')
    setRetryCount(0)
  }, [clearTimers])

  // 연결 해제
  const disconnect = useCallback(() => {
    clearTimers()
    setStatus('disconnected')
    setRetryCount(0)
    onDisconnect?.()
  }, [clearTimers, onDisconnect])

  // 온라인/오프라인 감지
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (status === 'offline' && autoReconnect) {
        attemptReconnect(0)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setStatus('offline')
      clearTimers()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [status, autoReconnect, attemptReconnect, clearTimers])

  // 페이지 가시성 변경 감지 (탭 전환 시 재연결)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        status === 'disconnected' &&
        autoReconnect &&
        isOnline
      ) {
        attemptReconnect(0)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [status, autoReconnect, isOnline, attemptReconnect])

  return {
    status,
    retryCount,
    retryIn,
    lastError,
    reconnect,
    cancelReconnect,
    disconnect,
    isOnline,
  }
}

// ============================================
// 상태 유틸리티
// ============================================

export function getStatusMessage(status: ConnectionStatus, retryIn: number | null): string {
  switch (status) {
    case 'connected':
      return '연결됨'
    case 'connecting':
      return '연결 중...'
    case 'reconnecting':
      return retryIn ? `${retryIn}초 후 재연결...` : '재연결 중...'
    case 'disconnected':
      return '연결 끊김'
    case 'offline':
      return '오프라인'
    case 'error':
      return '연결 오류'
    default:
      return '알 수 없음'
  }
}

export function getStatusColor(status: ConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'text-green-500'
    case 'connecting':
    case 'reconnecting':
      return 'text-yellow-500'
    case 'disconnected':
    case 'offline':
      return 'text-gray-400'
    case 'error':
      return 'text-red-500'
    default:
      return 'text-gray-400'
  }
}
