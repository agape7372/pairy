'use client'

/**
 * Sprint 32+: 협업 오버레이 컴포넌트 (개선)
 * - 원격 커서 표시 (부드러운 애니메이션)
 * - 영역 분리 시각화
 * - 충돌 알림
 */

import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useCollabOptional, type UserEditingState, type EditConflict, type EditingZone } from '@/lib/collab'

// 사용자 색상 팔레트
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
]

function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash = hash & hash
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

interface CollabOverlayProps {
  canvasWidth: number
  canvasHeight: number
  slots: Array<{
    id: string
    zone?: EditingZone
    transform: { x: number; y: number; width: number; height: number }
  }>
}

export function CollabOverlay({ canvasWidth, canvasHeight, slots }: CollabOverlayProps) {
  const collab = useCollabOptional()

  if (!collab || !collab.isConnected) {
    return null
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none z-40"
      style={{ width: canvasWidth, height: canvasHeight }}
    >
      {/* 원격 커서들 (애니메이션 적용) */}
      <AnimatePresence>
        {Array.from(collab.remoteUsers.entries()).map(([userId, state]) => (
          <RemoteCursor key={userId} userId={userId} state={state} />
        ))}
      </AnimatePresence>

      {/* 영역 분리 표시 */}
      {slots.map((slot) => {
        const owner = slot.zone ? collab.getZoneOwner(slot.zone) : null
        const isRemoteOwned = owner && owner !== collab.localUser?.id

        if (!isRemoteOwned) return null

        return (
          <ZoneIndicator
            key={slot.id}
            slot={slot}
            ownerName={getRemoteUserName(collab.remoteUsers, owner)}
            zone={slot.zone}
          />
        )
      })}

      {/* 충돌 알림 */}
      <AnimatePresence>
        {collab.currentConflict && (
          <ConflictNotification
            conflict={collab.currentConflict}
            onDismiss={collab.dismissConflict}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// 원격 커서 컴포넌트 (개선된 애니메이션)
// ============================================

function RemoteCursor({ userId, state }: { userId: string; state: UserEditingState }) {
  const [isStale, setIsStale] = useState(false)

  // 3초 이상 업데이트 없으면 stale 처리
  useEffect(() => {
    const checkStale = () => {
      setIsStale(Date.now() - state.lastActivity > 3000)
    }
    checkStale()
    const interval = setInterval(checkStale, 1000)
    return () => clearInterval(interval)
  }, [state.lastActivity])

  if (!state.cursor) return null

  const color = getUserColor(userId)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: isStale ? 0.4 : 1,
        scale: 1,
        x: state.cursor.x - 2,
        y: state.cursor.y - 2,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        x: { type: 'spring', stiffness: 400, damping: 25 },
        y: { type: 'spring', stiffness: 400, damping: 25 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      }}
      className="absolute top-0 left-0"
      style={{ willChange: 'transform' }}
    >
      {/* 커서 SVG (개선된 디자인) */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-md"
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.46 0 .68-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* 이름 태그 (애니메이션) */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute left-5 top-5 px-2 py-0.5 rounded-md text-xs font-medium text-white whitespace-nowrap shadow-md"
        style={{ backgroundColor: color }}
      >
        {userId.slice(0, 8)}
      </motion.div>

      {/* 편집 중 표시 */}
      {(state.selectedSlotId || state.selectedTextId) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute left-5 top-10 flex items-center gap-1 text-xs bg-white/90 text-gray-600 px-1.5 py-0.5 rounded shadow-sm"
        >
          <Edit3 className="w-3 h-3" />
          <span>편집 중</span>
        </motion.div>
      )}
    </motion.div>
  )
}

// ============================================
// 영역 표시 컴포넌트 (애니메이션 적용)
// ============================================

interface ZoneIndicatorProps {
  slot: {
    id: string
    transform: { x: number; y: number; width: number; height: number }
  }
  ownerName: string
  zone?: EditingZone
}

function ZoneIndicator({ slot, ownerName, zone }: ZoneIndicatorProps) {
  const zoneColor = zone === 'A' ? {
    border: 'border-primary-400',
    bg: 'bg-primary-100/30',
    badge: 'bg-primary-400',
  } : {
    border: 'border-accent-400',
    bg: 'bg-accent-100/30',
    badge: 'bg-accent-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'absolute border-2 rounded-xl pointer-events-none',
        zoneColor.border,
        zoneColor.bg
      )}
      style={{
        left: slot.transform.x,
        top: slot.transform.y,
        width: slot.transform.width,
        height: slot.transform.height,
      }}
    >
      {/* 소유자 배지 (애니메이션) */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          'absolute -top-7 left-2 px-3 py-1 text-white text-xs font-medium rounded-lg shadow-md',
          zoneColor.badge
        )}
      >
        {zone} 영역 · {ownerName} 편집 중
      </motion.div>

      {/* 패턴 오버레이 */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            currentColor 10px,
            currentColor 11px
          )`,
        }}
      />
    </motion.div>
  )
}

// ============================================
// 충돌 알림 컴포넌트 (개선된 애니메이션)
// ============================================

interface ConflictNotificationProps {
  conflict: EditConflict
  onDismiss: () => void
}

function ConflictNotification({ conflict, onDismiss }: ConflictNotificationProps) {
  const target = conflict.slotId ? '이미지 슬롯' : conflict.textId ? '텍스트' : '요소'

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 cursor-pointer"
      onClick={onDismiss}
    >
      <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-lg">
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0"
        >
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </motion.div>
        <div>
          <p className="font-semibold text-amber-800">편집 충돌!</p>
          <p className="text-sm text-amber-600">
            {conflict.userName}님이 같은 {target}을 편집 중입니다
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// 유틸리티
// ============================================

function getRemoteUserName(users: Map<string, UserEditingState>, userId: string | null): string {
  if (!userId) return '알 수 없음'
  const user = users.get(userId)
  return user?.userId.slice(0, 8) || '사용자'
}
