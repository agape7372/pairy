'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { BASE_PATH, getFullUrl } from '@/lib/constants'

type Provider = 'google' | 'twitter'
type AuthMode = 'login' | 'signup'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  const [mode, setMode] = useState<AuthMode>('login')
  const [isLoading, setIsLoading] = useState<Provider | 'email' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 이메일/비밀번호 폼
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSocialLogin = async (provider: Provider) => {
    setIsLoading(provider)
    setError(null)

    try {
      const supabase = createClient()
      // 명시적으로 전체 콜백 URL 생성 (GitHub Pages basePath 포함)
      const callbackUrl = getFullUrl(`/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`)

      console.log('[Login] OAuth redirect to:', callbackUrl)

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
        },
      })

      if (error) {
        throw error
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('로그인 중 오류가 발생했어요. 다시 시도해주세요.')
      setIsLoading(null)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading('email')
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      if (mode === 'signup') {
        // 회원가입
        const callbackUrl = getFullUrl(`/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl,
          },
        })

        if (error) throw error

        if (data.user && !data.user.confirmed_at) {
          setSuccess('이메일을 확인해주세요! 인증 링크를 보냈어요.')
        } else {
          // 이메일 인증이 필요 없는 경우 바로 프로필 생성
          if (data.user) {
            await supabase.from('profiles').insert({
              id: data.user.id,
              username: email.split('@')[0],
              display_name: email.split('@')[0],
              role: 'user',
            })
          }
          router.push(redirectTo)
        }
      } else {
        // 로그인
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('이메일 또는 비밀번호가 올바르지 않아요.')
          }
          throw error
        }

        router.push(redirectTo)
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || '오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold">
              <span className="text-primary-400">Pair</span>
              <span className="text-accent-400">y</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            시작하기
          </h1>
          <p className="text-gray-500">
            소셜 계정으로 간편하게 시작해요
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[24px] border border-gray-200 p-8 shadow-sm">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="space-y-3">
            {/* Google */}
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === 'google' ? (
                <LoadingSpinner />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              )}
              <span>Google로 계속하기</span>
            </button>

            {/* Twitter/X */}
            <button
              onClick={() => handleSocialLogin('twitter')}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === 'twitter' ? (
                <LoadingSpinner />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
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
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600">
                {success}
              </div>
            )}

            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                required
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
                minLength={6}
                className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading !== null}
              className="w-full"
            >
              {isLoading === 'email' ? (
                <LoadingSpinner />
              ) : mode === 'login' ? (
                '로그인'
              ) : (
                '회원가입'
              )}
            </Button>

            {/* Toggle Mode */}
            <div className="text-center text-sm text-gray-500">
              {mode === 'login' ? (
                <>
                  계정이 없으신가요?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-primary-400 hover:underline font-medium"
                  >
                    회원가입
                  </button>
                </>
              ) : (
                <>
                  이미 계정이 있으신가요?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-primary-400 hover:underline font-medium"
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

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin w-5 h-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
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
