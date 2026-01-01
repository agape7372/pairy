'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const redirectTo = searchParams.get('redirectTo') || '/'

      console.log('[Auth Callback] Starting with code:', code ? 'exists' : 'missing')
      console.log('[Auth Callback] Redirect to:', redirectTo)

      if (!code) {
        console.error('[Auth Callback] No code found')
        setError('인증 코드가 없습니다.')
        setTimeout(() => router.push('/login?error=no_code'), 2000)
        return
      }

      try {
        const supabase = createClient()

        // 1. Exchange code for session
        console.log('[Auth Callback] Exchanging code for session...')
        let sessionData, sessionError
        try {
          const result = await supabase.auth.exchangeCodeForSession(code)
          sessionData = result.data
          sessionError = result.error
          console.log('[Auth Callback] Exchange complete, error:', sessionError?.message || 'none')
        } catch (e) {
          console.error('[Auth Callback] Exchange threw:', e)
          throw e
        }

        if (sessionError) {
          console.error('[Auth Callback] Session exchange error:', sessionError)
          throw sessionError
        }

        console.log('[Auth Callback] Session obtained successfully')

        // 2. Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error('[Auth Callback] Get user error:', userError)
          throw userError || new Error('User not found')
        }

        console.log('[Auth Callback] User:', user.email)

        // 3. Check/create profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 = no rows returned (profile doesn't exist)
          console.error('[Auth Callback] Profile fetch error:', profileError)
        }

        if (!profile) {
          console.log('[Auth Callback] Creating new profile...')
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            username: user.email?.split('@')[0] || null,
            display_name: user.user_metadata?.full_name || user.user_metadata?.name || '새로운 사용자',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            role: 'user',
          })

          if (insertError) {
            console.error('[Auth Callback] Profile insert error:', insertError)
            // Don't throw - user can still proceed without profile
          } else {
            console.log('[Auth Callback] Profile created successfully')
          }
        }

        // 4. Redirect - window.location 사용 (router.push가 정적 사이트에서 불안정)
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
        const finalRedirect = redirectTo.startsWith('/') ? `${basePath}${redirectTo}` : redirectTo
        console.log('[Auth Callback] Redirecting to:', finalRedirect)
        window.location.href = finalRedirect

      } catch (err) {
        console.error('[Auth Callback] Error:', err)
        setError('인증에 실패했습니다.')
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
        setTimeout(() => {
          window.location.href = `${basePath}/login?error=auth_failed`
        }, 2000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFD9D9] to-[#D7FAFA]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-gray-500 text-sm">로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFD9D9] to-[#D7FAFA]">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FFD9D9] border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFD9D9] to-[#D7FAFA]">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FFD9D9] border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">로딩 중...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
