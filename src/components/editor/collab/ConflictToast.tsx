'use client'

/**
 * 충돌 알림 토스트 컴포넌트
 * 다른 사용자와 같은 영역을 편집할 때 알림 표시
 */

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, UserX } from 'lucide-react'
import { useCollabOptional } from '@/lib/collab'

interface ConflictToastProps {
  onResolve?: () => void
}

export function ConflictToast({ onResolve }: ConflictToastProps) {
  const collab = useCollabOptional()

  if (!collab || !collab.currentConflict) return null

  const conflict = collab.currentConflict

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border-2 border-amber-200 rounded-2xl shadow-lg">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>

          <div className="flex-1">
            <p className="font-medium text-amber-800">편집 충돌 감지</p>
            <p className="text-sm text-amber-600">
              <span className="font-semibold">{conflict.userName}</span>
              님이 같은 영역을 편집하고 있어요
            </p>
          </div>

          <button
            onClick={() => collab.dismissConflict()}
            className="p-2 rounded-full hover:bg-amber-100 transition-colors"
          >
            <X className="w-4 h-4 text-amber-600" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================
// 영역 잠금 알림
// ============================================

interface ZoneLockedToastProps {
  zone: 'A' | 'B'
  ownerName: string
  onDismiss: () => void
}

export function ZoneLockedToast({ zone, ownerName, onDismiss }: ZoneLockedToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed bottom-20 right-4 z-50"
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-white border rounded-xl shadow-lg">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: zone === 'A' ? '#FFE4E1' : '#E0FFFF',
          }}
        >
          <UserX className="w-4 h-4" style={{ color: zone === 'A' ? '#DC143C' : '#008B8B' }} />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-800">
            {zone} 영역 사용 중
          </p>
          <p className="text-xs text-gray-500">
            {ownerName}님이 편집 중이에요
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </motion.div>
  )
}

// ============================================
// 동기화 상태 알림
// ============================================

interface SyncStatusToastProps {
  status: 'syncing' | 'synced' | 'error'
}

export function SyncStatusToast({ status }: SyncStatusToastProps) {
  const messages = {
    syncing: { text: '변경사항 동기화 중...', bg: 'bg-blue-50', border: 'border-blue-200', color: 'text-blue-600' },
    synced: { text: '동기화 완료', bg: 'bg-green-50', border: 'border-green-200', color: 'text-green-600' },
    error: { text: '동기화 실패', bg: 'bg-red-50', border: 'border-red-200', color: 'text-red-600' },
  }

  const config = messages[status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-4 left-4 z-50 px-4 py-2 ${config.bg} border ${config.border} rounded-lg`}
    >
      <span className={`text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    </motion.div>
  )
}

export default ConflictToast
