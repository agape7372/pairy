'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const redirectTo = searchParams.get('redirectTo') || '/'

      if (code) {
        const supabase = createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
          // Check if user profile exists, if not create one
          const { data: { user } } = await supabase.auth.getUser()

          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', user.id)
              .single()

            if (!profile) {
              // Create new profile with default role
              await supabase.from('profiles').insert({
                id: user.id,
                username: user.email?.split('@')[0] || null,
                display_name: user.user_metadata?.full_name || user.user_metadata?.name || '새로운 사용자',
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                role: 'user', // 기본 역할
              })
            }
          }

          router.push(redirectTo)
          return
        }
      }

      setError('인증에 실패했습니다.')
      setTimeout(() => {
        router.push('/login?error=auth_failed')
      }, 2000)
    }

    handleCallback()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFD9D9] to-[#D7FAFA]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-gray-500 text-sm">로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFD9D9] to-[#D7FAFA]">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FFD9D9] border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFD9D9] to-[#D7FAFA]">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FFD9D9] border-t-transparent mx-auto mb-4"></div>
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
