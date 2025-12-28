'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'

interface UseFollowReturn {
  isFollowing: boolean
  followerCount: number
  followingCount: number
  isLoading: boolean
  follow: () => Promise<boolean>
  unfollow: () => Promise<boolean>
  toggle: () => Promise<boolean>
}

// 데모 모드용 로컬 스토리지 키
const DEMO_FOLLOWS_KEY = 'pairy_demo_follows'
const DEMO_COUNTS_KEY = 'pairy_demo_counts' // 안정적인 카운트 저장용

function getDemoFollows(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(DEMO_FOLLOWS_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

// 데모용 카운트를 안정적으로 관리 (렌더링마다 변경되지 않도록)
function getDemoCounts(userId: string): { follower: number; following: number } {
  if (typeof window === 'undefined') return { follower: 500, following: 200 }
  try {
    const stored = localStorage.getItem(DEMO_COUNTS_KEY)
    const counts: Record<string, { follower: number; following: number }> = stored ? JSON.parse(stored) : {}
    if (!counts[userId]) {
      // 최초 한 번만 랜덤 생성 후 저장
      counts[userId] = {
        follower: Math.floor(Math.random() * 1000) + 100,
        following: Math.floor(Math.random() * 500) + 50,
      }
      localStorage.setItem(DEMO_COUNTS_KEY, JSON.stringify(counts))
    }
    return counts[userId]
  } catch {
    return { follower: 500, following: 200 }
  }
}

function saveDemoFollows(follows: Set<string>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_FOLLOWS_KEY, JSON.stringify([...follows]))
}

export function useFollow(targetUserId: string): UseFollowReturn {
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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
  const follow = useCallback(async (): Promise<boolean> => {
    if (IS_DEMO_MODE) {
      const demoFollows = getDemoFollows()
      demoFollows.add(targetUserId)
      saveDemoFollows(demoFollows)
      setIsFollowing(true)
      setFollowerCount(prev => prev + 1)
      return true
    }

    if (!currentUserId) return false

    // 낙관적 업데이트: UI 먼저 변경
    const previousIsFollowing = isFollowing
    const previousCount = followerCount
    setIsFollowing(true)
    setFollowerCount(prev => prev + 1)

    try {
      const supabase = createClient()
      if (!supabase) {
        // 롤백
        setIsFollowing(previousIsFollowing)
        setFollowerCount(previousCount)
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
    }
  }, [targetUserId, currentUserId, isFollowing, followerCount])

  // 언팔로우 (낙관적 업데이트 + 실패 시 롤백)
  const unfollow = useCallback(async (): Promise<boolean> => {
    if (IS_DEMO_MODE) {
      const demoFollows = getDemoFollows()
      demoFollows.delete(targetUserId)
      saveDemoFollows(demoFollows)
      setIsFollowing(false)
      setFollowerCount(prev => Math.max(0, prev - 1))
      return true
    }

    if (!currentUserId) return false

    // 낙관적 업데이트: UI 먼저 변경
    const previousIsFollowing = isFollowing
    const previousCount = followerCount
    setIsFollowing(false)
    setFollowerCount(prev => Math.max(0, prev - 1))

    try {
      const supabase = createClient()
      if (!supabase) {
        // 롤백
        setIsFollowing(previousIsFollowing)
        setFollowerCount(previousCount)
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
    }
  }, [targetUserId, currentUserId, isFollowing, followerCount])

  // 토글
  const toggle = useCallback(async (): Promise<boolean> => {
    return isFollowing ? unfollow() : follow()
  }, [isFollowing, follow, unfollow])

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

        const followersList = (data || [])
          .map((item: any) => item.follower)
          .filter(Boolean)

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

        const followingList = (data || [])
          .map((item: any) => item.following)
          .filter(Boolean)

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
