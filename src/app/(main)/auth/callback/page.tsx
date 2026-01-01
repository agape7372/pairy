'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { BASE_PATH, getFullUrl } from '@/lib/constants'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('로그인 처리 중...')

  useEffect(() => {
    const handleAuth = async () => {
      const redirectTo = searchParams.get('redirectTo') || '/'
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      const code = searchParams.get('code')

      console.log('[Auth Callback] Starting...', {
        hasCode: !!code,
        redirectTo,
        error,
        BASE_PATH
      })

      // URL에 에러가 있는 경우
      if (error) {
        console.error('[Auth Callback] OAuth error:', error, errorDescription)
        setStatus('error')
        setMessage(errorDescription || error || '인증 오류가 발생했습니다.')
        setTimeout(() => {
          window.location.href = getFullUrl(`/login?error=${error}`)
        }, 2000)
        return
      }

      if (!isSupabaseConfigured()) {
        console.log('[Auth Callback] Demo mode - redirecting to home')
        window.location.href = getFullUrl('/')
        return
      }

      if (!code) {
        console.error('[Auth Callback] No code provided')
        setStatus('error')
        setMessage('인증 코드가 없습니다.')
        setTimeout(() => {
          window.location.href = getFullUrl('/login?error=no_code')
        }, 2000)
        return
      }

      try {
        const supabase = createClient()

        // 코드를 세션으로 교환
        console.log('[Auth Callback] Exchanging code for session...')
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('[Auth Callback] Exchange error:', exchangeError.message)

          // 이미 교환된 코드일 수 있음 - 세션 확인
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            console.log('[Auth Callback] Found existing session:', session.user?.email)
            redirectToDestination(redirectTo, session.user)
            return
          }

          throw exchangeError
        }

        if (!data.session) {
          throw new Error('세션을 가져올 수 없습니다.')
        }

        console.log('[Auth Callback] Session obtained:', data.session.user?.email)

        // 프로필 확인/생성 (비동기, 기다리지 않음)
        ensureProfile(supabase, data.session.user)

        // 리다이렉트
        redirectToDestination(redirectTo, data.session.user)

      } catch (err: any) {
        console.error('[Auth Callback] Error:', err)
        setStatus('error')
        setMessage(err.message || '인증에 실패했습니다.')

        setTimeout(() => {
          window.location.href = getFullUrl('/login?error=auth_failed')
        }, 2000)
      }
    }

    // 리다이렉트 실행
    const redirectToDestination = (redirectTo: string, user: any) => {
      setStatus('success')
      setMessage(`환영합니다, ${user?.user_metadata?.name || user?.email?.split('@')[0] || '사용자'}님!`)

      // redirectTo가 상대경로면 basePath 추가
      let finalUrl: string
      if (redirectTo.startsWith('http')) {
        finalUrl = redirectTo
      } else if (redirectTo.startsWith('/')) {
        // /로 시작하는 상대경로 → 전체 URL로 변환
        finalUrl = getFullUrl(redirectTo)
      } else {
        finalUrl = getFullUrl('/')
      }

      console.log('[Auth Callback] Redirecting to:', finalUrl)

      setTimeout(() => {
        window.location.href = finalUrl
      }, 500)
    }

    handleAuth()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFD9D9] to-[#D7FAFA]">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-sm">
        {status === 'loading' && (
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FFD9D9] border-t-transparent mx-auto mb-4" />
        )}
        {status === 'success' && (
          <div className="text-4xl mb-4 text-green-500">✓</div>
        )}
        {status === 'error' && (
          <div className="text-4xl mb-4">⚠️</div>
        )}
        <p className={status === 'error' ? 'text-red-500' : 'text-gray-600'}>
          {message}
        </p>
      </div>
    </div>
  )
}

// 프로필 확인/생성 함수
async function ensureProfile(supabase: any, user: any) {
  if (!user) return

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      console.log('[Auth Callback] Creating profile for:', user.email)
      await supabase.from('profiles').insert({
        id: user.id,
        username: user.email?.split('@')[0] || null,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || '새로운 사용자',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        role: 'user',
      })
    }
  } catch (err) {
    console.error('[Auth Callback] Profile error:', err)
  }
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFD9D9] to-[#D7FAFA]">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FFD9D9] border-t-transparent mx-auto mb-4" />
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
