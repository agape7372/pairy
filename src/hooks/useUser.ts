'use client'

/**
 * 사용자 인증 상태 훅
 *
 * onAuthStateChange만 사용 - INITIAL_SESSION 이벤트는 localStorage에서
 * 직접 읽어오므로 네트워크 요청 없이 즉시 발생함.
 * getSession()은 토큰 갱신 시 네트워크를 기다릴 수 있어 hang 위험이 있음.
 *
 * timeout 없음 - auth 체크는 timeout을 적용하지 않음
 * (user=null에서 isLoading=false가 되어 로그인 페이지로 잘못 리다이렉트 방지)
 * 단, 프로필 로딩은 별도 네트워크 요청이므로 타임아웃 적용
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { createTimeoutController } from '@/lib/utils/network'
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

  // 프로필 로드 함수 (타임아웃 적용)
  const loadProfile = useCallback(async (userId: string, isMounted: () => boolean) => {
    if (!isSupabaseConfigured()) return

    const { signal, clear } = createTimeoutController('read')

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio, role')
        .eq('id', userId)
        .abortSignal(signal)
        .single()

      clear() // 성공 시 타임아웃 해제

      if (!error && data && isMounted()) {
        setProfile(data as Profile)
      }
    } catch (err) {
      clear()
      // 타임아웃이나 취소된 요청은 조용히 무시
      if (err instanceof DOMException && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
        console.warn('[useUser] Profile load timeout or cancelled')
        return
      }
      console.error('[useUser] Profile load error:', err)
    }
  }, [])

  useEffect(() => {
    // 데모 모드 체크
    if (!isSupabaseConfigured()) {
      console.log('[useUser] Demo mode - skipping auth')
      setIsLoading(false)
      return
    }

    let isMounted = true
    const checkMounted = () => isMounted
    const supabase = createClient()

    console.log('[useUser] Setting up auth listener...')

    // onAuthStateChange만 사용
    // INITIAL_SESSION은 localStorage에서 즉시 읽어오므로 네트워크 hang 없음
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[useUser] Auth event:', event, session?.user?.email ?? 'no user')

        if (!isMounted) return

        // 세션 상태 업데이트
        if (session?.user) {
          setUser(session.user)
          loadProfile(session.user.id, checkMounted)
        } else {
          setUser(null)
          setProfile(null)
        }

        // 모든 이벤트에서 로딩 완료
        setIsLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

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
