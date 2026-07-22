'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart,
  Bookmark,
  Share2,
  ArrowLeft,
  Download,
  Clock,
  Sparkles,
  Twitter,
  CheckCircle,
  Eye,
  FileImage,
  Maximize,
  Shield,
  AlertCircle,
  FolderPlus,
} from 'lucide-react'
import { Button, Tag, useToast } from '@/components/ui'
import { LikeButton, CommentSection } from '@/components/social'
import { SectionErrorBoundary } from '@/components/common'
import { PricingBadge, PurchaseButton } from '@/components/marketplace'
import { useMarketplaceStore, type PricingType } from '@/stores/marketplaceStore'
import { cn } from '@/lib/utils/cn'
import { copyToClipboard } from '@/lib/utils/clipboard'
import {
  RESOURCE_CATEGORIES,
  LICENSE_INFO,
  FILE_FORMAT_INFO,
  resourceFormatLabel,
  type ResourceCategory,
  type LicenseType,
  type Resource,
} from '@/types/resources'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useBookmarks } from '@/hooks/useBookmarks'
import { useResource } from '@/hooks/useResources'
import { useTemplate, templateToResource } from '@/hooks/useTemplates'
import { IS_DEMO_MODE } from '@/lib/supabase/client'
import styles from '@/styles/particles.module.css'

// 라이선스를 가격 타입으로 변환
function licenseToPricingType(license: LicenseType, price?: number): PricingType {
  if (license === 'paid' && price) return 'paid'
  if (license === 'credit') return 'credit'
  return 'free'
}

// 샘플 자료 데이터 (확장된 형태)
const sampleResources: Record<string, Resource> = {
  '1': {
    id: '1',
    title: '커플 프로필 틀',
    description: '달달한 커플을 위한 프로필 틀이에요. 두 사람의 정보와 함께 케미를 보여줄 수 있어요. 프로필 사진, 이름, 좋아하는 것, 싫어하는 것, 그리고 둘만의 특별한 이야기를 담아보세요!',
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
  '2': {
    id: '2',
    title: '벚꽃 이메레스 세트',
    description: '봄 분위기의 벚꽃 배경 이미지 모음입니다. 고화질 PNG와 PSD 파일로 제공되어 자유롭게 편집하실 수 있어요.',
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
  '3': {
    id: '3',
    title: '전신 포즈 트레틀',
    description: '다양한 전신 포즈 가이드입니다. 서 있는 포즈, 앉은 포즈, 동적 포즈까지 다양하게 포함되어 있어요.',
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
  '4': {
    id: '4',
    title: 'TRPG 캐릭터 시트',
    description: 'D&D 스타일의 캐릭터 시트 템플릿입니다. 스탯, 스킬, 배경 스토리 등을 정리할 수 있어요.',
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
  '5': {
    id: '5',
    title: '친구 관계도',
    description: '친구들과의 관계를 한눈에 볼 수 있는 관계도 틀이에요.',
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
  '6': {
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
  '7': {
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
  '8': {
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
}

// 관련 자료
const getRelatedResources = (category: ResourceCategory, excludeId: string) => {
  return Object.values(sampleResources)
    .filter(r => r.category === category && r.id !== excludeId)
    .slice(0, 3)
}

// 라이선스 배지 컴포넌트
function LicenseBadge({ license, size = 'md' }: { license: LicenseType; size?: 'sm' | 'md' }) {
  const info = LICENSE_INFO[license]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        license === 'free' && 'bg-green-100 text-green-700',
        license === 'credit' && 'bg-blue-100 text-blue-700',
        license === 'noncommercial' && 'bg-amber-100 text-amber-700',
        license === 'paid' && 'bg-purple-100 text-purple-700'
      )}
    >
      {info.icon} {info.name}
    </span>
  )
}

// 투명도 토글 미리보기 컴포넌트
function TransparencyPreview({ hasTransparency }: { hasTransparency: boolean }) {
  const [showTransparency, setShowTransparency] = useState(false)

  return (
    <div className="relative">
      <div
        className={cn(
          'aspect-[4/3] rounded-[24px] flex items-center justify-center text-8xl shadow-lg overflow-hidden',
          showTransparency && hasTransparency
            ? 'bg-[conic-gradient(#e0e0e0_25%,#fff_25%,#fff_50%,#e0e0e0_50%,#e0e0e0_75%,#fff_75%)] bg-[length:20px_20px]'
            : 'bg-gradient-to-br from-primary-200 to-accent-200'
        )}
      >
        <span className="drop-shadow-lg">💕</span>
      </div>

      {/* 투명도 토글 버튼 */}
      {hasTransparency && (
        <button
          onClick={() => setShowTransparency(!showTransparency)}
          className={cn(
            'absolute bottom-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5',
            showTransparency
              ? 'bg-gray-900 text-white'
              : 'bg-white/90 text-gray-700 hover:bg-white'
          )}
        >
          <div className="w-4 h-4 rounded-sm bg-[conic-gradient(#ccc_25%,#fff_25%,#fff_50%,#ccc_50%,#ccc_75%,#fff_75%)] border border-gray-300" />
          {showTransparency ? '투명도 확인 중' : '투명도 확인'}
        </button>
      )}
    </div>
  )
}

interface TemplateDetailClientProps {
  templateId: string
}

export default function TemplateDetailClient({ templateId }: TemplateDetailClientProps) {
  const router = useRouter()
  const toast = useToast()
  const { subscription, incrementDownloads, getRemainingDownloads } = useSubscriptionStore()
  const hasPurchased = useMarketplaceStore((state) => state.hasPurchased(templateId))

  // isLiked state moved to LikeButton component
  // 북마크는 실 useBookmarks 로 배선(로컬 state 제거)
  const { isBookmarked: checkBookmarked, addBookmark, removeBookmark } = useBookmarks()
  const isBookmarked = checkBookmarked(templateId)
  const [showShareToast, setShowShareToast] = useState(false)
  const [showAddToLibrary, setShowAddToLibrary] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const bookmarkContainerRef = useRef<HTMLDivElement>(null)

  // 프로덕션: UUID 면 서버 resources 조회 (M5), 데모/샘플 id 는 sampleResources
  const isServerResource =
    !IS_DEMO_MODE &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId)
  const { resource: serverResource, isLoading: isResourceLoading } = useResource(
    isServerResource ? templateId : null
  )
  // 폴백: resources 에 없으면 게시된 틀(templates 테이블) 조회 — 업로드 틀 상세 표시 (F-16a)
  const { template: serverTemplate, isLoading: isTemplateLoading } = useTemplate(
    isServerResource && !isResourceLoading && !serverResource ? templateId : null
  )

  // Shooting Star 파티클 효과
  const emitShootingStar = useCallback(() => {
    if (!bookmarkContainerRef.current) return

    const container = bookmarkContainerRef.current
    const starCount = 3
    const colors = ['#FFD700', '#FFA500', '#FFFFFF']

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div')
      star.className = styles.shootingStar

      const startX = -30 - i * 15
      const startY = -30 - i * 10
      const delay = i * 100

      star.style.setProperty('--startX', `${startX}px`)
      star.style.setProperty('--startY', `${startY}px`)
      star.style.setProperty('--delay', `${delay}ms`)
      star.style.background = `linear-gradient(90deg, transparent, ${colors[i]}, #FFFFFF)`

      container.appendChild(star)
      setTimeout(() => star.remove(), 700 + delay)
    }

    // 추가로 작은 별 파티클
    for (let i = 0; i < 6; i++) {
      const sparkle = document.createElement('div')
      sparkle.className = styles.starMark

      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.3
      const distance = 20 + Math.random() * 25
      const tx = Math.cos(angle) * distance
      const ty = Math.sin(angle) * distance
      const delay = 50 + i * 30
      const scale = 0.6 + Math.random() * 0.4

      sparkle.style.setProperty('--tx', `${tx}px`)
      sparkle.style.setProperty('--ty', `${ty}px`)
      sparkle.style.setProperty('--delay', `${delay}ms`)
      sparkle.style.setProperty('--scale', `${scale}`)
      sparkle.innerHTML = '✦'
      sparkle.style.color = '#FFD700'
      sparkle.style.fontSize = '12px'

      container.appendChild(sparkle)
      setTimeout(() => sparkle.remove(), 600 + delay)
    }
  }, [])

  const handleBookmarkClick = async () => {
    const wasBookmarked = isBookmarked
    if (wasBookmarked) {
      const ok = await removeBookmark(templateId)
      if (!ok) toast.error('북마크 해제에 실패했어요.')
    } else {
      const ok = await addBookmark(templateId)
      if (ok) {
        emitShootingStar() // 활성화 시에만 Shooting Star
      } else {
        toast.error('북마크에 실패했어요. 로그인 상태를 확인해주세요.')
      }
    }
  }

  const resource = isServerResource
    ? (serverResource ?? (serverTemplate ? templateToResource(serverTemplate) : null))
    : sampleResources[templateId]

  if (isServerResource && (isResourceLoading || (!serverResource && isTemplateLoading))) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🤔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">자료를 찾을 수 없어요</h1>
        <p className="text-gray-500 mb-6">요청하신 자료가 존재하지 않거나 삭제되었을 수 있어요.</p>
        <Button asChild>
          <Link href="/templates">자료 허브로 돌아가기</Link>
        </Button>
      </div>
    )
  }

  const categoryInfo = RESOURCE_CATEGORIES[resource.category]
  const licenseInfo = LICENSE_INFO[resource.license]
  const relatedResources = getRelatedResources(resource.category, resource.id)
  const pricingType = licenseToPricingType(resource.license, resource.price)
  const templatePrice = resource.price || 0

  const handleShare = async () => {
    const success = await copyToClipboard(window.location.href)
    if (success) {
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
    } else {
      toast.error('링크 복사에 실패했어요')
    }
  }

  const handleTwitterShare = () => {
    const text = `${resource.title} by @${resource.creator.username}\n\n${resource.stats.downloads.toLocaleString()}회 다운로드된 인기 자료!\n\n#페어리 #Pairy #${categoryInfo.nameKo}`
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }

  const handleDownload = () => {
    // 중복 클릭 방지
    if (isDownloading) return

    // 유료 자료 체크
    if (resource.license === 'paid') {
      toast.warning('유료 자료입니다. 구매 후 다운로드할 수 있어요.')
      return
    }

    // 프리미엄 자료 체크
    if (resource.isPremium && subscription.tier === 'free') {
      toast.warning('프리미엄 자료입니다. 업그레이드 후 다운로드할 수 있어요.')
      return
    }

    // 다운로드 횟수 체크
    if (!incrementDownloads()) {
      toast.error('이번 달 다운로드 횟수를 모두 사용했어요. 프리미엄으로 업그레이드하세요!')
      return
    }

    // 실 다운로드 (M5 서버 자료): 파일 URL 또는 외부 배포 링크
    // http/https 만 허용 — DB 를 우회 삽입한 javascript:/data: 스킴 XSS 차단
    const rawTarget = resource.downloadUrl || resource.externalUrl
    const target = rawTarget && /^https?:\/\//i.test(rawTarget) ? rawTarget : null
    if (target) {
      window.open(target, '_blank', 'noopener,noreferrer')
      toast.success('다운로드가 시작되었습니다!')
      return
    }

    if (isServerResource) {
      toast.warning('다운로드할 파일이 등록되지 않은 자료예요.')
      return
    }

    // 데모: 0.5초 후 완료
    setIsDownloading(true)
    setTimeout(() => {
      setIsDownloading(false)
      toast.success('다운로드가 시작되었습니다!')
    }, 500)
  }

  const handleStartWork = () => {
    router.push(`/editor/new?template=${templateId}`)
  }

  // 실배선(2026-07-19): 이전엔 아무것도 저장하지 않고 성공 토스트만 띄우던 가짜 성공.
  // 북마크(실 저장, /my/bookmarks 에 표시)로 연결한다.
  const handleAddToLibrary = async () => {
    if (isBookmarked) {
      toast.info('이미 서재(북마크)에 있어요.')
      return
    }
    setShowAddToLibrary(true)
    const ok = await addBookmark(templateId)
    setShowAddToLibrary(false)
    if (ok) {
      toast.success('서재(북마크)에 추가했어요!')
    } else {
      toast.error('추가에 실패했어요. 로그인 상태를 확인해주세요.')
    }
  }

  const remainingDownloads = getRemainingDownloads()

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
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로 가기
          </button>

          {/* 카테고리 배지 */}
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
            categoryInfo.bgColor,
            categoryInfo.color
          )}>
            {categoryInfo.emoji} {categoryInfo.nameKo}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-8 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Preview */}
            <div className="lg:col-span-3">
              <TransparencyPreview hasTransparency={resource.fileInfo.hasTransparency} />

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
                    💕
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-2">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {resource.tags.map((tag, idx) => (
                  <Tag key={tag} variant={idx === 0 ? 'primary' : 'accent'}>
                    {tag}
                  </Tag>
                ))}
                {resource.isPremium && (
                  <Tag variant="accent" className="!bg-gradient-to-r from-amber-100 to-orange-100 !text-orange-700">
                    <Sparkles className="w-3 h-3 mr-1" />
                    PRO
                  </Tag>
                )}
              </div>

              {/* Title */}
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {resource.title}
                </h1>
                <PricingBadge pricingType={pricingType} price={templatePrice} />
              </div>

              {/* Creator */}
              <Link
                href={`/creator/${resource.creator.username}`}
                className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-400 transition-colors mb-4"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-200 to-accent-200" />
                <span className="text-sm">by {resource.creator.displayName}</span>
                {resource.creator.isVerified && (
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                )}
              </Link>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Download className="w-4 h-4" />
                  <span>{resource.stats.downloads.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Heart className="w-4 h-4" />
                  <span>{resource.stats.likes.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Eye className="w-4 h-4" />
                  <span>{resource.stats.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{resource.createdAt}</span>
                </div>
              </div>

              {/* File Info */}
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileImage className="w-4 h-4" />
                  파일 정보
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">포맷:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {resource.fileInfo.format.length > 0
                        ? resource.fileInfo.format.map(f => f.toUpperCase()).join(', ')
                        : resourceFormatLabel(resource) || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">크기:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {resource.fileInfo.sizeKB > 1000
                        ? `${(resource.fileInfo.sizeKB / 1024).toFixed(1)}MB`
                        : `${resource.fileInfo.sizeKB}KB`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {resource.fileInfo.width} × {resource.fileInfo.height}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {resource.fileInfo.hasTransparency ? (
                      <>
                        <div className="w-4 h-4 rounded-sm bg-[conic-gradient(#ccc_25%,#fff_25%,#fff_50%,#ccc_50%,#ccc_75%,#fff_75%)] border border-gray-300" />
                        <span className="font-medium text-gray-900">투명 배경</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 rounded-sm bg-white border border-gray-300" />
                        <span className="font-medium text-gray-900">배경 포함</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* License Info */}
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  이용 조건
                </h4>
                <div className="flex items-start gap-3">
                  <LicenseBadge license={resource.license} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">{licenseInfo.description}</p>
                    {licenseInfo.requirements.length > 0 && (
                      <ul className="text-xs text-gray-500 space-y-1">
                        {licenseInfo.requirements.map((req) => (
                          <li key={req} className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {resource.license === 'paid' && resource.price && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-2xl font-bold text-gray-900">
                      ₩{resource.price.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {resource.description}
              </p>

              {/* Download Limit Warning */}
              {subscription.tier === 'free' && remainingDownloads <= 5 && (
                <div className={cn(
                  'mb-4 p-3 rounded-xl flex items-center justify-between',
                  remainingDownloads === 0 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                )}>
                  <span className={cn(
                    'text-sm',
                    remainingDownloads === 0 ? 'text-red-700' : 'text-amber-700'
                  )}>
                    {remainingDownloads === 0
                      ? '이번 달 다운로드 횟수를 모두 사용했어요'
                      : `이번 달 다운로드 ${remainingDownloads}회 남았어요`}
                  </span>
                  <Button size="sm" variant={remainingDownloads === 0 ? 'primary' : 'outline'} asChild>
                    <Link href="/premium">무제한</Link>
                  </Button>
                </div>
              )}

              {/* Actions */}
              <div className="mb-4">
                {pricingType === 'paid' ? (
                  <PurchaseButton
                    template={{
                      id: resource.id,
                      title: resource.title,
                      preview: resource.thumbnailUrl || '',
                      creatorId: resource.creator.id,
                      creatorName: resource.creator.displayName,
                      price: templatePrice,
                      pricingType: pricingType,
                    }}
                    onUseTemplate={handleStartWork}
                    fullWidth
                  />
                ) : (
                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={handleDownload}
                      disabled={isDownloading}
                    >
                      <Download className={cn('w-5 h-5 mr-2', isDownloading && 'animate-bounce')} />
                      {isDownloading ? '다운로드 중...' : '다운로드'}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleAddToLibrary}
                      className={cn(showAddToLibrary && 'animate-pulse')}
                    >
                      <FolderPlus className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* 에디터로 시작하기 (페어틀 전용) */}
              {resource.category === 'pairtl' && (
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full mb-4"
                  onClick={handleStartWork}
                >
                  이 틀로 에디터에서 시작하기
                </Button>
              )}

              <div className="flex gap-3">
                <LikeButton
                  templateId={templateId}
                  initialLikeCount={resource.stats.likes}
                  variant="outline"
                  className="flex-1"
                />
                <div className="relative flex-1">
                  <Button
                    variant={isBookmarked ? 'accent' : 'outline'}
                    className="w-full"
                    onClick={handleBookmarkClick}
                  >
                    <Bookmark className={cn('w-5 h-5 mr-2', isBookmarked && 'fill-current')} />
                    {isBookmarked ? '저장됨' : '저장하기'}
                  </Button>
                  {/* Shooting Star 파티클 컨테이너 */}
                  <div
                    ref={bookmarkContainerRef}
                    className="absolute inset-0 overflow-visible pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
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

      {/* Related Resources */}
      {relatedResources.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              비슷한 <span className="text-accent-400">{categoryInfo.nameKo}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedResources.map((related) => (
                <Link
                  key={related.id}
                  href={`/templates/${related.id}`}
                  className="group bg-white rounded-[20px] overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-5xl relative">
                    {RESOURCE_CATEGORIES[related.category].emoji}
                    {related.isPremium && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        PRO
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-400 transition-colors flex-1">
                        {related.title}
                      </h3>
                      {related.creator.isVerified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">by {related.creator.displayName}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {related.stats.downloads.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {related.stats.likes.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 댓글 섹션 */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <SectionErrorBoundary sectionName="댓글">
            <CommentSection templateId={templateId} />
          </SectionErrorBoundary>
        </div>
      </section>
    </div>
  )
}
