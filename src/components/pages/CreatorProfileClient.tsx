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
  ExternalLink,
  Calendar,
  HelpCircle,
} from 'lucide-react'
import { Button, Tag } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { getIcon, getIconColor, type IconName } from '@/lib/utils/icons'

// 크리에이터 샘플 데이터
const creatorsData: Record<string, {
  username: string
  displayName: string
  bio: string
  avatarIcon: IconName
  joinedAt: string
  twitterHandle?: string
  stats: {
    totalTemplates: number
    totalLikes: number
    totalUses: number
    followers: number
  }
  templates: Array<{
    id: string
    title: string
    icon: IconName
    likeCount: number
    useCount: number
    tags: string[]
  }>
}> = {
  strawberry123: {
    username: 'strawberry123',
    displayName: '딸기크림',
    bio: '달달한 커플 틀 전문 크리에이터입니다. 사랑스러운 관계를 표현하는 틀을 주로 만들어요.',
    avatarIcon: 'heart',
    joinedAt: '2024-06-15',
    twitterHandle: 'strawberry_pairy',
    stats: {
      totalTemplates: 12,
      totalLikes: 5234,
      totalUses: 15892,
      followers: 2341,
    },
    templates: [
      { id: '1', title: '커플 프로필 틀', icon: 'heart', likeCount: 1234, useCount: 2847, tags: ['커플', '2인용'] },
      { id: '9', title: '기념일 카드', icon: 'calendar', likeCount: 892, useCount: 1523, tags: ['커플', '기념일'] },
      { id: '10', title: '러브레터 틀', icon: 'mail', likeCount: 567, useCount: 987, tags: ['커플', '1인용'] },
    ],
  },
  fairy_art: {
    username: 'fairy_art',
    displayName: '페어리',
    bio: '친구들과의 소중한 추억을 담는 관계도 틀을 만들고 있어요. 복잡한 관계도 예쁘게!',
    avatarIcon: 'sparkles',
    joinedAt: '2024-03-01',
    twitterHandle: 'fairy_art_kr',
    stats: {
      totalTemplates: 8,
      totalLikes: 3421,
      totalUses: 9876,
      followers: 1567,
    },
    templates: [
      { id: '2', title: '친구 관계도', icon: 'sparkles', likeCount: 892, useCount: 1523, tags: ['친구', '관계도'] },
      { id: '11', title: '우정 프로필', icon: 'star', likeCount: 543, useCount: 876, tags: ['친구', '2인용'] },
    ],
  },
  moonlight: {
    username: 'moonlight',
    displayName: '문라이트',
    bio: 'OC 덕후입니다. 캐릭터 소개에 진심인 사람.',
    avatarIcon: 'moon',
    joinedAt: '2024-07-20',
    stats: {
      totalTemplates: 5,
      totalLikes: 1890,
      totalUses: 4532,
      followers: 876,
    },
    templates: [
      { id: '3', title: 'OC 소개 카드', icon: 'moon', likeCount: 567, useCount: 892, tags: ['프로필', '1인용', 'OC'] },
    ],
  },
  mintchoco: {
    username: 'mintchoco',
    displayName: '민트초코',
    bio: '베프와의 케미를 세상에 알리고 싶어서 틀을 만들기 시작했어요.',
    avatarIcon: 'clover',
    joinedAt: '2024-05-10',
    twitterHandle: 'mintchoco_design',
    stats: {
      totalTemplates: 15,
      totalLikes: 8765,
      totalUses: 23456,
      followers: 4123,
    },
    templates: [
      { id: '4', title: '베프 케미 틀', icon: 'clover', likeCount: 2341, useCount: 4123, tags: ['친구', '2인용'] },
    ],
  },
  roseberry: {
    username: 'roseberry',
    displayName: '로즈베리',
    bio: '복잡한 관계도 아름답게, 삼각관계 전문 크리에이터.',
    avatarIcon: 'flower',
    joinedAt: '2024-04-05',
    stats: {
      totalTemplates: 7,
      totalLikes: 4321,
      totalUses: 11234,
      followers: 2156,
    },
    templates: [
      { id: '5', title: '삼각관계 틀', icon: 'triangle', likeCount: 1567, useCount: 2156, tags: ['관계도', '3인용+'] },
    ],
  },
  skyblue: {
    username: 'skyblue',
    displayName: '스카이블루',
    bio: '깔끔하고 정돈된 캐릭터 프로필 카드를 만들어요.',
    avatarIcon: 'cloud',
    joinedAt: '2024-08-12',
    stats: {
      totalTemplates: 4,
      totalLikes: 2345,
      totalUses: 5678,
      followers: 987,
    },
    templates: [
      { id: '6', title: '캐릭터 프로필 카드', icon: 'file', likeCount: 987, useCount: 1678, tags: ['프로필', '1인용', 'OC'] },
    ],
  },
  cherryblossom: {
    username: 'cherryblossom',
    displayName: '체리블라썸',
    bio: '팬아트 전문! 좋아하는 캐릭터들의 케미를 담아요.',
    avatarIcon: 'flower',
    joinedAt: '2024-02-14',
    twitterHandle: 'cherry_blossom_art',
    stats: {
      totalTemplates: 20,
      totalLikes: 12345,
      totalUses: 34567,
      followers: 6789,
    },
    templates: [
      { id: '7', title: '팬아트 커플 틀', icon: 'flower', likeCount: 3456, useCount: 5892, tags: ['팬아트', '커플', '2인용'] },
    ],
  },
  coconut: {
    username: 'coconut',
    displayName: '코코넛',
    bio: '단체 관계도의 달인, 복잡한 캐릭터 관계를 정리해드려요.',
    avatarIcon: 'users',
    joinedAt: '2024-01-20',
    stats: {
      totalTemplates: 6,
      totalLikes: 2567,
      totalUses: 6789,
      followers: 1234,
    },
    templates: [
      { id: '8', title: '단체 관계도', icon: 'users', likeCount: 789, useCount: 945, tags: ['관계도', '3인용+'] },
    ],
  },
}

interface CreatorProfileClientProps {
  username: string
}

export default function CreatorProfileClient({ username }: CreatorProfileClientProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(false)

  const creator = creatorsData[username]

  if (!creator) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <HelpCircle className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
        </div>
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
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center border-4 border-white shadow-lg">
              {(() => {
                const AvatarIcon = getIcon(creator.avatarIcon)
                const avatarColor = getIconColor(creator.avatarIcon)
                return <AvatarIcon className={cn('w-16 h-16', avatarColor)} strokeWidth={1.5} />
              })()}
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
                  <span>{creator.joinedAt} 가입</span>
                </div>
                {creator.twitterHandle && (
                  <a
                    href={`https://twitter.com/${creator.twitterHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#1DA1F2] hover:underline"
                  >
                    <Twitter className="w-4 h-4" />
                    <span>@{creator.twitterHandle}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <Button
                  variant={isFollowing ? 'outline' : 'primary'}
                  onClick={() => setIsFollowing(!isFollowing)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {isFollowing ? '팔로잉' : '팔로우'}
                </Button>
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
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{creator.stats.followers.toLocaleString()}</p>
              <p className="text-sm text-gray-500">팔로워</p>
            </div>
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
            {creator.templates.map((template) => {
              const TemplateIcon = getIcon(template.icon)
              const templateColor = getIconColor(template.icon)
              return (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="group bg-white rounded-[20px] overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center">
                  <TemplateIcon className={cn('w-16 h-16', templateColor)} strokeWidth={1.5} />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-400 transition-colors mb-2">
                    {template.title}
                  </h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.map((tag, idx) => (
                      <Tag key={tag} variant={idx === 0 ? 'primary' : 'accent'}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
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
            )})}
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
