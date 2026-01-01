'use client'

/**
 * 협업 참여자 목록 컴포넌트
 * useUserActivity 훅을 사용한 활동 상태 추적
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Crown, Circle, ChevronDown, ChevronUp } from 'lucide-react'
import { useUserActivity, getActivityStatusColor, type ActivityStatus } from '@/hooks/useUserActivity'
import type { EditingZone, CollabUser } from '@/lib/collab/types'

// 원격 참여자 타입
interface RemoteParticipant {
  id: string
  name: string
  color: string
  zone: EditingZone
  lastActivity: number
  isOnline: boolean
}

interface ParticipantListProps {
  sessionId: string | null
  user: CollabUser | null
  remoteUsers?: Map<string, RemoteParticipant>
  isHost?: boolean
  hostName?: string
  className?: string
  myZone?: EditingZone
}

// 사용자 색상 배열
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
]

function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash = hash & hash
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

export function ParticipantList({
  sessionId,
  user,
  remoteUsers,
  isHost,
  hostName,
  className = '',
  myZone,
}: ParticipantListProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // 로컬 사용자 활동 상태 추적
  const { status: activityStatus } = useUserActivity({
    enabled: !!sessionId,
    onStatusChange: (newStatus) => {
      // TODO: 활동 상태 변경 시 다른 사용자에게 브로드캐스트
      console.log('[ParticipantList] Activity status changed:', newStatus)
    },
  })

  const isConnected = !!sessionId && !!user
  const participants = remoteUsers ? Array.from(remoteUsers.entries()) : []
  const totalCount = isConnected ? participants.length + 1 : 1 // +1 for local user

  // 세션이 없으면 렌더링하지 않음
  if (!sessionId) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}
      style={{ width: 200 }}
    >
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-100 to-accent-100 hover:from-primary-150 hover:to-accent-150 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-800">참여자</span>
          <span className="bg-primary-200 text-primary-800 text-xs font-bold px-2 py-0.5 rounded-full">
            {totalCount}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* 참여자 목록 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
              {/* 연결 상태 표시 */}
              {!isConnected && (
                <div className="px-3 py-2 text-center text-sm text-gray-500">
                  <span className="animate-pulse">연결 중...</span>
                </div>
              )}

              {/* 나 (로컬 사용자) */}
              {isConnected && user && (
                <ParticipantItem
                  userId={user.id}
                  userName={user.name}
                  color={user.color || '#FF6B6B'}
                  zone={myZone ?? null}
                  activityStatus={activityStatus}
                  isLocal
                  isHost={isHost}
                />
              )}

              {/* 원격 사용자들 */}
              {participants.map(([participantId, participant]) => (
                <ParticipantItem
                  key={participantId}
                  userId={participantId}
                  userName={participant.name}
                  color={participant.color || getUserColor(participantId)}
                  zone={participant.zone}
                  isActive={participant.isOnline && Date.now() - participant.lastActivity < 5000}
                  isHost={hostName === participant.name}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================
// 개별 참여자 아이템
// ============================================

interface ParticipantItemProps {
  userId: string
  userName: string
  color: string
  zone: EditingZone
  isLocal?: boolean
  isActive?: boolean
  isHost?: boolean
  activityStatus?: ActivityStatus
}

function ParticipantItem({
  userId,
  userName,
  color,
  zone,
  isLocal,
  isActive = true,
  isHost,
  activityStatus,
}: ParticipantItemProps) {
  // 로컬 사용자는 activityStatus 사용, 원격 사용자는 isActive 사용
  const statusColor = isLocal && activityStatus
    ? getActivityStatusColor(activityStatus)
    : isActive ? '#22C55E' : '#9CA3AF'

  const statusTitle = isLocal && activityStatus
    ? activityStatus === 'active' ? '활동 중' : activityStatus === 'idle' ? '대기 중' : '자리비움'
    : isActive ? '온라인' : '오프라인'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
        isLocal
          ? 'bg-primary-50 border border-primary-100'
          : 'hover:bg-gray-50'
      }`}
    >
      {/* 아바타 */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 relative"
        style={{ backgroundColor: color }}
      >
        {userName[0]?.toUpperCase() || '?'}
        {/* 상태 인디케이터 (아바타 우하단) */}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
          style={{ backgroundColor: statusColor }}
          title={statusTitle}
        />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-800 truncate">
            {userName}
            {isLocal && ' (나)'}
          </span>
          {isHost && (
            <Crown className="w-3 h-3 text-amber-500" />
          )}
        </div>
        {zone && (
          <span
            className="text-xs px-1.5 py-0.5 rounded-md"
            style={{
              backgroundColor: zone === 'A' ? '#FFE4E1' : '#E0FFFF',
              color: zone === 'A' ? '#DC143C' : '#008B8B',
            }}
          >
            {zone} 영역 편집 중
          </span>
        )}
      </div>
    </motion.div>
  )
}

export default ParticipantList
