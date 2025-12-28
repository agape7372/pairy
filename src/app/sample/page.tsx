'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  User,
  Menu,
  X,
  Grid3X3,
  Bookmark,
  Download,
  Heart,
  ArrowUpRight,
  Filter,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ===== 샘플 데이터 =====
const categories = [
  { id: 'all', name: '전체' },
  { id: 'couple', name: '커플틀' },
  { id: 'profile', name: '프로필' },
  { id: 'relationship', name: '관계도' },
  { id: 'oc', name: 'OC 카드' },
  { id: 'group', name: '그룹틀' },
]

const sampleResources = [
  {
    id: '1',
    title: '미니멀 커플 프로필',
    creator: 'studio_mochi',
    thumbnail: '/samples/couple-1.jpg',
    downloads: 2340,
    likes: 892,
    aspectRatio: 'portrait', // 3:4
    color: '#F8E8E8',
  },
  {
    id: '2',
    title: '캐릭터 관계도 v2',
    creator: 'artflow',
    thumbnail: '/samples/relation-1.jpg',
    downloads: 1820,
    likes: 654,
    aspectRatio: 'landscape', // 4:3
    color: '#E8F0F8',
  },
  {
    id: '3',
    title: 'OC 소개 카드 세트',
    creator: 'pixel_garden',
    thumbnail: '/samples/oc-1.jpg',
    downloads: 3100,
    likes: 1205,
    aspectRatio: 'square', // 1:1
    color: '#F0F8E8',
  },
  {
    id: '4',
    title: '심플 듀오 프레임',
    creator: 'duo_studio',
    thumbnail: '/samples/duo-1.jpg',
    downloads: 1560,
    likes: 523,
    aspectRatio: 'portrait',
    color: '#F8F0E8',
  },
  {
    id: '5',
    title: '베스트프렌드 틀',
    creator: 'friend_art',
    thumbnail: '/samples/friend-1.jpg',
    downloads: 980,
    likes: 412,
    aspectRatio: 'landscape',
    color: '#E8E8F8',
  },
  {
    id: '6',
    title: '파스텔 프로필 카드',
    creator: 'pastel_moon',
    thumbnail: '/samples/pastel-1.jpg',
    downloads: 2780,
    likes: 934,
    aspectRatio: 'portrait',
    color: '#F8E8F0',
  },
  {
    id: '7',
    title: '그룹 관계도 템플릿',
    creator: 'group_maker',
    thumbnail: '/samples/group-1.jpg',
    downloads: 1230,
    likes: 567,
    aspectRatio: 'landscape',
    color: '#E8F8F0',
  },
  {
    id: '8',
    title: '커플 Q&A 틀',
    creator: 'qa_design',
    thumbnail: '/samples/qa-1.jpg',
    downloads: 890,
    likes: 345,
    aspectRatio: 'square',
    color: '#F0E8F8',
  },
]

// ===== 새로운 Navbar 컴포넌트 =====
function GalleryNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo - 심플하고 타이포 중심 */}
          <Link href="/sample" className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight text-gray-900">
              Pairy
            </span>
            <span className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">
              Archive
            </span>
          </Link>

          {/* Center Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-12">
            <div
              className={cn(
                'relative w-full transition-all duration-200',
                searchFocused && 'scale-[1.02]'
              )}
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="자료 검색..."
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-0 rounded-full text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          </div>

          {/* Right Actions - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/sample"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Grid3X3 className="w-4 h-4" strokeWidth={1.5} />
              <span>둘러보기</span>
            </Link>
            <Link
              href="/sample"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Bookmark className="w-4 h-4" strokeWidth={1.5} />
              <span>컬렉션</span>
            </Link>
            <div className="w-px h-5 bg-gray-200 mx-2" />
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <User className="w-4 h-4" strokeWidth={1.5} />
              <span>로그인</span>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" strokeWidth={1.5} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-slide-up">
            {/* Mobile Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="자료 검색..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-0 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <nav className="flex flex-col gap-1">
              <Link
                href="/sample"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Grid3X3 className="w-4 h-4" strokeWidth={1.5} />
                둘러보기
              </Link>
              <Link
                href="/sample"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Bookmark className="w-4 h-4" strokeWidth={1.5} />
                컬렉션
              </Link>
              <div className="h-px bg-gray-100 my-2" />
              <Link
                href="/login"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors"
              >
                <User className="w-4 h-4" strokeWidth={1.5} />
                로그인
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

// ===== 카테고리 필터 =====
function CategoryFilter({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all',
            selected === cat.id
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}

// ===== Masonry 그리드 아이템 =====
function ResourceCard({ resource }: { resource: (typeof sampleResources)[0] }) {
  const [isHovered, setIsHovered] = useState(false)

  // 비율에 따른 높이 클래스
  const heightClass = {
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    square: 'aspect-square',
  }[resource.aspectRatio]

  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer break-inside-avoid mb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div
        className={cn('w-full', heightClass)}
        style={{ backgroundColor: resource.color }}
      >
        {/* 실제 이미지가 없으므로 플레이스홀더 표시 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/50 flex items-center justify-center">
              <Grid3X3 className="w-6 h-6 text-gray-600" strokeWidth={1} />
            </div>
            <p className="text-sm font-medium text-gray-700">{resource.title}</p>
          </div>
        </div>
      </div>

      {/* Hover Overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black/0 transition-all duration-300',
          isHovered && 'bg-black/40'
        )}
      >
        {/* Action Buttons - 우상단 */}
        <div
          className={cn(
            'absolute top-3 right-3 flex gap-2 transition-all duration-300',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          )}
        >
          <button className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
            <Bookmark className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
          </button>
          <button className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
            <Download className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
          </button>
        </div>

        {/* Info - 하단 */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent transition-all duration-300',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
        >
          <h3 className="text-sm font-medium text-white mb-1">{resource.title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">@{resource.creator}</span>
            <div className="flex items-center gap-3 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" strokeWidth={1.5} />
                {resource.likes.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" strokeWidth={1.5} />
                {resource.downloads.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Hero 섹션 (갤러리 스타일) =====
function GalleryHero() {
  return (
    <section className="pt-24 pb-12 px-6 lg:px-10">
      <div className="max-w-[1600px] mx-auto">
        {/* 심플한 헤드라인 */}
        <div className="max-w-2xl mb-12">
          <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mb-4 leading-[1.15]">
            당신의 캐릭터를 위한
            <br />
            <span className="text-gray-400">아트 리소스 아카이브</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            커플틀, 프로필 카드, 관계도까지.
            <br className="hidden sm:block" />
            창작에 필요한 모든 템플릿을 한 곳에서.
          </p>
        </div>

        {/* 통계 (미니멀하게) */}
        <div className="flex items-center gap-8 text-sm text-gray-500 mb-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">1,200+</span>
            <span>템플릿</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">8.5K</span>
            <span>크리에이터</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">50K+</span>
            <span>다운로드</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ===== 메인 페이지 =====
export default function SamplePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortOpen, setSortOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-[Pretendard,system-ui,sans-serif]">
      <GalleryNavbar />

      <main>
        <GalleryHero />

        {/* Gallery Section */}
        <section className="px-6 lg:px-10 pb-20">
          <div className="max-w-[1600px] mx-auto">
            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-4 mb-8 sticky top-16 bg-white/80 backdrop-blur-xl py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 z-40 border-b border-gray-100">
              <CategoryFilter
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Filter className="w-4 h-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">정렬</span>
                  <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                </button>

                {sortOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setSortOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      {['인기순', '최신순', '다운로드순', '좋아요순'].map((option) => (
                        <button
                          key={option}
                          className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                          onClick={() => setSortOpen(false)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Masonry Grid */}
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
              {sampleResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
              {/* 더 많은 아이템을 위해 반복 */}
              {sampleResources.map((resource) => (
                <ResourceCard
                  key={`repeat-${resource.id}`}
                  resource={{ ...resource, id: `r-${resource.id}` }}
                />
              ))}
            </div>

            {/* Load More */}
            <div className="flex justify-center mt-12">
              <button className="flex items-center gap-2 px-8 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                더 보기
                <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-100 py-12 px-6 lg:px-10">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">Pairy</span>
              <span className="text-xs text-gray-400">Archive</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="#" className="hover:text-gray-900 transition-colors">
                이용약관
              </Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">
                개인정보
              </Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">
                문의
              </Link>
            </div>
            <p className="text-xs text-gray-400">
              © 2025 Pairy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
