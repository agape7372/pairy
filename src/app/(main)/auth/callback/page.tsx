'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('로그인 처리 중...')
  const processedRef = useRef(false)

  useEffect(() => {
    // 이미 처리했으면 무시 (React Strict Mode 대응)
    if (processedRef.current) {
      console.log('[Auth Callback] Already processed, skipping')
      return
    }

    const handleCallback = async () => {
      const code = searchParams.get('code')
      const redirectTo = searchParams.get('redirectTo') || '/'
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

      console.log('[Auth Callback] Starting...', { code: code ? 'exists' : 'missing', redirectTo })

      // 코드가 없으면 에러
      if (!code) {
        console.error('[Auth Callback] No code provided')
        setStatus('error')
        setMessage('인증 코드가 없습니다.')
        setTimeout(() => {
          window.location.href = `${basePath}/login?error=no_code`
        }, 2000)
        return
      }

      processedRef.current = true
      const supabase = createClient()

      try {
        // 먼저 이미 세션이 있는지 확인
        const { data: { session: existingSession } } = await supabase.auth.getSession()

        if (existingSession) {
          console.log('[Auth Callback] Session already exists, redirecting...')
          setStatus('success')
          setMessage('로그인 완료! 이동 중...')
          const finalUrl = redirectTo.startsWith('/') ? `${basePath}${redirectTo}` : redirectTo
          window.location.href = finalUrl
          return
        }

        // 세션이 없으면 코드로 교환
        console.log('[Auth Callback] Exchanging code for session...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error('[Auth Callback] Exchange error:', error.message)
          // 이미 사용된 코드일 수 있음 - 세션 다시 확인
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          if (retrySession) {
            console.log('[Auth Callback] Session found on retry, redirecting...')
            setStatus('success')
            setMessage('로그인 완료! 이동 중...')
            const finalUrl = redirectTo.startsWith('/') ? `${basePath}${redirectTo}` : redirectTo
            window.location.href = finalUrl
            return
          }
          throw error
        }

        console.log('[Auth Callback] Session obtained for:', data.user?.email)

        // 프로필 확인/생성
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single()

          if (!profile) {
            console.log('[Auth Callback] Creating profile...')
            await supabase.from('profiles').insert({
              id: data.user.id,
              username: data.user.email?.split('@')[0] || null,
              display_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '새로운 사용자',
              avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
              role: 'user',
            }).then(res => {
              if (res.error) console.error('[Auth Callback] Profile creation error:', res.error)
              else console.log('[Auth Callback] Profile created')
            })
          }
        }

        // 리다이렉트
        setStatus('success')
        setMessage('로그인 완료! 이동 중...')
        const finalUrl = redirectTo.startsWith('/') ? `${basePath}${redirectTo}` : redirectTo
        console.log('[Auth Callback] Redirecting to:', finalUrl)

        // 약간의 딜레이 후 리다이렉트 (상태 업데이트가 보이도록)
        setTimeout(() => {
          window.location.href = finalUrl
        }, 500)

      } catch (err: any) {
        console.error('[Auth Callback] Error:', err)
        setStatus('error')
        setMessage(err.message || '인증에 실패했습니다.')
        setTimeout(() => {
          window.location.href = `${basePath}/login?error=auth_failed`
        }, 2000)
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFD9D9] to-[#D7FAFA]">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-sm">
        {status === 'loading' && (
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FFD9D9] border-t-transparent mx-auto mb-4" />
        )}
        {status === 'success' && (
          <div className="text-4xl mb-4">✓</div>
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
