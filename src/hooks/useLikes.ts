'use client'

/**
 * 좋아요 관련 훅
 * 변경 이유: 데모 모드 localStorage 로직을 demoStorage 유틸리티로 통합
 * 추가: UUID 유효성 검사로 샘플 데이터 ID에 대한 400 에러 방지
 * [FIXED: useRef로 race condition 방지 - 빠른 더블클릭 시 중복 요청 방지]
 * [FIXED: 무한루프 방지 - 상태값을 useCallback 의존성에서 제거, ref 패턴 사용]
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'
import {
  getStorageSet,
  saveStorageSet,
  DEMO_STORAGE_KEYS,
} from '@/lib/utils/demoStorage'

// UUID 형식 검사 (샘플 데이터 ID '1', '2' 등을 필터링)
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

interface UseLikesReturn {
  isLiked: boolean
  likeCount: number
  isLoading: boolean
  like: () => Promise<boolean>
  unlike: () => Promise<boolean>
  toggle: () => Promise<boolean>
}

// 변경 이유: 로컬 localStorage 함수를 demoStorage 유틸리티로 대체 (코드 중복 제거)
const getDemoLikes = () => getStorageSet(DEMO_STORAGE_KEYS.LIKES)
const saveDemoLikes = (likes: Set<string>) => saveStorageSet(DEMO_STORAGE_KEYS.LIKES, likes)

export function useLikes(templateId: string, initialLikeCount?: number): UseLikesReturn {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount || 0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // [FIXED: useRef로 동기적 체크 - 상태는 비동기라 race condition 발생 가능]
  const isProcessingRef = useRef(false)

  // [FIXED: 무한루프 방지 - 상태값을 ref로 추적하여 콜백 의존성에서 제거]
  const isLikedRef = useRef(isLiked)
  const likeCountRef = useRef(likeCount)

  // 상태 변경 시 ref 동기화
  useEffect(() => {
    isLikedRef.current = isLiked
  }, [isLiked])

  useEffect(() => {
    likeCountRef.current = likeCount
  }, [likeCount])

  // 초기 상태 로드
  useEffect(() => {
    const loadLikeStatus = async () => {
      setIsLoading(true)

      // 데모 모드이거나 유효한 UUID가 아닌 경우 (샘플 데이터) localStorage 사용
      if (IS_DEMO_MODE || !isValidUUID(templateId)) {
        // 데모 모드: localStorage에서 좋아요 상태 로드
        const demoLikes = getDemoLikes()
        setIsLiked(demoLikes.has(templateId))
        // 초기값이 없으면 그대로 사용 (샘플 데이터는 이미 값이 있음)
        if (initialLikeCount === undefined) {
          setLikeCount(Math.floor(Math.random() * 500) + 50)
        }
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClient()
        if (!supabase) {
          setIsLoading(false)
          return
        }

        // 현재 사용자 가져오기
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)

          // 좋아요 여부 확인
          const { data: likeData } = await supabase
            .from('likes')
            .select('user_id')
            .eq('user_id', user.id)
            .eq('template_id', templateId)
            .single()

          setIsLiked(!!likeData)
        }

        // 템플릿의 좋아요 수 가져오기
        const { data: templateData } = await supabase
          .from('templates')
          .select('like_count')
          .eq('id', templateId)
          .single()

        if (templateData) {
          setLikeCount(templateData.like_count || 0)
        }
      } catch (error) {
        console.error('Failed to load like status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLikeStatus()
  }, [templateId, initialLikeCount])

  // 좋아요 (낙관적 업데이트 + 실패 시 롤백)
  // [FIXED: 무한루프 방지 - 상태값(isLiked, likeCount)을 의존성에서 제거, ref 사용]
  const like = useCallback(async (): Promise<boolean> => {
    // [FIXED: ref 기반 동기적 체크로 race condition 완전 방지]
    if (isProcessingRef.current) return false
    isProcessingRef.current = true

    // 데모 모드이거나 유효한 UUID가 아닌 경우 localStorage 사용
    if (IS_DEMO_MODE || !isValidUUID(templateId)) {
      const demoLikes = getDemoLikes()
      demoLikes.add(templateId)
      saveDemoLikes(demoLikes)
      setIsLiked(true)
      setLikeCount(prev => prev + 1)
      isProcessingRef.current = false
      return true
    }

    if (!currentUserId) {
      isProcessingRef.current = false
      return false
    }

    // [FIXED: ref에서 현재 값을 읽어 롤백용으로 저장]
    const previousIsLiked = isLikedRef.current
    const previousCount = likeCountRef.current

    // 낙관적 업데이트: UI 먼저 변경
    setIsLiked(true)
    setLikeCount(prev => prev + 1)

    try {
      const supabase = createClient()
      if (!supabase) {
        // 롤백
        setIsLiked(previousIsLiked)
        setLikeCount(previousCount)
        isProcessingRef.current = false
        return false
      }

      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: currentUserId,
          template_id: templateId,
        })

      if (error) throw error
      return true
    } catch (error) {
      // 실패 시 롤백
      console.error('Failed to like:', error)
      setIsLiked(previousIsLiked)
      setLikeCount(previousCount)
      return false
    } finally {
      isProcessingRef.current = false  // [FIXED: 반드시 해제]
    }
  }, [templateId, currentUserId])  // [FIXED: isLiked, likeCount 제거]

  // 좋아요 취소 (낙관적 업데이트 + 실패 시 롤백)
  // [FIXED: 무한루프 방지 - 상태값(isLiked, likeCount)을 의존성에서 제거, ref 사용]
  const unlike = useCallback(async (): Promise<boolean> => {
    // [FIXED: ref 기반 동기적 체크로 race condition 완전 방지]
    if (isProcessingRef.current) return false
    isProcessingRef.current = true

    // 데모 모드이거나 유효한 UUID가 아닌 경우 localStorage 사용
    if (IS_DEMO_MODE || !isValidUUID(templateId)) {
      const demoLikes = getDemoLikes()
      demoLikes.delete(templateId)
      saveDemoLikes(demoLikes)
      setIsLiked(false)
      setLikeCount(prev => Math.max(0, prev - 1))
      isProcessingRef.current = false
      return true
    }

    if (!currentUserId) {
      isProcessingRef.current = false
      return false
    }

    // [FIXED: ref에서 현재 값을 읽어 롤백용으로 저장]
    const previousIsLiked = isLikedRef.current
    const previousCount = likeCountRef.current

    // 낙관적 업데이트: UI 먼저 변경
    setIsLiked(false)
    setLikeCount(prev => Math.max(0, prev - 1))

    try {
      const supabase = createClient()
      if (!supabase) {
        // 롤백
        setIsLiked(previousIsLiked)
        setLikeCount(previousCount)
        isProcessingRef.current = false
        return false
      }

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', currentUserId)
        .eq('template_id', templateId)

      if (error) throw error
      return true
    } catch (error) {
      // 실패 시 롤백
      console.error('Failed to unlike:', error)
      setIsLiked(previousIsLiked)
      setLikeCount(previousCount)
      return false
    } finally {
      isProcessingRef.current = false  // [FIXED: 반드시 해제]
    }
  }, [templateId, currentUserId])  // [FIXED: isLiked, likeCount 제거]

  // 토글
  // [FIXED: 무한루프 방지 - isLikedRef 사용으로 콜백 안정성 확보]
  const toggle = useCallback(async (): Promise<boolean> => {
    return isLikedRef.current ? unlike() : like()
  }, [like, unlike])  // [FIXED: isLiked 제거, ref 사용]

  return {
    isLiked,
    likeCount,
    isLoading,
    like,
    unlike,
    toggle,
  }
}
