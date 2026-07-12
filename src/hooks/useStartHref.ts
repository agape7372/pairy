'use client'

import { useUser } from '@/hooks/useUser'

/**
 * "시작하기" 류 CTA 의 목적지.
 * 비로그인 → /login, 로그인 → 바로 에디터로(다시 로그인창 뜨는 문제 해소).
 */
export function useStartHref(): string {
  const { user, isLoading } = useUser()
  if (isLoading) return '/login'
  return user ? '/editor/new' : '/login'
}
