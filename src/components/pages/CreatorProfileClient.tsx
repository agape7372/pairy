'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Heart,
  Download,
  Users,
  FileText,
  Sparkles,
  Twitter,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { FollowButton } from '@/components/social'
import { useFollow } from '@/hooks/useFollow'
import { useCreatorProfile } from '@/hooks/useCreatorProfile'
import { cn } from '@/lib/utils/cn'


interface CreatorProfileClientProps {
  username: string
}

export default function CreatorProfileClient({ username }: CreatorProfileClientProps) {
  const router = useRouter()

  // 실 profiles 조회(F-22) — 하드코딩 샘플 제거
  const { creator, isLoading, notFound } = useCreatorProfile(username)

  // useFollow 는 실 UUID 로 동작(가짜 id 제거로 진짜 팔로우 성립)
  const { followerCount } = useFollow(creator?.id || '')

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-300 border-t-transparent" />
      </div>
    )
  }

  if (notFound || !creator) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🤔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">크리에이터를 찾을 수 없어요</h1>
        <p className="text-gray-500 mb-6">요청하신 크리에이터가 존재하지 않거나 탈퇴했을 수 있어요.</p>
        <Button asChild>
          <Link href="/templates">틀 둘러보기로 돌아가기</Link>
        </Button>
      </div>
    )
  }

  // 트위터 공유
  const handleTwitterShare = () => {
    const text = `${creator.displayName}님의 페어리 프로필을 확인해보세요!\n\n${creator.stats.totalTemplates}개의 틀 | ${creator.stats.totalUses.toLocaleString()}회 사용\n\n#페어리 #Pairy`
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }

  // 팔로워 수 (훅에서 가져온 값 또는 초기값)
  const displayFollowerCount = followerCount || creator.stats.followers

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로 가기
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <section className="bg-gradient-to-b from-primary-100 via-accent-50 to-white py-12 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-6xl border-4 border-white shadow-lg overflow-hidden">
              {creator.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
              ) : (
                '🎨'
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{creator.displayName}</h1>
                <span className="text-sm text-gray-500">@{creator.username}</span>
              </div>

              <p className="text-gray-600 mb-4 max-w-lg">{creator.bio}</p>

              {/* Meta */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(creator.joinedAt).toLocaleDateString('ko-KR')} 가입</span>
                </div>
              </div>

              {/* Actions - FollowButton 컴포넌트 사용 */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <FollowButton userId={creator.id} />
                <Button variant="outline" onClick={handleTwitterShare}>
                  <Twitter className="w-4 h-4 mr-2" />
                  공유하기
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 px-4 bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <FileText className="w-6 h-6 text-primary-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{creator.stats.totalTemplates}</p>
              <p className="text-sm text-gray-500">제작한 틀</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{creator.stats.totalLikes.toLocaleString()}</p>
              <p className="text-sm text-gray-500">받은 좋아요</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <Sparkles className="w-6 h-6 text-accent-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{creator.stats.totalUses.toLocaleString()}</p>
              <p className="text-sm text-gray-500">사용 횟수</p>
            </div>
            <Link
              href={`/creator/${username}/followers`}
              className="text-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{displayFollowerCount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">팔로워</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="py-12 px-4">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {creator.displayName}님의 <span className="text-primary-400">틀</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {creator.templates.map((template) => (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="group bg-white rounded-[20px] overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-5xl overflow-hidden">
                  {template.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={template.previewUrl} alt={template.title} className="w-full h-full object-cover" />
                  ) : (
                    '🎨'
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-400 transition-colors mb-2">
                    {template.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{template.likeCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      <span>{template.useCount.toLocaleString()}회 사용</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* More templates CTA */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 mb-4">
              {creator.displayName}님의 다른 틀도 구경해보세요!
            </p>
            <Button variant="outline" asChild>
              <Link href={`/templates?creator=${username}`}>
                모든 틀 보기 ({creator.stats.totalTemplates}개)
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
