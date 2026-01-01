import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database.types'

export type { UserRole }

/**
 * 서버사이드에서 현재 사용자의 역할을 가져옵니다.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return profile?.role ?? 'user'
  } catch {
    return null
  }
}

/**
 * 서버사이드에서 현재 사용자 정보와 역할을 가져옵니다.
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, bio, role')
      .eq('id', user.id)
      .single()

    return {
      user,
      profile,
      role: profile?.role as UserRole ?? 'user',
    }
  } catch {
    return null
  }
}

/**
 * 역할이 관리자인지 확인합니다 (admin 또는 super_admin).
 */
export function isAdminRole(role: UserRole | null): boolean {
  return role === 'admin' || role === 'super_admin'
}

/**
 * 역할이 슈퍼 관리자인지 확인합니다.
 */
export function isSuperAdminRole(role: UserRole | null): boolean {
  return role === 'super_admin'
}

/**
 * 역할이 크리에이터 이상인지 확인합니다 (creator, admin, super_admin).
 */
export function isCreatorRole(role: UserRole | null): boolean {
  return role === 'creator' || role === 'admin' || role === 'super_admin'
}

/**
 * 서버사이드에서 현재 사용자가 관리자인지 확인합니다.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return isAdminRole(role)
}

/**
 * 서버사이드에서 현재 사용자가 슈퍼 관리자인지 확인합니다.
 */
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return isSuperAdminRole(role)
}
