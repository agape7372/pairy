'use client'

import { useState } from 'react'
import { Users, Copy, Check, UserPlus, Crown, LogOut, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import type { Participant, CollabSession } from '@/hooks/useCollabSession'

interface CollabPanelProps {
  session: CollabSession | null
  participants: Participant[]
  isHost: boolean
  isLoading: boolean
  onCreateSession: () => Promise<string | null>
  onLeaveSession: () => Promise<void>
  onEndSession: () => Promise<void>
  onCopyLink: () => Promise<boolean>
  getInviteLink: () => string
}

export function CollabPanel({
  session,
  participants,
  isHost,
  isLoading,
  onCreateSession,
  onLeaveSession,
  onEndSession,
  onCopyLink,
  getInviteLink,
}: CollabPanelProps) {
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)

  const handleCopy = async () => {
    const success = await onCopyLink()
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCreateSession = async () => {
    setCreating(true)
    await onCreateSession()
    setCreating(false)
  }

  // 세션이 없을 때
  if (!session) {
    return (
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-accent-400" />
          <h3 className="font-semibold text-gray-900">함께 편집하기</h3>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          친구를 초대해서 함께 페어틀을 완성해보세요!
        </p>

        <Button
          className="w-full"
          onClick={handleCreateSession}
          disabled={creating || isLoading}
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              협업 세션 만들기
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-400" />
            <h3 className="font-semibold text-gray-900">협업 세션</h3>
          </div>
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            session.status === 'active'
              ? 'bg-success-light text-success-dark'
              : 'bg-warning-light text-warning-dark'
          )}>
            {session.status === 'active' ? '진행 중' : '대기 중'}
          </span>
        </div>

        {/* 초대 코드 */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500 mb-0.5">초대 코드</p>
            <p className="font-mono font-bold text-lg text-gray-900 tracking-wider">
              {session.invite_code}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1 text-success" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                복사
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 참여자 목록 */}
      <div className="p-4">
        <p className="text-xs font-medium text-gray-500 mb-3">
          참여자 ({participants.length}/{session.max_participants})
        </p>

        <div className="space-y-2">
          {participants.map((participant) => (
            <ParticipantItem
              key={participant.user_id}
              participant={participant}
              isCurrentUser={false} // TODO: 현재 사용자 확인
            />
          ))}

          {/* 빈 슬롯 표시 */}
          {Array.from({ length: session.max_participants - participants.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 p-2 rounded-lg border-2 border-dashed border-gray-200"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-gray-300" />
              </div>
              <span className="text-sm text-gray-400">대기 중...</span>
            </div>
          ))}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="p-4 pt-0">
        {isHost ? (
          <Button
            variant="outline"
            className="w-full text-error hover:bg-error-light"
            onClick={onEndSession}
          >
            <X className="w-4 h-4 mr-2" />
            세션 종료
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={onLeaveSession}
          >
            <LogOut className="w-4 h-4 mr-2" />
            나가기
          </Button>
        )}
      </div>
    </div>
  )
}

// 참여자 아이템 컴포넌트
function ParticipantItem({
  participant,
  isCurrentUser,
}: {
  participant: Participant
  isCurrentUser: boolean
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-2 rounded-lg transition-colors',
      isCurrentUser ? 'bg-primary-50' : 'hover:bg-gray-50'
    )}>
      {/* 아바타 */}
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center overflow-hidden">
          {participant.avatar_url ? (
            <img
              src={participant.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-gray-600">
              {participant.nickname.charAt(0)}
            </span>
          )}
        </div>
        {/* 온라인 상태 */}
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
          participant.is_online ? 'bg-success' : 'bg-gray-300'
        )} />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm text-gray-900 truncate">
            {participant.nickname}
          </span>
          {participant.role === 'host' && (
            <Crown className="w-3.5 h-3.5 text-warning shrink-0" />
          )}
          {isCurrentUser && (
            <span className="text-xs text-gray-400">(나)</span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {participant.role === 'host' ? '호스트' : '게스트'}
        </p>
      </div>
    </div>
  )
}

// 협업 커서 컴포넌트
export function CollabCursor({
  participant,
}: {
  participant: Participant
}) {
  if (!participant.cursor) return null

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-75"
      style={{
        left: participant.cursor.x,
        top: participant.cursor.y,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* 커서 */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="drop-shadow-sm"
      >
        <path
          d="M5.5 3L14.5 11.5L9.5 12L7 17L5.5 3Z"
          fill={participant.role === 'host' ? '#E8A8A8' : '#9FD9D9'}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* 이름 태그 */}
      <div
        className={cn(
          'absolute left-4 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap',
          participant.role === 'host' ? 'bg-primary-400' : 'bg-accent-400'
        )}
      >
        {participant.nickname}
      </div>
    </div>
  )
}
