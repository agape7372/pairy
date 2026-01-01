/**
 * URL 관련 유틸리티 함수들
 * Open Redirect 취약점 방지를 위한 검증 로직 포함
 */

import { BASE_PATH } from '@/lib/constants'

/**
 * 허용된 리다이렉트 URL인지 검증합니다.
 * Open Redirect 공격을 방지하기 위해 상대 경로만 허용합니다.
 *
 * @param url - 검증할 URL
 * @param fallback - 검증 실패 시 반환할 기본 URL (기본값: '/')
 * @returns 안전한 리다이렉트 URL
 *
 * @example
 * validateRedirectUrl('/my/profile') // '/my/profile'
 * validateRedirectUrl('https://evil.com') // '/'
 * validateRedirectUrl('//evil.com') // '/'
 * validateRedirectUrl('javascript:alert(1)') // '/'
 */
export function validateRedirectUrl(url: string | null | undefined, fallback = '/'): string {
  // null, undefined, 빈 문자열 처리
  if (!url || typeof url !== 'string') {
    return fallback
  }

  const trimmedUrl = url.trim()

  // 빈 문자열 체크
  if (trimmedUrl.length === 0) {
    return fallback
  }

  // 프로토콜 상대 URL 차단 (//evil.com)
  if (trimmedUrl.startsWith('//')) {
    return fallback
  }

  // javascript:, data:, vbscript: 등 위험한 프로토콜 차단
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  const lowerUrl = trimmedUrl.toLowerCase()
  if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
    return fallback
  }

  // 절대 URL인 경우 (http://, https://)
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    try {
      const parsedUrl = new URL(trimmedUrl)
      const currentOrigin = typeof window !== 'undefined'
        ? window.location.origin
        : 'https://agape7372.github.io'

      // 동일 origin인 경우에만 허용
      if (parsedUrl.origin === currentOrigin) {
        return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash
      }
      return fallback
    } catch {
      return fallback
    }
  }

  // 상대 경로인 경우 (/ 로 시작)
  if (trimmedUrl.startsWith('/')) {
    // 경로 탐색 공격 방지 (/../, /./)
    const normalizedPath = normalizePath(trimmedUrl)
    if (normalizedPath) {
      return normalizedPath
    }
    return fallback
  }

  // 그 외의 경우 (상대 경로가 아닌 경우)
  return fallback
}

/**
 * 경로를 정규화하고 위험한 패턴을 제거합니다.
 */
function normalizePath(path: string): string | null {
  try {
    // URL 객체를 사용하여 경로 정규화
    const dummyBase = 'http://dummy.com'
    const url = new URL(path, dummyBase)

    // 정규화된 경로 반환
    const normalizedPath = url.pathname + url.search + url.hash

    // 경로가 /로 시작하는지 확인
    if (!normalizedPath.startsWith('/')) {
      return null
    }

    return normalizedPath
  } catch {
    return null
  }
}

/**
 * 전체 URL을 생성합니다 (basePath 포함)
 * SSR과 CSR 모두에서 안전하게 동작합니다.
 */
export function getFullUrl(path: string): string {
  if (path.startsWith('http')) return path

  const cleanPath = path.startsWith('/') ? path : `/${path}`

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${BASE_PATH}${cleanPath}`
  }

  return `https://agape7372.github.io${BASE_PATH}${cleanPath}`
}

/**
 * 현재 페이지의 경로를 리다이렉트 파라미터로 인코딩합니다.
 */
export function encodeRedirectParam(path: string): string {
  return encodeURIComponent(validateRedirectUrl(path))
}

/**
 * 리다이렉트 파라미터를 디코딩하고 검증합니다.
 */
export function decodeRedirectParam(encoded: string | null | undefined): string {
  if (!encoded) return '/'

  try {
    const decoded = decodeURIComponent(encoded)
    return validateRedirectUrl(decoded)
  } catch {
    return '/'
  }
}
