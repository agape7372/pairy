'use client'

import { Suspense, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { validateRedirectUrl, getFullUrl } from '@/lib/utils/url'
import { parseError, logError } from '@/lib/utils/error'
import { ensureProfile } from '@/lib/auth/profile'
import {
  validatePassword,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  isValidEmail,
} from '@/lib/utils/validation'
import { checkRateLimit, resetRateLimit } from '@/lib/utils/safeStorage'
import type { OAuthProvider } from '@/lib/auth/identity'

type AuthMode = 'login' | 'signup'

// 폼 상태 타입
interface FormState {
  email: string
  password: string
  showPassword: boolean
}

// UI 상태 타입
interface UIState {
  mode: AuthMode
  isLoading: OAuthProvider | 'email' | null
  error: string | null
  success: string | null
  /** Rate limit 잠금 해제 시간 */
  lockedUntil?: number
  /** 남은 시도 횟수 */
  remainingAttempts?: number
}

// Rate limit 설정
const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 5 * 60 * 1000, // 5분
  lockoutMs: 15 * 60 * 1000, // 15분 잠금
}

function LoginContent() {
  const searchParams = useSearchParams()

  // URL 파라미터 안전하게 처리 (Open Redirect 방지)
  const redirectTo = validateRedirectUrl(searchParams.get('redirectTo'))
  const urlError = searchParams.get('error')

  // 폼 상태
  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    showPassword: false,
  })

  // UI 상태
  const [ui, setUI] = useState<UIState>({
    mode: 'login',
    isLoading: null,
    error: urlError ? decodeErrorParam(urlError) : null,
    success: null,
  })

  // 폼 필드 업데이트
  const updateForm = useCallback((updates: Partial<FormState>) => {
    setForm(prev => ({ ...prev, ...updates }))
  }, [])

  // UI 상태 업데이트
  const updateUI = useCallback((updates: Partial<UIState>) => {
    setUI(prev => ({ ...prev, ...updates }))
  }, [])

  // 에러 초기화
  const clearMessages = useCallback(() => {
    updateUI({ error: null, success: null })
  }, [updateUI])

  // 비밀번호 강도 계산 (회원가입 시)
  const passwordValidation = useMemo(() => {
    if (ui.mode !== 'signup' || !form.password) return null
    return validatePassword(form.password)
  }, [form.password, ui.mode])

  // Rate limit 잠금 시간 포맷
  const lockTimeRemaining = useMemo(() => {
    if (!ui.lockedUntil) return null
    const remaining = ui.lockedUntil - Date.now()
    if (remaining <= 0) return null
    const minutes = Math.ceil(remaining / 60000)
    return `${minutes}분`
  }, [ui.lockedUntil])

  // 소셜 로그인 핸들러
  const handleSocialLogin = useCallback(async (provider: OAuthProvider) => {
    if (!isSupabaseConfigured()) {
      updateUI({ error: '데모 모드에서는 소셜 로그인을 사용할 수 없어요.' })
      return
    }

    updateUI({ isLoading: provider, error: null })

    try {
      const supabase = createClient()
      const callbackUrl = getFullUrl(`/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`)

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
        },
      })

      if (error) {
        throw error
      }
      // OAuth 리다이렉트가 진행되므로 로딩 상태 유지
    } catch (err) {
      logError('SocialLogin', err)
      updateUI({
        error: parseError(err).message,
        isLoading: null,
      })
    }
  }, [redirectTo, updateUI])

  // 이메일 인증 핸들러
  const handleEmailAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()

    // 유효성 검사
    if (!form.email.trim()) {
      updateUI({ error: '이메일을 입력해주세요.' })
      return
    }

    if (!isValidEmail(form.email)) {
      updateUI({ error: '올바른 이메일 형식을 입력해주세요.' })
      return
    }

    // 회원가입 시 비밀번호 복잡성 검증
    if (ui.mode === 'signup') {
      const pwResult = validatePassword(form.password)
      if (!pwResult.isValid) {
        updateUI({ error: pwResult.error || '비밀번호가 요구사항을 충족하지 않아요.' })
        return
      }
    } else {
      // 로그인 시 최소 길이만 체크
      if (form.password.length < 6) {
        updateUI({ error: '비밀번호는 최소 6자 이상이어야 해요.' })
        return
      }
    }

    if (!isSupabaseConfigured()) {
      updateUI({ error: '데모 모드에서는 이메일 로그인을 사용할 수 없어요.' })
      return
    }

    // Rate limit 확인 (로그인 시에만)
    if (ui.mode === 'login') {
      const rateLimit = checkRateLimit('login', LOGIN_RATE_LIMIT)
      if (!rateLimit.allowed) {
        updateUI({
          error: '로그인 시도가 너무 많아요. 잠시 후 다시 시도해주세요.',
          lockedUntil: rateLimit.lockedUntil,
          remainingAttempts: 0,
        })
        return
      }
      updateUI({ remainingAttempts: rateLimit.remainingAttempts })
    }

    updateUI({ isLoading: 'email' })

    try {
      const supabase = createClient()

      if (ui.mode === 'signup') {
        // 회원가입
        const callbackUrl = getFullUrl(`/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`)
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: callbackUrl,
          },
        })

        if (error) throw error

        if (data.user && !data.user.confirmed_at) {
          updateUI({
            success: '이메일을 확인해주세요! 인증 링크를 보냈어요. 📬',
            isLoading: null,
          })
        } else if (data.user) {
          // 이메일 인증이 필요 없는 경우 프로필 생성 후 리다이렉트
          await ensureProfile(supabase, data.user)
          // [FIXED: 전체 페이지 새로고침으로 세션 동기화]
          window.location.href = getFullUrl(redirectTo)
        }
      } else {
        // 로그인
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })

        if (error) throw error

        // 로그인 성공 시 rate limit 초기화
        resetRateLimit('login')

        // [FIXED: router.push() 대신 window.location.href 사용]
        // router.push()는 클라이언트 사이드 네비게이션으로 React 상태가 유지됨
        // 이로 인해 새 페이지의 useUser()가 세션을 감지하기 전에 렌더링될 수 있음
        // window.location.href는 전체 페이지 새로고침을 강제하여
        // 새 페이지에서 깨끗한 상태로 세션을 로드함
        window.location.href = getFullUrl(redirectTo)
      }
    } catch (err) {
      logError('EmailAuth', err)
      updateUI({
        error: parseError(err).message,
        isLoading: null,
      })
    }
  }, [form, ui.mode, redirectTo, clearMessages, updateUI])

  // 모드 전환
  const toggleMode = useCallback(() => {
    clearMessages()
    updateUI({ mode: ui.mode === 'login' ? 'signup' : 'login' })
  }, [ui.mode, clearMessages, updateUI])

  const isDisabled = ui.isLoading !== null

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105">
            <span className="text-3xl font-bold">
              <span className="text-primary-400">Pair</span>
              <span className="text-accent-400">y</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {ui.mode === 'login' ? '다시 만나서 반가워요!' : '시작하기'}
          </h1>
          <p className="text-gray-500">
            소셜 계정으로 간편하게 시작해요
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[24px] border border-gray-200 p-8 shadow-sm">
          {/* Error Message */}
          {ui.error && (
            <div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-3 animate-shake"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{ui.error}</span>
            </div>
          )}

          {/* Success Message */}
          {ui.success && (
            <div
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 flex items-start gap-3 animate-fade-in"
              role="status"
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{ui.success}</span>
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="space-y-3">
            {/* Google */}
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={isDisabled}
              aria-label="Google 계정으로 로그인"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-full font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
            >
              {ui.isLoading === 'google' ? (
                <LoadingSpinner />
              ) : (
                <GoogleIcon />
              )}
              <span>Google로 계속하기</span>
            </button>

            {/* Twitter/X */}
            <button
              onClick={() => handleSocialLogin('twitter')}
              disabled={isDisabled}
              aria-label="X 계정으로 로그인"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              {ui.isLoading === 'twitter' ? (
                <LoadingSpinner />
              ) : (
                <XIcon />
              )}
              <span>X로 계속하기</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-400">또는</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4" noValidate>
            {/* Email Input */}
            <div className="relative">
              <label htmlFor="email" className="sr-only">이메일</label>
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                placeholder="이메일"
                required
                autoComplete="email"
                disabled={isDisabled}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">비밀번호</label>
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="password"
                type={form.showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => updateForm({ password: e.target.value })}
                placeholder={ui.mode === 'signup' ? '비밀번호 (8자 이상, 대소문자+숫자)' : '비밀번호'}
                required
                minLength={ui.mode === 'signup' ? 8 : 6}
                autoComplete={ui.mode === 'login' ? 'current-password' : 'new-password'}
                disabled={isDisabled}
                className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => updateForm({ showPassword: !form.showPassword })}
                disabled={isDisabled}
                aria-label={form.showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {form.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Indicator (회원가입 시) */}
            <AnimatePresence mode="wait">
              {ui.mode === 'signup' && passwordValidation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ backgroundColor: getPasswordStrengthColor(passwordValidation.level) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordValidation.strength}%` }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium min-w-[40px]"
                      style={{ color: getPasswordStrengthColor(passwordValidation.level) }}
                    >
                      {getPasswordStrengthLabel(passwordValidation.level)}
                    </span>
                  </div>
                  {/* 체크리스트 */}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                    <span className={passwordValidation.checks.minLength ? 'text-green-600' : 'text-gray-400'}>
                      ✓ 8자 이상
                    </span>
                    <span className={passwordValidation.checks.hasUppercase ? 'text-green-600' : 'text-gray-400'}>
                      ✓ 대문자
                    </span>
                    <span className={passwordValidation.checks.hasLowercase ? 'text-green-600' : 'text-gray-400'}>
                      ✓ 소문자
                    </span>
                    <span className={passwordValidation.checks.hasNumber ? 'text-green-600' : 'text-gray-400'}>
                      ✓ 숫자
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rate Limit Warning */}
            <AnimatePresence>
              {lockTimeRemaining && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700"
                >
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{lockTimeRemaining} 후에 다시 시도해주세요</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forgot Password Link (로그인 모드에서만) */}
            {ui.mode === 'login' && (
              <div className="text-right">
                <Link
                  href={`/reset-password?email=${encodeURIComponent(form.email)}`}
                  className="text-sm text-primary-400 hover:text-primary-500 hover:underline transition-colors"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isDisabled}
              className="w-full"
            >
              {ui.isLoading === 'email' ? (
                <LoadingSpinner />
              ) : ui.mode === 'login' ? (
                '로그인'
              ) : (
                '회원가입'
              )}
            </Button>

            {/* Toggle Mode */}
            <div className="text-center text-sm text-gray-500">
              {ui.mode === 'login' ? (
                <>
                  계정이 없으신가요?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    disabled={isDisabled}
                    className="text-primary-400 hover:text-primary-500 hover:underline font-medium transition-colors disabled:cursor-not-allowed"
                  >
                    회원가입
                  </button>
                </>
              ) : (
                <>
                  이미 계정이 있으신가요?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    disabled={isDisabled}
                    className="text-primary-400 hover:text-primary-500 hover:underline font-medium transition-colors disabled:cursor-not-allowed"
                  >
                    로그인
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-400">또는</span>
            </div>
          </div>

          {/* Guest Continue */}
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/templates">로그인 없이 둘러보기</Link>
          </Button>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-gray-400 mt-6">
          계속하면 Pairy의{' '}
          <Link href="/terms" className="text-primary-400 hover:underline">
            이용약관
          </Link>
          {' '}및{' '}
          <Link href="/privacy" className="text-primary-400 hover:underline">
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  )
}

// 로딩 스켈레톤
function LoginFallback() {
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
          <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse mx-auto mb-2" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
        <div className="bg-white rounded-[24px] border border-gray-200 p-8 shadow-sm">
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-12 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}

// 유틸리티 함수들
function decodeErrorParam(error: string): string {
  const errorMessages: Record<string, string> = {
    auth_failed: '인증에 실패했어요. 다시 시도해주세요.',
    session_failed: '세션 설정에 실패했어요.',
    no_auth: '인증 정보가 없어요. 다시 로그인해주세요.',
    access_denied: '접근이 거부되었어요.',
  }
  return errorMessages[error] || '오류가 발생했어요. 다시 시도해주세요.'
}

// 아이콘 컴포넌트들
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

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
