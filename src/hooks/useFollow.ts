'use client'

/**
 * 팔로우 관련 훅
 * 변경 이유: 데모 모드 localStorage 로직을 demoStorage 유틸리티로 통합
 * [FIXED: useRef로 race condition 방지 - 빠른 더블클릭 시 중복 요청 방지]
 * [FIXED: 무한루프 방지 - 상태값을 useCallback 의존성에서 제거, ref 패턴 사용]
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'
import {
  getStorageSet,
  saveStorageSet,
  getStableCounts,
  DEMO_STORAGE_KEYS,
} from '@/lib/utils/demoStorage'

// 프로필 기본 정보 타입
interface ProfileInfo {
  id: string
  display_name: string | null
  avatar_url: string | null
  username: string | null
}

// Supabase 팔로워/팔로잉 쿼리 결과 타입
interface FollowerQueryResult {
  follower: ProfileInfo | null
}

interface FollowingQueryResult {
  following: ProfileInfo | null
}

interface UseFollowReturn {
  isFollowing: boolean
  followerCount: number
  followingCount: number
  isLoading: boolean
  follow: () => Promise<boolean>
  unfollow: () => Promise<boolean>
  toggle: () => Promise<boolean>
}

// 변경 이유: 로컬 localStorage 함수를 demoStorage 유틸리티로 대체 (코드 중복 제거)
const getDemoFollows = () => getStorageSet(DEMO_STORAGE_KEYS.FOLLOWS)
const saveDemoFollows = (follows: Set<string>) => saveStorageSet(DEMO_STORAGE_KEYS.FOLLOWS, follows)
const getDemoCounts = (userId: string) => getStableCounts(
  DEMO_STORAGE_KEYS.FOLLOW_COUNTS,
  userId,
  () => ({
    follower: Math.floor(Math.random() * 1000) + 100,
    following: Math.floor(Math.random() * 500) + 50,
  })
)

export function useFollow(targetUserId: string): UseFollowReturn {
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // [FIXED: useRef로 동기적 체크 - 상태는 비동기라 race condition 발생 가능]
  const isProcessingRef = useRef(false)

  // [FIXED: 무한루프 방지 - 상태값을 ref로 추적하여 콜백 의존성에서 제거]
  const isFollowingRef = useRef(isFollowing)
  const followerCountRef = useRef(followerCount)

  // 상태 변경 시 ref 동기화
  useEffect(() => {
    isFollowingRef.current = isFollowing
  }, [isFollowing])

  useEffect(() => {
    followerCountRef.current = followerCount
  }, [followerCount])

  // 초기 상태 로드
  useEffect(() => {
    const loadFollowStatus = async () => {
      setIsLoading(true)

      if (IS_DEMO_MODE) {
        // 데모 모드: localStorage에서 팔로우 상태 로드
        const demoFollows = getDemoFollows()
        setIsFollowing(demoFollows.has(targetUserId))
        // 데모 모드: 안정적인 카운트 (localStorage에 저장되어 변하지 않음)
        const counts = getDemoCounts(targetUserId)
        setFollowerCount(counts.follower)
        setFollowingCount(counts.following)
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
        if (!user) {
          setIsLoading(false)
          return
        }
        setCurrentUserId(user.id)

        // 팔로우 여부 확인
        const { data: followData } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .single()

        setIsFollowing(!!followData)

        // 대상 사용자의 팔로워/팔로잉 수 가져오기
        const { data: profileData } = await supabase
          .from('profiles')
          .select('follower_count, following_count')
          .eq('id', targetUserId)
          .single()

        if (profileData) {
          setFollowerCount(profileData.follower_count || 0)
          setFollowingCount(profileData.following_count || 0)
        }
      } catch (error) {
        console.error('Failed to load follow status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFollowStatus()
  }, [targetUserId])

  // 팔로우 (낙관적 업데이트 + 실패 시 롤백)
  // [FIXED: 무한루프 방지 - 상태값(isFollowing, followerCount)을 의존성에서 제거, ref 사용]
  const follow = useCallback(async (): Promise<boolean> => {
    // [FIXED: ref 기반 동기적 체크로 race condition 완전 방지]
    if (isProcessingRef.current) return false
    isProcessingRef.current = true

    if (IS_DEMO_MODE) {
      const demoFollows = getDemoFollows()
      demoFollows.add(targetUserId)
      saveDemoFollows(demoFollows)
      setIsFollowing(true)
      setFollowerCount(prev => prev + 1)
      isProcessingRef.current = false
      return true
    }

    if (!currentUserId) {
      isProcessingRef.current = false
      return false
    }

    // [FIXED: ref에서 현재 값을 읽어 롤백용으로 저장]
    const previousIsFollowing = isFollowingRef.current
    const previousCount = followerCountRef.current

    // 낙관적 업데이트: UI 먼저 변경
    setIsFollowing(true)
    setFollowerCount(prev => prev + 1)

    try {
      const supabase = createClient()
      if (!supabase) {
        // 롤백
        setIsFollowing(previousIsFollowing)
        setFollowerCount(previousCount)
        isProcessingRef.current = false
        return false
      }

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        })

      if (error) throw error
      return true
    } catch (error) {
      // 실패 시 롤백
      console.error('Failed to follow:', error)
      setIsFollowing(previousIsFollowing)
      setFollowerCount(previousCount)
      return false
    } finally {
      isProcessingRef.current = false  // [FIXED: 반드시 해제]
    }
  }, [targetUserId, currentUserId])  // [FIXED: isFollowing, followerCount 제거]

  // 언팔로우 (낙관적 업데이트 + 실패 시 롤백)
  // [FIXED: 무한루프 방지 - 상태값(isFollowing, followerCount)을 의존성에서 제거, ref 사용]
  const unfollow = useCallback(async (): Promise<boolean> => {
    // [FIXED: ref 기반 동기적 체크로 race condition 완전 방지]
    if (isProcessingRef.current) return false
    isProcessingRef.current = true

    if (IS_DEMO_MODE) {
      const demoFollows = getDemoFollows()
      demoFollows.delete(targetUserId)
      saveDemoFollows(demoFollows)
      setIsFollowing(false)
      setFollowerCount(prev => Math.max(0, prev - 1))
      isProcessingRef.current = false
      return true
    }

    if (!currentUserId) {
      isProcessingRef.current = false
      return false
    }

    // [FIXED: ref에서 현재 값을 읽어 롤백용으로 저장]
    const previousIsFollowing = isFollowingRef.current
    const previousCount = followerCountRef.current

    // 낙관적 업데이트: UI 먼저 변경
    setIsFollowing(false)
    setFollowerCount(prev => Math.max(0, prev - 1))

    try {
      const supabase = createClient()
      if (!supabase) {
        // 롤백
        setIsFollowing(previousIsFollowing)
        setFollowerCount(previousCount)
        isProcessingRef.current = false
        return false
      }

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)

      if (error) throw error
      return true
    } catch (error) {
      // 실패 시 롤백
      console.error('Failed to unfollow:', error)
      setIsFollowing(previousIsFollowing)
      setFollowerCount(previousCount)
      return false
    } finally {
      isProcessingRef.current = false  // [FIXED: 반드시 해제]
    }
  }, [targetUserId, currentUserId])  // [FIXED: isFollowing, followerCount 제거]

  // 토글
  // [FIXED: 무한루프 방지 - isFollowingRef 사용으로 콜백 안정성 확보]
  const toggle = useCallback(async (): Promise<boolean> => {
    return isFollowingRef.current ? unfollow() : follow()
  }, [follow, unfollow])  // [FIXED: isFollowing 제거, ref 사용]

  return {
    isFollowing,
    followerCount,
    followingCount,
    isLoading,
    follow,
    unfollow,
    toggle,
  }
}

// 팔로워 목록 가져오기 훅
export function useFollowers(userId: string) {
  const [followers, setFollowers] = useState<Array<{
    id: string
    display_name: string | null
    avatar_url: string | null
    username: string | null
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFollowers = async () => {
      setIsLoading(true)

      if (IS_DEMO_MODE) {
        // 데모 모드: 샘플 데이터
        setFollowers([
          { id: '1', display_name: '딸기크림', avatar_url: null, username: 'strawberry123' },
          { id: '2', display_name: '페어리', avatar_url: null, username: 'fairy_art' },
          { id: '3', display_name: '문라이트', avatar_url: null, username: 'moonlight' },
        ])
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClient()
        if (!supabase) {
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('follows')
          .select(`
            follower:profiles!follows_follower_id_fkey(
              id,
              display_name,
              avatar_url,
              username
            )
          `)
          .eq('following_id', userId)

        if (error) throw error

        // NOTE: Supabase 타입 추론이 복잡하므로 unknown을 통해 변환
        const followersList = ((data || []) as unknown as FollowerQueryResult[])
          .map((item) => item.follower)
          .filter((f): f is ProfileInfo => f !== null)

        setFollowers(followersList)
      } catch (error) {
        console.error('Failed to load followers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFollowers()
  }, [userId])

  return { followers, isLoading }
}

// 팔로잉 목록 가져오기 훅
export function useFollowing(userId: string) {
  const [following, setFollowing] = useState<Array<{
    id: string
    display_name: string | null
    avatar_url: string | null
    username: string | null
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFollowing = async () => {
      setIsLoading(true)

      if (IS_DEMO_MODE) {
        // 데모 모드: 샘플 데이터
        setFollowing([
          { id: '4', display_name: '민트초코', avatar_url: null, username: 'mintchoco' },
          { id: '5', display_name: '로즈베리', avatar_url: null, username: 'roseberry' },
        ])
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClient()
        if (!supabase) {
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('follows')
          .select(`
            following:profiles!follows_following_id_fkey(
              id,
              display_name,
              avatar_url,
              username
            )
          `)
          .eq('follower_id', userId)

        if (error) throw error

        // NOTE: Supabase 타입 추론이 복잡하므로 unknown을 통해 변환
        const followingList = ((data || []) as unknown as FollowingQueryResult[])
          .map((item) => item.following)
          .filter((f): f is ProfileInfo => f !== null)

        setFollowing(followingList)
      } catch (error) {
        console.error('Failed to load following:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFollowing()
  }, [userId])

  return { following, isLoading }
}
