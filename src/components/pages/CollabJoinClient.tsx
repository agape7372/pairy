'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { useCollabSession } from '@/hooks/useCollabSession'
import { useUser } from '@/hooks/useUser'
import type { CollabUser } from '@/lib/collab/types'

interface CollabJoinClientProps {
  code: string
}

export default function CollabJoinClient({ code }: CollabJoinClientProps) {
  const router = useRouter()
  const upperCode = code.toUpperCase()

  // H-07/DL-0007: 협업 참여는 로그인 필수 — 참가자 신원 = auth.uid(서버 진실).
  const { user, profile } = useUser()

  const {
    session,
    isJoining,
    error,
    joinSession,
  } = useCollabSession()

  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    // 세션이 활성화되면 에디터로 이동(workId 가 있을 때만 — 없으면 참여만 확정하고 대기)
    if (session && session.status === 'active' && joined && session.workId) {
      router.push(`/editor/${session.workId}?session=${session.id}`)
    }
  }, [session, joined, router])

  const handleJoin = async () => {
    if (!user) {
      router.push(`/login?redirect=/collab/${upperCode}`)
      return
    }
    setJoining(true)

    const authUser: CollabUser = {
      id: user.id,
      name: profile?.display_name || '사용자',
      color: '',
    }

    const success = await joinSession(upperCode, authUser)
    if (success) {
      setJoined(true)
    }
    setJoining(false)
  }

  // 로딩 상태
  if (isJoining && !error) {
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
            {error}
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

  // 참여 완료(작업 미연결) — 호스트가 편집을 시작하면 연결(실시간 편집은 F-11 후속)
  if (joined && !session?.workId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-accent-50 px-4">
        <div className="max-w-md w-full bg-white rounded-[24px] shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-200 to-accent-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">참여 완료!</h1>
          <p className="text-gray-600 mb-6">
            호스트가 작업을 시작하면 함께 편집할 수 있어요.
          </p>
          <Button variant="secondary" className="w-full" onClick={() => router.push('/')}>
            홈으로 가기
          </Button>
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
            {upperCode}
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
