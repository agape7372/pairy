'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    // Supabase 설정이 없으면 데모 모드로 동작
    if (!isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    // Get initial session from localStorage (no network call - faster!)
    const initSession = async () => {
      try {
        // getSession()은 localStorage에서 바로 읽음 (네트워크 호출 없음)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

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

          if (!profileError) {
            setProfile(profileData as Profile)
          }
        }
      } catch {
        setUser(null)
        setProfile(null)
        setIsLoading(false)
      }
    }

    initSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
