'use client'

/**
 * 사용자 인증 상태 훅
 * [FIXED: getSession 타임아웃 추가 - 네트워크 지연 시 무한로딩 방지]
 */

import { useEffect, useState } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/types/database.types'

export type { UserRole }

// [FIXED: 세션 조회 타임아웃 - hang 방지]
const SESSION_TIMEOUT_MS = 5000

/**
 * Promise에 타임아웃을 추가하는 유틸리티
 * getSession()이 네트워크 문제로 hang되는 것을 방지
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) =>
      setTimeout(() => resolve(fallback), timeoutMs)
    ),
  ])
}

interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role: UserRole
}

interface UseUserReturn {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  role: UserRole | null
  isAdmin: boolean
  isSuperAdmin: boolean
  isCreator: boolean
  signOut: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Supabase 설정이 없으면 데모 모드로 동작
    if (!isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    // [FIXED: 마운트 상태 추적 - 언마운트 후 상태 업데이트 방지]
    let isMounted = true

    // Get initial session from localStorage (no network call - faster!)
    const initSession = async () => {
      try {
        // [FIXED: 타임아웃 추가 - getSession()이 hang되면 5초 후 세션 없음으로 처리]
        const sessionResult = await withTimeout(
          supabase.auth.getSession(),
          SESSION_TIMEOUT_MS,
          { data: { session: null }, error: null }
        )

        const { data: { session }, error: sessionError } = sessionResult

        // [FIXED: 언마운트 체크]
        if (!isMounted) return

        if (sessionError) {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
          return
        }

        if (!session) {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
          return
        }

        setUser(session.user)
        setIsLoading(false) // UI 먼저 업데이트

        // 프로필은 별도로 로드
        if (session.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, bio, role')
            .eq('id', session.user.id)
            .single()

          // [FIXED: 언마운트 체크]
          if (!isMounted) return

          if (!profileError) {
            setProfile(profileData as Profile)
          }
        }
      } catch {
        // [FIXED: 언마운트 체크]
        if (!isMounted) return
        setUser(null)
        setProfile(null)
        setIsLoading(false)
      }
    }

    initSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // [FIXED: 언마운트 체크]
        if (!isMounted) return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
          return
        }

        // 즉시 사용자 상태 업데이트 (UI가 먼저 반응하도록)
        setUser(session?.user ?? null)
        setIsLoading(false) // 먼저 로딩 끝내기

        // 프로필은 별도로 비동기 로드 (UI 블로킹 방지)
        if (session?.user) {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, bio, role')
              .eq('id', session.user.id)
              .single()

            // [FIXED: 언마운트 체크]
            if (!isMounted) return

            if (!error) {
              setProfile(profileData as Profile)
            }
          } catch {
            // 프로필 로드 실패해도 user는 유지
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      // [FIXED: 언마운트 플래그 설정 - 비동기 작업 후 상태 업데이트 방지]
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    if (!isSupabaseConfigured()) return

    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const role = profile?.role ?? null
  const isAdmin = role === 'admin' || role === 'super_admin'
  const isSuperAdmin = role === 'super_admin'
  const isCreator = role === 'creator' || isAdmin

  return { user, profile, isLoading, role, isAdmin, isSuperAdmin, isCreator, signOut }
}
