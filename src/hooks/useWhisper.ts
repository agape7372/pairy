'use client'

/**
 * Sprint 35: Whisper 관리 훅
 *
 * 기능:
 * - 위스퍼 목록 조회
 * - Realtime 구독 (새 위스퍼 알림)
 * - 읽음 처리
 * - 선물 수령
 * - 알림 상태 관리
 *
 * 설계 원칙:
 * - 데모 모드 지원 (localStorage fallback)
 * - 안전한 비동기 처리
 * - 메모리 누수 방지
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { IS_DEMO_MODE } from '@/lib/supabase/client'
import type { Json } from '@/types/database.types'
import type {
  Whisper,
  WhisperPayload,
  WhisperNotificationState,
  CreateWhisperInput,
  BroadcastWhisperInput,
} from '@/types/whisper'
import { playWhisperSound } from '@/lib/utils/whisperSound'

// ============================================
// 타입 정의
// ============================================

/** 훅 반환 타입 */
export interface UseWhisperReturn {
  /** 받은 위스퍼 목록 */
  whispers: Whisper[]
  /** 미읽은 위스퍼 수 */
  unreadCount: number
  /** 로딩 상태 */
  isLoading: boolean
  /** 에러 메시지 */
  error: string | null
  /** 알림 상태 */
  notification: WhisperNotificationState
  /** 위스퍼 읽음 처리 */
  markAsRead: (whisper: Whisper) => Promise<void>
  /** 선물 수령 */
  claimGift: (whisper: Whisper) => Promise<void>
  /** 알림 닫기 */
  dismissNotification: () => void
  /** 목록 새로고침 */
  refresh: () => Promise<void>
}

/** 크리에이터용 훅 반환 타입 */
export interface UseWhisperCreatorReturn {
  /** 보낸 위스퍼 목록 */
  sentWhispers: Whisper[]
  /** 로딩 상태 */
  isLoading: boolean
  /** 발송 중 상태 */
  isSending: boolean
  /** 에러 메시지 */
  error: string | null
  /** 위스퍼 발송 */
  sendWhisper: (input: CreateWhisperInput | BroadcastWhisperInput) => Promise<void>
  /** 목록 새로고침 */
  refresh: () => Promise<void>
}

// ============================================
// 데모용 로컬 스토리지 키
// ============================================

const DEMO_WHISPERS_KEY = 'pairy_demo_whispers_v1'
const DEMO_SENT_WHISPERS_KEY = 'pairy_demo_sent_whispers_v1'

// ============================================
// 데모용 유틸리티
// ============================================

function generateDemoWhisper(partial: Partial<Whisper>): Whisper {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    senderId: 'demo-creator',
    receiverId: 'demo-user',
    whisperType: 'NOTICE',
    payload: {
      message: '안녕하세요! 이것은 테스트 위스퍼입니다.',
    },
    scheduledAt: null,
    sentAt: now,
    readAt: null,
    claimedAt: null,
    status: 'SENT',
    theme: 'NIGHT',
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}

function loadDemoWhispers(): Whisper[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(DEMO_WHISPERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveDemoWhispers(whispers: Whisper[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DEMO_WHISPERS_KEY, JSON.stringify(whispers))
  } catch (error) {
    console.error('[useWhisper] Failed to save demo whispers:', error)
  }
}

function loadDemoSentWhispers(): Whisper[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(DEMO_SENT_WHISPERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveDemoSentWhispers(whispers: Whisper[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DEMO_SENT_WHISPERS_KEY, JSON.stringify(whispers))
  } catch (error) {
    console.error('[useWhisper] Failed to save demo sent whispers:', error)
  }
}

// ============================================
// 구독자용 훅
// ============================================

/**
 * 구독자용 위스퍼 관리 훅
 *
 * @param userId - 현재 사용자 ID
 * @returns 위스퍼 상태 및 조작 메서드
 *
 * @example
 * ```tsx
 * const {
 *   whispers,
 *   unreadCount,
 *   notification,
 *   markAsRead,
 *   claimGift,
 *   dismissNotification,
 * } = useWhisper(userId)
 * ```
 */
export function useWhisper(userId: string | null): UseWhisperReturn {
  // ============================================
  // 상태
  // ============================================

  const [whispers, setWhispers] = useState<Whisper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<WhisperNotificationState>({
    unreadCount: 0,
    latestWhisper: null,
    showNotification: false,
    isAnimating: false,
  })

  const isMountedRef = useRef(true)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  // 미읽은 위스퍼 수
  const unreadCount = whispers.filter((w) => w.status === 'SENT').length

  // ============================================
  // 데이터 로드
  // ============================================

  const loadWhispers = useCallback(async () => {
    if (!userId) {
      setWhispers([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (IS_DEMO_MODE) {
        // 데모 모드: localStorage에서 로드
        await new Promise((resolve) => setTimeout(resolve, 500)) // 시뮬레이션
        const loaded = loadDemoWhispers()
        if (isMountedRef.current) {
          setWhispers(loaded)
        }
      } else {
        // Supabase에서 로드
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        const { data, error: fetchError } = await supabase
          .from('whispers')
          .select('*')
          .eq('receiver_id', userId)
          .in('status', ['SENT', 'READ', 'CLAIMED'])
          .order('sent_at', { ascending: false })
          .limit(50)

        if (fetchError) throw fetchError

        if (isMountedRef.current && data) {
          // snake_case → camelCase 변환
          const formatted: Whisper[] = data.map((row) => ({
            id: row.id,
            senderId: row.sender_id,
            receiverId: row.receiver_id,
            whisperType: row.whisper_type,
            payload: row.payload as unknown as WhisperPayload,
            scheduledAt: row.scheduled_at,
            sentAt: row.sent_at,
            readAt: row.read_at,
            claimedAt: row.claimed_at,
            status: row.status,
            theme: row.theme,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }))
          setWhispers(formatted)
        }
      }
    } catch (err) {
      console.error('[useWhisper] Load failed:', err)
      if (isMountedRef.current) {
        setError('위스퍼를 불러오는데 실패했어요')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [userId])

  // ============================================
  // Realtime 구독
  // ============================================

  const setupRealtimeSubscription = useCallback(async () => {
    if (!userId || IS_DEMO_MODE) return

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const channel = supabase
        .channel(`whispers:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'whispers',
            filter: `receiver_id=eq.${userId}`,
          },
          (payload) => {
            if (!isMountedRef.current) return

            const row = payload.new as Record<string, unknown>
            const newWhisper: Whisper = {
              id: row.id as string,
              senderId: row.sender_id as string,
              receiverId: row.receiver_id as string,
              whisperType: row.whisper_type as Whisper['whisperType'],
              payload: row.payload as Whisper['payload'],
              scheduledAt: row.scheduled_at as string | null,
              sentAt: row.sent_at as string | null,
              readAt: row.read_at as string | null,
              claimedAt: row.claimed_at as string | null,
              status: row.status as Whisper['status'],
              theme: row.theme as Whisper['theme'],
              createdAt: row.created_at as string,
              updatedAt: row.updated_at as string,
            }

            // 새 위스퍼 추가
            setWhispers((prev) => [newWhisper, ...prev])

            // 알림 표시
            setNotification({
              unreadCount: unreadCount + 1,
              latestWhisper: newWhisper,
              showNotification: true,
              isAnimating: true,
            })

            // 사운드 재생
            playWhisperSound()
          }
        )
        .subscribe()

      subscriptionRef.current = {
        unsubscribe: () => {
          supabase.removeChannel(channel)
        },
      }
    } catch (err) {
      console.error('[useWhisper] Realtime subscription failed:', err)
    }
  }, [userId, unreadCount])

  // ============================================
  // 초기화 및 정리
  // ============================================

  useEffect(() => {
    isMountedRef.current = true
    loadWhispers()
    setupRealtimeSubscription()

    return () => {
      isMountedRef.current = false
      subscriptionRef.current?.unsubscribe()
    }
  }, [loadWhispers, setupRealtimeSubscription])

  // ============================================
  // 읽음 처리
  // ============================================

  const markAsRead = useCallback(async (whisper: Whisper) => {
    if (whisper.status !== 'SENT') return

    const now = new Date().toISOString()

    // 낙관적 업데이트
    setWhispers((prev) =>
      prev.map((w) =>
        w.id === whisper.id
          ? { ...w, status: 'READ' as const, readAt: now, updatedAt: now }
          : w
      )
    )

    try {
      if (IS_DEMO_MODE) {
        // 데모 모드: localStorage 업데이트
        const updated = whispers.map((w) =>
          w.id === whisper.id
            ? { ...w, status: 'READ' as const, readAt: now, updatedAt: now }
            : w
        )
        saveDemoWhispers(updated)
      } else {
        // Supabase 업데이트
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        await supabase
          .from('whispers')
          .update({
            status: 'READ',
            read_at: now,
            updated_at: now,
          })
          .eq('id', whisper.id)
      }
    } catch (err) {
      console.error('[useWhisper] Mark as read failed:', err)
      // 롤백
      setWhispers((prev) =>
        prev.map((w) =>
          w.id === whisper.id ? whisper : w
        )
      )
    }
  }, [whispers])

  // ============================================
  // 선물 수령
  // ============================================

  const claimGift = useCallback(async (whisper: Whisper) => {
    if (!whisper.payload.gift) return
    if (whisper.status === 'CLAIMED') return

    const now = new Date().toISOString()

    // 낙관적 업데이트
    setWhispers((prev) =>
      prev.map((w) =>
        w.id === whisper.id
          ? { ...w, status: 'CLAIMED' as const, claimedAt: now, updatedAt: now }
          : w
      )
    )

    try {
      if (IS_DEMO_MODE) {
        // 데모 모드: localStorage 업데이트
        const updated = whispers.map((w) =>
          w.id === whisper.id
            ? { ...w, status: 'CLAIMED' as const, claimedAt: now, updatedAt: now }
            : w
        )
        saveDemoWhispers(updated)
      } else {
        // Supabase 업데이트
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        const { error: claimError } = await supabase
          .from('whispers')
          .update({
            status: 'CLAIMED',
            claimed_at: now,
            updated_at: now,
          })
          .eq('id', whisper.id)

        if (claimError) throw claimError
      }
    } catch (err) {
      console.error('[useWhisper] Claim gift failed:', err)
      // 롤백
      setWhispers((prev) =>
        prev.map((w) =>
          w.id === whisper.id ? whisper : w
        )
      )
      throw err
    }
  }, [whispers])

  // ============================================
  // 알림 닫기
  // ============================================

  const dismissNotification = useCallback(() => {
    setNotification((prev) => ({
      ...prev,
      showNotification: false,
      isAnimating: false,
    }))
  }, [])

  // ============================================
  // 새로고침
  // ============================================

  const refresh = useCallback(async () => {
    await loadWhispers()
  }, [loadWhispers])

  // ============================================
  // 반환
  // ============================================

  return {
    whispers,
    unreadCount,
    isLoading,
    error,
    notification,
    markAsRead,
    claimGift,
    dismissNotification,
    refresh,
  }
}

// ============================================
// 크리에이터용 훅
// ============================================

/**
 * 크리에이터용 위스퍼 관리 훅
 *
 * @param creatorId - 크리에이터 ID
 * @returns 발송 상태 및 메서드
 *
 * @example
 * ```tsx
 * const {
 *   sentWhispers,
 *   isSending,
 *   sendWhisper,
 * } = useWhisperCreator(creatorId)
 * ```
 */
export function useWhisperCreator(creatorId: string | null): UseWhisperCreatorReturn {
  // ============================================
  // 상태
  // ============================================

  const [sentWhispers, setSentWhispers] = useState<Whisper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isMountedRef = useRef(true)

  // ============================================
  // 데이터 로드
  // ============================================

  const loadSentWhispers = useCallback(async () => {
    if (!creatorId) {
      setSentWhispers([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (IS_DEMO_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const loaded = loadDemoSentWhispers()
        if (isMountedRef.current) {
          setSentWhispers(loaded)
        }
      } else {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        const { data, error: fetchError } = await supabase
          .from('whispers')
          .select('*')
          .eq('sender_id', creatorId)
          .order('created_at', { ascending: false })
          .limit(100)

        if (fetchError) throw fetchError

        if (isMountedRef.current && data) {
          const formatted: Whisper[] = data.map((row) => ({
            id: row.id,
            senderId: row.sender_id,
            receiverId: row.receiver_id,
            whisperType: row.whisper_type,
            payload: row.payload as unknown as WhisperPayload,
            scheduledAt: row.scheduled_at,
            sentAt: row.sent_at,
            readAt: row.read_at,
            claimedAt: row.claimed_at,
            status: row.status,
            theme: row.theme,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }))
          setSentWhispers(formatted)
        }
      }
    } catch (err) {
      console.error('[useWhisperCreator] Load failed:', err)
      if (isMountedRef.current) {
        setError('위스퍼 목록을 불러오는데 실패했어요')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [creatorId])

  // ============================================
  // 초기화
  // ============================================

  useEffect(() => {
    isMountedRef.current = true
    loadSentWhispers()

    return () => {
      isMountedRef.current = false
    }
  }, [loadSentWhispers])

  // ============================================
  // 위스퍼 발송
  // ============================================

  const sendWhisper = useCallback(async (
    input: CreateWhisperInput | BroadcastWhisperInput
  ) => {
    if (!creatorId || isSending) return

    setIsSending(true)
    setError(null)

    try {
      if (IS_DEMO_MODE) {
        // 데모 모드: 로컬 저장
        await new Promise((resolve) => setTimeout(resolve, 1000)) // 시뮬레이션

        const isBroadcast = !('receiverId' in input)
        const now = new Date().toISOString()

        if (isBroadcast) {
          // 대량 발송 시뮬레이션 (3명에게 발송)
          const demoReceivers = ['demo-user-1', 'demo-user-2', 'demo-user-3']
          const newWhispers = demoReceivers.map((receiverId) =>
            generateDemoWhisper({
              senderId: creatorId,
              receiverId,
              whisperType: input.whisperType,
              payload: input.payload,
              scheduledAt: input.scheduledAt || null,
              sentAt: input.scheduledAt ? null : now,
              status: input.scheduledAt ? 'PENDING' : 'SENT',
              theme: input.theme || 'NIGHT',
            })
          )

          setSentWhispers((prev) => [...newWhispers, ...prev])
          saveDemoSentWhispers([...newWhispers, ...sentWhispers])
        } else {
          // 개별 발송
          const individualInput = input as CreateWhisperInput
          const newWhisper = generateDemoWhisper({
            senderId: creatorId,
            receiverId: individualInput.receiverId,
            whisperType: input.whisperType,
            payload: input.payload,
            scheduledAt: input.scheduledAt || null,
            sentAt: input.scheduledAt ? null : now,
            status: input.scheduledAt ? 'PENDING' : 'SENT',
            theme: input.theme || 'NIGHT',
          })

          setSentWhispers((prev) => [newWhisper, ...prev])
          saveDemoSentWhispers([newWhisper, ...sentWhispers])

          // 데모: 받는 사람 로컬 스토리지에도 추가
          const receivedWhispers = loadDemoWhispers()
          saveDemoWhispers([newWhisper, ...receivedWhispers])
        }
      } else {
        // Supabase 발송
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        const isBroadcast = !('receiverId' in input)

        if (isBroadcast) {
          // TODO: 대량 발송은 Supabase Edge Function으로 구현 필요
          // 현재는 데모 모드에서만 시뮬레이션 가능
          throw new Error('대량 발송은 아직 지원되지 않습니다. 개별 발송을 이용해주세요.')
        } else {
          // 개별 발송
          const individualInput = input as CreateWhisperInput
          const now = new Date().toISOString()

          const { error: insertError } = await supabase
            .from('whispers')
            .insert({
              sender_id: creatorId,
              receiver_id: individualInput.receiverId,
              whisper_type: input.whisperType,
              payload: input.payload as unknown as Json,
              scheduled_at: input.scheduledAt || null,
              sent_at: input.scheduledAt ? null : now,
              status: input.scheduledAt ? 'PENDING' : 'SENT',
              theme: input.theme || 'NIGHT',
            })

          if (insertError) throw insertError
        }

        // 목록 새로고침
        await loadSentWhispers()
      }
    } catch (err) {
      console.error('[useWhisperCreator] Send failed:', err)
      if (isMountedRef.current) {
        setError('위스퍼 발송에 실패했어요')
      }
      throw err
    } finally {
      if (isMountedRef.current) {
        setIsSending(false)
      }
    }
  }, [creatorId, isSending, sentWhispers, loadSentWhispers])

  // ============================================
  // 새로고침
  // ============================================

  const refresh = useCallback(async () => {
    await loadSentWhispers()
  }, [loadSentWhispers])

  // ============================================
  // 반환
  // ============================================

  return {
    sentWhispers,
    isLoading,
    isSending,
    error,
    sendWhisper,
    refresh,
  }
}

export default useWhisper
