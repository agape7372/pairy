// 배포 경로 프리픽스.
// GitHub Pages 시절 '/pairy' 였으나 Vercel 이전(DL-0001)으로 기본값 '' (루트 서빙).
// 하위 경로 배포가 다시 필요하면 NEXT_PUBLIC_BASE_PATH 로 지정.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

// 서버 측 사이트 origin 결정: 명시 env > Vercel 프로덕션 도메인(자동 주입) > 로컬.
const serverOrigin =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

// 전체 사이트 URL.
// 클라이언트: 현재 origin. 서버(SSR/메타데이터): 위 serverOrigin.
export const SITE_URL = typeof window !== 'undefined'
  ? `${window.location.origin}${BASE_PATH}`
  : `${serverOrigin}${BASE_PATH}`

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
  return `${SITE_URL}${cleanPath}`
}
