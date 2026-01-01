import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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
let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClient() {
  if (IS_DEMO_MODE) {
    // 데모 모드: 더미 클라이언트 반환 (실제 호출 시 에러 발생 방지)
    console.warn('[Pairy] 데모 모드로 실행 중입니다. Supabase 기능이 비활성화됩니다.')
    return null as unknown as ReturnType<typeof createSupabaseClient<Database>>
  }

  if (!supabaseClient) {
    supabaseClient = createSupabaseClient<Database>(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!,
      {
        auth: {
          // 정적 사이트에서 세션 지속성을 위해 localStorage 사용
          persistSession: true,
          storageKey: 'pairy-auth',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // PKCE 플로우 사용 (OAuth에 필요)
          flowType: 'pkce',
        },
      }
    )

    console.log('[Supabase] Client initialized with localStorage persistence')
  }

  return supabaseClient
}
