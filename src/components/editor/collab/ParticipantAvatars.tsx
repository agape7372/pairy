'use client'

/**
 * 참여자 아바타 바 컴포넌트
 * 에디터 왼쪽 하단에 가로로 표시되는 참여자 목록
 *
 * 향후 프로필 사진/캐릭터 토큰 지원 예정
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, MoreHorizontal } from 'lucide-react'
import { useUserActivity, getActivityStatusColor, type ActivityStatus } from '@/hooks/useUserActivity'
import type { EditingZone, CollabUser, UserEditingState } from '@/lib/collab/types'
import { cn } from '@/lib/utils/cn'

interface ParticipantAvatarsProps {
  sessionId: string | null
  user: CollabUser | null
  remoteUsers?: Map<string, UserEditingState>
  isHost?: boolean
  myZone?: EditingZone
  className?: string
  maxVisible?: number // 최대 표시 개수
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

export function ParticipantAvatars({
  sessionId,
  user,
  remoteUsers,
  isHost,
  myZone,
  className = '',
  maxVisible = 5,
}: ParticipantAvatarsProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  // 로컬 사용자 활동 상태 추적
  const { status: activityStatus } = useUserActivity({
    enabled: !!sessionId,
  })

  const isConnected = !!sessionId && !!user
  const participants = remoteUsers ? Array.from(remoteUsers.entries()) : []

  // 세션이 없으면 렌더링하지 않음
  if (!sessionId) return null

  // 모든 참여자 목록 (로컬 + 원격)
  const allParticipants: Array<{
    id: string
    name: string
    color: string
    avatar?: string
    isLocal: boolean
    isHost: boolean
    zone: EditingZone
    activityStatus?: ActivityStatus
    isActive: boolean
  }> = []

  // 로컬 사용자 추가 (맨 앞)
  if (isConnected && user) {
    allParticipants.push({
      id: user.id,
      name: user.name,
      color: user.color || '#FF6B6B',
      avatar: user.avatar,
      isLocal: true,
      isHost: !!isHost,
      zone: myZone ?? null,
      activityStatus,
      isActive: true,
    })
  }

  // 원격 사용자들 추가
  participants.forEach(([participantId, participant]) => {
    allParticipants.push({
      id: participantId,
      name: participant.userId.slice(0, 8),
      color: getUserColor(participantId),
      isLocal: false,
      isHost: false,
      zone: participant.zone,
      isActive: Date.now() - participant.lastActivity < 5000,
    })
  })

  const visibleParticipants = allParticipants.slice(0, maxVisible)
  const hiddenCount = allParticipants.length - maxVisible

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* 참여자 아바타들 */}
      <AnimatePresence mode="popLayout">
        {visibleParticipants.map((participant, index) => (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, scale: 0.5, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
            onMouseEnter={() => setShowTooltip(participant.id)}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <Avatar
              name={participant.name}
              color={participant.color}
              avatar={participant.avatar}
              isLocal={participant.isLocal}
              isHost={participant.isHost}
              isActive={participant.isActive}
              activityStatus={participant.activityStatus}
              zone={participant.zone}
              size="md"
            />

            {/* 툴팁 */}
            <AnimatePresence>
              {showTooltip === participant.id && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
                >
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                    <div className="flex items-center gap-1">
                      <span>{participant.name}</span>
                      {participant.isLocal && <span className="text-gray-400">(나)</span>}
                      {participant.isHost && <Crown className="w-3 h-3 text-amber-400" />}
                    </div>
                    {participant.zone && (
                      <div className="text-gray-400 text-[10px] mt-0.5">
                        {participant.zone} 영역 편집 중
                      </div>
                    )}
                    {/* 화살표 */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                      <div className="border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 더보기 표시 */}
      {hiddenCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold border-2 border-white shadow-md cursor-pointer hover:bg-gray-300 transition-colors"
          title={`외 ${hiddenCount}명`}
        >
          +{hiddenCount}
        </motion.div>
      )}

      {/* 연결 중 표시 */}
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md"
        >
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-600">연결 중...</span>
        </motion.div>
      )}
    </div>
  )
}

// ============================================
// 아바타 컴포넌트
// ============================================

interface AvatarProps {
  name: string
  color: string
  avatar?: string
  isLocal?: boolean
  isHost?: boolean
  isActive?: boolean
  activityStatus?: ActivityStatus
  zone?: EditingZone
  size?: 'sm' | 'md' | 'lg'
}

function Avatar({
  name,
  color,
  avatar,
  isLocal,
  isHost,
  isActive = true,
  activityStatus,
  zone,
  size = 'md',
}: AvatarProps) {
  // 크기 설정
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  const indicatorSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  }

  // 상태 색상
  const statusColor = isLocal && activityStatus
    ? getActivityStatusColor(activityStatus)
    : isActive ? '#22C55E' : '#9CA3AF'

  // 영역 테두리 색상
  const zoneBorderColor = zone === 'A'
    ? 'ring-2 ring-rose-400 ring-offset-1'
    : zone === 'B'
    ? 'ring-2 ring-cyan-400 ring-offset-1'
    : ''

  return (
    <div className="relative">
      {/* 메인 아바타 */}
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold text-white shadow-md border-2 border-white transition-transform hover:scale-110 cursor-pointer',
          sizeClasses[size],
          zoneBorderColor,
          isLocal && 'ring-2 ring-primary-300 ring-offset-1'
        )}
        style={{
          backgroundColor: avatar ? undefined : color,
          backgroundImage: avatar ? `url(${avatar})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!avatar && (name[0]?.toUpperCase() || '?')}
      </div>

      {/* 상태 인디케이터 */}
      <span
        className={cn(
          'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white',
          indicatorSizes[size]
        )}
        style={{ backgroundColor: statusColor }}
      />

      {/* 호스트 왕관 */}
      {isHost && (
        <Crown
          className="absolute -top-1 -right-1 w-4 h-4 text-amber-500 drop-shadow-sm"
          fill="#FCD34D"
        />
      )}
    </div>
  )
}

export default ParticipantAvatars
