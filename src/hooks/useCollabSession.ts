'use client'

/**
 * 협업 세션 관리 훅
 * 세션 생성, 참가, 초대 코드 관리
 *
 * C-5 배선(2026-07-18): 프로덕션은 Supabase collab_sessions + RPC
 * (join_collab_session / leave_collab_session / get_collab_session_by_invite),
 * 데모 모드는 기존 localStorage + BroadcastChannel (같은 브라우저 탭 간).
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { nanoid } from 'nanoid'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import type { CollabUser, EditingZone } from '@/lib/collab/types'

// ============================================
// Types
// ============================================

export interface CollabSession {
  id: string
  /** 서버가 멤버 변경 때 회전시키는 Realtime transport 권한 키 */
  realtimeKey?: string
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
    realtimeKey: session.realtimeKey || session.id || 'demo-session',
    invite_code: session.invite_code || session.inviteCode || '',
    max_participants: session.max_participants || session.maxParticipants || 2,
  } as CollabSession
}

interface UseCollabSessionOptions {
  templateId?: string
  workId?: string
  /** URL 등 외부 문맥이 기대하는 세션. 다른 탭의 마지막 세션 복원을 차단한다. */
  sessionId?: string
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

function getScopedSessionStorageKey(sessionId: string): string {
  return `${SESSION_STORAGE_KEY}:${sessionId}`
}

function cacheCollabSession(session: CollabSession): void {
  try {
    const serialized = JSON.stringify(session)
    localStorage.setItem(SESSION_STORAGE_KEY, serialized)
    localStorage.setItem(getScopedSessionStorageKey(session.id), serialized)
  } catch {
    // 저장소가 차단되어도 서버 검증된 인메모리 세션은 계속 사용할 수 있다.
  }
}

function removeCachedCollabSession(sessionId?: string): void {
  try {
    if (sessionId) {
      localStorage.removeItem(getScopedSessionStorageKey(sessionId))
    }

    const latest = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!sessionId || !latest) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return
    }

    try {
      if ((JSON.parse(latest) as Partial<CollabSession>).id === sessionId) {
        localStorage.removeItem(SESSION_STORAGE_KEY)
      }
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  } catch {
    // 브라우저 정책으로 localStorage가 막혀도 인메모리 세션 정리는 계속한다.
  }
}
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

type DbCollabSession = Database['public']['Tables']['collab_sessions']['Row'] & {
  /** migration 적용 전 타입과의 호환을 위해 optional 로 유지한다. */
  realtime_key?: string | null
}

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
const SESSION_REVALIDATION_INTERVAL_MS = 3_000

function getDbParticipants(row: DbCollabSession): DbParticipant[] {
  return (Array.isArray(row.participants) ? row.participants : []) as unknown as DbParticipant[]
}

function isDbSessionMember(row: DbCollabSession, userId: string): boolean {
  return (
    row.host_id === userId ||
    getDbParticipants(row).some((participant) => participant?.id === userId)
  )
}

function isDbSessionUsable(
  row: DbCollabSession,
  userId: string,
  expectedId: string
): boolean {
  const expiresAt = Date.parse(row.expires_at)
  return (
    row.id === expectedId &&
    (row.status === 'waiting' || row.status === 'active') &&
    Number.isFinite(expiresAt) &&
    expiresAt > Date.now() &&
    isDbSessionMember(row, userId)
  )
}

function isTransientSessionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const status = 'status' in error ? error.status : undefined
  if (typeof status === 'number' && (status === 0 || status >= 500)) {
    return true
  }

  const message = 'message' in error ? error.message : undefined
  return (
    typeof message === 'string' &&
    /(network|fetch|timeout|timed out|connection|load failed|temporary|temporar)/i.test(message)
  )
}

function mapDbSession(row: DbCollabSession): CollabSession {
  const raw = getDbParticipants(row)
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
    realtimeKey: typeof row.realtime_key === 'string' ? row.realtime_key : undefined,
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
  const { templateId, workId, sessionId: expectedSessionId, maxParticipants = 2 } = options

  const [session, setSession] = useState<CollabSession | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localUserId, setLocalUserId] = useState<string | null>(null)
  const [bootstrapSessionId, setBootstrapSessionId] = useState<string | null>(null)
  const validationRequestRef = useRef(0)
  const validationInFlightRef = useRef<{
    sessionId: string
    requestId: number
  } | null>(null)
  const transportMutationSessionRef = useRef<string | null>(null)

  // 세션 저장 (localStorage 캐시 + 데모에선 BroadcastChannel 알림)
  const saveSession = useCallback((sess: CollabSession | null) => {
    if (typeof window === 'undefined') return

    if (sess) {
      cacheCollabSession(sess)
    } else {
      removeCachedCollabSession(expectedSessionId)
    }

    if (!IS_DEMO_MODE) return
    // 데모: 다른 탭에 세션 변경 알림
    try {
      const ch = new BroadcastChannel(SESSION_SYNC_CHANNEL)
      ch.postMessage({ type: 'session-updated', session: sess })
      ch.close()
    } catch { /* BroadcastChannel not supported */ }
  }, [expectedSessionId])

  const clearProductionSession = useCallback((sessionIdToClear: string) => {
    // 이미 시작된 검증 응답이 추방 전 스냅샷으로 세션을 되살리지 못하게 한다.
    validationRequestRef.current += 1
    validationInFlightRef.current = null
    if (transportMutationSessionRef.current === sessionIdToClear) {
      transportMutationSessionRef.current = null
    }
    removeCachedCollabSession(sessionIdToClear)
    setBootstrapSessionId((current) =>
      current === sessionIdToClear ? null : current
    )
    setSession(null)
    setLocalUserId(null)
  }, [])

  const revalidateProductionSession = useCallback(async (targetSessionId: string) => {
    if (IS_DEMO_MODE) return

    if (transportMutationSessionRef.current === targetSessionId) return

    // interval/focus/visibility 이벤트가 겹쳐도 동일 세션 조회를 중복 실행하지 않는다.
    if (validationInFlightRef.current?.sessionId === targetSessionId) return

    const requestId = validationRequestRef.current + 1
    validationRequestRef.current = requestId
    validationInFlightRef.current = {
      sessionId: targetSessionId,
      requestId,
    }
    const isCurrentRequest = () =>
      validationRequestRef.current === requestId

    try {
      const supabase = createClient()
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (!isCurrentRequest()) return
      if (authError) {
        if (!isTransientSessionError(authError)) {
          clearProductionSession(targetSessionId)
        }
        return
      }
      if (!authUser) {
        clearProductionSession(targetSessionId)
        return
      }

      const { data: rawRow, error: fetchError } = await supabase
        .from('collab_sessions')
        .select('*')
        .eq('id', targetSessionId)
        .maybeSingle()

      if (!isCurrentRequest()) return
      if (fetchError) {
        if (!isTransientSessionError(fetchError)) {
          clearProductionSession(targetSessionId)
        }
        return
      }

      const row = rawRow as DbCollabSession | null
      if (!row || !isDbSessionUsable(row, authUser.id, targetSessionId)) {
        clearProductionSession(targetSessionId)
        return
      }

      const mapped = mapDbSession(row)
      setBootstrapSessionId(targetSessionId)
      setLocalUserId(authUser.id)
      setSession(mapped)
      cacheCollabSession(mapped)
    } catch {
      // fetch 자체가 throw 된 경우도 일시 오류로 취급해 현재 transport를 유지한다.
    } finally {
      if (validationInFlightRef.current?.requestId === requestId) {
        validationInFlightRef.current = null
      }
    }
  }, [clearProductionSession])

  // 세션 복원 — 데모: localStorage 신뢰 / 프로덕션: 저장된 id로 서버 재검증
  useEffect(() => {
    if (typeof window === 'undefined') return

    let stored: string | null
    try {
      stored = expectedSessionId
        ? localStorage.getItem(getScopedSessionStorageKey(expectedSessionId)) ||
          localStorage.getItem(SESSION_STORAGE_KEY)
        : localStorage.getItem(SESSION_STORAGE_KEY)
    } catch {
      return
    }
    if (!stored) return

    let parsed: Partial<CollabSession>
    try {
      parsed = JSON.parse(stored) as Partial<CollabSession>
    } catch {
      removeCachedCollabSession(expectedSessionId)
      return
    }

    if (expectedSessionId && parsed.id !== expectedSessionId) {
      return
    }

    if (IS_DEMO_MODE) {
      // 만료 확인
      if (parsed.expiresAt && parsed.expiresAt > Date.now() && parsed.status !== 'expired') {
        setSession(ensureCompatibility(parsed))
      } else {
        removeCachedCollabSession(parsed.id)
      }
      return
    }

    // 프로덕션은 캐시 내용 자체를 렌더링하지 않고 아래 재검증 effect의 조회 대상으로만 쓴다.
    if (!parsed.id) {
      removeCachedCollabSession(expectedSessionId)
      return
    }
    setBootstrapSessionId(parsed.id)
  }, [expectedSessionId])

  const sessionId = session?.id
  const revalidationSessionId =
    expectedSessionId || sessionId || bootstrapSessionId

  // URL 문맥이 바뀌면 이전 문서의 세션을 네트워크 성공 여부와 무관하게 즉시 분리한다.
  useEffect(() => {
    if (
      IS_DEMO_MODE ||
      !expectedSessionId ||
      !sessionId ||
      expectedSessionId === sessionId
    ) {
      return
    }
    clearProductionSession(sessionId)
  }, [clearProductionSession, expectedSessionId, sessionId])

  // 프로덕션 멤버십은 최대 3초 간격과 탭 복귀 시마다 서버에서 다시 확인한다.
  useEffect(() => {
    if (IS_DEMO_MODE || !revalidationSessionId) return

    let disposed = false
    const validate = () => {
      if (!disposed) {
        void revalidateProductionSession(revalidationSessionId)
      }
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') validate()
    }

    validate()
    const intervalId = window.setInterval(
      validate,
      SESSION_REVALIDATION_INTERVAL_MS
    )
    window.addEventListener('focus', validate)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      disposed = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', validate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      validationRequestRef.current += 1
      if (
        validationInFlightRef.current?.sessionId === revalidationSessionId
      ) {
        validationInFlightRef.current = null
      }
      if (transportMutationSessionRef.current === revalidationSessionId) {
        transportMutationSessionRef.current = null
      }
    }
  }, [revalidateProductionSession, revalidationSessionId])

  // 데모 전용: 탭 간 세션 동기화 (storage 이벤트 + BroadcastChannel)
  useEffect(() => {
    if (typeof window === 'undefined' || !IS_DEMO_MODE) return

    // storage 이벤트: 다른 탭에서 localStorage 변경 시
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== SESSION_STORAGE_KEY) return

      if (e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as Partial<CollabSession>
          if (expectedSessionId && parsed.id !== expectedSessionId) return
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
          if (
            sess.expiresAt > Date.now() &&
            (!expectedSessionId || sess.id === expectedSessionId)
          ) {
            setSession(sess)
          }
        } else if (msg.type === 'session-updated' && msg.session) {
          const sess = ensureCompatibility(msg.session)
          if (!expectedSessionId || sess.id === expectedSessionId) {
            setSession(sess)
          }
        }
      }
    } catch { /* BroadcastChannel not supported */ }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      syncChannel?.close()
    }
  }, [expectedSessionId])

  // 프로덕션 전용: Realtime 으로 세션 행 변경 구독 (참가자 합류/이탈/종료 반영)
  useEffect(() => {
    if (IS_DEMO_MODE || !sessionId || !localUserId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`collab-session-row:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'collab_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as DbCollabSession
          if (!isDbSessionUsable(row, localUserId, sessionId)) {
            clearProductionSession(sessionId)
            return
          }

          validationRequestRef.current += 1
          validationInFlightRef.current = null
          transportMutationSessionRef.current = null
          const mapped = mapDbSession(row)
          setBootstrapSessionId(sessionId)
          setSession(mapped)
          cacheCollabSession(mapped)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clearProductionSession, localUserId, sessionId])

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
      realtimeKey: sessionIdLocal,
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
      clearProductionSession(session.id)
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
  }, [clearProductionSession, session, localUserId, saveSession])

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
      clearProductionSession(session.id)
      return
    }

    const endedSession: CollabSession = {
      ...session,
      status: 'completed',
    }
    saveSession(endedSession)
    setSession(null)
    setLocalUserId(null)
  }, [clearProductionSession, session, localUserId, saveSession])

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

    const remainingParticipants = session.participants.filter(
      (participant) => participant.userId !== userId
    )

    if (IS_DEMO_MODE) {
      const updatedSession: CollabSession = {
        ...session,
        participants: remainingParticipants,
      }
      setSession(updatedSession)
      saveSession(updatedSession)
      return
    }

    // 이미 회전 요청 중이면 오래된 participants 스냅샷으로 병렬 UPDATE 하지 않는다.
    if (session.realtimeKey === '') return

    const previousSession = session
    validationRequestRef.current += 1
    validationInFlightRef.current = null
    transportMutationSessionRef.current = previousSession.id
    // 서버 응답 전에는 참가자 목록을 낙관적으로 신뢰하지 않는다. 대신 기존 transport
    // 자격을 즉시 비워 소비자가 연결을 끊을 수 있게 한다.
    setSession({
      ...session,
      realtimeKey: '',
    })

    void (async () => {
      const supabase = createClient()
      const isCurrentKick = () =>
        transportMutationSessionRef.current === previousSession.id
      try {
        const { data: rawRow, error: updateError } = await supabase
          .from('collab_sessions')
          .update({
            participants: remainingParticipants.map(toDbParticipant) as unknown as DbCollabSession['participants'],
          })
          .eq('id', previousSession.id)
          .select()
          .single()

        if (!isCurrentKick()) return

        if (updateError || !rawRow) {
          console.warn(
            'Kick participant error:',
            updateError?.message ?? '서버 응답 행이 없습니다'
          )
          setSession((current) =>
            current?.id === previousSession.id && current.realtimeKey === ''
              ? previousSession
              : current
          )
          transportMutationSessionRef.current = null
          return
        }

        const row = rawRow as DbCollabSession
        if (!isDbSessionUsable(row, localUserId, previousSession.id)) {
          clearProductionSession(previousSession.id)
          return
        }

        validationRequestRef.current += 1
        validationInFlightRef.current = null
        transportMutationSessionRef.current = null
        const mapped = mapDbSession(row)
        setBootstrapSessionId(previousSession.id)
        setSession(mapped)
        cacheCollabSession(mapped)
      } catch (kickError) {
        if (!isCurrentKick()) return
        console.warn('Kick participant error:', kickError)
        setSession((current) =>
          current?.id === previousSession.id && current.realtimeKey === ''
            ? previousSession
            : current
        )
        transportMutationSessionRef.current = null
      }
    })()
  }, [clearProductionSession, localUserId, saveSession, session])

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
