'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui'
import { FollowButton } from '@/components/social'
import { useFollowing } from '@/hooks/useFollow'
import { useCreatorProfile } from '@/hooks/useCreatorProfile'

interface FollowingClientProps {
  username: string
}

export default function FollowingClient({ username }: FollowingClientProps) {
  const router = useRouter()
  const { creator, notFound } = useCreatorProfile(username)
  const { following, isLoading } = useFollowing(creator?.id || '')

  if (notFound || !creator) {
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
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-2xl overflow-hidden">
              {creator.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
              ) : (
                '🎨'
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {creator.displayName}님의 팔로잉
              </h1>
              <p className="text-sm text-gray-500">
                {following.length}명을 팔로우하고 있어요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Following List */}
      <div className="max-w-[800px] mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-400 rounded-full" />
          </div>
        ) : following.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">아직 팔로잉하는 크리에이터가 없어요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {following.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                <Link
                  href={`/creator/${user.username}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-xl">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name || ''}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 hover:text-primary-400 transition-colors">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </Link>
                <FollowButton userId={user.id} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
