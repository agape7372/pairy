/**
 * 데모 모드 localStorage 유틸리티
 *
 * 변경 이유:
 * - useFollow, useLikes, useComments, useBookmarks 등에서 반복되던 localStorage 로직 통합
 * - 타입 안전성 강화 및 에러 처리 일관성 확보
 * - SSR 안전성 보장 (typeof window 체크)
 */

// ============================================
// 기본 Storage 유틸리티
// ============================================

/**
 * SSR-safe localStorage 읽기
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * SSR-safe localStorage 쓰기
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    // QuotaExceededError 등 무시
    console.warn(`Failed to save to localStorage: ${key}`, err)
  }
}

/**
 * SSR-safe localStorage 삭제
 */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch {
    // 무시
  }
}

// ============================================
// Set 기반 Storage (좋아요, 팔로우 등)
// ============================================

/**
 * Set<string>을 localStorage에서 읽기
 */
export function getStorageSet(key: string): Set<string> {
  const arr = getStorageItem<string[]>(key, [])
  return new Set(arr)
}

/**
 * Set<string>을 localStorage에 저장
 */
export function saveStorageSet(key: string, set: Set<string>): void {
  setStorageItem(key, [...set])
}

/**
 * Set에 아이템 추가
 */
export function addToStorageSet(key: string, item: string): Set<string> {
  const set = getStorageSet(key)
  set.add(item)
  saveStorageSet(key, set)
  return set
}

/**
 * Set에서 아이템 제거
 */
export function removeFromStorageSet(key: string, item: string): Set<string> {
  const set = getStorageSet(key)
  set.delete(item)
  saveStorageSet(key, set)
  return set
}

/**
 * Set에 아이템 존재 여부 확인
 */
export function hasInStorageSet(key: string, item: string): boolean {
  return getStorageSet(key).has(item)
}

// ============================================
// 카운트 기반 Storage (팔로워 수 등)
// ============================================

type CountsRecord = Record<string, { follower: number; following: number }>

/**
 * 안정적인 랜덤 카운트 생성 (최초 한 번만 생성 후 저장)
 */
export function getStableCounts(
  key: string,
  id: string,
  generator: () => { follower: number; following: number }
): { follower: number; following: number } {
  const counts = getStorageItem<CountsRecord>(key, {})

  if (!counts[id]) {
    counts[id] = generator()
    setStorageItem(key, counts)
  }

  return counts[id]
}

// ============================================
// 데모 모드 Storage 키 상수
// ============================================

export const DEMO_STORAGE_KEYS = {
  FOLLOWS: 'pairy_demo_follows',
  FOLLOW_COUNTS: 'pairy_demo_counts',
  LIKES: 'pairy_demo_likes',
  BOOKMARKS: 'pairy_demo_bookmarks',
  COMMENTS: 'pairy_demo_comments',
  COMMENT_LIKES: 'pairy_demo_comment_likes',
} as const

// ============================================
// 타입 익스포트
// ============================================

export type DemoStorageKey = keyof typeof DEMO_STORAGE_KEYS
