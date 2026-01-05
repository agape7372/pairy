'use client'

import { Suspense, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { getFullUrl } from '@/lib/utils/url'
import { parseError, logError } from '@/lib/utils/error'

// UI 상태 타입
type UIState = 'idle' | 'loading' | 'success' | 'error'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(initialEmail)
  const [state, setState] = useState<UIState>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    if (!email.trim()) {
      setState('error')
      setMessage('이메일을 입력해주세요.')
      return
    }

    if (!isValidEmail(email)) {
      setState('error')
      setMessage('올바른 이메일 형식을 입력해주세요.')
      return
    }

    if (!isSupabaseConfigured()) {
      setState('error')
      setMessage('데모 모드에서는 비밀번호 재설정을 사용할 수 없어요.')
      return
    }

    setState('loading')

    try {
      const supabase = createClient()
      const redirectUrl = getFullUrl('/update-password')

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) throw error

      setState('success')
      setMessage('비밀번호 재설정 링크를 이메일로 보냈어요! 메일함을 확인해주세요.')
    } catch (err) {
      logError('ResetPassword', err)
      setState('error')
      setMessage(parseError(err).message)
    }
  }, [email])

  const isLoading = state === 'loading'
  const isSuccess = state === 'success'

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105">
            <span className="text-3xl font-bold">
              <span className="text-primary-400">Pair</span>
              <span className="text-accent-400">y</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            비밀번호 재설정
          </h1>
          <p className="text-gray-500">
            가입한 이메일 주소를 입력하면
            <br />
            비밀번호 재설정 링크를 보내드려요
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[24px] border border-gray-200 p-8 shadow-sm">
          {/* Success State */}
          {isSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                이메일을 확인해주세요!
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {email}로 비밀번호 재설정 링크를 보냈어요.
                <br />
                이메일이 도착하지 않았다면 스팸함을 확인해주세요.
              </p>
              <div className="space-y-3">
                <Button variant="primary" className="w-full" asChild>
                  <Link href="/login">로그인으로 돌아가기</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setState('idle')
                    setMessage(null)
                  }}
                >
                  다른 이메일로 시도
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {state === 'error' && message && (
                <div
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-3 animate-shake"
                  role="alert"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{message}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Email Input */}
                <div className="relative">
                  <label htmlFor="reset-email" className="sr-only">이메일</label>
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="가입한 이메일"
                    required
                    autoComplete="email"
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    '재설정 링크 받기'
                  )}
                </Button>

                {/* Back to Login */}
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/login" className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    로그인으로 돌아가기
                  </Link>
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-gray-400 mt-6">
          도움이 필요하신가요?{' '}
          <Link href="/help" className="text-primary-400 hover:underline">
            고객센터
          </Link>
          에 문의해주세요.
        </p>
      </div>
    </div>
  )
}

// 로딩 스켈레톤
function ResetPasswordFallback() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-block mb-6">
            <span className="text-3xl font-bold">
              <span className="text-primary-400">Pair</span>
              <span className="text-accent-400">y</span>
            </span>
          </div>
          <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse mx-auto mb-2" />
          <div className="h-4 w-56 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
        <div className="bg-white rounded-[24px] border border-gray-200 p-8 shadow-sm">
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-12 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}

// 유틸리티 함수
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin w-5 h-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
