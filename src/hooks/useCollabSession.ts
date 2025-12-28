'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// 세션 상태 타입
export type SessionStatus = 'waiting' | 'active' | 'completed' | 'expired'

// 참여자 정보
export interface Participant {
  user_id: string
  nickname: string
  avatar_url: string | null
  joined_at: string
  role: 'host' | 'guest'
  cursor?: { x: number; y: number }
  is_online: boolean
}

// 협업 세션 정보
export interface CollabSession {
  id: string
  host_id: string
  work_id: string | null
  template_id: string | null
  invite_code: string
  participants: Participant[]
  max_participants: number
  status: SessionStatus
  created_at: string
  expires_at: string
}

interface UseCollabSessionOptions {
  workId?: string
  sessionId?: string
  inviteCode?: string
}

interface UseCollabSessionReturn {
  session: CollabSession | null
  participants: Participant[]
  isLoading: boolean
  error: Error | null
  isHost: boolean
  // 세션 관리
  createSession: (workId: string, templateId?: string) => Promise<string | null>
  joinSession: (inviteCode: string) => Promise<boolean>
  leaveSession: () => Promise<void>
  endSession: () => Promise<void>
  // Presence
  updateCursor: (x: number, y: number) => void
  // 유틸
  copyInviteLink: () => Promise<boolean>
  getInviteLink: () => string
}

// 초대 코드 생성 (6자리 영숫자)
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 혼동하기 쉬운 문자 제외
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function useCollabSession(options: UseCollabSessionOptions = {}): UseCollabSessionReturn {
  const { workId, sessionId, inviteCode } = options

  const [session, setSession] = useState<CollabSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const isHost = session?.host_id === currentUserId

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    // Supabase 설정이 없으면 스킵
    if (!isSupabaseConfigured()) return

    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // profiles 테이블에서 id 가져오기
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single()
          if (profile) {
            setCurrentUserId(profile.id)
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    fetchUser()
  }, [])

  // 세션 구독 설정
  const subscribeToSession = useCallback((sessionId: string) => {
    const supabase = createClient()

    // 기존 채널 정리
    if (channel) {
      supabase.removeChannel(channel)
    }

    // 새 채널 생성
    const newChannel = supabase.channel(`collab:${sessionId}`)

    // Presence 설정
    newChannel
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState()
        const presenceList = Object.values(state).flat() as unknown as Participant[]
        setParticipants(presenceList.map(p => ({ ...p, is_online: true })))
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUserId) {
          // 현재 사용자 정보 가져오기
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .eq('id', currentUserId)
            .single()

          if (profile) {
            await newChannel.track({
              user_id: profile.id,
              nickname: profile.display_name || '익명',
              avatar_url: profile.avatar_url,
              joined_at: new Date().toISOString(),
              role: isHost ? 'host' : 'guest',
            })
          }
        }
      })

    setChannel(newChannel)

    return () => {
      supabase.removeChannel(newChannel)
    }
  }, [currentUserId, isHost, channel])

  // 세션 정보 로드
  const fetchSession = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('collab_sessions')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      setSession(data as unknown as CollabSession)
      subscribeToSession(id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('세션을 불러올 수 없습니다.'))
    } finally {
      setIsLoading(false)
    }
  }, [subscribeToSession])

  // 초대 코드로 세션 찾기
  const findSessionByCode = useCallback(async (code: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('collab_sessions')
      .select('*')
      .eq('invite_code', code.toUpperCase())
      .eq('status', 'waiting')
      .single()

    if (error) return null
    return data as unknown as CollabSession
  }, [])

  // 세션 생성
  const createSession = useCallback(async (workId: string, templateId?: string): Promise<string | null> => {
    if (!currentUserId) {
      setError(new Error('로그인이 필요합니다.'))
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const inviteCode = generateInviteCode()

      const { data, error } = await supabase
        .from('collab_sessions')
        .insert({
          host_id: currentUserId,
          work_id: workId,
          template_id: templateId || null,
          invite_code: inviteCode,
          participants: [],
          max_participants: 2,
          status: 'waiting',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24시간 후
        })
        .select()
        .single()

      if (error) throw error

      setSession(data as unknown as CollabSession)
      subscribeToSession(data.id)
      return data.invite_code
    } catch (err) {
      setError(err instanceof Error ? err : new Error('세션 생성에 실패했습니다.'))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId, subscribeToSession])

  // 세션 참여
  const joinSession = useCallback(async (code: string): Promise<boolean> => {
    if (!currentUserId) {
      setError(new Error('로그인이 필요합니다.'))
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const sessionData = await findSessionByCode(code)
      if (!sessionData) {
        setError(new Error('유효하지 않은 초대 코드입니다.'))
        return false
      }

      // 만료 확인
      if (new Date(sessionData.expires_at) < new Date()) {
        setError(new Error('초대가 만료되었습니다.'))
        return false
      }

      // 인원 확인
      const currentParticipants = sessionData.participants || []
      if (currentParticipants.length >= sessionData.max_participants) {
        setError(new Error('세션이 가득 찼습니다.'))
        return false
      }

      // 세션 상태 업데이트
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', currentUserId)
        .single()

      if (!profile) throw new Error('프로필을 찾을 수 없습니다.')

      const newParticipant: Participant = {
        user_id: profile.id,
        nickname: profile.display_name || '익명',
        avatar_url: profile.avatar_url,
        joined_at: new Date().toISOString(),
        role: 'guest',
        is_online: true,
      }

      // JSON 직렬화를 통해 Supabase Json 타입과 호환되도록 변환
      const updatedParticipants = JSON.parse(JSON.stringify([...currentParticipants, newParticipant]))

      const { error: updateError } = await supabase
        .from('collab_sessions')
        .update({
          participants: updatedParticipants,
          status: 'active' as const,
        })
        .eq('id', sessionData.id)

      if (updateError) throw updateError

      setSession({ ...sessionData, status: 'active' })
      subscribeToSession(sessionData.id)
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('세션 참여에 실패했습니다.'))
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId, findSessionByCode, subscribeToSession])

  // 세션 나가기
  const leaveSession = useCallback(async () => {
    if (!session || !currentUserId) return

    try {
      const supabase = createClient()

      // Presence에서 나가기
      if (channel) {
        await channel.untrack()
        supabase.removeChannel(channel)
      }

      // 참여자 목록에서 제거
      const updatedParticipants = (session.participants || [])
        .filter(p => p.user_id !== currentUserId)

      // JSON 직렬화
      const serializedParticipants = JSON.parse(JSON.stringify(updatedParticipants))
      const newStatus = updatedParticipants.length === 0 ? 'waiting' : 'active'

      await supabase
        .from('collab_sessions')
        .update({
          participants: serializedParticipants,
          status: newStatus as 'waiting' | 'active',
        })
        .eq('id', session.id)

      setSession(null)
      setParticipants([])
      setChannel(null)
    } catch (err) {
      console.error('Failed to leave session:', err)
    }
  }, [session, currentUserId, channel])

  // 세션 종료 (호스트만)
  const endSession = useCallback(async () => {
    if (!session || !isHost) return

    try {
      const supabase = createClient()

      if (channel) {
        supabase.removeChannel(channel)
      }

      await supabase
        .from('collab_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id)

      setSession(null)
      setParticipants([])
      setChannel(null)
    } catch (err) {
      console.error('Failed to end session:', err)
    }
  }, [session, isHost, channel])

  // 커서 업데이트
  const updateCursor = useCallback((x: number, y: number) => {
    if (channel && currentUserId) {
      channel.track({
        user_id: currentUserId,
        cursor: { x, y },
      })
    }
  }, [channel, currentUserId])

  // 초대 링크 복사
  const copyInviteLink = useCallback(async (): Promise<boolean> => {
    if (!session) return false

    try {
      const link = getInviteLink()
      await navigator.clipboard.writeText(link)
      return true
    } catch {
      return false
    }
  }, [session])

  // 초대 링크 가져오기
  const getInviteLink = useCallback((): string => {
    if (!session) return ''
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/collab/${session.invite_code}`
  }, [session])

  // 세션 ID로 초기 로드
  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId)
    }
  }, [sessionId, fetchSession])

  // 초대 코드로 초기 로드
  useEffect(() => {
    if (inviteCode && !session) {
      joinSession(inviteCode)
    }
  }, [inviteCode, session, joinSession])

  // 정리
  useEffect(() => {
    return () => {
      if (channel) {
        const supabase = createClient()
        supabase.removeChannel(channel)
      }
    }
  }, [channel])

  return {
    session,
    participants,
    isLoading,
    error,
    isHost,
    createSession,
    joinSession,
    leaveSession,
    endSession,
    updateCursor,
    copyInviteLink,
    getInviteLink,
  }
}
