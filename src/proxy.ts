import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

// Next.js 16 proxy(구 middleware) — Supabase 세션 리프레시.
// H-01: 브라우저 세션을 쿠키로 통일(client.ts createBrowserClient)했으므로, 매 요청마다
// 서버에서 세션을 갱신해 만료 토큰을 재발급하고 갱신된 쿠키를 응답에 실어야 한다.
// 이게 없으면 토큰 만료 후 서버 Route Handler 가 로그인 사용자를 인식 못 함(2차 감사 H-01 · DL-0006).
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let response = NextResponse.next({ request })

  // 데모 모드(env 미설정)에서는 세션 리프레시 대상이 없음 → 통과.
  if (!url || !key) return response

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // 중요: createServerClient 와 getUser() 사이에 로직을 넣지 말 것(세션 동기화 깨짐).
  // getUser() 가 필요 시 토큰을 갱신하고 setAll 로 갱신 쿠키를 response 에 기록한다.
  await supabase.auth.getUser()

  return response
}

export const config = {
  // 정적 자산·이미지 제외. API 라우트는 포함(결제 confirm 등이 갱신 세션 쿠키를 받아야 함).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
