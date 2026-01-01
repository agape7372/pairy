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

    // Get initial session
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, bio, role')
            .eq('id', user.id)
            .single()

          setProfile(profile)
        }
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, bio, role')
            .eq('id', session.user.id)
            .single()

          setProfile(profile)
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
