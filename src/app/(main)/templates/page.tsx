'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Heart, Filter, X } from 'lucide-react'
import { Button, Tag } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

// 임시 샘플 데이터
const allTags = ['전체', '커플', '친구', '관계도', '프로필', '1인용', '2인용', '3인용+', 'OC', '팬아트']

const sampleTemplates = [
  {
    id: '1',
    title: '커플 프로필 틀',
    creator: '딸기크림',
    likeCount: 1234,
    tags: ['커플', '2인용'],
    emoji: '💕',
  },
  {
    id: '2',
    title: '친구 관계도',
    creator: '페어리',
    likeCount: 892,
    tags: ['친구', '관계도'],
    emoji: '✨',
  },
  {
    id: '3',
    title: 'OC 소개 카드',
    creator: '문라이트',
    likeCount: 567,
    tags: ['프로필', '1인용', 'OC'],
    emoji: '🌙',
  },
  {
    id: '4',
    title: '베프 케미 틀',
    creator: '민트초코',
    likeCount: 2341,
    tags: ['친구', '2인용'],
    emoji: '🍀',
  },
  {
    id: '5',
    title: '삼각관계 틀',
    creator: '로즈베리',
    likeCount: 1567,
    tags: ['관계도', '3인용+'],
    emoji: '🔺',
  },
  {
    id: '6',
    title: '캐릭터 프로필 카드',
    creator: '스카이블루',
    likeCount: 987,
    tags: ['프로필', '1인용', 'OC'],
    emoji: '📋',
  },
  {
    id: '7',
    title: '팬아트 커플 틀',
    creator: '체리블라썸',
    likeCount: 3456,
    tags: ['팬아트', '커플', '2인용'],
    emoji: '🌸',
  },
  {
    id: '8',
    title: '단체 관계도',
    creator: '코코넛',
    likeCount: 789,
    tags: ['관계도', '3인용+'],
    emoji: '🥥',
  },
  {
    id: '9',
    title: '캐릭터 TMI 틀',
    creator: '라벤더',
    likeCount: 1123,
    tags: ['프로필', '1인용'],
    emoji: '💜',
  },
]

type SortOption = 'popular' | 'recent' | 'likes'

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('전체')
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [showFilters, setShowFilters] = useState(false)

  // 필터링된 템플릿
  const filteredTemplates = sampleTemplates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.creator.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = selectedTag === '전체' || template.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  // 정렬
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortBy === 'likes') return b.likeCount - a.likeCount
    // TODO: Add recent sort when we have timestamps
    return b.likeCount - a.likeCount // default to popular
  })

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <section className="py-12 px-4 bg-gradient-to-b from-primary-100 to-white">
        <div className="max-w-[1200px] mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            틀 <span className="text-accent-400">둘러보기</span>
          </h1>
          <p className="text-gray-500 mb-8">
            다양한 틀을 찾아보고, 마음에 드는 틀로 작업을 시작해보세요.
          </p>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="틀 이름이나 크리에이터로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all"
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
            <Button
              variant="outline"
              className="!rounded-full px-4"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline ml-2">필터</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Filters & Content */}
      <section className="py-8 px-4">
        <div className="max-w-[1200px] mx-auto">
          {/* Tags Filter */}
          <div className={cn(
            'overflow-hidden transition-all duration-300',
            showFilters ? 'max-h-40 opacity-100 mb-6' : 'max-h-0 opacity-0'
          )}>
            <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    selectedTag === tag
                      ? 'bg-primary-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Results Header */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-500">
              {sortedTemplates.length}개의 틀
              {selectedTag !== '전체' && (
                <span className="ml-2">
                  <Tag variant="primary" className="!text-xs">{selectedTag}</Tag>
                </span>
              )}
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm text-gray-600 bg-transparent border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="popular">인기순</option>
              <option value="recent">최신순</option>
              <option value="likes">좋아요순</option>
            </select>
          </div>

          {/* Templates Grid */}
          {sortedTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className="group bg-white rounded-[20px] overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  {/* Preview */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-5xl">
                    {template.emoji}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-400 transition-colors">
                      {template.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {template.likeCount.toLocaleString()}
                      </span>
                      <span>by {template.creator}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag, idx) => (
                        <Tag key={tag} variant={idx === 0 ? 'primary' : 'accent'}>
                          {tag}
                        </Tag>
                      ))}
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
                onClick={() => {
                  setSearchQuery('')
                  setSelectedTag('전체')
                }}
              >
                필터 초기화
              </Button>
            </div>
          )}

          {/* Load More */}
          {sortedTemplates.length > 0 && (
            <div className="text-center mt-12">
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
