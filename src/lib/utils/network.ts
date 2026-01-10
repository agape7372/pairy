/**
 * 네트워크 유틸리티
 *
 * 기능:
 * - AbortController 기반 타임아웃
 * - 재시도 로직 (지수 백오프)
 * - 타임아웃 상수 정의
 */

// ============================================
// 타임아웃 상수
// ============================================

/** 작업 유형별 타임아웃 (밀리초) */
export const NETWORK_TIMEOUTS = {
  /** 데이터 조회 */
  read: 10_000,
  /** 데이터 저장/수정 */
  write: 30_000,
  /** 파일 업로드 */
  upload: 120_000,
  /** 인증 작업 */
  auth: 15_000,
} as const

export type TimeoutType = keyof typeof NETWORK_TIMEOUTS

// ============================================
// 타임아웃 컨트롤러
// ============================================

export interface TimeoutController {
  /** AbortSignal - fetch나 Supabase 쿼리에 전달 */
  signal: AbortSignal
  /** 타임아웃 취소 (성공 시 호출) */
  clear: () => void
  /** 수동 취소 */
  abort: () => void
}

/**
 * 타임아웃이 적용된 AbortController 생성
 *
 * @example
 * ```typescript
 * const { signal, clear } = createTimeoutController('read')
 * try {
 *   const { data } = await supabase
 *     .from('profiles')
 *     .select('*')
 *     .abortSignal(signal)
 *   clear() // 성공 시 타임아웃 해제
 * } catch (error) {
 *   if (isTimeoutError(error)) {
 *     // 타임아웃 처리
 *   }
 * }
 * ```
 */
export function createTimeoutController(
  type: TimeoutType = 'read',
  customTimeout?: number
): TimeoutController {
  const controller = new AbortController()
  const timeout = customTimeout ?? NETWORK_TIMEOUTS[type]

  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException('Request timeout', 'TimeoutError'))
  }, timeout)

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
    abort: () => {
      clearTimeout(timeoutId)
      controller.abort(new DOMException('Request cancelled', 'AbortError'))
    },
  }
}

// ============================================
// 에러 판별
// ============================================

/**
 * 타임아웃 에러인지 확인
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'TimeoutError' || error.message === 'Request timeout'
  }
  if (error instanceof Error) {
    return (
      error.name === 'AbortError' ||
      error.message.includes('timeout') ||
      error.message.includes('aborted')
    )
  }
  return false
}

/**
 * 취소된 요청인지 확인
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'AbortError'
  }
  if (error instanceof Error) {
    return error.name === 'AbortError' || error.message.includes('aborted')
  }
  return false
}

/**
 * 네트워크 에러인지 확인
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return error.message.includes('network') || error.message.includes('fetch')
  }
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT')
    )
  }
  return false
}

// ============================================
// 재시도 로직
// ============================================

export interface RetryOptions {
  /** 최대 재시도 횟수 (기본: 3) */
  maxRetries?: number
  /** 초기 대기 시간 ms (기본: 1000) */
  initialDelay?: number
  /** 최대 대기 시간 ms (기본: 10000) */
  maxDelay?: number
  /** 재시도할 에러 판별 함수 */
  shouldRetry?: (error: unknown) => boolean
  /** 재시도 전 콜백 */
  onRetry?: (attempt: number, error: unknown) => void
}

/**
 * 지수 백오프를 적용한 재시도 래퍼
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetchData(),
 *   {
 *     maxRetries: 3,
 *     shouldRetry: (e) => isNetworkError(e) || isTimeoutError(e),
 *     onRetry: (attempt) => console.log(`재시도 ${attempt}회`)
 *   }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (e) => isNetworkError(e) || isTimeoutError(e),
    onRetry,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // 마지막 시도이거나 재시도 불가능한 에러면 throw
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error
      }

      // 지수 백오프 + 지터
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt) + Math.random() * 500,
        maxDelay
      )

      onRetry?.(attempt + 1, error)

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// ============================================
// Supabase 통합 헬퍼
// ============================================

/**
 * Supabase 쿼리에 타임아웃 적용하는 래퍼
 *
 * @example
 * ```typescript
 * const { data, error } = await withTimeout(
 *   supabase.from('profiles').select('*'),
 *   'read'
 * )
 * ```
 */
export async function withSupabaseTimeout<T>(
  queryBuilder: { abortSignal: (signal: AbortSignal) => PromiseLike<T> },
  type: TimeoutType = 'read'
): Promise<T> {
  const { signal, clear } = createTimeoutController(type)

  try {
    const result = await queryBuilder.abortSignal(signal)
    clear()
    return result
  } catch (error) {
    clear()
    throw error
  }
}
