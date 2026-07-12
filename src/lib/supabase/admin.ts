import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * service_role 관리자 클라이언트 — 서버 전용(Route Handler).
 * RLS 를 우회하므로 절대 클라이언트 번들에 포함되면 안 된다(NEXT_PUBLIC_ 아님).
 * 결제 확정처럼 "서버만 수행하는 부여"에만 사용.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('[admin] SUPABASE_SERVICE_ROLE_KEY / URL 누락 — 서버 결제 처리 불가')
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
