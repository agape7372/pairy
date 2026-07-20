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
import type { UserRole, SubscriptionTierServer } from '@/types/database.types'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

export type { UserRole }

interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role: UserRole
  subscription_tier: SubscriptionTierServer
  subscription_valid_until: string | null
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
  const loadProfile = useCallback(async (isMounted: () => boolean) => {
    if (!isSupabaseConfigured()) return

    const { signal, clear } = createTimeoutController('read')

    try {
      const supabase = createClient()
      // H-04: 민감 컬럼(role·subscription_*)은 public SELECT 에서 회수됨 → 본인 전체 행은
      // get_my_profile() SECURITY DEFINER RPC 로만 조회(own row, 컬럼 GRANT 우회).
      const { data, error } = await supabase
        .rpc('get_my_profile')
        .abortSignal(signal)

      clear() // 성공 시 타임아웃 해제

      const row = data?.[0]
      if (!error && row && isMounted()) {
        setProfile({
          id: row.id,
          display_name: row.display_name,
          avatar_url: row.avatar_url,
          bio: row.bio,
          role: row.role,
          subscription_tier: row.subscription_tier,
          subscription_valid_until: row.subscription_valid_until,
        })
        // C-3: 서버 구독 상태가 진실 — 스토어 tier 를 서버값으로 강제 동기화(localStorage 캐시 강등).
        useSubscriptionStore.getState().syncFromServer(
          row.subscription_tier,
          row.subscription_valid_until,
        )
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 데모 모드 초기화: 비동기 작업 없이 즉시 완료
      setIsLoading(false)
      return
    }

    let isMounted = true
    const checkMounted = () => isMounted
    const supabase = createClient()

    // onAuthStateChange만 사용
    // INITIAL_SESSION은 localStorage에서 즉시 읽어오므로 네트워크 hang 없음
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // 프로덕션에서 유저 이메일 로깅 금지(개인정보). 개발 중에만 이벤트명 출력.
        if (process.env.NODE_ENV !== 'production') console.log('[useUser] Auth event:', event)

        if (!isMounted) return

        // 세션 상태 업데이트
        if (session?.user) {
          setUser(session.user)
          loadProfile(checkMounted)
        } else {
          setUser(null)
          setProfile(null)
          // 비로그인/로그아웃: 구독 진실 없음 → free 로 강등(잔존 캐시가 프리미엄인 채 남지 않게)
          useSubscriptionStore.getState().syncFromServer('free', null)
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
