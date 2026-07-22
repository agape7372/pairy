'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Heart,
  X,
  Plus,
  SlidersHorizontal,
  Download,
  Eye,
  CheckCircle,
  Sparkles,
  Image,
  Pencil,
  Users,
  ScrollText,
  Trash2,
  FileImage,
  Edit3,
  Dices,
  Terminal,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import {
  RESOURCE_CATEGORIES,
  CATEGORY_TAGS,
  LICENSE_INFO,
  type ResourceCategory,
  type LicenseType,
  resourceFormatLabel,
  type Resource,
} from '@/types/resources'
import {
  getCustomTemplates,
  deleteCustomTemplate,
  type CustomTemplate,
} from '@/lib/utils/customTemplateStorage'
import { useResources } from '@/hooks/useResources'
import { useTemplates, templateToResource } from '@/hooks/useTemplates'
import { getResourcePosts, toResourceViewModel } from '@/lib/utils/resourceStorage'
import { IS_DEMO_MODE } from '@/lib/supabase/client'

// 카테고리 아이콘 매핑
const categoryIcons: Record<ResourceCategory, typeof Image> = {
  imeres: Image,
  tretle: Pencil,
  pairtl: Users,
  sessionlog: ScrollText,
  cocofolia: Dices,
  program: Terminal,
}

// 샘플 자료 데이터 (허브 형태)
const sampleResources: Resource[] = [
  {
    id: '1',
    title: '커플 프로필 틀',
    description: '달달한 커플을 위한 프로필 틀이에요.',
    category: 'pairtl',
    tags: ['커플', '2인용'],
    creator: {
      id: 'strawberry123',
      displayName: '딸기크림',
      username: 'strawberry123',
      isVerified: true,
    },
    fileInfo: {
      format: ['png'],
      width: 1200,
      height: 900,
      sizeKB: 450,
      hasTransparency: true,
    },
    license: 'credit',
    stats: { views: 5234, downloads: 1234, likes: 892, uses: 2847 },
    thumbnailUrl: '',
    previewUrls: [],
    createdAt: '2025-01-28',
    updatedAt: '2025-01-28',
    isPremium: false,
  },
  {
    id: '2',
    title: '벚꽃 이메레스 세트',
    description: '봄 분위기의 벚꽃 배경 이미지 모음',
    category: 'imeres',
    tags: ['배경', '이펙트', '소스'],
    creator: {
      id: 'cherry_art',
      displayName: '체리블라썸',
      username: 'cherry_art',
      isVerified: true,
    },
    fileInfo: {
      format: ['png', 'psd'],
      width: 2000,
      height: 1500,
      sizeKB: 2400,
      hasTransparency: true,
    },
    license: 'credit',
    stats: { views: 8923, downloads: 3456, likes: 1567, uses: 4521 },
    thumbnailUrl: '',
    previewUrls: [],
    createdAt: '2025-01-26',
    updatedAt: '2025-01-26',
    isPremium: true,
  },
  {
    id: '3',
    title: '전신 포즈 트레틀',
    description: '다양한 전신 포즈 가이드 트레이싱 틀',
    category: 'tretle',
    tags: ['전신', '포즈'],
    creator: {
      id: 'moonlight',
      displayName: '문라이트',
      username: 'moonlight',
      isVerified: false,
    },
    fileInfo: {
      format: ['png', 'clip'],
      width: 1500,
      height: 2100,
      sizeKB: 890,
      hasTransparency: true,
    },
    license: 'noncommercial',
    stats: { views: 4567, downloads: 892, likes: 567, uses: 1234 },
    thumbnailUrl: '',
    previewUrls: [],
    createdAt: '2025-01-24',
    updatedAt: '2025-01-24',
    isPremium: false,
  },
  {
    id: '4',
    title: 'TRPG 캐릭터 시트',
    description: 'D&D 스타일 캐릭터 시트 템플릿',
    category: 'sessionlog',
    tags: ['TRPG', '캐릭터시트'],
    creator: {
      id: 'dice_master',
      displayName: '다이스마스터',
      username: 'dice_master',
      isVerified: true,
    },
    fileInfo: {
      format: ['png', 'psd'],
      width: 1800,
      height: 2400,
      sizeKB: 1200,
      hasTransparency: false,
    },
    license: 'free',
    stats: { views: 3245, downloads: 1123, likes: 789, uses: 2156 },
    thumbnailUrl: '',
    previewUrls: [],
    createdAt: '2025-01-22',
    updatedAt: '2025-01-22',
    isPremium: false,
  },
  {
    id: '5',
    title: '친구 관계도',
    description: '친구들과의 관계를 한눈에 볼 수 있는 관계도 틀',
    category: 'pairtl',
    tags: ['친구', '관계도'],
    creator: {
      id: 'fairy_art',
      displayName: '페어리',
      username: 'fairy_art',
      isVerified: true,
    },
    fileInfo: {
      format: ['png'],
      width: 1600,
      height: 1200,
      sizeKB: 680,
      hasTransparency: true,
    },
    license: 'credit',
    stats: { views: 4892, downloads: 892, likes: 456, uses: 1523 },
    thumbnailUrl: '',
    previewUrls: [],
    createdAt: '2025-01-20',
    updatedAt: '2025-01-20',
    isPremium: false,
  },
  {
    id: '6',
    title: '손 포즈 모음 트레틀',
    description: '다양한 손 포즈 레퍼런스 가이드',
    category: 'tretle',
    tags: ['손', '포즈'],
    creator: {
      id: 'hand_study',
      displayName: '핸드스터디',
      username: 'hand_study',
      isVerified: false,
    },
    fileInfo: {
      format: ['png'],
      width: 2000,
      height: 2000,
      sizeKB: 1500,
      hasTransparency: true,
    },
    license: 'credit',
    stats: { views: 6789, downloads: 2341, likes: 1234, uses: 3456 },
    thumbnailUrl: '',
    previewUrls: [],
    createdAt: '2025-01-18',
    updatedAt: '2025-01-18',
    isPremium: true,
  },
  {
    id: '7',
    title: '네온 이펙트 세트',
    description: '사이버펑크 느낌의 네온 이펙트 모음',
    category: 'imeres',
    tags: ['이펙트', '데코'],
    creator: {
      id: 'neon_dreams',
      displayName: '네온드림',
      username: 'neon_dreams',
      isVerified: true,
    },
    fileInfo: {
      format: ['png', 'psd'],
      width: 1920,
      height: 1080,
      sizeKB: 3200,
      hasTransparency: true,
    },
    license: 'paid',
    price: 2000,
    stats: { views: 12456, downloads: 567, likes: 2341, uses: 892 },
    thumbnailUrl: '',
    previewUrls: [],
    createdAt: '2025-01-16',
    updatedAt: '2025-01-16',
    isPremium: true,
  },
  {
    id: '8',
    title: '세션 기록 템플릿',
    description: 'TRPG 세션 진행 기록용 템플릿',
    category: 'sessionlog',
    tags: ['세션기록', 'TRPG'],
    creator: {
      id: 'rpg_lover',
      displayName: 'RPG러버',
      username: 'rpg_lover',
      isVerified: false,
    },
    fileInfo: {
      format: ['png'],
      width: 1200,
      height: 1600,
      sizeKB: 420,
      hasTransparency: false,
    },
    license: 'free',
    stats: { views: 2134, downloads: 456, likes: 234, uses: 789 },
    thumbnailUrl: '',
    previewUrls: [],
    createdAt: '2025-01-14',
    updatedAt: '2025-01-14',
    isPremium: false,
  },
]

// 카테고리별 이모지 반환
const getCategoryEmoji = (category: ResourceCategory) => {
  return RESOURCE_CATEGORIES[category].emoji
}

// 라이선스 뱃지 컴포넌트
function LicenseBadge({ license, price }: { license: LicenseType; price?: number }) {
  const info = LICENSE_INFO[license]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        license === 'free' && 'bg-green-100 text-green-700',
        license === 'credit' && 'bg-blue-100 text-blue-700',
        license === 'noncommercial' && 'bg-amber-100 text-amber-700',
        license === 'paid' && 'bg-purple-100 text-purple-700'
      )}
    >
      {info.icon} {license === 'paid' && price ? `₩${price.toLocaleString()}` : info.name}
    </span>
  )
}

export default function ResourceHubPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'downloads' | 'likes'>('popular')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 커스텀 템플릿 상태
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])

  // 커스텀 템플릿 로드 — localStorage 는 SSR 에 없어 hydration 후 effect 로드가 안전
  useEffect(() => {
    const templates = getCustomTemplates()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 클라 전용 저장소 초기 로드
    setCustomTemplates(templates)
  }, [])

  // 커스텀 템플릿 삭제
  const handleDeleteCustomTemplate = (id: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteCustomTemplate(id)
      setCustomTemplates(getCustomTemplates())
    }
  }

  // 현재 카테고리에 맞는 태그 목록
  const availableTags = useMemo(() => {
    if (selectedCategory === 'all') {
      return Object.values(CATEGORY_TAGS).flat()
    }
    return CATEGORY_TAGS[selectedCategory]
  }, [selectedCategory])

  // 태그 토글
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // 카테고리 변경 시 태그 초기화
  const handleCategoryChange = (category: ResourceCategory | 'all') => {
    setSelectedCategory(category)
    setSelectedTags([])
  }

  // 자료 목록 — 프로덕션: 서버 templates(게시된 틀, F-16a) + resources(M5) / 데모: 내 업로드 + 샘플
  // read-path 배선: 업로드된 틀/자료가 write-only 로 실종되던 공백을 메꾼다.
  const { resources: serverResources } = useResources()
  const { templates: serverTemplates } = useTemplates({ limit: 48, sortBy: 'recent' })
  const [demoUploads, setDemoUploads] = useState<Resource[]>([])
  useEffect(() => {
    if (!IS_DEMO_MODE) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 클라 전용 저장소 초기 로드
    setDemoUploads(getResourcePosts().map(toResourceViewModel))
  }, [])
  const serverTemplateCards = useMemo(
    () => serverTemplates.map(templateToResource),
    [serverTemplates]
  )
  const allResources = IS_DEMO_MODE
    ? [...demoUploads, ...sampleResources]
    : [...serverTemplateCards, ...serverResources]

  // 필터링 및 정렬
  const filteredResources = useMemo(() => {
    // 필터링
    const filtered = allResources.filter((resource) => {
      const matchesSearch =
        searchQuery === '' ||
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.creator.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory =
        selectedCategory === 'all' || resource.category === selectedCategory

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => resource.tags.includes(tag))

      return matchesSearch && matchesCategory && matchesTags
    })

    // 정렬
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'downloads':
          return b.stats.downloads - a.stats.downloads
        case 'likes':
          return b.stats.likes - a.stats.likes
        case 'popular':
        default:
          const aScore =
            a.stats.downloads * 2 + a.stats.likes + a.stats.views * 0.1
          const bScore =
            b.stats.downloads * 2 + b.stats.likes + b.stats.views * 0.1
          return bScore - aScore
      }
    })
  }, [allResources, searchQuery, selectedCategory, selectedTags, sortBy])

  // 필터 초기화
  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedTags([])
    setSortBy('popular')
  }

  const hasFilters =
    searchQuery !== '' || selectedCategory !== 'all' || selectedTags.length > 0

  return (
    <div className="animate-fade-in">
      {/* 내 커스텀 템플릿 섹션 */}
      {customTemplates.length > 0 && (
        <section className="py-6 px-4 bg-gradient-to-b from-accent-50 to-white border-b border-accent-100">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileImage className="w-5 h-5 text-accent-500" />
                <h2 className="text-lg font-bold text-gray-900">
                  내 커스텀 템플릿
                </h2>
                <span className="px-2 py-0.5 bg-accent-100 text-accent-600 text-xs font-medium rounded-full">
                  {customTemplates.length}개
                </span>
              </div>
              <Link
                href="/templates/new"
                className="text-sm text-accent-600 hover:text-accent-700 font-medium"
              >
                + 새로 만들기
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {customTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* 썸네일 */}
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {template.compositeImage ? (
                      <img
                        src={template.compositeImage}
                        alt={template.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-accent-100">
                        <span className="text-4xl">{template.emoji}</span>
                      </div>
                    )}
                    {/* 호버 오버레이 */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Link
                        href={`/canvas-editor/custom?id=${template.id}`}
                        className="p-2 bg-white rounded-lg text-gray-700 hover:bg-primary-100"
                        title="에디터에서 열기"
                      >
                        <Edit3 className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteCustomTemplate(template.id)}
                        className="p-2 bg-white rounded-lg text-gray-700 hover:bg-red-100 hover:text-red-600"
                        title="삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* 정보 */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{template.emoji}</span>
                      <h3 className="font-semibold text-gray-900 truncate flex-1">
                        {template.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                      {template.description || '설명 없음'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {template.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {template.canvasSize.width}×{template.canvasSize.height}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hero - 자료 허브 */}
      <section className="py-8 sm:py-12 px-4 bg-gradient-to-b from-primary-100 to-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                자료 <span className="text-accent-400">허브</span>
              </h1>
              <p className="text-gray-500 text-sm sm:text-base">
                이메레스, 트레틀, 페어틀, 세션로그까지. 필요한 모든 자료를 한곳에서.
              </p>
            </div>
            <Button asChild className="shrink-0 w-full sm:w-auto">
              <Link href="/resources/new">
                <Plus className="w-4 h-4 mr-1" />
                자료 업로드
              </Link>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="자료 이름, 크리에이터, 태그 검색..."
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

      {/* Category Tabs */}
      <section className="border-b border-gray-100 bg-white sticky top-[65px] z-30">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="py-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => handleCategoryChange('all')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2',
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Sparkles className="w-4 h-4" />
              전체
            </button>
            {Object.entries(RESOURCE_CATEGORIES).map(([key, category]) => {
              const Icon = categoryIcons[key as ResourceCategory]
              return (
                <button
                  key={key}
                  onClick={() => handleCategoryChange(key as ResourceCategory)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2',
                    selectedCategory === key
                      ? `${category.bgColor} ${category.color}`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {category.nameKo}
                </button>
              )
            })}
          </div>

          {/* Tags & Advanced Filters */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              showAdvanced ? 'max-h-40 py-3 border-t border-gray-100' : 'max-h-0'
            )}
          >
            {/* Tags */}
            <div className="flex gap-2 flex-wrap mb-3">
              {availableTags.slice(0, 12).map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all',
                    selectedTags.includes(tag)
                      ? 'bg-accent-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">정렬:</span>
              <div className="flex gap-2">
                {[
                  { value: 'popular', label: '인기순' },
                  { value: 'recent', label: '최신순' },
                  { value: 'downloads', label: '다운로드순' },
                  { value: 'likes', label: '좋아요순' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setSortBy(option.value as typeof sortBy)
                    }
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
                {filteredResources.length}개의 자료
              </p>
              {selectedTags.map((tag) => (
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
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm text-gray-600 bg-transparent border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:hidden"
            >
              <option value="popular">인기순</option>
              <option value="recent">최신순</option>
              <option value="downloads">다운로드순</option>
              <option value="likes">좋아요순</option>
            </select>
          </div>

          {/* Resources Grid */}
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredResources.map((resource) => (
                <Link
                  key={resource.id}
                  href={`/templates/${resource.id}`}
                  className="group bg-white rounded-[16px] sm:rounded-[20px] overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  {/* Preview */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-4xl sm:text-5xl relative">
                    {getCategoryEmoji(resource.category)}

                    {/* Premium Badge */}
                    {resource.isPremium && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        PRO
                      </div>
                    )}

                    {/* Transparency Indicator */}
                    {resource.fileInfo.hasTransparency && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center" title="투명 배경">
                        <div className="w-4 h-4 rounded-sm bg-[conic-gradient(#ccc_25%,#fff_25%,#fff_50%,#ccc_50%,#ccc_75%,#fff_75%)]" />
                      </div>
                    )}

                    {/* Category Badge */}
                    <div
                      className={cn(
                        'absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium',
                        RESOURCE_CATEGORIES[resource.category].bgColor,
                        RESOURCE_CATEGORIES[resource.category].color
                      )}
                    >
                      {RESOURCE_CATEGORIES[resource.category].nameKo}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-400 transition-colors text-sm sm:text-base line-clamp-1 flex-1">
                        {resource.title}
                      </h3>
                      {resource.creator.isVerified && (
                        <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                    </div>

                    {/* Creator */}
                    <p className="text-xs text-gray-500 mb-2">
                      by {resource.creator.displayName}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400 mb-2">
                      <span className="flex items-center gap-0.5">
                        <Download className="w-3 h-3" />
                        {resource.stats.downloads.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Heart className="w-3 h-3" />
                        {resource.stats.likes.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-3 h-3" />
                        {resource.stats.views.toLocaleString()}
                      </span>
                    </div>

                    {/* License & File Info */}
                    <div className="flex items-center justify-between">
                      <LicenseBadge
                        license={resource.license}
                        price={resource.price}
                      />
                      <span className="text-xs text-gray-400">
                        {resourceFormatLabel(resource)}
                      </span>
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
                다른 키워드나 카테고리로 검색해보세요.
              </p>
              <Button variant="secondary" onClick={resetFilters}>
                필터 초기화
              </Button>
            </div>
          )}

        </div>
      </section>

      {/* Category Info Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            카테고리 <span className="text-accent-400">안내</span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(RESOURCE_CATEGORIES).map(([key, category]) => {
              const Icon = categoryIcons[key as ResourceCategory]
              return (
                <button
                  key={key}
                  onClick={() => handleCategoryChange(key as ResourceCategory)}
                  className={cn(
                    'p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md',
                    selectedCategory === key
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                      category.bgColor
                    )}
                  >
                    <Icon className={cn('w-5 h-5', category.color)} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    {category.nameKo}
                  </h3>
                  <p className="text-xs text-gray-500">{category.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
