'use client'

/**
 * 사용자 인증 상태 훅 - 완전 재작성
 *
 * 핵심 원칙:
 * 1. getSession()을 먼저 호출하여 즉시 세션 확인
 * 2. onAuthStateChange로 후속 변경 감지
 * 3. 모든 에러를 잡아서 isLoading이 true로 stuck되지 않도록 함
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
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

  // 초기화 완료 여부 추적 (클로저 문제 해결)
  const initializedRef = useRef(false)

  // 프로필 로드 함수 (재사용)
  const loadProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured()) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio, role')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data as Profile)
      }
    } catch (err) {
      console.error('[useUser] Profile load error:', err)
    }
  }, [])

  // 세션 처리 함수 (재사용)
  const handleSession = useCallback((session: Session | null) => {
    console.log('[useUser] Handling session:', session?.user?.email ?? 'no session')

    initializedRef.current = true

    if (session?.user) {
      setUser(session.user)
      loadProfile(session.user.id)
    } else {
      setUser(null)
      setProfile(null)
    }
    setIsLoading(false)
  }, [loadProfile])

  useEffect(() => {
    // 데모 모드 체크
    if (!isSupabaseConfigured()) {
      console.log('[useUser] Demo mode - skipping auth')
      setIsLoading(false)
      return
    }

    let isMounted = true
    const supabase = createClient()

    // 1단계: 즉시 현재 세션 확인 (getSession은 localStorage에서 읽음)
    const initializeAuth = async () => {
      try {
        console.log('[useUser] Initializing auth...')

        // getSession()은 localStorage에서 세션을 읽고 필요시 토큰 갱신
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[useUser] getSession error:', error)
        }

        if (isMounted) {
          handleSession(session)
        }
      } catch (err) {
        console.error('[useUser] Init error:', err)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // 2단계: 인증 상태 변경 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[useUser] Auth event:', event)

        if (!isMounted) return

        // INITIAL_SESSION은 이미 initializeAuth에서 처리했으므로 스킵
        if (event === 'INITIAL_SESSION') {
          return
        }

        // 다른 이벤트는 처리
        handleSession(session)
      }
    )

    // 초기화 실행
    initializeAuth()

    // 안전장치: 5초 후에도 초기화 안됐으면 강제 종료
    const safetyTimer = setTimeout(() => {
      if (isMounted && !initializedRef.current) {
        console.warn('[useUser] Safety timeout - forcing isLoading to false')
        initializedRef.current = true
        setIsLoading(false)
      }
    }, 5000)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearTimeout(safetyTimer)
    }
  }, [handleSession])

  // 로그아웃
  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (err) {
      console.error('[useUser] Sign out error:', err)
    }
  }, [])

  const role = profile?.role ?? null

  return {
    user,
    profile,
    isLoading,
    role,
    isAdmin: role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
    isCreator: role === 'creator' || role === 'admin' || role === 'super_admin',
    signOut,
  }
}
