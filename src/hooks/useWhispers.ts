'use client'

/**
 * ⚠️ DEPRECATED (데모 목업) — 정본은 `useWhisper.ts`(실 Supabase 구현).
 *
 * 이 훅은 모든 Supabase 경로가 TODO 스텁인 데모 전용 목업이다. 현재 `my/whispers/page.tsx`가
 * 이 훅에 배선돼 있어(가짜 성공), 정본 `useWhisper`/`useWhisperCreator`(실 구현·realtime)는 소비처 0.
 * Whisper 기능은 F-18에서 defer/축소 판정 — 페이지를 정본 훅으로 이관하고 이 파일을 제거하는 작업은
 * Tier 0 파운데이션 이후로 보류한다. 결정 근거: docs/ai-org/decisions/DL-0003-whisper-hook-canonical.md
 *
 * 위스퍼 데이터 훅 (받은/보낸 조회, 데모 목업, 페이지네이션)
 *
 * @example
 * const { receivedWhispers, sentWhispers, isLoading, error } = useWhispers()
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { IS_DEMO_MODE } from '@/lib/supabase/client'
import type {
  Whisper,
  WhisperStatus,
} from '@/types/whisper'

// ============================================
// 타입 정의
// ============================================

export interface UseWhispersOptions {
  /** 초기 로드 여부 (기본: true) */
  autoFetch?: boolean
  /** 페이지 크기 (기본: 20) */
  pageSize?: number
}

export interface UseWhispersReturn {
  /** 받은 위스퍼 목록 */
  receivedWhispers: Whisper[]
  /** 보낸 위스퍼 목록 */
  sentWhispers: Whisper[]
  /** 미읽은 위스퍼 수 */
  unreadCount: number
  /** 로딩 상태 */
  isLoading: boolean
  /** 에러 상태 */
  error: Error | null
  /** 받은 위스퍼 새로고침 */
  refetchReceived: () => Promise<void>
  /** 보낸 위스퍼 새로고침 */
  refetchSent: () => Promise<void>
  /** 위스퍼 읽음 처리 */
  markAsRead: (whisperId: string) => Promise<void>
  /** 위스퍼 선물 수령 */
  claimGift: (whisperId: string) => Promise<void>
  /** 더 불러오기 (받은 위스퍼) */
  loadMoreReceived: () => Promise<void>
  /** 더 불러오기 (보낸 위스퍼) */
  loadMoreSent: () => Promise<void>
  /** 더 불러올 데이터 있음 (받은 위스퍼) */
  hasMoreReceived: boolean
  /** 더 불러올 데이터 있음 (보낸 위스퍼) */
  hasMoreSent: boolean
}

// ============================================
// 데모 모드 목업 데이터
// ============================================

const DEMO_RECEIVED_WHISPERS: Whisper[] = [
  {
    id: 'whisper-demo-1',
    senderId: 'creator-strawberry',
    receiverId: 'demo-user',
    whisperType: 'GIFT',
    payload: {
      message: '안녕하세요! 항상 응원해주셔서 감사해요 💕\n특별한 선물을 준비했어요.',
      gift: {
        type: 'STICKER',
        stickerId: 'sticker-heart-001',
        stickerName: '러블리 하트 스티커',
        stickerImageUrl: '/stickers/lovely-heart.png',
        quantity: 3,
      },
      ephemeral: false,
    },
    scheduledAt: null,
    sentAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30분 전
    readAt: null,
    claimedAt: null,
    status: 'SENT',
    theme: 'LOVE',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'whisper-demo-2',
    senderId: 'creator-moonlight',
    receiverId: 'demo-user',
    whisperType: 'SECRET_EVENT',
    payload: {
      message: '🌙 비밀 이벤트에 초대합니다!\n\n구독자님만을 위한 특별 할인 쿠폰이에요.\n이번 주말까지만 유효하니 서둘러주세요!',
      gift: {
        type: 'COUPON',
        couponCode: 'MOON30',
        discountType: 'PERCENT',
        discountValue: 30,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      },
      limitedQuantity: 50,
      claimedCount: 23,
    },
    scheduledAt: null,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2시간 전
    readAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    claimedAt: null,
    status: 'READ',
    theme: 'NIGHT',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'whisper-demo-3',
    senderId: 'creator-goldenart',
    receiverId: 'demo-user',
    whisperType: 'NOTICE',
    payload: {
      message: '✨ 새로운 템플릿 컬렉션이 출시되었어요!\n\n구독자님께 먼저 알려드려요. 이번 컬렉션은 봄 테마로 준비했답니다. 꼭 확인해보세요!',
    },
    scheduledAt: null,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1일 전
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    claimedAt: null,
    status: 'READ',
    theme: 'GOLDEN',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: 'whisper-demo-4',
    senderId: 'creator-mystic',
    receiverId: 'demo-user',
    whisperType: 'GIFT',
    payload: {
      message: '신비로운 선물이 도착했어요 🔮\n\n열어보기 전까지는 비밀이에요...',
      gift: {
        type: 'TEMPLATE',
        templateId: 'template-mystic-001',
        templateName: '미스틱 포토카드',
        templateThumbnailUrl: '/templates/mystic-thumbnail.jpg',
        validDays: 30,
      },
      ephemeral: true,
    },
    scheduledAt: null,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2일 전
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    claimedAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    status: 'CLAIMED',
    theme: 'MYSTIC',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
  },
]

const DEMO_SENT_WHISPERS: Whisper[] = [
  {
    id: 'whisper-sent-1',
    senderId: 'demo-user',
    receiverId: 'all-subscribers',
    whisperType: 'NOTICE',
    payload: {
      message: '안녕하세요, 구독자 여러분! 🎉\n\n새로운 작품을 공개했어요. 많은 관심 부탁드려요!',
    },
    scheduledAt: null,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    readAt: null,
    claimedAt: null,
    status: 'SENT',
    theme: 'SPRING',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'whisper-sent-2',
    senderId: 'demo-user',
    receiverId: 'subscriber-123',
    whisperType: 'GIFT',
    payload: {
      message: '1주년 기념 특별 선물이에요! 감사합니다 💝',
      gift: {
        type: 'STICKER',
        stickerId: 'sticker-anniversary',
        stickerName: '1주년 기념 스티커',
        stickerImageUrl: '/stickers/anniversary.png',
        quantity: 5,
      },
    },
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 예약됨
    sentAt: null,
    readAt: null,
    claimedAt: null,
    status: 'PENDING',
    theme: 'LOVE',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
]

// ============================================
// 훅 구현
// ============================================

export function useWhispers(options: UseWhispersOptions = {}): UseWhispersReturn {
  const { autoFetch = true, pageSize = 20 } = options

  // 상태
  const [receivedWhispers, setReceivedWhispers] = useState<Whisper[]>([])
  const [sentWhispers, setSentWhispers] = useState<Whisper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hasMoreReceived, setHasMoreReceived] = useState(true)
  const [hasMoreSent, setHasMoreSent] = useState(true)
  const [receivedPage, setReceivedPage] = useState(0)
  const [sentPage, setSentPage] = useState(0)

  // 미읽은 위스퍼 수 계산
  const unreadCount = useMemo(() => {
    return receivedWhispers.filter(
      (w) => w.status === 'SENT' || (w.status === 'READ' && !w.claimedAt && w.payload.gift)
    ).length
  }, [receivedWhispers])

  // 받은 위스퍼 불러오기
  const fetchReceivedWhispers = useCallback(async (page: number = 0, append: boolean = false) => {
    try {
      if (!append) {
        setIsLoading(true)
      }

      // 데모 모드
      if (IS_DEMO_MODE) {
        // 네트워크 지연 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 500))

        const start = page * pageSize
        const end = start + pageSize
        const pageData = DEMO_RECEIVED_WHISPERS.slice(start, end)

        if (append) {
          setReceivedWhispers((prev) => [...prev, ...pageData])
        } else {
          setReceivedWhispers(pageData)
        }

        setHasMoreReceived(end < DEMO_RECEIVED_WHISPERS.length)
        setReceivedPage(page)
        setError(null)
        return
      }

      // TODO: 실제 Supabase 연동
      // const { data, error } = await supabase
      //   .from('whispers')
      //   .select('*')
      //   .eq('receiver_id', userId)
      //   .order('sent_at', { ascending: false })
      //   .range(start, end - 1)

      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '위스퍼를 불러오는 중 오류가 발생했습니다.'
      setError(new Error(errorMessage))
      console.error('[useWhispers] fetchReceivedWhispers error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [pageSize])

  // 보낸 위스퍼 불러오기
  const fetchSentWhispers = useCallback(async (page: number = 0, append: boolean = false) => {
    try {
      if (!append) {
        setIsLoading(true)
      }

      // 데모 모드
      if (IS_DEMO_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 400))

        const start = page * pageSize
        const end = start + pageSize
        const pageData = DEMO_SENT_WHISPERS.slice(start, end)

        if (append) {
          setSentWhispers((prev) => [...prev, ...pageData])
        } else {
          setSentWhispers(pageData)
        }

        setHasMoreSent(end < DEMO_SENT_WHISPERS.length)
        setSentPage(page)
        setError(null)
        return
      }

      // TODO: 실제 Supabase 연동
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '보낸 위스퍼를 불러오는 중 오류가 발생했습니다.'
      setError(new Error(errorMessage))
      console.error('[useWhispers] fetchSentWhispers error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [pageSize])

  // 새로고침
  const refetchReceived = useCallback(async () => {
    await fetchReceivedWhispers(0, false)
  }, [fetchReceivedWhispers])

  const refetchSent = useCallback(async () => {
    await fetchSentWhispers(0, false)
  }, [fetchSentWhispers])

  // 더 불러오기
  const loadMoreReceived = useCallback(async () => {
    if (hasMoreReceived && !isLoading) {
      await fetchReceivedWhispers(receivedPage + 1, true)
    }
  }, [hasMoreReceived, isLoading, receivedPage, fetchReceivedWhispers])

  const loadMoreSent = useCallback(async () => {
    if (hasMoreSent && !isLoading) {
      await fetchSentWhispers(sentPage + 1, true)
    }
  }, [hasMoreSent, isLoading, sentPage, fetchSentWhispers])

  // 읽음 처리
  const markAsRead = useCallback(async (whisperId: string) => {
    try {
      if (IS_DEMO_MODE) {
        setReceivedWhispers((prev) =>
          prev.map((w) =>
            w.id === whisperId
              ? { ...w, status: 'READ' as WhisperStatus, readAt: new Date().toISOString() }
              : w
          )
        )
        return
      }

      // TODO: 실제 Supabase 연동
    } catch (err) {
      console.error('[useWhispers] markAsRead error:', err)
      throw err
    }
  }, [])

  // 선물 수령
  const claimGift = useCallback(async (whisperId: string) => {
    try {
      if (IS_DEMO_MODE) {
        // 낙관적 업데이트
        setReceivedWhispers((prev) =>
          prev.map((w) =>
            w.id === whisperId
              ? { ...w, status: 'CLAIMED' as WhisperStatus, claimedAt: new Date().toISOString() }
              : w
          )
        )

        // 시뮬레이션 딜레이
        await new Promise((resolve) => setTimeout(resolve, 800))
        return
      }

      // TODO: 실제 Supabase 연동
    } catch (err) {
      // 롤백
      await refetchReceived()
      console.error('[useWhispers] claimGift error:', err)
      throw err
    }
  }, [refetchReceived])

  // 초기 로드
  useEffect(() => {
    if (autoFetch) {
      Promise.all([
        fetchReceivedWhispers(0, false),
        fetchSentWhispers(0, false),
      ])
    }
  }, [autoFetch, fetchReceivedWhispers, fetchSentWhispers])

  return {
    receivedWhispers,
    sentWhispers,
    unreadCount,
    isLoading,
    error,
    refetchReceived,
    refetchSent,
    markAsRead,
    claimGift,
    loadMoreReceived,
    loadMoreSent,
    hasMoreReceived,
    hasMoreSent,
  }
}

export default useWhispers
