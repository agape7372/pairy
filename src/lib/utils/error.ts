/**
 * 에러 핸들링 유틸리티
 * 일관된 에러 처리와 사용자 친화적인 메시지 제공
 */

import type { AuthError, PostgrestError } from '@supabase/supabase-js'

/**
 * 에러 타입 정의
 */
export type AppErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_USER_NOT_FOUND'
  | 'AUTH_EMAIL_NOT_CONFIRMED'
  | 'AUTH_WEAK_PASSWORD'
  | 'AUTH_EMAIL_TAKEN'
  | 'AUTH_RATE_LIMITED'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_INVALID_TOKEN'
  | 'AUTH_OAUTH_ERROR'
  | 'NETWORK_ERROR'
  | 'DATABASE_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'

/**
 * 앱 에러 클래스
 */
export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * 에러 코드별 사용자 친화적 메시지 매핑
 */
const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  AUTH_INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않아요.',
  AUTH_USER_NOT_FOUND: '등록되지 않은 계정이에요.',
  AUTH_EMAIL_NOT_CONFIRMED: '이메일 인증이 필요해요. 메일함을 확인해주세요.',
  AUTH_WEAK_PASSWORD: '비밀번호는 최소 6자 이상이어야 해요.',
  AUTH_EMAIL_TAKEN: '이미 사용 중인 이메일이에요.',
  AUTH_RATE_LIMITED: '너무 많은 요청이 있었어요. 잠시 후 다시 시도해주세요.',
  AUTH_SESSION_EXPIRED: '세션이 만료되었어요. 다시 로그인해주세요.',
  AUTH_INVALID_TOKEN: '유효하지 않은 인증 토큰이에요.',
  AUTH_OAUTH_ERROR: '소셜 로그인 중 오류가 발생했어요.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  DATABASE_ERROR: '데이터 처리 중 오류가 발생했어요.',
  VALIDATION_ERROR: '입력값을 확인해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했어요. 다시 시도해주세요.',
}

/**
 * Supabase Auth 에러를 AppError로 변환합니다.
 */
export function parseAuthError(error: AuthError): AppError {
  const message = error.message.toLowerCase()

  // 에러 메시지 패턴 매칭
  if (message.includes('invalid login credentials') || message.includes('invalid password')) {
    return new AppError('AUTH_INVALID_CREDENTIALS', ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS, error)
  }

  if (message.includes('user not found')) {
    return new AppError('AUTH_USER_NOT_FOUND', ERROR_MESSAGES.AUTH_USER_NOT_FOUND, error)
  }

  if (message.includes('email not confirmed')) {
    return new AppError('AUTH_EMAIL_NOT_CONFIRMED', ERROR_MESSAGES.AUTH_EMAIL_NOT_CONFIRMED, error)
  }

  if (message.includes('password') && (message.includes('weak') || message.includes('short'))) {
    return new AppError('AUTH_WEAK_PASSWORD', ERROR_MESSAGES.AUTH_WEAK_PASSWORD, error)
  }

  if (message.includes('already registered') || message.includes('email taken') || message.includes('user already exists')) {
    return new AppError('AUTH_EMAIL_TAKEN', ERROR_MESSAGES.AUTH_EMAIL_TAKEN, error)
  }

  if (message.includes('rate limit') || message.includes('too many requests')) {
    return new AppError('AUTH_RATE_LIMITED', ERROR_MESSAGES.AUTH_RATE_LIMITED, error)
  }

  if (message.includes('session') && (message.includes('expired') || message.includes('invalid'))) {
    return new AppError('AUTH_SESSION_EXPIRED', ERROR_MESSAGES.AUTH_SESSION_EXPIRED, error)
  }

  if (message.includes('token') && message.includes('invalid')) {
    return new AppError('AUTH_INVALID_TOKEN', ERROR_MESSAGES.AUTH_INVALID_TOKEN, error)
  }

  if (message.includes('oauth') || message.includes('provider')) {
    return new AppError('AUTH_OAUTH_ERROR', ERROR_MESSAGES.AUTH_OAUTH_ERROR, error)
  }

  return new AppError('UNKNOWN_ERROR', ERROR_MESSAGES.UNKNOWN_ERROR, error)
}

/**
 * Supabase Postgrest 에러를 AppError로 변환합니다.
 */
export function parsePostgrestError(error: PostgrestError): AppError {
  const message = error.message.toLowerCase()

  if (message.includes('network') || message.includes('fetch')) {
    return new AppError('NETWORK_ERROR', ERROR_MESSAGES.NETWORK_ERROR, error)
  }

  if (message.includes('duplicate') || message.includes('unique')) {
    return new AppError('VALIDATION_ERROR', '이미 존재하는 데이터예요.', error)
  }

  return new AppError('DATABASE_ERROR', ERROR_MESSAGES.DATABASE_ERROR, error)
}

/**
 * 일반 에러를 AppError로 변환합니다.
 */
export function parseError(error: unknown): AppError {
  // 이미 AppError인 경우
  if (error instanceof AppError) {
    return error
  }

  // Supabase Auth 에러
  if (isAuthError(error)) {
    return parseAuthError(error)
  }

  // Supabase Postgrest 에러
  if (isPostgrestError(error)) {
    return parsePostgrestError(error)
  }

  // 일반 Error 객체
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
      return new AppError('NETWORK_ERROR', ERROR_MESSAGES.NETWORK_ERROR, error)
    }

    return new AppError('UNKNOWN_ERROR', error.message || ERROR_MESSAGES.UNKNOWN_ERROR, error)
  }

  // 문자열 에러
  if (typeof error === 'string') {
    return new AppError('UNKNOWN_ERROR', error, error)
  }

  // 알 수 없는 에러
  return new AppError('UNKNOWN_ERROR', ERROR_MESSAGES.UNKNOWN_ERROR, error)
}

/**
 * Supabase Auth 에러인지 타입 가드
 */
function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    ('status' in error || '__isAuthError' in error || 'code' in error)
  )
}

/**
 * Supabase Postgrest 에러인지 타입 가드
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error &&
    'details' in error
  )
}

/**
 * 에러 메시지를 가져옵니다.
 */
export function getErrorMessage(error: unknown): string {
  return parseError(error).message
}

/**
 * 에러를 안전하게 로깅합니다 (프로덕션에서는 민감 정보 제외)
 */
export function logError(context: string, error: unknown): void {
  const appError = parseError(error)

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, {
      code: appError.code,
      message: appError.message,
      originalError: appError.originalError,
    })
  } else {
    // 프로덕션에서는 민감 정보 제외
    console.error(`[${context}] ${appError.code}: ${appError.message}`)
  }
}
