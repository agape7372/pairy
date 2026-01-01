'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('로그인 처리 중...')

  useEffect(() => {
    const handleAuth = async () => {
      const redirectTo = searchParams.get('redirectTo') || '/'
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      console.log('[Auth Callback] Starting...', { redirectTo, basePath, error })

      // URL에 에러가 있는 경우
      if (error) {
        console.error('[Auth Callback] OAuth error:', error, errorDescription)
        setStatus('error')
        setMessage(errorDescription || error || '인증 오류가 발생했습니다.')
        setTimeout(() => {
          window.location.href = `${basePath}/login?error=${error}`
        }, 2000)
        return
      }

      if (!isSupabaseConfigured()) {
        console.log('[Auth Callback] Demo mode')
        window.location.href = `${basePath}/`
        return
      }

      try {
        const supabase = createClient()

        // Supabase가 detectSessionInUrl로 자동 처리하므로 세션만 확인
        // 약간의 지연을 두고 세션 확인 (자동 처리 시간 확보)
        await new Promise(resolve => setTimeout(resolve, 500))

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        console.log('[Auth Callback] Session check:', session?.user?.email || 'no session', sessionError?.message)

        if (session) {
          // 프로필 확인/생성 (비동기, 기다리지 않음)
          ensureProfile(supabase, session.user)

          setStatus('success')
          setMessage('로그인 완료!')

          const finalUrl = redirectTo.startsWith('/') ? `${basePath}${redirectTo}` : redirectTo
          console.log('[Auth Callback] Redirecting to:', finalUrl)

          setTimeout(() => {
            window.location.href = finalUrl
          }, 300)
        } else {
          // 세션이 없으면 수동으로 코드 교환 시도
          const code = searchParams.get('code')
          if (code) {
            console.log('[Auth Callback] No session, trying manual exchange...')
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
              throw exchangeError
            }

            if (data.session) {
              ensureProfile(supabase, data.session.user)
              setStatus('success')
              setMessage('로그인 완료!')

              const finalUrl = redirectTo.startsWith('/') ? `${basePath}${redirectTo}` : redirectTo
              setTimeout(() => {
                window.location.href = finalUrl
              }, 300)
              return
            }
          }

          throw new Error('세션을 가져올 수 없습니다.')
        }
      } catch (err: any) {
        console.error('[Auth Callback] Error:', err)
        setStatus('error')
        setMessage(err.message || '인증에 실패했습니다.')

        setTimeout(() => {
          window.location.href = `${basePath}/login?error=auth_failed`
        }, 2000)
      }
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
