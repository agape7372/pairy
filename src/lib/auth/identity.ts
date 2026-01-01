/**
 * 계정 연동(Identity Linking) 유틸리티
 * 소셜 계정 연결/해제 관리
 */

import type { SupabaseClient, User, UserIdentity } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { logError } from '@/lib/utils/error'
import { getFullUrl } from '@/lib/utils/url'

/**
 * 지원하는 OAuth 제공자 타입
 */
export type OAuthProvider = 'google' | 'twitter'

/**
 * 제공자 정보 타입
 */
export interface ProviderInfo {
  id: OAuthProvider
  name: string
  icon: 'google' | 'twitter'
  color: string
  bgColor: string
}

/**
 * 연결된 계정 정보 타입
 */
export interface LinkedAccount {
  provider: OAuthProvider
  providerInfo: ProviderInfo
  identity: UserIdentity
  email?: string
  name?: string
  avatarUrl?: string
  linkedAt: Date
}

/**
 * 지원하는 제공자 정보
 */
export const PROVIDERS: Record<OAuthProvider, ProviderInfo> = {
  google: {
    id: 'google',
    name: 'Google',
    icon: 'google',
    color: '#4285F4',
    bgColor: 'bg-white hover:bg-gray-50',
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'twitter',
    color: '#000000',
    bgColor: 'bg-black hover:bg-gray-800',
  },
}

/**
 * 사용자의 연결된 계정 목록을 가져옵니다.
 */
export async function getLinkedAccounts(
  supabase: SupabaseClient<Database>
): Promise<{ accounts: LinkedAccount[]; error?: string }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { accounts: [], error: '사용자 정보를 가져올 수 없어요.' }
    }

    const identities = user.identities || []

    const accounts: LinkedAccount[] = identities
      .filter(identity => identity.provider in PROVIDERS)
      .map(identity => ({
        provider: identity.provider as OAuthProvider,
        providerInfo: PROVIDERS[identity.provider as OAuthProvider],
        identity,
        email: identity.identity_data?.email as string | undefined,
        name: (identity.identity_data?.full_name ||
          identity.identity_data?.name ||
          identity.identity_data?.preferred_username) as string | undefined,
        avatarUrl: (identity.identity_data?.avatar_url ||
          identity.identity_data?.picture) as string | undefined,
        linkedAt: identity.created_at ? new Date(identity.created_at) : new Date(),
      }))

    return { accounts }
  } catch (error) {
    logError('getLinkedAccounts', error)
    return { accounts: [], error: '연결된 계정 정보를 가져오는 중 오류가 발생했어요.' }
  }
}

/**
 * 특정 제공자가 연결되어 있는지 확인합니다.
 */
export async function isProviderLinked(
  supabase: SupabaseClient<Database>,
  provider: OAuthProvider
): Promise<boolean> {
  const { accounts } = await getLinkedAccounts(supabase)
  return accounts.some(account => account.provider === provider)
}

/**
 * 새로운 소셜 계정을 연결합니다.
 */
export async function linkAccount(
  supabase: SupabaseClient<Database>,
  provider: OAuthProvider,
  redirectTo?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 이미 연결되어 있는지 확인
    const isLinked = await isProviderLinked(supabase, provider)
    if (isLinked) {
      return { success: false, error: `이미 ${PROVIDERS[provider].name} 계정이 연결되어 있어요.` }
    }

    // 콜백 URL 생성
    const callbackUrl = getFullUrl(
      `/auth/callback?type=link&provider=${provider}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`
    )

    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      logError('linkAccount', error)

      if (error.message.includes('already linked')) {
        return { success: false, error: '이 계정은 이미 다른 사용자에게 연결되어 있어요.' }
      }

      return { success: false, error: '계정 연결에 실패했어요.' }
    }

    return { success: true }
  } catch (error) {
    logError('linkAccount', error)
    return { success: false, error: '계정 연결 중 오류가 발생했어요.' }
  }
}

/**
 * 연결된 소셜 계정을 해제합니다.
 */
export async function unlinkAccount(
  supabase: SupabaseClient<Database>,
  provider: OAuthProvider
): Promise<{ success: boolean; error?: string }> {
  try {
    // 현재 연결된 계정 확인
    const { accounts } = await getLinkedAccounts(supabase)

    // 최소 1개의 인증 수단은 유지해야 함
    if (accounts.length <= 1) {
      return {
        success: false,
        error: '최소 1개의 로그인 수단은 유지해야 해요. 다른 계정을 먼저 연결해주세요.',
      }
    }

    // 해당 제공자의 identity 찾기
    const targetAccount = accounts.find(account => account.provider === provider)
    if (!targetAccount) {
      return { success: false, error: '연결된 계정을 찾을 수 없어요.' }
    }

    const { error } = await supabase.auth.unlinkIdentity(targetAccount.identity)

    if (error) {
      logError('unlinkAccount', error)
      return { success: false, error: '계정 연결 해제에 실패했어요.' }
    }

    return { success: true }
  } catch (error) {
    logError('unlinkAccount', error)
    return { success: false, error: '계정 연결 해제 중 오류가 발생했어요.' }
  }
}

/**
 * 사용자의 주 로그인 방식을 확인합니다.
 */
export function getPrimaryAuthMethod(user: User): 'email' | OAuthProvider | null {
  const identities = user.identities || []

  if (identities.length === 0) {
    return null
  }

  // 이메일 인증이 있는 경우
  const emailIdentity = identities.find(i => i.provider === 'email')
  if (emailIdentity) {
    return 'email'
  }

  // OAuth 인증만 있는 경우 첫 번째 것 반환
  const firstOAuth = identities.find(i => i.provider in PROVIDERS)
  if (firstOAuth) {
    return firstOAuth.provider as OAuthProvider
  }

  return null
}

/**
 * 사용자가 비밀번호를 설정했는지 확인합니다.
 */
export function hasPasswordAuth(user: User): boolean {
  const identities = user.identities || []
  return identities.some(i => i.provider === 'email')
}
