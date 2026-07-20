'use client'

/**
 * 협업 세션 관리 훅 (H-07 서버 배선 · DL-0006/DL-0007)
 *
 * 세션 생성/참가/종료/추방을 Supabase RPC(20260720000005)로 수행하고, collab_sessions 행 변경을
 * Realtime 으로 구독해 다른 기기와 상태를 동기화한다. 참가자 신원 = auth.uid(로그인 필수).
 * 기존 localStorage/BroadcastChannel stub 은 제거 — 다른 브라우저에서 참여 가능해진다.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import type { CollabUser, EditingZone } from '@/lib/collab/types'

// ============================================
// Types
// ============================================

type CollabRow = Database['public']['Tables']['collab_sessions']['Row']

/** DB participants JSONB 요소 형식 (RPC _collab_participant 와 정합) */
interface DbParticipant {
  id: string
  name: string
  avatar?: string | null
  isHost: boolean
  joinedAt: number
}

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

interface UseCollabSessionOptions {
  templateId?: string
  workId?: string
  /** 에디터 진입 시 URL 의 협업 세션 id — 기존 세션을 서버에서 복원(RLS: host/참가자만). */
  sessionId?: string
  maxParticipants?: number
}

interface UseCollabSessionReturn {
  session: CollabSession | null
  isHost: boolean
  isJoining: boolean
  error: string | null
  createSession: (user: CollabUser) => Promise<CollabSession | null>
  joinSession: (inviteCode: string, user: CollabUser) => Promise<boolean>
  leaveSession: () => void
  endSession: () => void
  getInviteLink: () => string
  copyInviteLink: () => Promise<boolean>
  regenerateInviteCode: () => string
  participants: SessionParticipant[]
  kickParticipant: (userId: string) => void
}

// ============================================
// Constants / helpers
// ============================================

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

function dbToParticipant(p: DbParticipant): SessionParticipant {
  return {
    userId: p.id,
    userName: p.name,
    userColor: getUserColor(p.id),
    userAvatar: p.avatar ?? undefined,
    zone: null,
    isHost: p.isHost,
    joinedAt: p.joinedAt,
    isOnline: true,
  }
}

/** DB row → 앱 CollabSession */
function rowToSession(row: CollabRow): CollabSession {
  const raw = (row.participants as unknown as DbParticipant[] | null) ?? []
  const participants = raw.map(dbToParticipant)
  const host = participants.find((p) => p.isHost)
  return {
    id: row.id,
    hostId: row.host_id ?? '',
    hostName: host?.userName ?? '',
    inviteCode: row.invite_code,
    templateId: row.template_id ?? undefined,
    workId: row.work_id ?? undefined,
    maxParticipants: row.max_participants ?? 2,
    participants,
    status: row.status as CollabSession['status'],
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : 0,
    invite_code: row.invite_code,
    max_participants: row.max_participants ?? 2,
  }
}

// ============================================
// Hook
// ============================================

export function useCollabSession(
  options: UseCollabSessionOptions = {}
): UseCollabSessionReturn {
  const { templateId, workId, sessionId } = options

  const [session, setSession] = useState<CollabSession | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localUserId, setLocalUserId] = useState<string | null>(null)
  const localUserIdRef = useRef<string | null>(null)
  localUserIdRef.current = localUserId

  // 에디터 진입 등: URL 의 세션 id 로 기존 세션 복원(RLS 가 host/참가자만 허용). 이후 Realtime 동기화.
  useEffect(() => {
    if (!sessionId || IS_DEMO_MODE) return
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('collab_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle()
      if (cancelled || !data) return
      setSession(rowToSession(data as CollabRow))
      if (user) setLocalUserId(user.id)
    })()
    return () => { cancelled = true }
  }, [sessionId])

  // 세션 생성 — RPC(host=auth.uid, 2인). 로그인 필수.
  const createSession = useCallback(async (user: CollabUser): Promise<CollabSession | null> => {
    setError(null)
    if (IS_DEMO_MODE) {
      setError('데모 모드에서는 협업을 사용할 수 없어요. 로그인 후 이용해주세요.')
      return null
    }
    try {
      const supabase = createClient()
      const inviteCode = generateInviteCode()
      const { data, error: rpcError } = await supabase.rpc('create_collab_session', {
        p_invite_code: inviteCode,
        p_template_id: templateId ?? null,
        p_work_id: workId ?? null,
      })
      if (rpcError || !data) {
        setError('세션 생성에 실패했어요.')
        return null
      }
      const sess = rowToSession(data as CollabRow)
      setSession(sess)
      setLocalUserId(user.id)
      return sess
    } catch {
      setError('세션 생성 중 오류가 발생했어요.')
      return null
    }
  }, [templateId, workId])

  // 세션 참가 — RPC(원자적 정원 체크). 로그인 필수.
  const joinSession = useCallback(async (
    inviteCode: string,
    user: CollabUser
  ): Promise<boolean> => {
    setIsJoining(true)
    setError(null)
    if (IS_DEMO_MODE) {
      setError('데모 모드에서는 협업에 참여할 수 없어요. 로그인 후 이용해주세요.')
      setIsJoining(false)
      return false
    }
    try {
      const supabase = createClient()
      const { data, error: rpcError } = await supabase.rpc('join_collab_session', {
        p_invite_code: inviteCode.toUpperCase(),
      })
      if (rpcError || !data) {
        const msg = rpcError?.message ?? ''
        setError(
          msg.includes('full') ? '세션이 가득 찼습니다.'
          : msg.includes('not found') ? '세션을 찾을 수 없거나 만료되었습니다.'
          : msg.includes('auth') ? '참여하려면 로그인이 필요해요.'
          : '세션 참가에 실패했습니다.'
        )
        return false
      }
      setSession(rowToSession(data as CollabRow))
      setLocalUserId(user.id)
      return true
    } catch {
      setError('세션 참가 중 오류가 발생했습니다.')
      return false
    } finally {
      setIsJoining(false)
    }
  }, [])

  // Realtime 구독 — 세션 행 변경 동기화(참가/나가기/추방/종료)
  useEffect(() => {
    const sid = session?.id
    if (!sid || IS_DEMO_MODE) return
    const supabase = createClient()
    const channel = supabase
      .channel(`collab:${sid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collab_sessions', filter: `id=eq.${sid}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setSession(null)
            return
          }
          const next = rowToSession(payload.new as CollabRow)
          // 완료/만료 → 세션 종료
          if (next.status === 'completed' || next.status === 'expired') {
            setSession(null)
            return
          }
          // 추방 감지: 본인이 참가자 목록에서 사라졌으면 세션 이탈
          const me = localUserIdRef.current
          if (me && next.hostId !== me && !next.participants.some((p) => p.userId === me)) {
            setSession(null)
            setError('세션에서 나가게 되었어요.')
            return
          }
          setSession(next)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.id])

  // 세션 나가기
  const leaveSession = useCallback(() => {
    const sess = session
    if (!sess || IS_DEMO_MODE) { setSession(null); setLocalUserId(null); return }
    const supabase = createClient()
    void supabase.rpc('leave_collab_session', { p_session_id: sess.id })
    setSession(null)
    setLocalUserId(null)
  }, [session])

  // 세션 종료 (호스트만)
  const endSession = useCallback(() => {
    const sess = session
    if (!sess || IS_DEMO_MODE) { setSession(null); setLocalUserId(null); return }
    const supabase = createClient()
    void supabase.rpc('end_collab_session', { p_session_id: sess.id })
    setSession(null)
    setLocalUserId(null)
  }, [session])

  // 초대 링크 생성
  const getInviteLink = useCallback((): string => {
    if (!session) return ''
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/collab/${session.inviteCode}`
  }, [session])

  // 초대 링크 복사
  const copyInviteLink = useCallback(async (): Promise<boolean> => {
    const link = getInviteLink()
    if (!link) return false
    try {
      await navigator.clipboard.writeText(link)
      return true
    } catch {
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

  // 초대 코드 재생성 — 서버 재발급은 후속(2인 MVP 범위 밖). 현재 코드 반환.
  const regenerateInviteCode = useCallback((): string => {
    return session?.inviteCode || ''
  }, [session])

  // 참가자 추방 (호스트만) — RPC. Realtime 이 목록 갱신을 전파.
  const kickParticipant = useCallback((userId: string) => {
    const sess = session
    if (!sess || sess.hostId !== localUserIdRef.current || IS_DEMO_MODE) return
    const supabase = createClient()
    void supabase.rpc('kick_collab_participant', { p_session_id: sess.id, p_user_id: userId })
  }, [session])

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
