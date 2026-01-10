/**
 * 입력 검증 유틸리티
 *
 * 기능:
 * - 비밀번호 복잡성 검증
 * - 이메일 검증
 * - 이미지 URL 검증
 * - 사용자명 검증
 */

// ============================================
// 비밀번호 검증
// ============================================

export interface PasswordValidationResult {
  /** 유효 여부 */
  isValid: boolean
  /** 에러 메시지 (무효한 경우) */
  error?: string
  /** 강도 점수 (0-100) */
  strength: number
  /** 강도 레벨 */
  level: 'weak' | 'fair' | 'good' | 'strong'
  /** 상세 검증 결과 */
  checks: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecial: boolean
    noCommonPatterns: boolean
  }
}

/** 비밀번호 최소 요구사항 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // 권장하지만 필수는 아님
} as const

/** 흔한 비밀번호 패턴 (사용 금지) */
const COMMON_PATTERNS = [
  /^123456/,
  /^password/i,
  /^qwerty/i,
  /^abc123/i,
  /^111111/,
  /^000000/,
  /^admin/i,
  /^letmein/i,
  /^welcome/i,
  /^monkey/i,
  /^dragon/i,
  /^master/i,
  /^12345678/,
  /^1234567890/,
]

/**
 * 비밀번호 복잡성 검증
 *
 * @example
 * ```typescript
 * const result = validatePassword('MyP@ss123')
 * if (!result.isValid) {
 *   showError(result.error)
 * }
 * ```
 */
export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommonPatterns: !COMMON_PATTERNS.some((pattern) => pattern.test(password)),
  }

  // 강도 점수 계산
  let strength = 0
  if (checks.minLength) strength += 25
  if (checks.hasUppercase) strength += 15
  if (checks.hasLowercase) strength += 15
  if (checks.hasNumber) strength += 20
  if (checks.hasSpecial) strength += 15
  if (checks.noCommonPatterns) strength += 10

  // 길이 보너스
  if (password.length >= 12) strength += 10
  if (password.length >= 16) strength += 10

  // 강도 레벨 결정
  let level: PasswordValidationResult['level'] = 'weak'
  if (strength >= 80) level = 'strong'
  else if (strength >= 60) level = 'good'
  else if (strength >= 40) level = 'fair'

  // 필수 조건 검사
  const errors: string[] = []

  if (!checks.minLength) {
    errors.push(`최소 ${PASSWORD_REQUIREMENTS.minLength}자 이상이어야 해요`)
  }
  if (PASSWORD_REQUIREMENTS.requireUppercase && !checks.hasUppercase) {
    errors.push('대문자를 포함해야 해요')
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase && !checks.hasLowercase) {
    errors.push('소문자를 포함해야 해요')
  }
  if (PASSWORD_REQUIREMENTS.requireNumber && !checks.hasNumber) {
    errors.push('숫자를 포함해야 해요')
  }
  if (!checks.noCommonPatterns) {
    errors.push('너무 쉬운 비밀번호예요')
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors[0] : undefined,
    strength: Math.min(100, strength),
    level,
    checks,
  }
}

/**
 * 비밀번호 강도 레벨에 따른 색상 반환
 */
export function getPasswordStrengthColor(
  level: PasswordValidationResult['level']
): string {
  switch (level) {
    case 'weak':
      return '#ef4444' // red-500
    case 'fair':
      return '#f59e0b' // amber-500
    case 'good':
      return '#22c55e' // green-500
    case 'strong':
      return '#10b981' // emerald-500
    default:
      return '#9ca3af' // gray-400
  }
}

/**
 * 비밀번호 강도 레벨 한글 라벨
 */
export function getPasswordStrengthLabel(
  level: PasswordValidationResult['level']
): string {
  switch (level) {
    case 'weak':
      return '약함'
    case 'fair':
      return '보통'
    case 'good':
      return '좋음'
    case 'strong':
      return '강함'
    default:
      return ''
  }
}

// ============================================
// 이메일 검증
// ============================================

/** 이메일 정규식 (RFC 5322 간소화 버전) */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * 이메일 유효성 검증
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false
  return EMAIL_REGEX.test(email)
}

// ============================================
// 이미지 URL 검증
// ============================================

/** 허용된 이미지 프로토콜 */
const ALLOWED_IMAGE_PROTOCOLS = ['https:', 'http:', 'blob:', 'data:']

/** 위험한 URL 패턴 */
const DANGEROUS_PATTERNS = [
  /javascript:/i,
  /vbscript:/i,
  /data:text\/html/i,
]

export interface ImageUrlValidationResult {
  isValid: boolean
  error?: string
  sanitizedUrl?: string
}

/**
 * 이미지 URL 유효성 검증
 *
 * @example
 * ```typescript
 * const result = validateImageUrl(userInput)
 * if (result.isValid) {
 *   setImageSrc(result.sanitizedUrl)
 * }
 * ```
 */
export function validateImageUrl(url: string | null | undefined): ImageUrlValidationResult {
  if (!url) {
    return { isValid: false, error: 'URL이 비어있어요' }
  }

  // 위험한 패턴 검사
  if (DANGEROUS_PATTERNS.some((pattern) => pattern.test(url))) {
    return { isValid: false, error: '허용되지 않는 URL 형식이에요' }
  }

  // data: URL 특별 처리 (이미지만 허용)
  if (url.startsWith('data:')) {
    if (!url.startsWith('data:image/')) {
      return { isValid: false, error: '이미지 형식만 허용돼요' }
    }
    return { isValid: true, sanitizedUrl: url }
  }

  // blob: URL은 그대로 허용
  if (url.startsWith('blob:')) {
    return { isValid: true, sanitizedUrl: url }
  }

  // URL 파싱 시도
  try {
    const parsed = new URL(url, window?.location?.origin)

    // 프로토콜 검사
    if (!ALLOWED_IMAGE_PROTOCOLS.includes(parsed.protocol)) {
      return { isValid: false, error: '허용되지 않는 프로토콜이에요' }
    }

    // HTTPS 권장 (개발 환경에서는 HTTP도 허용)
    if (
      parsed.protocol === 'http:' &&
      !parsed.hostname.includes('localhost') &&
      !parsed.hostname.includes('127.0.0.1')
    ) {
      // HTTP는 허용하지만 경고 로그
      console.warn(`[validateImageUrl] HTTP URL 감지: ${url}`)
    }

    return { isValid: true, sanitizedUrl: parsed.href }
  } catch {
    return { isValid: false, error: '올바른 URL 형식이 아니에요' }
  }
}

/**
 * 이미지 URL을 안전하게 사용할 수 있는지 빠른 체크
 */
export function isSafeImageUrl(url: string | null | undefined): boolean {
  return validateImageUrl(url).isValid
}

// ============================================
// 사용자명 검증
// ============================================

/** 사용자명 규칙 */
export const USERNAME_RULES = {
  minLength: 3,
  maxLength: 20,
  allowedPattern: /^[a-zA-Z0-9_]+$/,
} as const

/**
 * 사용자명 유효성 검증
 */
export function validateUsername(username: string): {
  isValid: boolean
  error?: string
} {
  if (!username) {
    return { isValid: false, error: '사용자명을 입력해주세요' }
  }

  if (username.length < USERNAME_RULES.minLength) {
    return {
      isValid: false,
      error: `최소 ${USERNAME_RULES.minLength}자 이상이어야 해요`,
    }
  }

  if (username.length > USERNAME_RULES.maxLength) {
    return {
      isValid: false,
      error: `최대 ${USERNAME_RULES.maxLength}자까지 가능해요`,
    }
  }

  if (!USERNAME_RULES.allowedPattern.test(username)) {
    return {
      isValid: false,
      error: '영문, 숫자, 밑줄(_)만 사용할 수 있어요',
    }
  }

  return { isValid: true }
}

// ============================================
// 일반 텍스트 검증
// ============================================

/**
 * 텍스트 길이 검증
 */
export function validateTextLength(
  text: string,
  options: { min?: number; max: number; fieldName?: string }
): { isValid: boolean; error?: string } {
  const { min = 0, max, fieldName = '텍스트' } = options

  if (text.length < min) {
    return { isValid: false, error: `${fieldName}은(는) 최소 ${min}자 이상이어야 해요` }
  }

  if (text.length > max) {
    return { isValid: false, error: `${fieldName}은(는) 최대 ${max}자까지 가능해요` }
  }

  return { isValid: true }
}
