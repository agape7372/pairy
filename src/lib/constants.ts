// GitHub Pages 배포 경로
// next.config.ts의 basePath와 일치해야 함
export const BASE_PATH = '/pairy'

// 전체 사이트 URL
export const SITE_URL = typeof window !== 'undefined'
  ? `${window.location.origin}${BASE_PATH}`
  : `https://agape7372.github.io${BASE_PATH}`

// 인증 콜백 URL
export const AUTH_CALLBACK_URL = `${SITE_URL}/auth/callback`

// 경로에 basePath 추가하는 헬퍼
export function withBasePath(path: string): string {
  if (path.startsWith('http')) return path
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${BASE_PATH}${cleanPath}`
}

// 전체 URL 생성 헬퍼
export function getFullUrl(path: string): string {
  if (path.startsWith('http')) return path
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return typeof window !== 'undefined'
    ? `${window.location.origin}${BASE_PATH}${cleanPath}`
    : `https://agape7372.github.io${BASE_PATH}${cleanPath}`
}
