'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Users, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { useCollabSession } from '@/hooks/useCollabSession'

export default function CollabJoinPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string).toUpperCase()

  const {
    session,
    isLoading,
    error,
    joinSession,
  } = useCollabSession()

  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    // 세션이 활성화되면 에디터로 이동
    if (session && session.status === 'active' && joined) {
      router.push(`/editor/${session.work_id}?session=${session.id}`)
    }
  }, [session, joined, router])

  const handleJoin = async () => {
    setJoining(true)
    const success = await joinSession(code)
    if (success) {
      setJoined(true)
    }
    setJoining(false)
  }

  // 로딩 상태
  if (isLoading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-accent-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">세션을 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-accent-50 px-4">
        <div className="max-w-md w-full bg-white rounded-[24px] shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-error-light rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-error" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            참여할 수 없습니다
          </h1>

          <p className="text-gray-600 mb-6">
            {error.message}
          </p>

          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push('/')}
            >
              홈으로 가기
            </Button>
            <Button
              className="w-full"
              onClick={() => router.push('/templates')}
            >
              새 작업 시작하기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 초대 코드 확인 화면
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-accent-50 px-4">
      <div className="max-w-md w-full bg-white rounded-[24px] shadow-xl p-8 text-center">
        {/* 아이콘 */}
        <div className="w-20 h-20 bg-gradient-to-br from-primary-200 to-accent-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-gray-600" />
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          협업에 초대받았어요!
        </h1>

        <p className="text-gray-600 mb-6">
          함께 페어틀을 완성해보세요
        </p>

        {/* 초대 코드 */}
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4 mb-6 border-2 border-dashed border-primary-200">
          <p className="text-sm text-gray-500 mb-1">초대 코드</p>
          <p className="font-mono font-bold text-3xl text-gray-900 tracking-[0.3em]">
            {code}
          </p>
        </div>

        {/* 참여 버튼 */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleJoin}
          disabled={joining}
        >
          {joining ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              참여하는 중...
            </>
          ) : (
            <>
              참여하기
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        {/* 로그인 안내 */}
        <p className="text-sm text-gray-500 mt-4">
          참여하려면 로그인이 필요해요
        </p>
      </div>
    </div>
  )
}
