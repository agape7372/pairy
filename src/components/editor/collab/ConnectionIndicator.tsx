'use client'

/**
 * 연결 상태 표시 컴포넌트
 * 협업 세션의 연결 상태를 시각적으로 표시
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Loader2, CloudOff, Users } from 'lucide-react'
import { useCollabOptional } from '@/lib/collab'

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'offline'

interface ConnectionIndicatorProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ConnectionIndicator({
  className = '',
  showLabel = true,
  size = 'md',
}: ConnectionIndicatorProps) {
  const collab = useCollabOptional()

  const getStatus = (): ConnectionStatus => {
    if (!collab) return 'offline'
    if (collab.isConnected) return 'connected'
    if (collab.isSyncing) return 'connecting'
    return 'disconnected'
  }

  const status = getStatus()
  const participantCount = collab ? collab.remoteUsers.size + 1 : 0

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
  onReconnect?: () => void
}

export function ConnectionBanner({ onReconnect }: ConnectionBannerProps) {
  const collab = useCollabOptional()

  if (!collab || collab.isConnected) return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-red-500 text-white rounded-xl shadow-lg">
        <WifiOff className="w-5 h-5" />
        <span className="font-medium">협업 연결이 끊어졌습니다</span>
        {onReconnect && (
          <button
            onClick={onReconnect}
            className="px-3 py-1 bg-white text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            재연결
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default ConnectionIndicator
