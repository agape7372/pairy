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
      console.log('[useUser] Demo mode - no Supabase configured')
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    // Get initial session
    const getUser = async () => {
      try {
        console.log('[useUser] Fetching user...')
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error('[useUser] Auth error:', userError.message)
          setUser(null)
          setProfile(null)
          setIsLoading(false)
          return
        }

        console.log('[useUser] User:', user?.email || 'none')
        setUser(user)

        if (user) {
          console.log('[useUser] Fetching profile for:', user.id)
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, bio, role')
            .eq('id', user.id)
            .single()

          if (profileError) {
            console.error('[useUser] Profile error:', profileError.message, profileError.code)
            // 프로필이 없어도 계속 진행
            setProfile(null)
          } else {
            console.log('[useUser] Profile loaded:', profileData?.display_name)
            setProfile(profileData as Profile)
          }
        }
      } catch (error) {
        console.error('[useUser] Unexpected error:', error)
      } finally {
        console.log('[useUser] Loading complete')
        setIsLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useUser] Auth state changed:', event, session?.user?.email)

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
          return
        }

        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, bio, role')
            .eq('id', session.user.id)
            .single()

          if (error) {
            console.error('[useUser] Profile error on auth change:', error.message)
            setProfile(null)
          } else {
            setProfile(profileData as Profile)
          }
        } else {
          setProfile(null)
        }

        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    if (!isSupabaseConfigured()) return

    console.log('[useUser] Signing out...')
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
