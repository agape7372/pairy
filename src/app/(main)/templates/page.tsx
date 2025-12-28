'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Heart, X, Plus, SlidersHorizontal } from 'lucide-react'
import { Button, Tag } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

// 태그 목록
const allTags = ['전체', '커플', '친구', '관계도', '프로필', '1인용', '2인용', '3인용+', 'OC', '팬아트']

// 템플릿 타입
interface Template {
  id: string
  title: string
  creator: string
  likeCount: number
  tags: string[]
  emoji: string
  createdAt: string
}

// 더 많은 샘플 데이터
const sampleTemplates: Template[] = [
  {
    id: '1',
    title: '커플 프로필 틀',
    creator: '딸기크림',
    likeCount: 1234,
    tags: ['커플', '2인용'],
    emoji: '💕',
    createdAt: '2025-01-28',
  },
  {
    id: '2',
    title: '친구 관계도',
    creator: '페어리',
    likeCount: 892,
    tags: ['친구', '관계도'],
    emoji: '✨',
    createdAt: '2025-01-27',
  },
  {
    id: '3',
    title: 'OC 소개 카드',
    creator: '문라이트',
    likeCount: 567,
    tags: ['프로필', '1인용', 'OC'],
    emoji: '🌙',
    createdAt: '2025-01-26',
  },
  {
    id: '4',
    title: '베프 케미 틀',
    creator: '민트초코',
    likeCount: 2341,
    tags: ['친구', '2인용'],
    emoji: '🍀',
    createdAt: '2025-01-25',
  },
  {
    id: '5',
    title: '삼각관계 틀',
    creator: '로즈베리',
    likeCount: 1567,
    tags: ['관계도', '3인용+'],
    emoji: '🔺',
    createdAt: '2025-01-24',
  },
  {
    id: '6',
    title: '캐릭터 프로필 카드',
    creator: '스카이블루',
    likeCount: 987,
    tags: ['프로필', '1인용', 'OC'],
    emoji: '📋',
    createdAt: '2025-01-23',
  },
  {
    id: '7',
    title: '팬아트 커플 틀',
    creator: '체리블라썸',
    likeCount: 3456,
    tags: ['팬아트', '커플', '2인용'],
    emoji: '🌸',
    createdAt: '2025-01-22',
  },
  {
    id: '8',
    title: '단체 관계도',
    creator: '코코넛',
    likeCount: 789,
    tags: ['관계도', '3인용+'],
    emoji: '🥥',
    createdAt: '2025-01-21',
  },
  {
    id: '9',
    title: '캐릭터 TMI 틀',
    creator: '라벤더',
    likeCount: 1123,
    tags: ['프로필', '1인용'],
    emoji: '💜',
    createdAt: '2025-01-20',
  },
  {
    id: '10',
    title: '소꿉친구 틀',
    creator: '피치멜로우',
    likeCount: 2156,
    tags: ['친구', '2인용'],
    emoji: '🍑',
    createdAt: '2025-01-19',
  },
  {
    id: '11',
    title: '라이벌 관계도',
    creator: '블랙체리',
    likeCount: 1789,
    tags: ['관계도', '2인용'],
    emoji: '⚔️',
    createdAt: '2025-01-18',
  },
  {
    id: '12',
    title: '최애 프로필',
    creator: '스타더스트',
    likeCount: 4521,
    tags: ['팬아트', '1인용'],
    emoji: '⭐',
    createdAt: '2025-01-17',
  },
]

type SortOption = 'popular' | 'recent' | 'likes'

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 태그 토글
  const toggleTag = (tag: string) => {
    if (tag === '전체') {
      setSelectedTags([])
      return
    }
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // 필터링 및 정렬 (memoized)
  const sortedTemplates = useMemo(() => {
    // 필터링
    const filtered = sampleTemplates.filter((template) => {
      const matchesSearch = searchQuery === '' ||
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => template.tags.includes(tag))

      return matchesSearch && matchesTags
    })

    // 정렬
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'likes':
          return b.likeCount - a.likeCount
        case 'popular':
        default:
          // 인기 = 좋아요 + 최신성 가중치
          const aScore = a.likeCount + (new Date(a.createdAt).getTime() / 100000000)
          const bScore = b.likeCount + (new Date(b.createdAt).getTime() / 100000000)
          return bScore - aScore
      }
    })
  }, [searchQuery, selectedTags, sortBy])

  // 필터 초기화
  const resetFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
    setSortBy('popular')
  }

  const hasFilters = searchQuery !== '' || selectedTags.length > 0

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <section className="py-8 sm:py-12 px-4 bg-gradient-to-b from-primary-100 to-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                틀 <span className="text-accent-400">둘러보기</span>
              </h1>
              <p className="text-gray-500 text-sm sm:text-base">
                다양한 틀을 찾아보고, 마음에 드는 틀로 작업을 시작해보세요.
              </p>
            </div>
            <Button asChild className="shrink-0 w-full sm:w-auto">
              <Link href="/templates/new">
                <Plus className="w-4 h-4 mr-1" />
                새 템플릿 만들기
              </Link>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="틀 이름, 크리에이터, 태그 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all text-sm sm:text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                'px-4 py-3 rounded-full border transition-all flex items-center gap-2',
                showAdvanced
                  ? 'bg-primary-400 text-white border-primary-400'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">필터</span>
            </button>
          </div>
        </div>
      </section>

      {/* Tags & Filters */}
      <section className="border-b border-gray-100 bg-white sticky top-[65px] z-30">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* Quick Tags - Always visible */}
          <div className="py-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedTags([])}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                selectedTags.length === 0
                  ? 'bg-primary-400 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              전체
            </button>
            {allTags.slice(1).map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  selectedTags.includes(tag)
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Advanced Filters */}
          <div className={cn(
            'overflow-hidden transition-all duration-300',
            showAdvanced ? 'max-h-24 py-3 border-t border-gray-100' : 'max-h-0'
          )}>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">정렬:</span>
              <div className="flex gap-2">
                {[
                  { value: 'popular', label: '인기순' },
                  { value: 'recent', label: '최신순' },
                  { value: 'likes', label: '좋아요순' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as SortOption)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      sortBy === option.value
                        ? 'bg-accent-100 text-accent-600'
                        : 'text-gray-500 hover:bg-gray-100'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-6 sm:py-8 px-4">
        <div className="max-w-[1200px] mx-auto">
          {/* Results Header */}
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-gray-500">
                {sortedTemplates.length}개의 틀
              </p>
              {selectedTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full text-xs"
                >
                  {tag}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  초기화
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm text-gray-600 bg-transparent border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:hidden"
            >
              <option value="popular">인기순</option>
              <option value="recent">최신순</option>
              <option value="likes">좋아요순</option>
            </select>
          </div>

          {/* Templates Grid */}
          {sortedTemplates.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {sortedTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className="group bg-white rounded-[16px] sm:rounded-[20px] overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  {/* Preview */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-4xl sm:text-5xl">
                    {template.emoji}
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-primary-400 transition-colors text-sm sm:text-base line-clamp-1">
                      {template.title}
                    </h3>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                        {template.likeCount.toLocaleString()}
                      </span>
                      <span className="truncate">by {template.creator}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {template.tags.slice(0, 2).map((tag, idx) => (
                        <Tag key={tag} variant={idx === 0 ? 'primary' : 'accent'} className="!text-[10px] sm:!text-xs !px-2 !py-0.5">
                          {tag}
                        </Tag>
                      ))}
                      {template.tags.length > 2 && (
                        <span className="text-[10px] sm:text-xs text-gray-400">
                          +{template.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                검색 결과가 없어요
              </h3>
              <p className="text-gray-500 mb-4">
                다른 키워드나 태그로 검색해보세요.
              </p>
              <Button
                variant="secondary"
                onClick={resetFilters}
              >
                필터 초기화
              </Button>
            </div>
          )}

          {/* Load More */}
          {sortedTemplates.length > 0 && sortedTemplates.length >= 12 && (
            <div className="text-center mt-8 sm:mt-12">
              <Button variant="outline">
                더 보기
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
