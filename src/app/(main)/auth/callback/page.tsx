'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { getFullUrl } from '@/lib/constants'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('로그인 처리 중...')

  useEffect(() => {
    const handleAuth = async () => {
      // 전체 URL 로깅 (디버깅용)
      console.log('[Auth Callback] Full URL:', window.location.href)
      console.log('[Auth Callback] Hash:', window.location.hash)
      console.log('[Auth Callback] Search:', window.location.search)

      const redirectTo = searchParams.get('redirectTo') || '/'
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      const code = searchParams.get('code')

      // Hash fragment에서도 파라미터 파싱 (Supabase가 #access_token=...으로 반환할 수 있음)
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
      const hashAccessToken = hashParams.get('access_token')
      const hashRefreshToken = hashParams.get('refresh_token')
      const hashError = hashParams.get('error')
      const hashErrorDescription = hashParams.get('error_description')

      console.log('[Auth Callback] Params:', {
        hasCode: !!code,
        hasHashToken: !!hashAccessToken,
        redirectTo,
        error: error || hashError,
      })

      // URL에 에러가 있는 경우 (query params 또는 hash)
      const authError = error || hashError
      const authErrorDescription = errorDescription || hashErrorDescription
      if (authError) {
        console.error('[Auth Callback] OAuth error:', authError, authErrorDescription)
        setStatus('error')
        setMessage(authErrorDescription || authError || '인증 오류가 발생했습니다.')
        setTimeout(() => {
          window.location.href = getFullUrl(`/login?error=${authError}`)
        }, 2000)
        return
      }

      if (!isSupabaseConfigured()) {
        console.log('[Auth Callback] Demo mode - redirecting to home')
        window.location.href = getFullUrl('/')
        return
      }

      const supabase = createClient()

      // Case 1: Hash fragment에 토큰이 있는 경우 (implicit-like flow)
      if (hashAccessToken && hashRefreshToken) {
        console.log('[Auth Callback] Found tokens in hash fragment')
        try {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken,
          })

          if (setSessionError) {
            throw setSessionError
          }

          if (data.session) {
            console.log('[Auth Callback] Session set from hash:', data.session.user?.email)
            ensureProfile(supabase, data.session.user)
            redirectToDestination(redirectTo, data.session.user)
            return
          }
        } catch (err: any) {
          console.error('[Auth Callback] Set session error:', err)
          setStatus('error')
          setMessage(err.message || '세션 설정에 실패했습니다.')
          setTimeout(() => {
            window.location.href = getFullUrl('/login?error=session_failed')
          }, 2000)
          return
        }
      }

      // Case 2: Query params에 code가 있는 경우 (PKCE flow)
      if (code) {
        console.log('[Auth Callback] Found code in query params, exchanging...')
        try {
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
          ensureProfile(supabase, data.session.user)
          redirectToDestination(redirectTo, data.session.user)
          return

        } catch (err: any) {
          console.error('[Auth Callback] Code exchange error:', err)
          setStatus('error')
          setMessage(err.message || '인증에 실패했습니다.')
          setTimeout(() => {
            window.location.href = getFullUrl('/login?error=auth_failed')
          }, 2000)
          return
        }
      }

      // Case 3: 이미 세션이 있는지 확인
      console.log('[Auth Callback] No code or token, checking existing session...')
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('[Auth Callback] Found existing session:', session.user?.email)
        redirectToDestination(redirectTo, session.user)
        return
      }

      // 아무것도 없는 경우
      console.error('[Auth Callback] No code, token, or session found')
      setStatus('error')
      setMessage('인증 정보가 없습니다. 다시 로그인해주세요.')
      setTimeout(() => {
        window.location.href = getFullUrl('/login?error=no_auth')
      }, 2000)
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
