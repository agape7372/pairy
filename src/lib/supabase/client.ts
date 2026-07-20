import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// 환경변수 체크 (빌드 타임에 정적으로 치환됨)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 데모 모드 여부 (Supabase 설정이 없으면 true)
export const IS_DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY

export function isSupabaseConfigured(): boolean {
  return !IS_DEMO_MODE
}

// 싱글톤 클라이언트 (설정된 경우에만 생성)
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (IS_DEMO_MODE) {
    console.warn('[Pairy] 데모 모드로 실행 중입니다. Supabase 기능이 비활성화됩니다.')
    return null as unknown as ReturnType<typeof createBrowserClient<Database>>
  }

  if (!supabaseClient) {
    // H-01: 세션 저장을 localStorage → 쿠키로 통일한다.
    // 기존 @supabase/supabase-js 브라우저 클라이언트는 세션을 localStorage 에 저장했고,
    // 서버 Route Handler(@supabase/ssr, server.ts)는 쿠키를 읽어 → 로그인 브라우저의
    // 서버 API 호출(결제 confirm 등)에서 getUser()==null → 401. createBrowserClient 는
    // 세션을 쿠키에 저장해 server.ts·proxy.ts 와 정본을 공유한다(2차 감사 H-01 · DL-0006).
    supabaseClient = createBrowserClient<Database>(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!,
      {
        auth: {
          // URL 의 OAuth code 자동 감지 비활성 — auth/callback 이 수동 exchangeCodeForSession 하므로
          // 자동 감지와 충돌("PKCE code verifier not found"/"code already used") 방지. (기존 동작 보존)
          detectSessionInUrl: false,
        },
      }
    )
  }

  return supabaseClient
}
