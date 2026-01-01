'use client'

/**
 * 협업 세션 관리 훅
 * 세션 생성, 참가, 초대 코드 관리
 */

import { useState, useCallback, useEffect } from 'react'
import { nanoid } from 'nanoid'
import type { CollabUser, EditingZone } from '@/lib/collab/types'

// ============================================
// Types
// ============================================

export interface CollabSession {
  id: string
  hostId: string
  hostName: string
  inviteCode: string
  templateId?: string
  workId?: string
  maxParticipants: number
  participants: SessionParticipant[]
  status: 'waiting' | 'active' | 'completed' | 'expired'
  createdAt: number
  expiresAt: number
  // 호환성 속성 (CollabPanel용)
  invite_code: string
  max_participants: number
}

export interface SessionParticipant {
  userId: string
  userName: string
  userColor: string
  userAvatar?: string
  zone: EditingZone
  isHost: boolean
  joinedAt: number
  isOnline: boolean
}

// Participant 타입 (CollabPanel 호환성)
export interface Participant {
  user_id: string
  nickname: string
  avatar_url?: string
  is_online: boolean
  role: 'host' | 'guest'
  cursor?: { x: number; y: number }
}

// SessionParticipant -> Participant 변환
export function toParticipant(sp: SessionParticipant): Participant {
  return {
    user_id: sp.userId,
    nickname: sp.userName,
    avatar_url: sp.userAvatar,
    is_online: sp.isOnline,
    role: sp.isHost ? 'host' : 'guest',
    cursor: undefined,
  }
}

// 세션 호환성 속성 보장
function ensureCompatibility(session: Partial<CollabSession>): CollabSession {
  return {
    ...session,
    invite_code: session.invite_code || session.inviteCode || '',
    max_participants: session.max_participants || session.maxParticipants || 2,
  } as CollabSession
}

interface UseCollabSessionOptions {
  templateId?: string
  workId?: string
  maxParticipants?: number
}

interface UseCollabSessionReturn {
  // 세션 상태
  session: CollabSession | null
  isHost: boolean
  isJoining: boolean
  error: string | null

  // 세션 관리
  createSession: (user: CollabUser) => Promise<CollabSession>
  joinSession: (inviteCode: string, user: CollabUser) => Promise<boolean>
  leaveSession: () => void
  endSession: () => void

  // 초대 관련
  getInviteLink: () => string
  copyInviteLink: () => Promise<boolean>
  regenerateInviteCode: () => string

  // 참가자 관리
  participants: SessionParticipant[]
  kickParticipant: (userId: string) => void
}

// ============================================
// Constants
// ============================================

const SESSION_STORAGE_KEY = 'pairy-collab-session'
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24시간
const INVITE_CODE_LENGTH = 6

// 사용자 색상 팔레트
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
]

function generateInviteCode(): string {
  // 읽기 쉬운 문자만 사용 (0, O, I, l 제외)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash = hash & hash
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

// ============================================
// Hook
// ============================================

export function useCollabSession(
  options: UseCollabSessionOptions = {}
): UseCollabSessionReturn {
  const { templateId, workId, maxParticipants = 2 } = options

  const [session, setSession] = useState<CollabSession | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localUserId, setLocalUserId] = useState<string | null>(null)

  // 세션 저장 (localStorage)
  const saveSession = useCallback((sess: CollabSession | null) => {
    if (typeof window === 'undefined') return

    if (sess) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sess))
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [])

  // 세션 복원
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<CollabSession>
        // 만료 확인
        if (parsed.expiresAt && parsed.expiresAt > Date.now() && parsed.status !== 'expired') {
          setSession(ensureCompatibility(parsed))
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY)
        }
      } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY)
      }
    }
  }, [])

  // 세션 생성
  const createSession = useCallback(async (user: CollabUser): Promise<CollabSession> => {
    setError(null)

    const now = Date.now()
    const sessionId = nanoid(12)

    const hostParticipant: SessionParticipant = {
      userId: user.id,
      userName: user.name,
      userColor: user.color || getUserColor(user.id),
      userAvatar: user.avatar,
      zone: null,
      isHost: true,
      joinedAt: now,
      isOnline: true,
    }

    const inviteCode = generateInviteCode()
    const newSession: CollabSession = {
      id: sessionId,
      hostId: user.id,
      hostName: user.name,
      inviteCode,
      templateId,
      workId,
      maxParticipants,
      participants: [hostParticipant],
      status: 'waiting',
      createdAt: now,
      expiresAt: now + SESSION_EXPIRY_MS,
      // 호환성 속성
      invite_code: inviteCode,
      max_participants: maxParticipants,
    }

    setSession(newSession)
    setLocalUserId(user.id)
    saveSession(newSession)

    // TODO: Supabase에 세션 저장
    // await supabase.from('collab_sessions').insert(newSession)

    return newSession
  }, [templateId, workId, maxParticipants, saveSession])

  // 세션 참가
  const joinSession = useCallback(async (
    inviteCode: string,
    user: CollabUser
  ): Promise<boolean> => {
    setIsJoining(true)
    setError(null)

    try {
      // TODO: Supabase에서 세션 조회
      // const { data, error } = await supabase
      //   .from('collab_sessions')
      //   .select('*')
      //   .eq('invite_code', inviteCode.toUpperCase())
      //   .single()

      // 데모: 로컬 스토리지에서 조회 (같은 브라우저 테스트용)
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!stored) {
        setError('세션을 찾을 수 없습니다')
        return false
      }

      const existingSession = ensureCompatibility(JSON.parse(stored))

      if (existingSession.inviteCode !== inviteCode.toUpperCase()) {
        setError('잘못된 초대 코드입니다')
        return false
      }

      if (existingSession.status === 'expired' || existingSession.expiresAt < Date.now()) {
        setError('만료된 세션입니다')
        return false
      }

      if (existingSession.participants.length >= existingSession.maxParticipants) {
        setError('세션이 가득 찼습니다')
        return false
      }

      // 이미 참가 중인지 확인
      const alreadyJoined = existingSession.participants.some(p => p.userId === user.id)
      if (alreadyJoined) {
        setSession(existingSession)
        setLocalUserId(user.id)
        return true
      }

      // 새 참가자 추가
      const newParticipant: SessionParticipant = {
        userId: user.id,
        userName: user.name,
        userColor: user.color || getUserColor(user.id),
        userAvatar: user.avatar,
        zone: null,
        isHost: false,
        joinedAt: Date.now(),
        isOnline: true,
      }

      const updatedSession: CollabSession = {
        ...existingSession,
        participants: [...existingSession.participants, newParticipant],
        status: 'active',
      }

      setSession(updatedSession)
      setLocalUserId(user.id)
      saveSession(updatedSession)

      return true
    } catch (err) {
      setError('세션 참가 중 오류가 발생했습니다')
      console.error('Join session error:', err)
      return false
    } finally {
      setIsJoining(false)
    }
  }, [saveSession])

  // 세션 나가기
  const leaveSession = useCallback(() => {
    if (!session || !localUserId) return

    const updatedParticipants = session.participants.filter(p => p.userId !== localUserId)

    if (updatedParticipants.length === 0) {
      // 마지막 참가자가 나가면 세션 종료
      saveSession(null)
      setSession(null)
    } else if (session.hostId === localUserId) {
      // 호스트가 나가면 다음 참가자에게 호스트 이전
      const newHost = updatedParticipants[0]
      const updatedSession: CollabSession = {
        ...session,
        hostId: newHost.userId,
        hostName: newHost.userName,
        participants: updatedParticipants.map((p, i) => ({
          ...p,
          isHost: i === 0,
        })),
      }
      saveSession(updatedSession)
      setSession(null)
    } else {
      const updatedSession: CollabSession = {
        ...session,
        participants: updatedParticipants,
      }
      saveSession(updatedSession)
      setSession(null)
    }

    setLocalUserId(null)
  }, [session, localUserId, saveSession])

  // 세션 종료 (호스트만)
  const endSession = useCallback(() => {
    if (!session || session.hostId !== localUserId) return

    const endedSession: CollabSession = {
      ...session,
      status: 'completed',
    }
    saveSession(endedSession)
    setSession(null)
    setLocalUserId(null)

    // TODO: Supabase에 세션 상태 업데이트
  }, [session, localUserId, saveSession])

  // 초대 링크 생성
  const getInviteLink = useCallback((): string => {
    if (!session) return ''

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/editor?join=${session.inviteCode}`
  }, [session])

  // 초대 링크 복사
  const copyInviteLink = useCallback(async (): Promise<boolean> => {
    const link = getInviteLink()
    if (!link) return false

    try {
      await navigator.clipboard.writeText(link)
      return true
    } catch {
      // 폴백: 구형 브라우저 지원
      const textArea = document.createElement('textarea')
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        return true
      } catch {
        return false
      } finally {
        document.body.removeChild(textArea)
      }
    }
  }, [getInviteLink])

  // 초대 코드 재생성
  const regenerateInviteCode = useCallback((): string => {
    if (!session || session.hostId !== localUserId) return session?.inviteCode || ''

    const newCode = generateInviteCode()
    const updatedSession: CollabSession = {
      ...session,
      inviteCode: newCode,
    }
    setSession(updatedSession)
    saveSession(updatedSession)

    return newCode
  }, [session, localUserId, saveSession])

  // 참가자 추방 (호스트만)
  const kickParticipant = useCallback((userId: string) => {
    if (!session || session.hostId !== localUserId || userId === localUserId) return

    const updatedSession: CollabSession = {
      ...session,
      participants: session.participants.filter(p => p.userId !== userId),
    }
    setSession(updatedSession)
    saveSession(updatedSession)

    // TODO: Supabase Realtime으로 추방 이벤트 전송
  }, [session, localUserId, saveSession])

  const isHost = session?.hostId === localUserId

  return {
    session,
    isHost,
    isJoining,
    error,
    createSession,
    joinSession,
    leaveSession,
    endSession,
    getInviteLink,
    copyInviteLink,
    regenerateInviteCode,
    participants: session?.participants || [],
    kickParticipant,
  }
}
