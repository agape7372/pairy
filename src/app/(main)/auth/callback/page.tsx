'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { validateRedirectUrl, getFullUrl } from '@/lib/utils/url'
import { logError } from '@/lib/utils/error'
import { ensureProfile } from '@/lib/auth/profile'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

type CallbackStatus = 'loading' | 'success' | 'error'
type CallbackType = 'login' | 'link' | 'signup'

interface CallbackState {
  status: CallbackStatus
  message: string
  userName?: string
}

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: '로그인 처리 중...',
  })

  useEffect(() => {
    handleAuthCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAuthCallback = async () => {
    // URL 파라미터 안전하게 처리 (Open Redirect 방지)
    const redirectTo = validateRedirectUrl(searchParams.get('redirectTo'))
    const callbackType = (searchParams.get('type') || 'login') as CallbackType
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const code = searchParams.get('code')

    // Hash fragment에서도 파라미터 파싱
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
    const hashAccessToken = hashParams.get('access_token')
    const hashRefreshToken = hashParams.get('refresh_token')
    const hashError = hashParams.get('error')
    const hashErrorDescription = hashParams.get('error_description')

    // URL에 에러가 있는 경우
    const authError = error || hashError
    const authErrorDescription = errorDescription || hashErrorDescription

    if (authError) {
      logError('AuthCallback', new Error(authErrorDescription || authError))
      handleError(getLocalizedErrorMessage(authError))
      return
    }

    if (!isSupabaseConfigured()) {
      redirectToDestination('/', null, callbackType)
      return
    }

    const supabase = createClient()

    try {
      // Case 1: Hash fragment에 토큰이 있는 경우
      if (hashAccessToken && hashRefreshToken) {
        await handleHashTokens(supabase, hashAccessToken, hashRefreshToken, redirectTo, callbackType)
        return
      }

      // Case 2: Query params에 code가 있는 경우 (PKCE flow)
      if (code) {
        await handleCodeExchange(supabase, code, redirectTo, callbackType)
        return
      }

      // Case 3: 이미 세션이 있는지 확인
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await handleExistingSession(supabase, session.user, redirectTo, callbackType)
        return
      }

      // 아무것도 없는 경우
      handleError('인증 정보가 없어요. 다시 로그인해주세요.')
    } catch (err) {
      logError('AuthCallback', err)
      handleError('인증 처리 중 오류가 발생했어요.')
    }
  }

  // Hash fragment 토큰 처리
  const handleHashTokens = async (
    supabase: SupabaseClient<Database>,
    accessToken: string,
    refreshToken: string,
    redirectTo: string,
    callbackType: CallbackType
  ) => {
    const { data, error: setSessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (setSessionError) {
      throw setSessionError
    }

    if (data.session) {
      await ensureProfile(supabase, data.session.user)
      redirectToDestination(redirectTo, data.session.user, callbackType)
    } else {
      throw new Error('세션을 설정할 수 없어요.')
    }
  }

  // PKCE 코드 교환 처리
  const handleCodeExchange = async (
    supabase: SupabaseClient<Database>,
    code: string,
    redirectTo: string,
    callbackType: CallbackType
  ) => {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      // 이미 교환된 코드일 수 있음 - 세션 확인
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        redirectToDestination(redirectTo, session.user, callbackType)
        return
      }
      throw exchangeError
    }

    if (!data.session) {
      throw new Error('세션을 가져올 수 없어요.')
    }

    await ensureProfile(supabase, data.session.user)
    redirectToDestination(redirectTo, data.session.user, callbackType)
  }

  // 기존 세션 처리
  const handleExistingSession = async (
    supabase: SupabaseClient<Database>,
    user: User,
    redirectTo: string,
    callbackType: CallbackType
  ) => {
    await ensureProfile(supabase, user)
    redirectToDestination(redirectTo, user, callbackType)
  }

  // 에러 처리
  const handleError = (message: string) => {
    setState({ status: 'error', message })
    setTimeout(() => {
      window.location.href = getFullUrl('/login?error=auth_failed')
    }, 2500)
  }

  // 리다이렉트 실행
  const redirectToDestination = (redirectTo: string, user: User | null, callbackType: CallbackType) => {
    const userName = user?.user_metadata?.name ||
                     user?.user_metadata?.full_name ||
                     user?.email?.split('@')[0] ||
                     '사용자'

    let message = `환영합니다, ${userName}님!`
    if (callbackType === 'link') {
      message = '계정이 성공적으로 연결되었어요!'
    } else if (callbackType === 'signup') {
      message = `가입을 환영해요, ${userName}님!`
    }

    setState({
      status: 'success',
      message,
      userName,
    })

    // 안전한 리다이렉트 URL 생성
    const finalUrl = getFullUrl(redirectTo)

    setTimeout(() => {
      window.location.href = finalUrl
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 to-accent-100">
      <div className="text-center p-8 bg-white rounded-[24px] shadow-lg max-w-sm w-full mx-4 animate-fade-in">
        {/* Loading State */}
        {state.status === 'loading' && (
          <div className="animate-fade-in">
            <Loader2 className="w-12 h-12 text-primary-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 font-medium">{state.message}</p>
          </div>
        )}

        {/* Success State */}
        {state.status === 'success' && (
          <div className="animate-scale-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gray-900 font-bold text-lg mb-2">{state.message}</p>
            <p className="text-gray-400 text-sm">잠시 후 이동합니다...</p>
          </div>
        )}

        {/* Error State */}
        {state.status === 'error' && (
          <div className="animate-shake">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 font-medium mb-2">{state.message}</p>
            <p className="text-gray-400 text-sm">로그인 페이지로 이동합니다...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// 에러 코드를 사용자 친화적 메시지로 변환
function getLocalizedErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    access_denied: '접근이 거부되었어요. 권한을 확인해주세요.',
    server_error: '서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
    temporarily_unavailable: '일시적으로 서비스를 사용할 수 없어요.',
    invalid_request: '잘못된 요청이에요.',
    unauthorized_client: '인증되지 않은 클라이언트에요.',
    unsupported_response_type: '지원하지 않는 응답 유형이에요.',
    invalid_scope: '잘못된 권한 범위에요.',
    consent_required: '사용자 동의가 필요해요.',
    login_required: '로그인이 필요해요.',
  }

  return errorMessages[errorCode] || '인증 중 오류가 발생했어요.'
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 to-accent-100">
      <div className="text-center p-8 bg-white rounded-[24px] shadow-lg">
        <Loader2 className="w-12 h-12 text-primary-400 mx-auto mb-4 animate-spin" />
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
