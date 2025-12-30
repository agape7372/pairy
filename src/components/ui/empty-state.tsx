'use client'

/**
 * EmptyState - 빈 상태 컴포넌트
 *
 * UX 서사: "텅 빈 캔버스도 가능성으로 가득 차 있다는 것을 알려주는,
 *          따뜻하고 격려하는 안내자"
 *
 * 빈 상태는 '없음'이 아니라 '시작'을 의미합니다.
 * 사용자가 첫 발을 내딛도록 부드럽게 손을 내밉니다.
 */

import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { usePrefersReducedMotion } from '@/hooks/useAccessibility'
import {
  Sparkles,
  Folder,
  Heart,
  Image,
  Search,
  BookOpen,
  Users,
  Palette,
  FileQuestion,
  type LucideIcon,
} from 'lucide-react'
import { Button } from './button'

// 빈 상태 유형별 기본 설정
type EmptyStateVariant =
  | 'bookmarks'
  | 'library'
  | 'works'
  | 'search'
  | 'templates'
  | 'followers'
  | 'purchases'
  | 'default'

interface VariantConfig {
  icon: LucideIcon
  title: string
  description: string
  illustration: 'garden' | 'canvas' | 'compass' | 'star' | 'book'
  color: string
}

const variantConfigs: Record<EmptyStateVariant, VariantConfig> = {
  bookmarks: {
    icon: Heart,
    title: '아직 저장한 자료가 없어요',
    description: '마음에 드는 자료를 발견하면\n하트를 눌러 저장해보세요',
    illustration: 'garden',
    color: 'from-pink-100 to-rose-100',
  },
  library: {
    icon: Folder,
    title: '라이브러리가 비어있어요',
    description: '첫 번째 폴더를 만들어\n자료를 정리해보세요',
    illustration: 'book',
    color: 'from-amber-100 to-orange-100',
  },
  works: {
    icon: Palette,
    title: '아직 작품이 없어요',
    description: '당신만의 첫 작품을\n만들어볼까요?',
    illustration: 'canvas',
    color: 'from-purple-100 to-pink-100',
  },
  search: {
    icon: Search,
    title: '검색 결과가 없어요',
    description: '다른 키워드로 검색하거나\n카테고리를 둘러보세요',
    illustration: 'compass',
    color: 'from-blue-100 to-cyan-100',
  },
  templates: {
    icon: Image,
    title: '템플릿을 찾지 못했어요',
    description: '새로운 템플릿이 곧 올라올 거예요\n조금만 기다려주세요',
    illustration: 'star',
    color: 'from-green-100 to-emerald-100',
  },
  followers: {
    icon: Users,
    title: '아직 팔로워가 없어요',
    description: '멋진 작품을 공유하면\n팔로워가 생길 거예요',
    illustration: 'garden',
    color: 'from-violet-100 to-purple-100',
  },
  purchases: {
    icon: BookOpen,
    title: '구매 내역이 없어요',
    description: '마켓플레이스에서\n멋진 자료를 찾아보세요',
    illustration: 'book',
    color: 'from-teal-100 to-cyan-100',
  },
  default: {
    icon: FileQuestion,
    title: '아무것도 없어요',
    description: '여기에 무언가가 채워질 거예요',
    illustration: 'star',
    color: 'from-gray-100 to-slate-100',
  },
}

// SVG 일러스트레이션 컴포넌트들
function GardenIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-32 h-32', className)}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 화분 */}
      <path
        d="M44 90 L52 110 L76 110 L84 90 Z"
        className="fill-amber-200 stroke-amber-300"
        strokeWidth="2"
      />
      {/* 줄기 */}
      <path
        d="M64 90 C64 75, 64 60, 64 50"
        className="stroke-green-400"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* 잎 1 */}
      <ellipse
        cx="52"
        cy="65"
        rx="12"
        ry="8"
        className="fill-green-300"
        transform="rotate(-30 52 65)"
      />
      {/* 잎 2 */}
      <ellipse
        cx="76"
        cy="60"
        rx="12"
        ry="8"
        className="fill-green-400"
        transform="rotate(30 76 60)"
      />
      {/* 꽃봉오리 */}
      <circle cx="64" cy="42" r="14" className="fill-pink-200" />
      <circle cx="58" cy="38" r="8" className="fill-pink-300" />
      <circle cx="70" cy="38" r="8" className="fill-pink-300" />
      <circle cx="64" cy="46" r="8" className="fill-pink-300" />
      <circle cx="64" cy="42" r="5" className="fill-yellow-300" />
      {/* 반짝이 */}
      <g className="animate-twinkle">
        <path
          d="M40 30 L42 34 L46 34 L43 37 L44 41 L40 38 L36 41 L37 37 L34 34 L38 34 Z"
          className="fill-yellow-200"
        />
      </g>
      <g className="animate-twinkle" style={{ animationDelay: '0.5s' }}>
        <path
          d="M90 45 L91 47 L93 47 L91.5 49 L92 51 L90 49.5 L88 51 L88.5 49 L87 47 L89 47 Z"
          className="fill-pink-200"
        />
      </g>
    </svg>
  )
}

function CanvasIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-32 h-32', className)}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 캔버스 프레임 */}
      <rect
        x="20"
        y="25"
        width="88"
        height="78"
        rx="4"
        className="fill-white stroke-gray-300"
        strokeWidth="2"
      />
      {/* 이젤 다리 */}
      <path d="M35 103 L45 125" className="stroke-amber-400" strokeWidth="4" strokeLinecap="round" />
      <path d="M93 103 L83 125" className="stroke-amber-400" strokeWidth="4" strokeLinecap="round" />
      {/* 캔버스 위 점선 (가이드) */}
      <rect
        x="32"
        y="37"
        width="64"
        height="54"
        rx="2"
        className="stroke-gray-200"
        strokeWidth="1"
        strokeDasharray="4 2"
        fill="none"
      />
      {/* 브러시 */}
      <g transform="translate(75, 15) rotate(45)">
        <rect x="0" y="0" width="6" height="30" rx="2" className="fill-amber-300" />
        <rect x="0" y="0" width="6" height="10" rx="2" className="fill-purple-300" />
      </g>
      {/* 파레트 */}
      <ellipse cx="25" cy="80" rx="15" ry="12" className="fill-amber-100 stroke-amber-200" strokeWidth="1" />
      <circle cx="20" cy="76" r="4" className="fill-pink-300" />
      <circle cx="28" cy="74" r="3" className="fill-blue-300" />
      <circle cx="22" cy="84" r="3" className="fill-green-300" />
    </svg>
  )
}

function CompassIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-32 h-32', className)}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 나침반 외곽 */}
      <circle cx="64" cy="64" r="45" className="fill-white stroke-gray-300" strokeWidth="2" />
      <circle cx="64" cy="64" r="40" className="fill-none stroke-gray-200" strokeWidth="1" />
      {/* 방향 표시 */}
      <text x="64" y="32" className="fill-gray-400 text-[10px]" textAnchor="middle">N</text>
      <text x="64" y="102" className="fill-gray-300 text-[10px]" textAnchor="middle">S</text>
      <text x="24" y="68" className="fill-gray-300 text-[10px]" textAnchor="middle">W</text>
      <text x="104" y="68" className="fill-gray-300 text-[10px]" textAnchor="middle">E</text>
      {/* 바늘 */}
      <polygon points="64,30 60,64 64,70 68,64" className="fill-rose-400" />
      <polygon points="64,98 60,64 64,58 68,64" className="fill-gray-300" />
      {/* 중앙 */}
      <circle cx="64" cy="64" r="6" className="fill-gray-100 stroke-gray-300" strokeWidth="1" />
      {/* 물음표 */}
      <text x="64" y="68" className="fill-gray-400 text-[10px] font-bold" textAnchor="middle">?</text>
    </svg>
  )
}

function StarIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-32 h-32', className)}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 메인 별 */}
      <path
        d="M64 20 L72 48 L102 48 L78 66 L86 94 L64 78 L42 94 L50 66 L26 48 L56 48 Z"
        className="fill-amber-100 stroke-amber-300"
        strokeWidth="2"
      />
      {/* 작은 별들 */}
      <path
        d="M25 30 L27 36 L33 36 L28 40 L30 46 L25 42 L20 46 L22 40 L17 36 L23 36 Z"
        className="fill-pink-200 animate-float"
      />
      <path
        d="M100 25 L101 29 L105 29 L102 32 L103 36 L100 33 L97 36 L98 32 L95 29 L99 29 Z"
        className="fill-blue-200 animate-float"
        style={{ animationDelay: '0.3s' }}
      />
      <path
        d="M105 80 L106 83 L109 83 L107 85 L108 88 L105 86 L102 88 L103 85 L101 83 L104 83 Z"
        className="fill-green-200 animate-float"
        style={{ animationDelay: '0.6s' }}
      />
      {/* 반짝이 */}
      <circle cx="64" cy="56" r="3" className="fill-white opacity-80" />
    </svg>
  )
}

function BookIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-32 h-32', className)}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 책 - 닫힌 상태 */}
      <rect
        x="25"
        y="35"
        width="78"
        height="70"
        rx="4"
        className="fill-amber-100 stroke-amber-300"
        strokeWidth="2"
      />
      {/* 책등 */}
      <rect x="25" y="35" width="8" height="70" rx="2" className="fill-amber-200" />
      {/* 책 페이지 */}
      <rect x="35" y="40" width="60" height="60" rx="2" className="fill-white stroke-gray-200" strokeWidth="1" />
      {/* 줄 표시 */}
      <line x1="45" y1="55" x2="85" y2="55" className="stroke-gray-200" strokeWidth="1" />
      <line x1="45" y1="65" x2="80" y2="65" className="stroke-gray-200" strokeWidth="1" />
      <line x1="45" y1="75" x2="75" y2="75" className="stroke-gray-200" strokeWidth="1" />
      {/* 북마크 */}
      <path d="M75 35 L75 50 L80 45 L85 50 L85 35" className="fill-pink-300" />
      {/* 안경 */}
      <g transform="translate(40, 82)">
        <circle cx="0" cy="0" r="8" className="fill-none stroke-gray-400" strokeWidth="2" />
        <circle cx="20" cy="0" r="8" className="fill-none stroke-gray-400" strokeWidth="2" />
        <path d="M8 0 L12 0" className="stroke-gray-400" strokeWidth="2" />
      </g>
    </svg>
  )
}

const illustrations = {
  garden: GardenIllustration,
  canvas: CanvasIllustration,
  compass: CompassIllustration,
  star: StarIllustration,
  book: BookIllustration,
}

export interface EmptyStateProps {
  /** 빈 상태 유형 */
  variant?: EmptyStateVariant
  /** 커스텀 제목 (variant 기본값 대체) */
  title?: string
  /** 커스텀 설명 (variant 기본값 대체) */
  description?: string
  /** 커스텀 아이콘 */
  icon?: LucideIcon
  /** CTA 버튼 라벨 */
  actionLabel?: string
  /** CTA 버튼 클릭 핸들러 */
  onAction?: () => void
  /** CTA 버튼 href (Link로 렌더링) */
  actionHref?: string
  /** 커스텀 일러스트 (ReactNode) */
  customIllustration?: ReactNode
  /** 일러스트 숨기기 */
  hideIllustration?: boolean
  /** 추가 클래스 */
  className?: string
  /** 컴팩트 모드 */
  compact?: boolean
}

export function EmptyState({
  variant = 'default',
  title,
  description,
  icon,
  actionLabel,
  onAction,
  actionHref,
  customIllustration,
  hideIllustration = false,
  className,
  compact = false,
}: EmptyStateProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isVisible, setIsVisible] = useState(false)
  const config = variantConfigs[variant]

  // 진입 애니메이션
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const Icon = icon || config.icon
  const Illustration = illustrations[config.illustration]

  const animationClass = prefersReducedMotion
    ? 'opacity-100'
    : isVisible
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 translate-y-4'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center transition-all duration-500',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        animationClass,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* 일러스트레이션 */}
      {!hideIllustration && (
        <div
          className={cn(
            'relative mb-6 p-6 rounded-full bg-gradient-to-br',
            config.color,
            !prefersReducedMotion && 'animate-breathe'
          )}
        >
          {customIllustration || <Illustration />}

          {/* 아이콘 뱃지 */}
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center">
            <Icon className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      )}

      {/* 텍스트 */}
      <div className={cn('max-w-[280px]', compact && 'max-w-[240px]')}>
        <h3
          className={cn(
            'font-bold text-gray-800 mb-2',
            compact ? 'text-base' : 'text-lg'
          )}
        >
          {title || config.title}
        </h3>
        <p
          className={cn(
            'text-gray-500 whitespace-pre-line',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {description || config.description}
        </p>
      </div>

      {/* CTA 버튼 */}
      {(actionLabel && (onAction || actionHref)) && (
        <div className="mt-6">
          <Button
            variant="primary"
            size={compact ? 'sm' : 'md'}
            onClick={onAction}
            asChild={!!actionHref}
            className={cn(
              'group',
              !prefersReducedMotion && 'btn-cute-primary'
            )}
          >
            {actionHref ? (
              <a href={actionHref}>
                <Sparkles className="w-4 h-4 mr-2 transition-transform group-hover:rotate-12" />
                {actionLabel}
              </a>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2 transition-transform group-hover:rotate-12" />
                {actionLabel}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

export default EmptyState
