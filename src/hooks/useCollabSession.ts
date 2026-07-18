'use client'

/**
 * 협업 세션 관리 훅
 * 세션 생성, 참가, 초대 코드 관리
 *
 * C-5 배선(2026-07-18): 프로덕션은 Supabase collab_sessions + RPC
 * (join_collab_session / leave_collab_session / get_collab_session_by_invite),
 * 데모 모드는 기존 localStorage + BroadcastChannel (같은 브라우저 탭 간).
 */

import { useState, useCallback, useEffect } from 'react'
import { nanoid } from 'nanoid'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
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
const SESSION_SYNC_CHANNEL = 'pairy-session-sync'

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
// 서버 행 ↔ 훅 뷰모델 매핑 (프로덕션)
// ============================================

type DbCollabSession = Database['public']['Tables']['collab_sessions']['Row']

/** participants JSONB 항목 (join_collab_session RPC 가 기록하는 형태) */
interface DbParticipant {
  id: string
  name?: string
  color?: string
  avatar?: string
  zone?: EditingZone
  isHost?: boolean
  joinedAt?: number
  isOnline?: boolean
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function mapDbSession(row: DbCollabSession): CollabSession {
  const raw = (Array.isArray(row.participants) ? row.participants : []) as unknown as DbParticipant[]
  const participants: SessionParticipant[] = raw
    .filter((p) => typeof p?.id === 'string')
    .map((p) => ({
      userId: p.id,
      userName: p.name || '게스트',
      userColor: p.color || getUserColor(p.id),
      userAvatar: p.avatar || undefined,
      zone: p.zone ?? null,
      isHost: p.isHost === true || p.id === row.host_id,
      joinedAt: typeof p.joinedAt === 'number' ? p.joinedAt : Date.parse(row.created_at),
      isOnline: p.isOnline !== false,
    }))
  const host = participants.find((p) => p.userId === row.host_id)

  return {
    id: row.id,
    hostId: row.host_id,
    hostName: host?.userName ?? '호스트',
    inviteCode: row.invite_code,
    templateId: row.template_id ?? undefined,
    workId: row.work_id ?? undefined,
    maxParticipants: row.max_participants,
    participants,
    status: row.status,
    createdAt: Date.parse(row.created_at),
    expiresAt: Date.parse(row.expires_at),
    invite_code: row.invite_code,
    max_participants: row.max_participants,
  }
}

function toDbParticipant(sp: SessionParticipant): DbParticipant {
  return {
    id: sp.userId,
    name: sp.userName,
    color: sp.userColor,
    avatar: sp.userAvatar ?? '',
    zone: sp.zone,
    isHost: sp.isHost,
    joinedAt: sp.joinedAt,
    isOnline: sp.isOnline,
  }
}

/** RPC 예외 메시지 → 사용자 메시지 */
function mapRpcError(message: string | undefined): string {
  if (!message) return '세션 참가 중 오류가 발생했습니다'
  if (message.includes('SESSION_NOT_FOUND')) return '세션을 찾을 수 없습니다'
  if (message.includes('SESSION_FULL')) return '세션이 가득 찼습니다'
  if (message.includes('AUTH_REQUIRED')) return '로그인이 필요합니다'
  return '세션 참가 중 오류가 발생했습니다'
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

  // 세션 저장 (localStorage 캐시 + 데모에선 BroadcastChannel 알림)
  const saveSession = useCallback((sess: CollabSession | null) => {
    if (typeof window === 'undefined') return

    if (sess) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sess))
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }

    if (!IS_DEMO_MODE) return
    // 데모: 다른 탭에 세션 변경 알림
    try {
      const ch = new BroadcastChannel(SESSION_SYNC_CHANNEL)
      ch.postMessage({ type: 'session-updated', session: sess })
      ch.close()
    } catch { /* BroadcastChannel not supported */ }
  }, [])

  // 세션 복원 — 데모: localStorage 신뢰 / 프로덕션: 저장된 id로 서버 재검증
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return

    let parsed: Partial<CollabSession>
    try {
      parsed = JSON.parse(stored) as Partial<CollabSession>
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return
    }

    if (IS_DEMO_MODE) {
      // 만료 확인
      if (parsed.expiresAt && parsed.expiresAt > Date.now() && parsed.status !== 'expired') {
        setSession(ensureCompatibility(parsed))
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY)
      }
      return
    }

    // 프로덕션: 서버가 진실 — 저장된 세션 id 재조회 (host/참가자만 SELECT 가능)
    if (!parsed.id) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const [{ data: { user } }, { data: row }] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from('collab_sessions').select('*').eq('id', parsed.id!).maybeSingle(),
        ])
        if (cancelled) return
        if (
          !row ||
          (row.status !== 'waiting' && row.status !== 'active') ||
          Date.parse(row.expires_at) < Date.now()
        ) {
          localStorage.removeItem(SESSION_STORAGE_KEY)
          return
        }
        setSession(mapDbSession(row))
        if (user) setLocalUserId(user.id)
      } catch { /* 네트워크 실패 시 복원 포기 */ }
    })()
    return () => { cancelled = true }
  }, [])

  // 데모 전용: 탭 간 세션 동기화 (storage 이벤트 + BroadcastChannel)
  useEffect(() => {
    if (typeof window === 'undefined' || !IS_DEMO_MODE) return

    // storage 이벤트: 다른 탭에서 localStorage 변경 시
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== SESSION_STORAGE_KEY) return

      if (e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as Partial<CollabSession>
          if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
            setSession(ensureCompatibility(parsed))
          }
        } catch { /* ignore */ }
      } else {
        // 세션이 삭제됨
        setSession(null)
        setLocalUserId(null)
      }
    }

    // BroadcastChannel: 세션 존재 확인 요청/응답
    let syncChannel: BroadcastChannel | null = null
    try {
      syncChannel = new BroadcastChannel(SESSION_SYNC_CHANNEL)
      syncChannel.onmessage = (event: MessageEvent) => {
        const msg = event.data as { type: string; session?: CollabSession }
        if (msg.type === 'session-query') {
          // 다른 탭이 세션을 물어봄 → 현재 세션 응답
          const currentStored = localStorage.getItem(SESSION_STORAGE_KEY)
          if (currentStored) {
            syncChannel?.postMessage({
              type: 'session-response',
              session: JSON.parse(currentStored),
            })
          }
        } else if (msg.type === 'session-response' && msg.session) {
          // 응답을 받았다면 세션 설정
          const sess = ensureCompatibility(msg.session)
          if (sess.expiresAt > Date.now()) {
            setSession(sess)
          }
        } else if (msg.type === 'session-updated' && msg.session) {
          const sess = ensureCompatibility(msg.session)
          setSession(sess)
        }
      }
    } catch { /* BroadcastChannel not supported */ }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      syncChannel?.close()
    }
  }, [])

  // 프로덕션 전용: Realtime 으로 세션 행 변경 구독 (참가자 합류/이탈/종료 반영)
  const sessionId = session?.id
  useEffect(() => {
    if (IS_DEMO_MODE || !sessionId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`collab-session-row:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'collab_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as DbCollabSession
          if (row.status === 'completed' || row.status === 'expired') {
            setSession(null)
            setLocalUserId(null)
            localStorage.removeItem(SESSION_STORAGE_KEY)
          } else {
            const mapped = mapDbSession(row)
            setSession(mapped)
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mapped))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  // 세션 생성
  const createSession = useCallback(async (user: CollabUser): Promise<CollabSession> => {
    setError(null)

    const now = Date.now()

    if (!IS_DEMO_MODE) {
      // 프로덕션: 서버에 세션 생성 (host_id = 인증 uid, RLS INSERT 정책)
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setError('로그인이 필요합니다')
        throw new Error('AUTH_REQUIRED')
      }

      const inviteCode = generateInviteCode()
      const hostParticipant: DbParticipant = {
        id: authUser.id,
        name: user.name,
        color: user.color || getUserColor(authUser.id),
        avatar: user.avatar ?? '',
        zone: null,
        isHost: true,
        joinedAt: now,
        isOnline: true,
      }

      const { data: row, error: insertError } = await supabase
        .from('collab_sessions')
        .insert({
          host_id: authUser.id,
          template_id: templateId && UUID_RE.test(templateId) ? templateId : null,
          work_id: workId && UUID_RE.test(workId) ? workId : null,
          invite_code: inviteCode,
          participants: [hostParticipant] as unknown as DbCollabSession['participants'],
          max_participants: maxParticipants,
          status: 'waiting',
          expires_at: new Date(now + SESSION_EXPIRY_MS).toISOString(),
        })
        .select()
        .single()

      if (insertError || !row) {
        setError('세션 생성에 실패했습니다')
        throw new Error(insertError?.message ?? 'CREATE_FAILED')
      }

      const mapped = mapDbSession(row)
      setSession(mapped)
      setLocalUserId(authUser.id)
      saveSession(mapped)
      return mapped
    }

    // 데모: localStorage 세션
    const sessionIdLocal = nanoid(12)

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
      id: sessionIdLocal,
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
      if (!IS_DEMO_MODE) {
        // 프로덕션: RPC 참가 — 신원(id)은 서버가 auth.uid() 로 강제 (C-5)
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          setError('로그인이 필요합니다')
          return false
        }

        const { data: row, error: rpcError } = await supabase.rpc('join_collab_session', {
          p_invite_code: inviteCode.toUpperCase(),
          p_name: user.name,
          p_color: user.color || null,
          p_avatar: user.avatar || null,
        })

        if (rpcError || !row) {
          setError(mapRpcError(rpcError?.message))
          return false
        }

        const mapped = mapDbSession(row as DbCollabSession)
        setSession(mapped)
        setLocalUserId(authUser.id)
        saveSession(mapped)
        return true
      }

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

    if (!IS_DEMO_MODE) {
      // 프로덕션: 서버에서 자신 제거 (호스트/전원 이탈 시 서버가 completed 처리)
      const supabase = createClient()
      supabase.rpc('leave_collab_session', { p_session_id: session.id })
        .then(({ error: rpcError }) => {
          if (rpcError) console.warn('Leave session error:', rpcError.message)
        })
      localStorage.removeItem(SESSION_STORAGE_KEY)
      setSession(null)
      setLocalUserId(null)
      return
    }

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

    if (!IS_DEMO_MODE) {
      // 프로덕션: 호스트가 상태 종료 (RLS: 호스트만 UPDATE 가능)
      const supabase = createClient()
      supabase
        .from('collab_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', session.id)
        .then(({ error: updateError }) => {
          if (updateError) console.warn('End session error:', updateError.message)
        })
      localStorage.removeItem(SESSION_STORAGE_KEY)
      setSession(null)
      setLocalUserId(null)
      return
    }

    const endedSession: CollabSession = {
      ...session,
      status: 'completed',
    }
    saveSession(endedSession)
    setSession(null)
    setLocalUserId(null)
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
      invite_code: newCode,
    }
    setSession(updatedSession)
    saveSession(updatedSession)

    if (!IS_DEMO_MODE) {
      const supabase = createClient()
      supabase
        .from('collab_sessions')
        .update({ invite_code: newCode })
        .eq('id', session.id)
        .then(({ error: updateError }) => {
          if (updateError) console.warn('Regenerate invite code error:', updateError.message)
        })
    }

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

    if (!IS_DEMO_MODE) {
      // 프로덕션: 호스트가 participants 에서 제거 (RLS: 호스트만 UPDATE 가능)
      const supabase = createClient()
      supabase
        .from('collab_sessions')
        .update({
          participants: updatedSession.participants.map(toDbParticipant) as unknown as DbCollabSession['participants'],
        })
        .eq('id', session.id)
        .then(({ error: updateError }) => {
          if (updateError) console.warn('Kick participant error:', updateError.message)
        })
    }
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
