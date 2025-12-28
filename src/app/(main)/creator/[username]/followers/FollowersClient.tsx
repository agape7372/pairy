'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui'
import { FollowButton } from '@/components/social'
import { useFollowers } from '@/hooks/useFollow'

// 크리에이터 정보 (임시 - 실제로는 API에서 가져옴)
const creatorsData: Record<string, { id: string; displayName: string; avatarEmoji: string }> = {
  strawberry123: { id: 'creator-1', displayName: '딸기크림', avatarEmoji: '🍓' },
  fairy_art: { id: 'creator-2', displayName: '페어리', avatarEmoji: '🧚' },
  moonlight: { id: 'creator-3', displayName: '문라이트', avatarEmoji: '🌙' },
  mintchoco: { id: 'creator-4', displayName: '민트초코', avatarEmoji: '🍀' },
  roseberry: { id: 'creator-5', displayName: '로즈베리', avatarEmoji: '🌹' },
  skyblue: { id: 'creator-6', displayName: '스카이블루', avatarEmoji: '☁️' },
  cherryblossom: { id: 'creator-7', displayName: '체리블라썸', avatarEmoji: '🌸' },
  coconut: { id: 'creator-8', displayName: '코코넛', avatarEmoji: '🥥' },
}

interface FollowersClientProps {
  username: string
}

export default function FollowersClient({ username }: FollowersClientProps) {
  const router = useRouter()
  const creator = creatorsData[username]
  const { followers, isLoading } = useFollowers(creator?.id || '')

  if (!creator) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🤔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">크리에이터를 찾을 수 없어요</h1>
        <Button asChild>
          <Link href="/templates">틀 둘러보기로 돌아가기</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-[800px] mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로 가기
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-2xl">
              {creator.avatarEmoji}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {creator.displayName}님의 팔로워
              </h1>
              <p className="text-sm text-gray-500">
                {followers.length}명이 팔로우하고 있어요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Followers List */}
      <div className="max-w-[800px] mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-400 rounded-full" />
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">아직 팔로워가 없어요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {followers.map((follower) => (
              <div
                key={follower.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                <Link
                  href={`/creator/${follower.username}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-xl">
                    {follower.avatar_url ? (
                      <img
                        src={follower.avatar_url}
                        alt={follower.display_name || ''}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 hover:text-primary-400 transition-colors">
                      {follower.display_name || follower.username}
                    </p>
                    <p className="text-sm text-gray-500">@{follower.username}</p>
                  </div>
                </Link>
                <FollowButton userId={follower.id} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
