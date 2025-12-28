'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Bookmark, Share2, ArrowLeft, Users, Download, Clock, Sparkles, Twitter } from 'lucide-react'
import { Button, Tag } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

// 임시 샘플 데이터 (실제로는 Supabase에서 가져옴)
const sampleTemplates: Record<string, {
  id: string
  title: string
  description: string
  creator: string
  creatorId: string
  likeCount: number
  downloadCount: number
  useCount: number // 사용 횟수 (작품 생성 수)
  tags: string[]
  emoji: string
  slots: number
  createdAt: string
}> = {
  '1': {
    id: '1',
    title: '커플 프로필 틀',
    description: '달달한 커플을 위한 프로필 틀이에요. 두 사람의 정보와 함께 케미를 보여줄 수 있어요. 프로필 사진, 이름, 좋아하는 것, 싫어하는 것, 그리고 둘만의 특별한 이야기를 담아보세요!',
    creator: '딸기크림',
    creatorId: 'strawberry123',
    likeCount: 1234,
    downloadCount: 567,
    useCount: 2847,
    tags: ['커플', '2인용'],
    emoji: '💕',
    slots: 2,
    createdAt: '2025-01-15',
  },
  '2': {
    id: '2',
    title: '친구 관계도',
    description: '친구들과의 관계를 한눈에 볼 수 있는 관계도 틀이에요. 각자의 역할과 서로의 관계를 재미있게 표현해보세요.',
    creator: '페어리',
    creatorId: 'fairy_art',
    likeCount: 892,
    downloadCount: 234,
    useCount: 1523,
    tags: ['친구', '관계도'],
    emoji: '✨',
    slots: 4,
    createdAt: '2025-01-10',
  },
  '3': {
    id: '3',
    title: 'OC 소개 카드',
    description: '자신만의 OC(오리지널 캐릭터)를 소개하는 카드에요. 캐릭터의 기본 정보부터 성격, 배경 스토리까지 담을 수 있어요.',
    creator: '문라이트',
    creatorId: 'moonlight',
    likeCount: 567,
    downloadCount: 189,
    useCount: 892,
    tags: ['프로필', '1인용', 'OC'],
    emoji: '🌙',
    slots: 1,
    createdAt: '2025-01-08',
  },
  '4': {
    id: '4',
    title: '베프 케미 틀',
    description: '베스트 프렌드와의 케미를 보여줄 수 있는 틀이에요. 서로의 공통점과 차이점, 그리고 함께한 추억을 담아보세요.',
    creator: '민트초코',
    creatorId: 'mintchoco',
    likeCount: 2341,
    downloadCount: 892,
    useCount: 4123,
    tags: ['친구', '2인용'],
    emoji: '🍀',
    slots: 2,
    createdAt: '2025-01-12',
  },
  '5': {
    id: '5',
    title: '삼각관계 틀',
    description: '복잡한 삼각관계를 표현할 수 있는 틀이에요. 세 사람 사이의 미묘한 감정선을 담아보세요.',
    creator: '로즈베리',
    creatorId: 'roseberry',
    likeCount: 1567,
    downloadCount: 456,
    useCount: 2156,
    tags: ['관계도', '3인용+'],
    emoji: '🔺',
    slots: 3,
    createdAt: '2025-01-05',
  },
  '6': {
    id: '6',
    title: '캐릭터 프로필 카드',
    description: '캐릭터의 기본 정보를 깔끔하게 정리할 수 있는 프로필 카드에요. 이름, 나이, 성격 등 핵심 정보를 담아보세요.',
    creator: '스카이블루',
    creatorId: 'skyblue',
    likeCount: 987,
    downloadCount: 321,
    useCount: 1678,
    tags: ['프로필', '1인용', 'OC'],
    emoji: '📋',
    slots: 1,
    createdAt: '2025-01-03',
  },
  '7': {
    id: '7',
    title: '팬아트 커플 틀',
    description: '좋아하는 작품의 커플을 표현할 수 있는 팬아트 전용 틀이에요. 공식 커플도 비공식 커플도 모두 환영!',
    creator: '체리블라썸',
    creatorId: 'cherryblossom',
    likeCount: 3456,
    downloadCount: 1234,
    useCount: 5892,
    tags: ['팬아트', '커플', '2인용'],
    emoji: '🌸',
    slots: 2,
    createdAt: '2025-01-18',
  },
  '8': {
    id: '8',
    title: '단체 관계도',
    description: '여러 캐릭터들의 관계를 한눈에 볼 수 있는 단체 관계도에요. 복잡한 인물 관계를 정리하기 좋아요.',
    creator: '코코넛',
    creatorId: 'coconut',
    likeCount: 789,
    downloadCount: 234,
    useCount: 945,
    tags: ['관계도', '3인용+'],
    emoji: '🥥',
    slots: 6,
    createdAt: '2025-01-01',
  },
}

// 관련 틀 추천
const relatedTemplates = [
  { id: '4', title: '베프 케미 틀', emoji: '🍀', likeCount: 2341 },
  { id: '5', title: '삼각관계 틀', emoji: '🔺', likeCount: 1567 },
  { id: '7', title: '팬아트 커플 틀', emoji: '🌸', likeCount: 3456 },
]

interface TemplateDetailClientProps {
  templateId: string
}

export default function TemplateDetailClient({ templateId }: TemplateDetailClientProps) {
  const router = useRouter()

  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showShareToast, setShowShareToast] = useState(false)

  const template = sampleTemplates[templateId]

  if (!template) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🤔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">틀을 찾을 수 없어요</h1>
        <p className="text-gray-500 mb-6">요청하신 틀이 존재하지 않거나 삭제되었을 수 있어요.</p>
        <Button asChild>
          <Link href="/templates">틀 둘러보기로 돌아가기</Link>
        </Button>
      </div>
    )
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // 트위터 공유
  const handleTwitterShare = () => {
    const text = `${template.title} by @${template.creator}\n\n이 틀로 ${template.useCount.toLocaleString()}개의 작품이 만들어졌어요! ✨\n\n#페어리 #Pairy`
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }

  const handleStartWork = () => {
    router.push(`/editor/new?template=${templateId}`)
  }

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      <div className={cn(
        'fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm transition-all duration-300 z-50',
        showShareToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      )}>
        링크가 복사되었어요!
      </div>

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

      {/* Main Content */}
      <section className="py-8 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Preview */}
            <div className="lg:col-span-3">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 rounded-[24px] flex items-center justify-center text-8xl shadow-lg">
                {template.emoji}
              </div>

              {/* Preview Thumbnails */}
              <div className="flex gap-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-20 h-16 rounded-lg bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-2xl cursor-pointer transition-all',
                      i === 1 ? 'ring-2 ring-primary-400' : 'opacity-60 hover:opacity-100'
                    )}
                  >
                    {template.emoji}
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-2">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {template.tags.map((tag, idx) => (
                  <Tag key={tag} variant={idx === 0 ? 'primary' : 'accent'}>
                    {tag}
                  </Tag>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {template.title}
              </h1>

              {/* Creator */}
              <Link
                href={`/creator/${template.creatorId}`}
                className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-400 transition-colors mb-6"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-200 to-accent-200" />
                <span className="text-sm">by {template.creator}</span>
              </Link>

              {/* Usage Counter Badge */}
              <div className="mb-4 p-3 bg-gradient-to-r from-accent-50 to-primary-50 rounded-xl border border-accent-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-500" />
                  <span className="text-sm text-gray-700">
                    이 틀로 <span className="font-bold text-accent-600">{template.useCount.toLocaleString()}</span>개의 작품이 만들어졌어요!
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Heart className="w-4 h-4" />
                  <span>{template.likeCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Download className="w-4 h-4" />
                  <span>{template.downloadCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{template.slots}인용</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{template.createdAt}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                {template.description}
              </p>

              {/* Actions */}
              <div className="flex gap-3 mb-4">
                <Button size="lg" className="flex-1" onClick={handleStartWork}>
                  이 틀로 시작하기
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  variant={isLiked ? 'primary' : 'outline'}
                  className="flex-1"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={cn('w-5 h-5 mr-2', isLiked && 'fill-current')} />
                  {isLiked ? '좋아요 취소' : '좋아요'}
                </Button>
                <Button
                  variant={isBookmarked ? 'accent' : 'outline'}
                  className="flex-1"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                >
                  <Bookmark className={cn('w-5 h-5 mr-2', isBookmarked && 'fill-current')} />
                  {isBookmarked ? '저장됨' : '저장하기'}
                </Button>
                <Button variant="ghost" onClick={handleShare}>
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              {/* Twitter Share */}
              <button
                onClick={handleTwitterShare}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-medium transition-colors"
              >
                <Twitter className="w-5 h-5" />
                트위터에 공유하기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Related Templates */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            비슷한 <span className="text-accent-400">틀</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedTemplates.map((related) => (
              <Link
                key={related.id}
                href={`/templates/${related.id}`}
                className="group bg-white rounded-[20px] overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-5xl">
                  {related.emoji}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-400 transition-colors">
                    {related.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                    <Heart className="w-4 h-4" />
                    <span>{related.likeCount.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
