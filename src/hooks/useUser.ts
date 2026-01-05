'use client'

/**
 * 사용자 인증 상태 훅
 * [FIXED: getSession() 대신 onAuthStateChange 사용 - 네트워크 hang 방지]
 */

import { useEffect, useState, useRef } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/types/database.types'

export type { UserRole }

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

  // [FIXED: ref로 상태 추적 - 클로저 문제 해결]
  const sessionReceivedRef = useRef(false)

  useEffect(() => {
    // Supabase 설정이 없으면 데모 모드로 동작
    if (!isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    let isMounted = true
    sessionReceivedRef.current = false

    // [FIXED: onAuthStateChange만 사용 - getSession() 제거]
    // getSession()은 autoRefreshToken으로 인해 네트워크 요청을 기다릴 수 있음
    // onAuthStateChange의 INITIAL_SESSION 이벤트는 localStorage에서 직접 읽어 즉시 발생
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        console.log('[useUser] Auth state changed:', event, session?.user?.email)

        // 세션 이벤트 수신 플래그 설정
        sessionReceivedRef.current = true

        // 사용자 상태 즉시 업데이트
        setUser(session?.user ?? null)
        setIsLoading(false)

        // 프로필은 별도로 비동기 로드 (UI 블로킹 방지)
        if (session?.user) {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, bio, role')
              .eq('id', session.user.id)
              .single()

            if (!isMounted) return

            if (!error && profileData) {
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

    // [FIXED: Fallback - 2초 후에도 이벤트가 없으면 수동으로 getSession 호출]
    // 이는 onAuthStateChange가 발생하지 않는 엣지 케이스를 처리
    const fallbackTimer = setTimeout(async () => {
      if (!isMounted) return

      // 이미 세션 이벤트를 받았으면 스킵
      if (sessionReceivedRef.current) return

      console.log('[useUser] Fallback: no auth event received, checking session manually')

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted) return

        if (session?.user) {
          setUser(session.user)

          // 프로필 로드
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, bio, role')
            .eq('id', session.user.id)
            .single()

          if (!isMounted) return
          if (profileData) {
            setProfile(profileData as Profile)
          }
        }

        setIsLoading(false)
      } catch (err) {
        console.error('[useUser] Fallback session check failed:', err)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }, 2000)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearTimeout(fallbackTimer)
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
