'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

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
    processedRef.current = true

    const handleCallback = async () => {
      const code = searchParams.get('code')
      const redirectTo = searchParams.get('redirectTo') || '/'
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

      console.log('[Auth Callback] Step 1: Starting...', {
        code: code ? 'exists' : 'missing',
        redirectTo,
        basePath,
        supabaseConfigured: isSupabaseConfigured()
      })

      // Supabase가 설정되지 않은 경우
      if (!isSupabaseConfigured()) {
        console.log('[Auth Callback] Supabase not configured')
        redirectWithDelay(`${basePath}/`, '데모 모드입니다.')
        return
      }

      // 코드가 없으면 에러
      if (!code) {
        console.error('[Auth Callback] No code provided')
        redirectWithDelay(`${basePath}/login?error=no_code`, '인증 코드가 없습니다.')
        return
      }

      const supabase = createClient()

      try {
        // Step 2: 세션 교환 시도
        console.log('[Auth Callback] Step 2: Calling exchangeCodeForSession...')

        const exchangeResult = await Promise.race([
          supabase.auth.exchangeCodeForSession(code),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Session exchange timeout (10s)')), 10000)
          )
        ]) as { data: any; error: any }

        console.log('[Auth Callback] Step 3: Exchange result received')

        if (exchangeResult.error) {
          console.error('[Auth Callback] Exchange error:', exchangeResult.error.message)

          // 코드가 이미 사용됐을 수 있음 - 세션 확인
          console.log('[Auth Callback] Step 3b: Checking existing session...')
          const { data: { session } } = await supabase.auth.getSession()

          if (session) {
            console.log('[Auth Callback] Step 3c: Found existing session for:', session.user?.email)
            doRedirect(basePath, redirectTo)
            return
          }

          throw exchangeResult.error
        }

        const { data } = exchangeResult
        console.log('[Auth Callback] Step 4: Session obtained for:', data.user?.email)

        // Step 5: 프로필 처리 (비동기로 처리하고 기다리지 않음)
        if (data.user) {
          console.log('[Auth Callback] Step 5: Starting profile check (non-blocking)...')
          handleProfileCreation(supabase, data.user).catch(err => {
            console.error('[Auth Callback] Profile error (non-blocking):', err)
          })
        }

        // Step 6: 즉시 리다이렉트
        console.log('[Auth Callback] Step 6: Redirecting...')
        doRedirect(basePath, redirectTo)

      } catch (err: any) {
        console.error('[Auth Callback] Error:', err)
        redirectWithDelay(`${basePath}/login?error=auth_failed`, err.message || '인증에 실패했습니다.')
      }
    }

    // 리다이렉트 헬퍼 함수
    const doRedirect = (basePath: string, redirectTo: string) => {
      setStatus('success')
      setMessage('로그인 완료! 이동 중...')

      const finalUrl = redirectTo.startsWith('/')
        ? `${basePath}${redirectTo}`
        : redirectTo

      console.log('[Auth Callback] Final redirect to:', finalUrl)

      // 즉시 리다이렉트 시도
      window.location.replace(finalUrl)
    }

    const redirectWithDelay = (url: string, msg: string) => {
      setStatus('error')
      setMessage(msg)
      setTimeout(() => {
        window.location.replace(url)
      }, 2000)
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
        {status === 'loading' && (
          <p className="text-xs text-gray-400 mt-2">잠시만 기다려주세요...</p>
        )}
      </div>
    </div>
  )
}

// 프로필 생성 (별도 함수로 분리)
async function handleProfileCreation(supabase: any, user: any) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
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
      } else {
        console.log('[Auth Callback] Profile created successfully')
      }
    } else if (profile) {
      console.log('[Auth Callback] Profile already exists')
    }
  } catch (err) {
    console.error('[Auth Callback] Profile creation error:', err)
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
