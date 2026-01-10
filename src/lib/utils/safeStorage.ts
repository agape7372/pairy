/**
 * 안전한 스토리지 유틸리티
 *
 * 기능:
 * - JSON 파싱 에러 처리
 * - 타입 검증
 * - 만료 시간 지원
 * - 용량 초과 처리
 */

// ============================================
// 타입 정의
// ============================================

export interface StorageOptions<T> {
  /** 기본값 (파싱 실패 시 반환) */
  defaultValue: T
  /** 유효성 검사 함수 */
  validate?: (value: unknown) => value is T
  /** 만료 시간 (밀리초) */
  expiresIn?: number
}

interface StoredData<T> {
  value: T
  timestamp: number
  expiresAt?: number
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 안전한 JSON 파싱
 * 파싱 실패 시 기본값 반환
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  defaultValue: T
): T {
  if (!json) return defaultValue

  try {
    return JSON.parse(json) as T
  } catch {
    console.warn('[safeJsonParse] JSON 파싱 실패, 기본값 사용')
    return defaultValue
  }
}

/**
 * 타입 검증이 포함된 안전한 JSON 파싱
 */
export function safeJsonParseWithValidation<T>(
  json: string | null | undefined,
  options: StorageOptions<T>
): T {
  const { defaultValue, validate } = options

  if (!json) return defaultValue

  try {
    const parsed = JSON.parse(json)

    // 유효성 검사
    if (validate && !validate(parsed)) {
      console.warn('[safeJsonParse] 유효성 검사 실패, 기본값 사용')
      return defaultValue
    }

    return parsed as T
  } catch {
    console.warn('[safeJsonParse] JSON 파싱 실패, 기본값 사용')
    return defaultValue
  }
}

// ============================================
// LocalStorage 래퍼
// ============================================

/**
 * localStorage에서 안전하게 데이터 읽기
 */
export function getStorageItem<T>(
  key: string,
  options: StorageOptions<T>
): T {
  if (typeof window === 'undefined') return options.defaultValue

  try {
    const stored = localStorage.getItem(key)
    if (!stored) return options.defaultValue

    const data = JSON.parse(stored) as StoredData<T> | T

    // 새 포맷 (메타데이터 포함)
    if (isStoredData<T>(data)) {
      // 만료 확인
      if (data.expiresAt && Date.now() > data.expiresAt) {
        localStorage.removeItem(key)
        return options.defaultValue
      }

      // 유효성 검사
      if (options.validate && !options.validate(data.value)) {
        localStorage.removeItem(key)
        return options.defaultValue
      }

      return data.value
    }

    // 레거시 포맷 (직접 저장된 값)
    if (options.validate && !options.validate(data)) {
      localStorage.removeItem(key)
      return options.defaultValue
    }

    return data as T
  } catch {
    console.warn(`[getStorageItem] ${key} 읽기 실패`)
    return options.defaultValue
  }
}

/**
 * localStorage에 안전하게 데이터 저장
 */
export function setStorageItem<T>(
  key: string,
  value: T,
  expiresIn?: number
): boolean {
  if (typeof window === 'undefined') return false

  try {
    const data: StoredData<T> = {
      value,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
    }

    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    // 용량 초과 처리
    if (isQuotaExceededError(error)) {
      console.warn(`[setStorageItem] 스토리지 용량 초과: ${key}`)
      // 오래된 항목 정리 시도
      cleanupExpiredItems()
      try {
        localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }))
        return true
      } catch {
        return false
      }
    }
    console.error(`[setStorageItem] ${key} 저장 실패:`, error)
    return false
  }
}

/**
 * localStorage에서 항목 삭제
 */
export function removeStorageItem(key: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

// ============================================
// 헬퍼 함수
// ============================================

function isStoredData<T>(data: unknown): data is StoredData<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    'timestamp' in data
  )
}

function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.code === 22 || // 레거시 코드
      error.code === 1014 || // Firefox
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}

/**
 * 만료된 항목 정리
 */
function cleanupExpiredItems(): void {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []
  const now = Date.now()

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue

    try {
      const stored = localStorage.getItem(key)
      if (!stored) continue

      const data = JSON.parse(stored)
      if (isStoredData(data) && data.expiresAt && data.expiresAt < now) {
        keysToRemove.push(key)
      }
    } catch {
      // 파싱 실패한 항목은 무시
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key))

  if (keysToRemove.length > 0) {
    console.log(`[cleanupExpiredItems] ${keysToRemove.length}개 만료 항목 정리`)
  }
}

// ============================================
// 배열/객체 검증 헬퍼
// ============================================

/**
 * 배열 타입 검증 함수 생성기
 */
export function createArrayValidator<T>(
  itemValidator: (item: unknown) => item is T
): (value: unknown) => value is T[] {
  return (value: unknown): value is T[] => {
    return Array.isArray(value) && value.every(itemValidator)
  }
}

/**
 * 객체가 특정 키를 가지는지 검증
 */
export function hasRequiredKeys<T extends object>(
  obj: unknown,
  keys: (keyof T)[]
): obj is T {
  if (typeof obj !== 'object' || obj === null) return false
  return keys.every((key) => key in obj)
}

// ============================================
// Rate Limiting 지원
// ============================================

export interface RateLimitState {
  attempts: number
  firstAttempt: number
  lockedUntil?: number
}

const RATE_LIMIT_KEY_PREFIX = 'pairy_rate_limit_'

/**
 * Rate limit 상태 확인 및 업데이트
 */
export function checkRateLimit(
  action: string,
  options: {
    maxAttempts: number
    windowMs: number
    lockoutMs: number
  }
): { allowed: boolean; remainingAttempts: number; lockedUntil?: number } {
  const key = `${RATE_LIMIT_KEY_PREFIX}${action}`
  const now = Date.now()

  const state = getStorageItem<RateLimitState>(key, {
    defaultValue: { attempts: 0, firstAttempt: now },
  })

  // 잠금 상태 확인
  if (state.lockedUntil && now < state.lockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: state.lockedUntil,
    }
  }

  // 윈도우 만료 확인
  if (now - state.firstAttempt > options.windowMs) {
    // 윈도우 리셋
    const newState: RateLimitState = { attempts: 1, firstAttempt: now }
    setStorageItem(key, newState)
    return { allowed: true, remainingAttempts: options.maxAttempts - 1 }
  }

  // 시도 횟수 확인
  if (state.attempts >= options.maxAttempts) {
    // 잠금 설정
    const newState: RateLimitState = {
      ...state,
      lockedUntil: now + options.lockoutMs,
    }
    setStorageItem(key, newState)
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: newState.lockedUntil,
    }
  }

  // 시도 허용
  const newState: RateLimitState = {
    ...state,
    attempts: state.attempts + 1,
  }
  setStorageItem(key, newState)

  return {
    allowed: true,
    remainingAttempts: options.maxAttempts - newState.attempts,
  }
}

/**
 * Rate limit 초기화 (로그인 성공 시)
 */
export function resetRateLimit(action: string): void {
  removeStorageItem(`${RATE_LIMIT_KEY_PREFIX}${action}`)
}
