/**
 * 프로필 관리 유틸리티
 * 프로필 생성, 업데이트, 검증 로직 통합
 */

import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database, Profile } from '@/types/database.types'
import { logError } from '@/lib/utils/error'

/**
 * 프로필 생성에 필요한 데이터 타입
 */
interface CreateProfileData {
  username?: string | null
  displayName?: string | null
  avatarUrl?: string | null
}

/**
 * 프로필 업데이트에 필요한 데이터 타입
 */
export interface UpdateProfileData {
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
}

/**
 * 사용자 메타데이터에서 프로필 정보를 추출합니다.
 */
export function extractProfileFromUser(user: User): CreateProfileData {
  const metadata = user.user_metadata || {}

  // 다양한 OAuth 제공자에서 이름 추출
  const displayName =
    metadata.full_name ||
    metadata.name ||
    metadata.preferred_username ||
    user.email?.split('@')[0] ||
    '새로운 사용자'

  // 사용자명 생성 (이메일 앞부분 또는 ID 앞 8자)
  const username =
    metadata.preferred_username ||
    user.email?.split('@')[0] ||
    user.id.slice(0, 8)

  // 아바타 URL 추출
  const avatarUrl =
    metadata.avatar_url ||
    metadata.picture ||
    null

  return {
    username: sanitizeUsername(username),
    displayName: sanitizeDisplayName(displayName),
    avatarUrl,
  }
}

/**
 * 사용자명을 정규화합니다.
 * - 영문 소문자, 숫자, 언더스코어만 허용
 * - 최대 20자
 */
export function sanitizeUsername(username: string | null | undefined): string | null {
  if (!username) return null

  return username
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 20)
}

/**
 * 표시 이름을 정규화합니다.
 * - XSS 위험 문자 제거
 * - 최대 30자
 */
export function sanitizeDisplayName(name: string | null | undefined): string | null {
  if (!name) return null

  return name
    .replace(/[<>'"&]/g, '') // XSS 위험 문자 제거
    .trim()
    .slice(0, 30)
}

/**
 * 자기소개를 정규화합니다.
 * - XSS 위험 문자 제거
 * - 최대 200자
 */
export function sanitizeBio(bio: string | null | undefined): string | null {
  if (!bio) return null

  return bio
    .replace(/[<>]/g, '') // HTML 태그 위험 문자만 제거
    .trim()
    .slice(0, 200)
}

/**
 * 사용자의 프로필이 존재하는지 확인합니다.
 */
export async function checkProfileExists(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116: Row not found - 이건 정상적인 케이스
    logError('checkProfileExists', error)
  }

  return !!data
}

/**
 * 사용자의 프로필을 가져옵니다.
 */
export async function getProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      logError('getProfile', error)
    }
    return null
  }

  return data
}

/**
 * 신규 사용자의 프로필을 생성합니다.
 * 이미 존재하는 경우 기존 프로필을 반환합니다.
 */
export async function ensureProfile(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<{ success: boolean; profile: Profile | null; error?: string }> {
  try {
    // 1. 기존 프로필 확인
    const existingProfile = await getProfile(supabase, user.id)
    if (existingProfile) {
      return { success: true, profile: existingProfile }
    }

    // 2. 사용자 메타데이터에서 정보 추출
    const profileData = extractProfileFromUser(user)

    // 3. 프로필 생성
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: profileData.username,
        display_name: profileData.displayName,
        avatar_url: profileData.avatarUrl,
        role: 'user',
      })
      .select()
      .single()

    if (error) {
      // 동시 생성 시도로 인한 중복 에러는 무시하고 기존 프로필 반환
      if (error.code === '23505') {
        const existingProfile = await getProfile(supabase, user.id)
        return { success: true, profile: existingProfile }
      }

      logError('ensureProfile', error)
      return { success: false, profile: null, error: '프로필 생성에 실패했어요.' }
    }

    return { success: true, profile: data }
  } catch (error) {
    logError('ensureProfile', error)
    return { success: false, profile: null, error: '프로필 생성 중 오류가 발생했어요.' }
  }
}

/**
 * 사용자의 프로필을 업데이트합니다.
 */
export async function updateProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: UpdateProfileData
): Promise<{ success: boolean; error?: string }> {
  try {
    // 데이터 정규화
    const sanitizedData: UpdateProfileData = {}

    if (data.display_name !== undefined) {
      sanitizedData.display_name = sanitizeDisplayName(data.display_name)
    }

    if (data.bio !== undefined) {
      sanitizedData.bio = sanitizeBio(data.bio)
    }

    if (data.avatar_url !== undefined) {
      sanitizedData.avatar_url = data.avatar_url
    }

    const { error } = await supabase
      .from('profiles')
      .update(sanitizedData)
      .eq('id', userId)

    if (error) {
      logError('updateProfile', error)
      return { success: false, error: '프로필 업데이트에 실패했어요.' }
    }

    return { success: true }
  } catch (error) {
    logError('updateProfile', error)
    return { success: false, error: '프로필 업데이트 중 오류가 발생했어요.' }
  }
}

/**
 * 사용자의 프로필과 관련 데이터를 삭제합니다.
 * 주의: 이 함수는 되돌릴 수 없습니다.
 */
export async function deleteProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 관련 데이터 삭제 (CASCADE가 설정되어 있지 않은 경우)
    // 순서가 중요: 외래키 제약 조건을 고려

    // 1. 좋아요 삭제
    await supabase.from('likes').delete().eq('user_id', userId)

    // 2. 북마크 삭제
    await supabase.from('bookmarks').delete().eq('user_id', userId)

    // 3. 댓글 좋아요 삭제
    await supabase.from('comment_likes').delete().eq('user_id', userId)

    // 4. 댓글 삭제
    await supabase.from('comments').delete().eq('user_id', userId)

    // 5. 팔로우 관계 삭제
    await supabase.from('follows').delete().eq('follower_id', userId)
    await supabase.from('follows').delete().eq('following_id', userId)

    // 6. 작업물 삭제
    await supabase.from('works').delete().eq('user_id', userId)

    // 7. 구매 내역 업데이트 (null로 설정)
    await supabase
      .from('purchases')
      .update({ buyer_id: null })
      .eq('buyer_id', userId)

    // 8. 콜라보 세션 삭제 (호스트인 경우)
    await supabase.from('collab_sessions').delete().eq('host_id', userId)

    // 9. 템플릿 삭제 (크리에이터인 경우)
    await supabase.from('templates').delete().eq('creator_id', userId)

    // 10. 프로필 삭제
    const { error } = await supabase.from('profiles').delete().eq('id', userId)

    if (error) {
      logError('deleteProfile', error)
      return { success: false, error: '프로필 삭제에 실패했어요.' }
    }

    return { success: true }
  } catch (error) {
    logError('deleteProfile', error)
    return { success: false, error: '계정 삭제 중 오류가 발생했어요.' }
  }
}
