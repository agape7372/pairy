'use client'

/**
 * 협업 참여자 목록 컴포넌트
 * 현재 세션에 참여 중인 사용자들을 표시
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Crown, Circle, ChevronDown, ChevronUp } from 'lucide-react'
import { useCollabOptional } from '@/lib/collab'
import type { EditingZone } from '@/lib/collab/types'

interface ParticipantListProps {
  isHost?: boolean
  hostName?: string
  className?: string
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

export function ParticipantList({ isHost, hostName, className = '' }: ParticipantListProps) {
  const collab = useCollabOptional()
  const [isExpanded, setIsExpanded] = useState(true)

  const isConnected = collab?.isConnected ?? false
  const participants = isConnected ? Array.from(collab!.remoteUsers.entries()) : []
  const totalCount = isConnected ? participants.length + 1 : 1 // +1 for local user

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
              {isConnected && (
                <ParticipantItem
                  userId={collab?.localUser?.id || 'me'}
                  userName={collab?.localUser?.name || '나'}
                  color={collab?.localUser?.color || '#FF6B6B'}
                  zone={collab?.myZone ?? null}
                  isLocal
                  isHost={isHost}
                />
              )}

              {/* 원격 사용자들 */}
              {participants.map(([userId, state]) => (
                <ParticipantItem
                  key={userId}
                  userId={userId}
                  userName={userId.slice(0, 8)}
                  color={getUserColor(userId)}
                  zone={state.zone}
                  isActive={Date.now() - state.lastActivity < 5000}
                  isHost={hostName === userId}
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
}

function ParticipantItem({
  userId,
  userName,
  color,
  zone,
  isLocal,
  isActive = true,
  isHost,
}: ParticipantItemProps) {
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
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{ backgroundColor: color }}
      >
        {userName[0]?.toUpperCase() || '?'}
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

      {/* 활성 상태 */}
      <Circle
        className={`w-2 h-2 shrink-0 ${
          isActive ? 'fill-green-500 text-green-500' : 'fill-gray-300 text-gray-300'
        }`}
      />
    </motion.div>
  )
}

export default ParticipantList
