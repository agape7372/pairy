'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Copy, Check, Crown, ChevronDown, LogOut, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui'
import type { PresenceParticipant } from '@/types/editor-entry'

// ============================================
// Props
// ============================================

interface PresenceBarProps {
  participants: PresenceParticipant[]
  inviteCode?: string
  isHost: boolean
  maxDisplayAvatars?: number
  onCopyInviteLink?: () => Promise<boolean>
  onLeaveSession?: () => void
  className?: string
}

// ============================================
// 컴포넌트
// ============================================

export function PresenceBar({
  participants,
  inviteCode,
  isHost,
  maxDisplayAvatars = 4,
  onCopyInviteLink,
  onLeaveSession,
  className,
}: PresenceBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  // 온라인 참여자만 필터링
  const onlineParticipants = useMemo(
    () => participants.filter((p) => p.isOnline),
    [participants]
  )

  // 표시할 아바타와 나머지 수
  const displayedAvatars = onlineParticipants.slice(0, maxDisplayAvatars)
  const remainingCount = Math.max(0, onlineParticipants.length - maxDisplayAvatars)

  const handleCopyLink = async () => {
    if (!onCopyInviteLink) return

    const success = await onCopyInviteLink()
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={cn('relative', className)}>
      {/* 메인 바 */}
      <motion.div
        className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* 참여자 아바타 스택 */}
        <div className="flex items-center -space-x-2">
          {displayedAvatars.map((participant, index) => (
            <ParticipantAvatar
              key={participant.userId}
              participant={participant}
              index={index}
              showCrown={participant.role === 'host'}
            />
          ))}

          {/* 추가 참여자 수 */}
          {remainingCount > 0 && (
            <div className="relative z-0 w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>

        {/* 참여자 수 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Users className="w-4 h-4" />
          <span className="font-medium">{onlineParticipants.length}</span>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </button>

        {/* 초대 버튼 */}
        {inviteCode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="ml-1 h-7 px-2"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-green-500" />
                <span className="text-xs">복사됨</span>
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5 mr-1" />
                <span className="text-xs">초대</span>
              </>
            )}
          </Button>
        )}
      </motion.div>

      {/* 확장 패널 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50"
          >
            {/* 헤더 */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">참여자</h3>
                <span className="text-xs text-gray-500">
                  {onlineParticipants.length}명 온라인
                </span>
              </div>
            </div>

            {/* 참여자 목록 */}
            <div className="max-h-64 overflow-y-auto">
              {participants.map((participant) => (
                <ParticipantListItem
                  key={participant.userId}
                  participant={participant}
                  isCurrentUser={false} // TODO: 실제 현재 사용자 확인
                />
              ))}
            </div>

            {/* 초대 코드 섹션 */}
            {inviteCode && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">초대 코드</p>
                    <p className="font-mono font-bold text-sm text-gray-900">
                      {inviteCode}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* 나가기 버튼 */}
            {onLeaveSession && (
              <div className="px-4 py-3 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onLeaveSession}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isHost ? '세션 종료' : '나가기'}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 클릭 외부 영역 닫기 */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}

// ============================================
// 참여자 아바타 컴포넌트
// ============================================

interface ParticipantAvatarProps {
  participant: PresenceParticipant
  index: number
  showCrown?: boolean
}

function ParticipantAvatar({ participant, index, showCrown }: ParticipantAvatarProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
      style={{ zIndex: 10 - index }}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full border-2 border-white overflow-hidden',
          'bg-gradient-to-br from-primary-200 to-accent-200'
        )}
      >
        {participant.avatarUrl ? (
          <Image
            src={participant.avatarUrl}
            alt={participant.nickname || '사용자'}
            width={32}
            height={32}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* NOTE: 빈 문자열 방어 - charAt(0)이 빈 값일 경우 '?' 표시 */}
            <span className="text-sm font-medium text-gray-600">
              {(participant.nickname?.charAt(0) || '?').toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* 온라인 상태 */}
      <div
        className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
          participant.isOnline ? 'bg-green-500' : 'bg-gray-300'
        )}
      />

      {/* 호스트 표시 */}
      {showCrown && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
          <Crown className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </motion.div>
  )
}

// ============================================
// 참여자 목록 아이템
// ============================================

interface ParticipantListItemProps {
  participant: PresenceParticipant
  isCurrentUser: boolean
}

function ParticipantListItem({ participant, isCurrentUser }: ParticipantListItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 transition-colors',
        isCurrentUser ? 'bg-primary-50' : 'hover:bg-gray-50'
      )}
    >
      {/* 아바타 */}
      <div className="relative shrink-0">
        <div
          className={cn(
            'w-9 h-9 rounded-full overflow-hidden',
            'bg-gradient-to-br from-primary-200 to-accent-200'
          )}
        >
          {participant.avatarUrl ? (
            <Image
              src={participant.avatarUrl}
              alt={participant.nickname || '사용자'}
              width={36}
              height={36}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {/* NOTE: 빈 문자열 방어 */}
              <span className="text-sm font-medium text-gray-600">
                {(participant.nickname?.charAt(0) || '?').toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* 온라인 상태 */}
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
            participant.isOnline ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm text-gray-900 truncate">
            {participant.nickname || '익명'}
          </span>
          {participant.role === 'host' && (
            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
          {isCurrentUser && (
            <span className="text-xs text-gray-400">(나)</span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {participant.editingElementId
            ? '편집 중...'
            : participant.isOnline
            ? '온라인'
            : '오프라인'}
        </p>
      </div>
    </div>
  )
}
