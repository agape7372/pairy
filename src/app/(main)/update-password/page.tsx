'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { parseError, logError } from '@/lib/utils/error'

// UI 상태 타입
type UIState = 'checking' | 'ready' | 'loading' | 'success' | 'error' | 'invalid'

// 비밀번호 강도 타입
type PasswordStrength = 'weak' | 'medium' | 'strong'

interface FormState {
  password: string
  confirmPassword: string
  showPassword: boolean
  showConfirmPassword: boolean
}

function UpdatePasswordContent() {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
  })
  const [state, setState] = useState<UIState>('checking')
  const [error, setError] = useState<string | null>(null)

  // 세션 확인 (비밀번호 재설정 링크에서 온 경우)
  useEffect(() => {
    const checkSession = async () => {
      if (!isSupabaseConfigured()) {
        setState('invalid')
        return
      }

      try {
        const supabase = createClient()

        // URL의 hash fragment에서 access_token 확인 (Supabase가 리다이렉트할 때 포함)
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          // 토큰으로 세션 설정
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            logError('UpdatePassword:setSession', sessionError)
            setState('invalid')
            return
          }
        }

        // 현재 세션 확인
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          setState('invalid')
          return
        }

        setState('ready')
      } catch (err) {
        logError('UpdatePassword:checkSession', err)
        setState('invalid')
      }
    }

    checkSession()
  }, [])

  // 폼 필드 업데이트
  const updateForm = useCallback((updates: Partial<FormState>) => {
    setForm(prev => ({ ...prev, ...updates }))
  }, [])

  // 비밀번호 강도 계산
  const getPasswordStrength = useCallback((password: string): PasswordStrength => {
    if (password.length < 6) return 'weak'

    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score >= 5) return 'strong'
    if (score >= 3) return 'medium'
    return 'weak'
  }, [])

  const passwordStrength = getPasswordStrength(form.password)

  // 비밀번호 업데이트 핸들러
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 유효성 검사
    if (form.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 해요.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않아요.')
      return
    }

    if (passwordStrength === 'weak') {
      setError('더 강력한 비밀번호를 사용해주세요.')
      return
    }

    setState('loading')

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password: form.password,
      })

      if (updateError) throw updateError

      setState('success')

      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      logError('UpdatePassword', err)
      setState('ready')
      setError(parseError(err).message)
    }
  }, [form, passwordStrength, router])

  const isLoading = state === 'loading'

  // 세션 확인 중
  if (state === 'checking') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">인증 정보를 확인하고 있어요...</p>
        </div>
      </div>
    )
  }

  // 유효하지 않은 링크
  if (state === 'invalid') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
        <div className="w-full max-w-[400px] text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            링크가 만료되었어요
          </h1>
          <p className="text-gray-500 mb-6">
            비밀번호 재설정 링크가 만료되었거나 유효하지 않아요.
            <br />
            다시 시도해주세요.
          </p>
          <div className="space-y-3">
            <Button variant="primary" className="w-full" asChild>
              <Link href="/reset-password">새 링크 받기</Link>
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/login">로그인으로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 성공 상태
  if (state === 'success') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
        <div className="w-full max-w-[400px] text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center animate-bounce-once">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            비밀번호가 변경되었어요!
          </h1>
          <p className="text-gray-500 mb-6">
            새 비밀번호로 로그인할 수 있어요.
            <br />
            잠시 후 로그인 페이지로 이동합니다.
          </p>
          <Button variant="primary" className="w-full" asChild>
            <Link href="/login">지금 로그인하기</Link>
          </Button>
        </div>
      </div>
    )
  }

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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            새 비밀번호 설정
          </h1>
          <p className="text-gray-500">
            안전한 새 비밀번호를 입력해주세요
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[24px] border border-gray-200 p-8 shadow-sm">
          {/* Error Message */}
          {error && (
            <div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-3 animate-shake"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* New Password */}
            <div>
              <div className="relative">
                <label htmlFor="new-password" className="sr-only">새 비밀번호</label>
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  id="new-password"
                  type={form.showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateForm({ password: e.target.value })}
                  placeholder="새 비밀번호"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  disabled={isLoading}
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => updateForm({ showPassword: !form.showPassword })}
                  disabled={isLoading}
                  aria-label={form.showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {form.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    <div className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength === 'weak' ? 'bg-red-400' :
                      passwordStrength === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <div className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength === 'medium' ? 'bg-yellow-400' :
                      passwordStrength === 'strong' ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                    <div className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength === 'strong' ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  </div>
                  <p className={`text-xs ${
                    passwordStrength === 'weak' ? 'text-red-500' :
                    passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {passwordStrength === 'weak' && '보안 강도: 약함'}
                    {passwordStrength === 'medium' && '보안 강도: 보통'}
                    {passwordStrength === 'strong' && '보안 강도: 강함'}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label htmlFor="confirm-password" className="sr-only">비밀번호 확인</label>
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="confirm-password"
                type={form.showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => updateForm({ confirmPassword: e.target.value })}
                placeholder="비밀번호 확인"
                required
                minLength={6}
                autoComplete="new-password"
                disabled={isLoading}
                className={`w-full pl-12 pr-12 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  form.confirmPassword.length > 0 && form.password !== form.confirmPassword
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={() => updateForm({ showConfirmPassword: !form.showConfirmPassword })}
                disabled={isLoading}
                aria-label={form.showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {form.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Match Indicator */}
            {form.confirmPassword.length > 0 && (
              <p className={`text-xs ${
                form.password === form.confirmPassword ? 'text-green-600' : 'text-red-500'
              }`}>
                {form.password === form.confirmPassword ? '✓ 비밀번호가 일치해요' : '✗ 비밀번호가 일치하지 않아요'}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || form.password.length < 6 || form.password !== form.confirmPassword}
              className="w-full"
            >
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                '비밀번호 변경하기'
              )}
            </Button>
          </form>

          {/* Password Tips */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-medium text-gray-700 mb-2">안전한 비밀번호 팁:</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 최소 8자 이상 사용하기</li>
              <li>• 대문자, 소문자, 숫자 조합하기</li>
              <li>• 특수문자 포함하기 (!@#$%...)</li>
              <li>• 이전에 사용한 비밀번호 피하기</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// 로딩 스켈레톤
function UpdatePasswordFallback() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">로딩 중...</p>
      </div>
    </div>
  )
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<UpdatePasswordFallback />}>
      <UpdatePasswordContent />
    </Suspense>
  )
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
