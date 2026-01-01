/**
 * 에러 핸들링 유틸리티 테스트
 */

import { AppError, parseError, getErrorMessage, parseAuthError } from '../error'

describe('AppError', () => {
  it('올바른 에러 객체를 생성해야 함', () => {
    const error = new AppError('AUTH_INVALID_CREDENTIALS', '테스트 메시지')

    expect(error.code).toBe('AUTH_INVALID_CREDENTIALS')
    expect(error.message).toBe('테스트 메시지')
    expect(error.name).toBe('AppError')
    expect(error instanceof Error).toBe(true)
  })

  it('원본 에러를 포함할 수 있어야 함', () => {
    const originalError = new Error('원본 에러')
    const error = new AppError('UNKNOWN_ERROR', '래핑된 에러', originalError)

    expect(error.originalError).toBe(originalError)
  })
})

describe('parseAuthError', () => {
  it('잘못된 자격 증명 에러를 파싱해야 함', () => {
    const authError = { message: 'Invalid login credentials', status: 400 }
    const result = parseAuthError(authError as any)

    expect(result.code).toBe('AUTH_INVALID_CREDENTIALS')
  })

  it('이메일 미확인 에러를 파싱해야 함', () => {
    const authError = { message: 'Email not confirmed', status: 400 }
    const result = parseAuthError(authError as any)

    expect(result.code).toBe('AUTH_EMAIL_NOT_CONFIRMED')
  })

  it('이미 등록된 사용자 에러를 파싱해야 함', () => {
    const authError = { message: 'User already registered', status: 400 }
    const result = parseAuthError(authError as any)

    expect(result.code).toBe('AUTH_EMAIL_TAKEN')
  })

  it('rate limit 에러를 파싱해야 함', () => {
    const authError = { message: 'Too many requests', status: 429 }
    const result = parseAuthError(authError as any)

    expect(result.code).toBe('AUTH_RATE_LIMITED')
  })

  it('세션 만료 에러를 파싱해야 함', () => {
    const authError = { message: 'Session expired', status: 401 }
    const result = parseAuthError(authError as any)

    expect(result.code).toBe('AUTH_SESSION_EXPIRED')
  })

  it('알 수 없는 에러는 UNKNOWN_ERROR로 파싱해야 함', () => {
    const authError = { message: 'Some unknown error', status: 500 }
    const result = parseAuthError(authError as any)

    expect(result.code).toBe('UNKNOWN_ERROR')
  })
})

describe('parseError', () => {
  it('AppError는 그대로 반환해야 함', () => {
    const appError = new AppError('AUTH_INVALID_CREDENTIALS', '테스트')
    const result = parseError(appError)

    expect(result).toBe(appError)
  })

  it('일반 Error를 파싱해야 함', () => {
    const error = new Error('일반 에러 메시지')
    const result = parseError(error)

    expect(result.code).toBe('UNKNOWN_ERROR')
    expect(result.message).toBe('일반 에러 메시지')
  })

  it('네트워크 에러를 감지해야 함', () => {
    const error = new Error('Failed to fetch')
    const result = parseError(error)

    expect(result.code).toBe('NETWORK_ERROR')
  })

  it('문자열 에러를 파싱해야 함', () => {
    const result = parseError('문자열 에러')

    expect(result.code).toBe('UNKNOWN_ERROR')
    expect(result.message).toBe('문자열 에러')
  })

  it('null을 안전하게 처리해야 함', () => {
    const result = parseError(null)

    expect(result.code).toBe('UNKNOWN_ERROR')
  })

  it('undefined를 안전하게 처리해야 함', () => {
    const result = parseError(undefined)

    expect(result.code).toBe('UNKNOWN_ERROR')
  })

  it('객체를 안전하게 처리해야 함', () => {
    const result = parseError({ foo: 'bar' })

    expect(result.code).toBe('UNKNOWN_ERROR')
  })
})

describe('getErrorMessage', () => {
  it('AppError에서 메시지를 추출해야 함', () => {
    const error = new AppError('AUTH_INVALID_CREDENTIALS', '잘못된 자격 증명')
    expect(getErrorMessage(error)).toBe('잘못된 자격 증명')
  })

  it('일반 Error에서 메시지를 추출해야 함', () => {
    const error = new Error('일반 에러')
    expect(getErrorMessage(error)).toBe('일반 에러')
  })

  it('문자열에서 메시지를 추출해야 함', () => {
    expect(getErrorMessage('문자열 에러')).toBe('문자열 에러')
  })

  it('null에서 기본 메시지를 반환해야 함', () => {
    const message = getErrorMessage(null)
    expect(message).toBeTruthy()
    expect(typeof message).toBe('string')
  })
})
