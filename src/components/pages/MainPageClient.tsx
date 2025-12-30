'use client'

/**
 * MainPageClient - 마켓플레이스 스타일 메인 페이지 v2
 *
 * 디자인 개선:
 * - 다양한 호버 효과 (tilt, reveal, glow, flip)
 * - Skeleton loading
 * - Scroll reveal 애니메이션
 * - Bento grid 레이아웃
 * - 마이크로 인터랙션
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Download,
  TrendingUp,
  Clock,
  Star,
  Crown,
  CheckCircle,
  ArrowRight,
  Users,
  Flame,
  Gift,
  Image,
  Pencil,
  ScrollText,
  ExternalLink,
} from 'lucide-react'
import { Button, Tag } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import {
  RESOURCE_CATEGORIES,
  type ResourceCategory,
} from '@/types/resources'
import { useLikes } from '@/hooks/useLikes'

// ============================================
// 커스텀 훅: Scroll Reveal
// ============================================

function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

// ============================================
// 커스텀 훅: Tilt Effect
// ============================================

function useTiltEffect() {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('')

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 20
    const rotateY = (centerX - x) / 20
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`)
  }

  const handleMouseLeave = () => {
    setTransform('')
  }

  return { ref, transform, handleMouseMove, handleMouseLeave }
}

// ============================================
// 배너 데이터
// ============================================

const banners = [
  {
    id: 1,
    title: '신규 가입 이벤트',
    description: '지금 가입하면 프리미엄 3일 무료!',
    bgGradient: 'from-primary-200 via-primary-100 to-accent-100',
    icon: Gift,
    cta: '지금 시작하기',
    href: '/login',
    badge: 'EVENT',
    badgeColor: 'bg-red-500',
  },
  {
    id: 2,
    title: '크리에이터 모집 중',
    description: '당신의 창작물을 공유하고 수익을 얻어보세요',
    bgGradient: 'from-accent-200 via-accent-100 to-primary-100',
    icon: Crown,
    cta: '크리에이터 신청',
    href: '/my/creator',
    badge: 'NEW',
    badgeColor: 'bg-blue-500',
  },
  {
    id: 3,
    title: '이번 주 인기 틀',
    description: '가장 많이 사용된 템플릿을 확인해보세요',
    bgGradient: 'from-pink-200 via-primary-100 to-accent-200',
    icon: TrendingUp,
    cta: '인기 틀 보기',
    href: '/templates?sort=popular',
    badge: 'HOT',
    badgeColor: 'bg-orange-500',
  },
]

// ============================================
// 샘플 데이터
// ============================================

const trendingTemplates = [
  { id: '1', title: '커플 프로필 틀', category: 'pairtl' as ResourceCategory, creator: { name: '딸기크림', verified: true }, stats: { likes: 1234, downloads: 3456 }, isPremium: false, isNew: true },
  { id: '2', title: '벚꽃 이메레스 세트', category: 'imeres' as ResourceCategory, creator: { name: '체리블라썸', verified: true }, stats: { likes: 892, downloads: 2341 }, isPremium: true, isNew: false },
  { id: '3', title: '전신 포즈 트레틀', category: 'tretle' as ResourceCategory, creator: { name: '문라이트', verified: false }, stats: { likes: 567, downloads: 1892 }, isPremium: false, isNew: false },
  { id: '4', title: 'TRPG 캐릭터 시트', category: 'sessionlog' as ResourceCategory, creator: { name: '다이스마스터', verified: true }, stats: { likes: 789, downloads: 1523 }, isPremium: false, isNew: true },
  { id: '5', title: '친구 관계도', category: 'pairtl' as ResourceCategory, creator: { name: '페어리', verified: true }, stats: { likes: 456, downloads: 1234 }, isPremium: false, isNew: false },
  { id: '6', title: '네온 이펙트 세트', category: 'imeres' as ResourceCategory, creator: { name: '네온드림', verified: true }, stats: { likes: 2341, downloads: 892 }, isPremium: true, isNew: false },
]

const popularCreators = [
  { id: 'strawberry123', name: '딸기크림', avatar: null, followers: 1234, templates: 23, verified: true },
  { id: 'cherry_art', name: '체리블라썸', avatar: null, followers: 892, templates: 15, verified: true },
  { id: 'fairy_art', name: '페어리', avatar: null, followers: 756, templates: 18, verified: true },
  { id: 'moonlight', name: '문라이트', avatar: null, followers: 543, templates: 12, verified: false },
]

const recentTemplates = [
  { id: '10', title: '여름 배경 세트', category: 'imeres' as ResourceCategory, creator: '썸머드림', timeAgo: '방금 전', isLive: true },
  { id: '11', title: '상반신 포즈 가이드', category: 'tretle' as ResourceCategory, creator: '포즈마스터', timeAgo: '5분 전', isLive: true },
  { id: '12', title: '우정 관계도', category: 'pairtl' as ResourceCategory, creator: '프렌즈', timeAgo: '15분 전', isLive: false },
  { id: '13', title: '세션 요약 템플릿', category: 'sessionlog' as ResourceCategory, creator: 'RPG러버', timeAgo: '30분 전', isLive: false },
]

// 카테고리 아이콘 매핑
const categoryIcons: Record<ResourceCategory, typeof Image> = {
  imeres: Image,
  tretle: Pencil,
  pairtl: Users,
  sessionlog: ScrollText,
}

// ============================================
// Skeleton 컴포넌트
// ============================================

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-gray-200 rounded', className)} />
  )
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <Skeleton className="aspect-square" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  )
}

// ============================================
// 배너 슬라이더 (페이드 트랜지션)
// ============================================

function BannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const changeSlide = useCallback((newIndex: number) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide(newIndex)
      setIsTransitioning(false)
    }, 300)
  }, [])

  const nextSlide = useCallback(() => {
    changeSlide((currentSlide + 1) % banners.length)
  }, [currentSlide, changeSlide])

  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isPaused, nextSlide])

  const banner = banners[currentSlide]
  const Icon = banner.icon

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className={cn(
          'bg-gradient-to-r py-10 sm:py-14 px-4 transition-all duration-500',
          banner.bgGradient,
          isTransitioning && 'opacity-0 scale-95'
        )}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* 아이콘 - 부유 애니메이션 */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-lg animate-float">
                  <Icon className="w-10 h-10 text-gray-700" strokeWidth={1.5} />
                </div>
                {/* 뱃지 */}
                <span className={cn(
                  'absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold text-white rounded-full animate-pulse',
                  banner.badgeColor
                )}>
                  {banner.badge}
                </span>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {banner.title}
                </h2>
                <p className="text-gray-600">
                  {banner.description}
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="group">
              <Link href={banner.href}>
                {banner.cta}
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
        <div
          className="h-full bg-white/70 transition-all duration-100"
          style={{
            width: isPaused ? `${((currentSlide + 1) / banners.length) * 100}%` : undefined,
            animation: isPaused ? 'none' : 'progress 5s linear infinite',
          }}
        />
      </div>

      {/* 네비게이션 */}
      <button
        onClick={() => changeSlide((currentSlide - 1 + banners.length) % banners.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white hover:scale-110 transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => changeSlide((currentSlide + 1) % banners.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white hover:scale-110 transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* 도트 인디케이터 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => changeSlide(idx)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
            )}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  )
}

// ============================================
// Bento 카테고리 그리드
// 변경 이유: 답답한 ring 테두리 효과 → 부드러운 그림자 + 떠오르는 효과로 개선
// ============================================

function BentoCategoryGrid() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section ref={ref} className="py-8 px-4 bg-gray-50">
      <div className="max-w-[1200px] mx-auto">
        <div className={cn(
          'grid grid-cols-2 md:grid-cols-4 gap-3 transition-all duration-700',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        )}>
          {Object.entries(RESOURCE_CATEGORIES).map(([key, category], idx) => {
            const Icon = categoryIcons[key as ResourceCategory]
            return (
              <Link
                key={key}
                href={`/templates?category=${key}`}
                className={cn(
                  'group relative overflow-hidden rounded-2xl p-5 transition-all duration-300',
                  // 변경 이유: ring 효과 제거 → 그림자 + translateY로 부드러운 호버 효과
                  'hover:shadow-lg hover:-translate-y-1',
                  idx === 0 && 'md:col-span-2 md:row-span-2',
                  category.bgColor.replace('-100', '-50')
                )}
                style={{
                  transitionDelay: `${idx * 100}ms`,
                }}
              >
                {/* 배경 패턴 */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                    backgroundSize: '20px 20px',
                  }} />
                </div>

                <div className="relative">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110',
                    category.bgColor
                  )}>
                    <Icon className={cn('w-6 h-6', category.color)} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{category.nameKo}</h3>
                  <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                  <div className="flex items-center text-sm text-gray-400 group-hover:text-gray-600 transition-colors">
                    <span>둘러보기</span>
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                {/* 변경 이유: 호버 시 그라데이션 오버레이 - 더 subtle하게 */}
                <div className={cn(
                  'absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300',
                  `bg-gradient-to-br ${category.bgColor.replace('-100', '-400').replace('bg-', 'from-')} to-transparent`
                )} />
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================
// 트렌딩 카드 (미니멀 리디자인)
// 변경 이유: 촌스러운 금색 뱃지 제거, 과도한 버튼 정리, 실제 기능 연결
// ============================================

function TrendingCard({ template, rank }: { template: typeof trendingTemplates[0]; rank: number }) {
  const { ref, transform, handleMouseMove, handleMouseLeave } = useTiltEffect()
  const [isHovered, setIsHovered] = useState(false)
  const category = RESOURCE_CATEGORIES[template.category]

  // 변경 이유: 실제 좋아요 기능 연결
  const { isLiked, likeCount, toggle: toggleLike } = useLikes(template.id, template.stats.likes)

  // 변경 이유: 좋아요 버튼 클릭 시 Link 이벤트 차단
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await toggleLike()
  }

  return (
    <Link
      href={`/templates/${template.id}`}
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); handleMouseLeave() }}
    >
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-300 hover:border-gray-200 hover:shadow-lg"
        style={{ transform }}
      >
        {/* 프리뷰 */}
        <div className={cn(
          'aspect-square flex items-center justify-center relative overflow-hidden',
          category.bgColor.replace('-100', '-50')
        )}>
          {/* 변경 이유: 순위 뱃지 - 미니멀하게 재디자인 */}
          <div className={cn(
            'absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs z-10 transition-all duration-300',
            rank === 1 && 'bg-primary-400 text-white',
            rank === 2 && 'bg-primary-300 text-white',
            rank === 3 && 'bg-primary-200 text-primary-700',
            rank > 3 && 'bg-white/90 text-gray-500 backdrop-blur-sm'
          )}>
            {rank}
          </div>

          {/* 변경 이유: 프리미엄 뱃지 - 작고 심플하게 */}
          {template.isPremium && (
            <div className="absolute top-3 right-3 px-1.5 py-0.5 bg-gray-900/80 backdrop-blur-sm rounded text-[10px] font-bold text-white z-10">
              PRO
            </div>
          )}

          {/* NEW 뱃지 - 더 subtle하게 */}
          {template.isNew && (
            <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-primary-500 text-[10px] font-bold rounded-full z-10">
              NEW
            </div>
          )}

          {/* 이모지 */}
          <span className={cn(
            'text-5xl transition-all duration-500',
            isHovered && 'scale-110'
          )}>
            {category.emoji}
          </span>

          {/* 변경 이유: 호버 시 좋아요 버튼 하나만 - 심플하게 */}
          <button
            onClick={handleLikeClick}
            className={cn(
              'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-20',
              template.isPremium ? 'top-10' : 'top-3',
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90',
              isLiked
                ? 'bg-red-50 text-red-500'
                : 'bg-white/90 backdrop-blur-sm text-gray-500 hover:text-red-500 hover:bg-red-50'
            )}
            aria-label={isLiked ? '좋아요 취소' : '좋아요'}
          >
            <Heart
              className="w-4 h-4 transition-transform hover:scale-110"
              fill={isLiked ? 'currentColor' : 'none'}
            />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate mb-1 group-hover:text-primary-500">
            {template.title}
          </h3>
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
            <span>{template.creator.name}</span>
            {template.creator.verified && (
              <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
            )}
          </div>

          {/* 스탯 */}
          <div className="flex items-center gap-4 text-sm">
            <span className={cn(
              'flex items-center gap-1 transition-colors',
              isLiked ? 'text-red-500' : 'text-gray-400'
            )}>
              <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
              {likeCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-gray-400">
              <Download className="w-4 h-4" />
              {template.stats.downloads.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 호버 시 subtle한 테두리 강조 */}
        <div className={cn(
          'absolute inset-0 rounded-2xl border-2 border-primary-200 opacity-0 transition-opacity duration-300 pointer-events-none',
          isHovered && 'opacity-100'
        )} />
      </div>
    </Link>
  )
}

function TrendingSection() {
  const { ref, isVisible } = useScrollReveal()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section ref={ref} className="py-10 px-4">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* 변경 이유: 그라데이션 → 단색으로 통일 */}
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Flame className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">지금 뜨는 틀</h2>
              <p className="text-sm text-gray-500">실시간 인기 템플릿</p>
            </div>
          </div>
          <Link
            href="/templates?sort=trending"
            className="flex items-center gap-1 text-sm font-medium text-primary-400 hover:text-primary-500 group"
          >
            더보기
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className={cn(
          'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 transition-all duration-700',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        )}>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            : trendingTemplates.map((template, idx) => (
                <TrendingCard key={template.id} template={template} rank={idx + 1} />
              ))
          }
        </div>
      </div>
    </section>
  )
}

// ============================================
// 인기 크리에이터 (미니멀 리디자인)
// 변경 이유: 촌스러운 그라데이션 테두리/아바타 제거 → 깔끔한 단색 + 그림자로 통일
// ============================================

function CreatorCard({ creator, index }: { creator: typeof popularCreators[0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={`/creator/${creator.id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* 변경 이유: 그라데이션 테두리 제거 → 깔끔한 흰색 카드 + 호버 시 그림자 */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* 아바타 - 변경 이유: 그라데이션 → 브랜드 컬러(primary) 단색 */}
        <div className="relative mx-auto mb-4">
          <div className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300',
            'bg-primary-100',
            isHovered && 'scale-105'
          )}>
            {creator.avatar ? (
              <img src={creator.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary-400">
                {creator.name[0]}
              </span>
            )}
          </div>
          {creator.verified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
              <CheckCircle className="w-4 h-4 text-blue-500" fill="currentColor" />
            </div>
          )}
        </div>

        <h3 className="font-bold text-gray-900 mb-1">{creator.name}</h3>

        <div className="flex items-center justify-center gap-3 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {creator.followers.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Image className="w-3.5 h-3.5" />
            {creator.templates}
          </span>
        </div>

        {/* 변경 이유: 복잡한 버튼 애니메이션 → 심플한 텍스트 링크 */}
        <div className="text-sm text-gray-400 group-hover:text-primary-400 transition-colors">
          프로필 보기 →
        </div>
      </div>
    </Link>
  )
}

function PopularCreatorsSection() {
  const { ref, isVisible } = useScrollReveal()

  // 변경 이유: 그라데이션 배경 제거 → 단색
  return (
    <section ref={ref} className="py-10 px-4 bg-gray-50">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* 변경 이유: 그라데이션 → 단색으로 통일 */}
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">인기 크리에이터</h2>
              <p className="text-sm text-gray-500">팔로우하고 새 작품 알림 받기</p>
            </div>
          </div>
        </div>

        <div className={cn(
          'grid grid-cols-2 sm:grid-cols-4 gap-4 transition-all duration-700',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        )}>
          {popularCreators.map((creator, idx) => (
            <CreatorCard key={creator.id} creator={creator} index={idx} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// 최근 업로드 (타임라인 스타일 + 라이브 인디케이터)
// ============================================

function RecentUploadsSection() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section ref={ref} className="py-10 px-4">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* 변경 이유: 그라데이션 → 단색으로 통일 */}
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-gray-500" />
              </div>
              {/* 라이브 표시 */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500" />
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">방금 올라온 틀</h2>
              <p className="text-sm text-gray-500">따끈따끈한 신작</p>
            </div>
          </div>
        </div>

        <div className={cn(
          'space-y-3 transition-all duration-700',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        )}>
          {recentTemplates.map((template, idx) => {
            const category = RESOURCE_CATEGORIES[template.category]
            return (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-300"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* 타임라인 도트 */}
                <div className="relative flex flex-col items-center">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    template.isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                  )} />
                  {idx < recentTemplates.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                  )}
                </div>

                {/* 아이콘 */}
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105',
                  category.bgColor
                )}>
                  <span className="text-2xl">{category.emoji}</span>
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-500 transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-sm text-gray-500">{template.creator}</p>
                </div>

                {/* 시간 & 뱃지 */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn(
                    'text-sm',
                    template.isLive ? 'text-green-500 font-medium' : 'text-gray-400'
                  )}>
                    {template.timeAgo}
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================
// 통계 (카운트업 애니메이션)
// ============================================

function AnimatedCounter({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const { ref, isVisible } = useScrollReveal()

  useEffect(() => {
    if (!isVisible) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isVisible, end, duration])

  return <span ref={ref}>{count.toLocaleString()}+</span>
}

function StatsBanner() {
  return (
    <section className="py-16 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
      </div>

      <div className="max-w-[1200px] mx-auto relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: 1200, label: '틀 템플릿', icon: Image },
            { value: 8500, label: '완성된 작품', icon: Download },
            { value: 3200, label: '크리에이터', icon: Users },
            { value: 50000, label: '활성 사용자', icon: Heart },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="text-center group"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary-300 transition-transform duration-300 group-hover:scale-125" strokeWidth={1.5} />
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                <AnimatedCounter end={stat.value} />
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// CTA (Glassmorphism)
// ============================================

// 변경 이유: 과도한 glassmorphism + 그라데이션 → 깔끔한 단색 배경
function CTASection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-[800px] mx-auto">
        {/* 변경 이유: 복잡한 레이어 구조 → 심플한 단색 배경 */}
        <div className="bg-primary-50 rounded-3xl p-10 sm:p-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 mb-6 shadow-sm">
            <Star className="w-4 h-4 text-primary-400" fill="currentColor" />
            100% 무료로 시작
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            지금 시작해보세요
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            무료로 가입하고 첫 번째 작품을 만들어보세요.
            크리에이터가 되어 수익도 창출할 수 있어요.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild className="group">
              <Link href="/login">
                무료로 시작하기
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="bg-white hover:bg-gray-50">
              <Link href="/about">서비스 소개</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// 메인 컴포넌트
// ============================================

export default function MainPageClient() {
  return (
    <div className="min-h-screen bg-white">
      <BannerSlider />
      <BentoCategoryGrid />
      <TrendingSection />
      <PopularCreatorsSection />
      <RecentUploadsSection />
      <StatsBanner />
      <CTASection />

      {/* Float 애니메이션 정의 */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
