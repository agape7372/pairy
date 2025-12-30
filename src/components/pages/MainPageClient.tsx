'use client'

/**
 * MainPageClient - 마켓플레이스 스타일 메인 페이지
 *
 * 디자인 원칙:
 * - 딸기크림 테마 (#FFD9D9, #D7FAFA)
 * - 파스텔 톤의 부드러운 UI
 * - 카드 기반 레이아웃
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Download,
  Eye,
  Sparkles,
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
} from 'lucide-react'
import { Button, Tag } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import {
  RESOURCE_CATEGORIES,
  type ResourceCategory,
} from '@/types/resources'

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
  },
]

// ============================================
// 샘플 데이터
// ============================================

const trendingTemplates = [
  {
    id: '1',
    title: '커플 프로필 틀',
    category: 'pairtl' as ResourceCategory,
    creator: { name: '딸기크림', verified: true },
    stats: { likes: 1234, downloads: 3456 },
    isPremium: false,
  },
  {
    id: '2',
    title: '벚꽃 이메레스 세트',
    category: 'imeres' as ResourceCategory,
    creator: { name: '체리블라썸', verified: true },
    stats: { likes: 892, downloads: 2341 },
    isPremium: true,
  },
  {
    id: '3',
    title: '전신 포즈 트레틀',
    category: 'tretle' as ResourceCategory,
    creator: { name: '문라이트', verified: false },
    stats: { likes: 567, downloads: 1892 },
    isPremium: false,
  },
  {
    id: '4',
    title: 'TRPG 캐릭터 시트',
    category: 'sessionlog' as ResourceCategory,
    creator: { name: '다이스마스터', verified: true },
    stats: { likes: 789, downloads: 1523 },
    isPremium: false,
  },
  {
    id: '5',
    title: '친구 관계도',
    category: 'pairtl' as ResourceCategory,
    creator: { name: '페어리', verified: true },
    stats: { likes: 456, downloads: 1234 },
    isPremium: false,
  },
  {
    id: '6',
    title: '네온 이펙트 세트',
    category: 'imeres' as ResourceCategory,
    creator: { name: '네온드림', verified: true },
    stats: { likes: 2341, downloads: 892 },
    isPremium: true,
  },
]

const popularCreators = [
  { id: 'strawberry123', name: '딸기크림', avatar: null, followers: 1234, templates: 23, verified: true },
  { id: 'cherry_art', name: '체리블라썸', avatar: null, followers: 892, templates: 15, verified: true },
  { id: 'fairy_art', name: '페어리', avatar: null, followers: 756, templates: 18, verified: true },
  { id: 'moonlight', name: '문라이트', avatar: null, followers: 543, templates: 12, verified: false },
]

const recentTemplates = [
  { id: '10', title: '여름 배경 세트', category: 'imeres' as ResourceCategory, creator: '썸머드림', timeAgo: '방금 전' },
  { id: '11', title: '상반신 포즈 가이드', category: 'tretle' as ResourceCategory, creator: '포즈마스터', timeAgo: '5분 전' },
  { id: '12', title: '우정 관계도', category: 'pairtl' as ResourceCategory, creator: '프렌즈', timeAgo: '15분 전' },
  { id: '13', title: '세션 요약 템플릿', category: 'sessionlog' as ResourceCategory, creator: 'RPG러버', timeAgo: '30분 전' },
  { id: '14', title: '반려동물 프로필', category: 'pairtl' as ResourceCategory, creator: '펫러버', timeAgo: '1시간 전' },
  { id: '15', title: '별빛 이펙트', category: 'imeres' as ResourceCategory, creator: '스타더스트', timeAgo: '2시간 전' },
]

// 카테고리 아이콘 매핑
const categoryIcons: Record<ResourceCategory, typeof Image> = {
  imeres: Image,
  tretle: Pencil,
  pairtl: Users,
  sessionlog: ScrollText,
}

// ============================================
// 배너 슬라이더 컴포넌트
// ============================================

function BannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % banners.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
  }, [])

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
          'bg-gradient-to-r py-8 sm:py-12 px-4 transition-all duration-500',
          banner.bgGradient
        )}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/60 backdrop-blur flex items-center justify-center shadow-lg">
                <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700" strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-white/80 rounded-full text-xs font-bold text-gray-700">
                    {banner.badge}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  {banner.title}
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {banner.description}
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link href={banner.href}>
                {banner.cta}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center hover:bg-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center hover:bg-white transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              idx === currentSlide ? 'bg-gray-800 w-6' : 'bg-gray-400/50'
            )}
          />
        ))}
      </div>
    </section>
  )
}

// ============================================
// 카테고리 퀵 네비게이션
// ============================================

function CategoryNav() {
  return (
    <section className="py-6 px-4 border-b border-gray-100 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {Object.entries(RESOURCE_CATEGORIES).map(([key, category]) => {
            const Icon = categoryIcons[key as ResourceCategory]
            return (
              <Link
                key={key}
                href={`/templates?category=${key}`}
                className="flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-2xl hover:bg-gray-50 transition-colors group"
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105',
                    category.bgColor
                  )}
                >
                  <Icon className={cn('w-7 h-7', category.color)} />
                </div>
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  {category.nameKo}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================
// 트렌딩 템플릿 섹션
// ============================================

function TrendingSection() {
  return (
    <section className="py-8 px-4">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                지금 뜨는 틀
              </h2>
              <p className="text-xs text-gray-500">실시간 인기 템플릿</p>
            </div>
          </div>
          <Link
            href="/templates?sort=trending"
            className="text-sm font-medium text-primary-400 hover:text-primary-500 flex items-center gap-1"
          >
            더보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {trendingTemplates.map((template, idx) => {
            const category = RESOURCE_CATEGORIES[template.category]
            return (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                {/* Preview */}
                <div
                  className={cn(
                    'aspect-square flex items-center justify-center relative',
                    category.bgColor.replace('bg-', 'bg-gradient-to-br from-').replace('-100', '-50') + ' to-' + category.bgColor.replace('bg-', '').replace('-100', '-200')
                  )}
                >
                  {/* Rank Badge */}
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>

                  {template.isPremium && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}

                  <span className="text-4xl">{category.emoji}</span>
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-400 transition-colors">
                    {template.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-500 truncate">
                      {template.creator.name}
                    </span>
                    {template.creator.verified && (
                      <CheckCircle className="w-3 h-3 text-blue-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-0.5">
                      <Heart className="w-3 h-3" />
                      {template.stats.likes}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Download className="w-3 h-3" />
                      {template.stats.downloads}
                    </span>
                  </div>
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
// 인기 크리에이터 섹션
// ============================================

function PopularCreatorsSection() {
  return (
    <section className="py-8 px-4 bg-gray-50">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                인기 크리에이터
              </h2>
              <p className="text-xs text-gray-500">팔로우하고 새 작품 알림 받기</p>
            </div>
          </div>
          <Link
            href="/creators"
            className="text-sm font-medium text-primary-400 hover:text-primary-500 flex items-center gap-1"
          >
            더보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {popularCreators.map((creator) => (
            <Link
              key={creator.id}
              href={`/creator/${creator.id}`}
              className="bg-white rounded-2xl p-4 border border-gray-200 hover:shadow-md transition-all group text-center"
            >
              {/* Avatar */}
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                {creator.avatar ? (
                  <img src={creator.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gray-600">
                    {creator.name[0]}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-1 mb-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-400 transition-colors">
                  {creator.name}
                </h3>
                {creator.verified && (
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                )}
              </div>

              <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {creator.followers.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  {creator.templates}
                </span>
              </div>

              <Button variant="outline" size="sm" className="mt-3 w-full">
                팔로우
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// 최근 업로드 섹션
// ============================================

function RecentUploadsSection() {
  return (
    <section className="py-8 px-4">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                방금 올라온 틀
              </h2>
              <p className="text-xs text-gray-500">따끈따끈한 신작</p>
            </div>
          </div>
          <Link
            href="/templates?sort=recent"
            className="text-sm font-medium text-primary-400 hover:text-primary-500 flex items-center gap-1"
          >
            더보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentTemplates.map((template) => {
            const category = RESOURCE_CATEGORIES[template.category]
            return (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 hover:shadow-md hover:border-primary-200 transition-all group"
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center shrink-0',
                    category.bgColor
                  )}
                >
                  <span className="text-2xl">{category.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-400 transition-colors">
                    {template.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{template.creator}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-green-500">{template.timeAgo}</span>
                  </div>
                </div>
                <Tag variant="primary" className="shrink-0">
                  {category.nameKo}
                </Tag>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================
// 카테고리별 추천 섹션
// ============================================

function CategoryRecommendSection() {
  return (
    <section className="py-8 px-4 bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                카테고리별 추천
              </h2>
              <p className="text-xs text-gray-500">원하는 유형을 골라보세요</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(RESOURCE_CATEGORIES).map(([key, category]) => {
            const Icon = categoryIcons[key as ResourceCategory]
            return (
              <Link
                key={key}
                href={`/templates?category=${key}`}
                className="relative overflow-hidden rounded-2xl p-6 group"
              >
                {/* Background */}
                <div
                  className={cn(
                    'absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity',
                    category.bgColor.replace('-100', '-200')
                  )}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />

                {/* Content */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        category.bgColor
                      )}
                    >
                      <Icon className={cn('w-6 h-6', category.color)} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{category.nameKo}</h3>
                      <p className="text-xs text-gray-500">{category.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      1,234개의 자료
                    </span>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                  </div>
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
// 통계 배너
// ============================================

function StatsBanner() {
  return (
    <section className="py-12 px-4 bg-gradient-to-r from-gray-900 to-gray-800">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { value: '1,200+', label: '틀 템플릿', icon: Image },
            { value: '8,500+', label: '완성된 작품', icon: Download },
            { value: '3,200+', label: '크리에이터', icon: Users },
            { value: '50,000+', label: '활성 사용자', icon: Heart },
          ].map((stat) => (
            <div key={stat.label} className="p-4">
              <stat.icon className="w-8 h-8 mx-auto mb-2 text-primary-300" strokeWidth={1.5} />
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {stat.value}
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
// CTA 섹션
// ============================================

function CTASection() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-[800px] mx-auto">
        <div className="bg-gradient-to-br from-primary-200 via-primary-100 to-accent-200 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
          {/* 장식 */}
          <div className="absolute top-4 left-8 opacity-30">
            <Sparkles className="w-10 h-10 text-gray-700" />
          </div>
          <div className="absolute bottom-8 right-12 opacity-30">
            <Heart className="w-14 h-14 text-gray-700" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 relative">
            지금 시작해보세요
          </h2>
          <p className="text-gray-600 mb-6 relative">
            무료로 가입하고 첫 번째 작품을 만들어보세요
          </p>
          <div className="flex flex-wrap gap-3 justify-center relative">
            <Button size="lg" asChild>
              <Link href="/login">
                무료로 시작하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
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
      {/* 배너 슬라이더 */}
      <BannerSlider />

      {/* 카테고리 네비게이션 */}
      <CategoryNav />

      {/* 트렌딩 템플릿 */}
      <TrendingSection />

      {/* 인기 크리에이터 */}
      <PopularCreatorsSection />

      {/* 최근 업로드 */}
      <RecentUploadsSection />

      {/* 카테고리별 추천 */}
      <CategoryRecommendSection />

      {/* 통계 */}
      <StatsBanner />

      {/* CTA */}
      <CTASection />
    </div>
  )
}
