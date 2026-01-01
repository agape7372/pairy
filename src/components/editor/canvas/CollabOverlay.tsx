'use client'

/**
 * Sprint 32: 협업 오버레이 컴포넌트
 * - 원격 커서 표시
 * - 영역 분리 시각화
 * - 충돌 알림
 */

import { useMemo } from 'react'
import { AlertCircle, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useCollabOptional, type UserEditingState, type EditConflict, type EditingZone } from '@/lib/collab'

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
      {/* 원격 커서들 */}
      {Array.from(collab.remoteUsers.entries()).map(([userId, state]) => (
        <RemoteCursor key={userId} state={state} />
      ))}

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
          />
        )
      })}

      {/* 충돌 알림 */}
      {collab.currentConflict && (
        <ConflictNotification
          conflict={collab.currentConflict}
          onDismiss={collab.dismissConflict}
        />
      )}
    </div>
  )
}

// ============================================
// 원격 커서 컴포넌트
// ============================================

function RemoteCursor({ state }: { state: UserEditingState }) {
  if (!state.cursor) return null

  // 사용자별 고유 색상 생성
  const color = useMemo(() => {
    const colors = ['#E8A8A8', '#9FD9D9', '#B8A8E8', '#A8E8B8', '#E8D8A8']
    const index = state.userId.charCodeAt(0) % colors.length
    return colors[index]
  }, [state.userId])

  return (
    <div
      className="absolute transition-all duration-75 ease-out"
      style={{
        left: state.cursor.x,
        top: state.cursor.y,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* 커서 아이콘 */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="drop-shadow-sm"
      >
        <path
          d="M5.5 3L14.5 11.5L9.5 12L7 17L5.5 3Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* 이름 태그 */}
      <div
        className="absolute left-4 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap shadow-sm"
        style={{ backgroundColor: color }}
      >
        {state.userId.slice(0, 8)}
      </div>

      {/* 편집 중 표시 */}
      {(state.selectedSlotId || state.selectedTextId) && (
        <div className="absolute left-4 top-8 flex items-center gap-1 text-xs text-gray-500">
          <Edit3 className="w-3 h-3" />
          <span>편집 중</span>
        </div>
      )}
    </div>
  )
}

// ============================================
// 영역 표시 컴포넌트
// ============================================

interface ZoneIndicatorProps {
  slot: {
    id: string
    transform: { x: number; y: number; width: number; height: number }
  }
  ownerName: string
}

function ZoneIndicator({ slot, ownerName }: ZoneIndicatorProps) {
  return (
    <div
      className="absolute border-2 border-accent-400 bg-accent-100/30 rounded-lg pointer-events-none"
      style={{
        left: slot.transform.x,
        top: slot.transform.y,
        width: slot.transform.width,
        height: slot.transform.height,
      }}
    >
      {/* 소유자 배지 */}
      <div className="absolute -top-6 left-0 px-2 py-0.5 bg-accent-400 text-white text-xs font-medium rounded-t">
        {ownerName} 편집 중
      </div>

      {/* 반투명 오버레이 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/80 px-3 py-1.5 rounded-full text-sm text-gray-600 shadow-sm">
          {ownerName}님이 편집 중
        </div>
      </div>
    </div>
  )
}

// ============================================
// 충돌 알림 컴포넌트
// ============================================

interface ConflictNotificationProps {
  conflict: EditConflict
  onDismiss: () => void
}

function ConflictNotification({ conflict, onDismiss }: ConflictNotificationProps) {
  const target = conflict.slotId ? '이미지 슬롯' : conflict.textId ? '텍스트' : '요소'

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'bg-warning text-warning-dark px-4 py-3 rounded-xl shadow-lg',
        'flex items-center gap-3',
        'animate-in slide-in-from-bottom-4 fade-in duration-300'
      )}
      onClick={onDismiss}
    >
      <AlertCircle className="w-5 h-5 shrink-0" />
      <div>
        <p className="font-medium">편집 충돌!</p>
        <p className="text-sm opacity-80">
          {conflict.userName}님이 같은 {target}을 편집 중입니다
        </p>
      </div>
    </div>
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
