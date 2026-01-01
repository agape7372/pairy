'use client'

/**
 * 연결 상태 표시 컴포넌트
 * useReconnect 훅을 사용한 재연결 상태 관리
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Loader2, CloudOff, Users, RefreshCw } from 'lucide-react'
import { useReconnect, getStatusMessage, type ConnectionStatus } from '@/hooks/useReconnect'
import type { CollabUser } from '@/lib/collab/types'

interface ConnectionIndicatorProps {
  sessionId: string | null
  isConnected: boolean
  participantCount?: number
  onReconnect?: () => Promise<boolean>
  onDisconnect?: () => void
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ConnectionIndicator({
  sessionId,
  isConnected: externalIsConnected,
  participantCount: externalParticipantCount = 0,
  onReconnect,
  onDisconnect,
  className = '',
  showLabel = true,
  size = 'md',
}: ConnectionIndicatorProps) {
  // useReconnect 훅 사용 (재연결 로직 위임 시)
  const reconnect = useReconnect({
    onReconnect: onReconnect || (async () => false),
    onDisconnect,
    autoReconnect: !!sessionId,
  })

  // 외부 상태와 재연결 상태 통합
  const getStatus = (): ConnectionStatus => {
    if (!sessionId) return 'offline'
    if (externalIsConnected) return 'connected'
    if (reconnect.status === 'reconnecting') return 'reconnecting'
    if (reconnect.status === 'connecting') return 'connecting'
    if (!reconnect.isOnline) return 'offline'
    return 'disconnected'
  }

  const status = getStatus()
  const participantCount = externalParticipantCount

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center ${sizeClasses[size]} ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="flex items-center gap-1"
        >
          {status === 'connected' && (
            <>
              <div className="relative">
                <Wifi className={`${iconSizes[size]} text-green-500`} />
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-green-400 opacity-30"
                />
              </div>
              {showLabel && (
                <span className="text-green-600 font-medium">연결됨</span>
              )}
            </>
          )}

          {status === 'connecting' && (
            <>
              <Loader2 className={`${iconSizes[size]} text-amber-500 animate-spin`} />
              {showLabel && (
                <span className="text-amber-600 font-medium">연결 중...</span>
              )}
            </>
          )}

          {status === 'reconnecting' && (
            <>
              <RefreshCw className={`${iconSizes[size]} text-amber-500 animate-spin`} />
              {showLabel && (
                <span className="text-amber-600 font-medium">
                  {reconnect.retryIn
                    ? `${reconnect.retryIn}초 후 재연결...`
                    : `재연결 중... (${reconnect.retryCount + 1}/${5})`}
                </span>
              )}
            </>
          )}

          {status === 'disconnected' && (
            <>
              <WifiOff className={`${iconSizes[size]} text-red-500`} />
              {showLabel && (
                <span className="text-red-600 font-medium">연결 끊김</span>
              )}
            </>
          )}

          {status === 'offline' && (
            <>
              <CloudOff className={`${iconSizes[size]} text-gray-400`} />
              {showLabel && (
                <span className="text-gray-500 font-medium">오프라인</span>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 참여자 수 */}
      {status === 'connected' && participantCount > 1 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-0.5 ml-2 px-2 py-0.5 bg-primary-100 rounded-full"
        >
          <Users className={`${iconSizes[size]} text-primary-600`} />
          <span className="text-primary-700 font-medium">{participantCount}</span>
        </motion.div>
      )}
    </motion.div>
  )
}

// ============================================
// 연결 상태 배너 (하단 표시용)
// ============================================

interface ConnectionBannerProps {
  sessionId: string | null
  isConnected: boolean
  isReconnecting?: boolean
  retryIn?: number | null
  lastError?: string | null
  onReconnect?: () => void
}

export function ConnectionBanner({
  sessionId,
  isConnected,
  isReconnecting,
  retryIn,
  lastError,
  onReconnect,
}: ConnectionBannerProps) {
  // 연결 안됨 + 세션 있을 때만 표시
  if (!sessionId || isConnected) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500 text-white rounded-xl shadow-lg">
          {isReconnecting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <WifiOff className="w-5 h-5" />
          )}
          <div className="flex flex-col">
            <span className="font-medium">
              {isReconnecting
                ? retryIn
                  ? `${retryIn}초 후 재연결 시도...`
                  : '재연결 중...'
                : '협업 연결이 끊어졌습니다'}
            </span>
            {lastError && (
              <span className="text-xs text-red-200">{lastError}</span>
            )}
          </div>
          {onReconnect && !isReconnecting && (
            <button
              onClick={onReconnect}
              className="px-3 py-1 bg-white text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              재연결
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ConnectionIndicator
