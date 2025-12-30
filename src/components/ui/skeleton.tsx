'use client'

import { forwardRef, type HTMLAttributes, useMemo } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Skeleton Loading & Shimmer 컴포넌트
 *
 * UX 서사: "콘텐츠가 피어나기 전, 은은한 빛이 흐르는 자리"
 *
 * 사용 사례:
 * - 데이터 로딩 중 레이아웃 시프트 방지
 * - 사용자에게 콘텐츠 형태 힌트 제공
 * - 부드러운 shimmer로 로딩 상태 명확히 전달
 */

// ============================================
// TYPES
// ============================================

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** 스켈레톤 변형 */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  /** 너비 (CSS 값) */
  width?: string | number
  /** 높이 (CSS 값) */
  height?: string | number
  /** Shimmer 애니메이션 활성화 */
  animate?: boolean
  /** 다크모드에서 색상 반전 */
  dark?: boolean
}

export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  /** 텍스트 줄 수 */
  lines?: number
  /** 마지막 줄 너비 (%) */
  lastLineWidth?: number
  /** 줄 간격 */
  gap?: 'sm' | 'md' | 'lg'
  /** Shimmer 애니메이션 활성화 */
  animate?: boolean
}

export interface SkeletonCardProps extends HTMLAttributes<HTMLDivElement> {
  /** 이미지 영역 표시 */
  hasImage?: boolean
  /** 이미지 높이 */
  imageHeight?: string | number
  /** 텍스트 줄 수 */
  lines?: number
  /** 아바타 표시 */
  hasAvatar?: boolean
  /** Shimmer 애니메이션 활성화 */
  animate?: boolean
}

export interface SkeletonAvatarProps extends HTMLAttributes<HTMLDivElement> {
  /** 아바타 크기 */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Shimmer 애니메이션 활성화 */
  animate?: boolean
}

// ============================================
// SKELETON BASE
// ============================================

/**
 * 기본 스켈레톤 컴포넌트
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" width="200px" />
 * <Skeleton variant="circular" width={48} height={48} />
 * <Skeleton variant="rectangular" height={200} />
 * ```
 */
const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant = 'text',
      width,
      height,
      animate = true,
      dark = false,
      style,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      text: 'h-4 rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-none',
      rounded: 'rounded-xl',
    }

    const computedStyle = useMemo(
      () => ({
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }),
      [width, height, style]
    )

    return (
      <div
        ref={ref}
        className={cn(
          // 기본 스타일
          'relative overflow-hidden',
          // 배경색 (다크모드 대응)
          dark
            ? 'bg-gray-700'
            : 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
          // 변형별 스타일
          variantStyles[variant],
          // Shimmer 애니메이션
          animate && 'skeleton-shimmer',
          className
        )}
        style={computedStyle}
        aria-hidden="true"
        aria-label="Loading..."
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

// ============================================
// SKELETON TEXT (여러 줄)
// ============================================

/**
 * 텍스트 스켈레톤 (여러 줄)
 *
 * @example
 * ```tsx
 * <SkeletonText lines={3} lastLineWidth={60} />
 * ```
 */
const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(
  (
    {
      className,
      lines = 3,
      lastLineWidth = 70,
      gap = 'md',
      animate = true,
      ...props
    },
    ref
  ) => {
    const gapStyles = {
      sm: 'gap-1.5',
      md: 'gap-2.5',
      lg: 'gap-3.5',
    }

    // 각 줄의 너비를 약간씩 다르게 하여 자연스럽게
    const lineWidths = useMemo(() => {
      return Array.from({ length: lines }, (_, i) => {
        if (i === lines - 1) return lastLineWidth
        // 85-100% 사이 랜덤하게 (시드 기반으로 일관성 유지)
        return 85 + ((i * 7) % 15)
      })
    }, [lines, lastLineWidth])

    return (
      <div
        ref={ref}
        className={cn('flex flex-col', gapStyles[gap], className)}
        {...props}
      >
        {lineWidths.map((width, index) => (
          <Skeleton
            key={index}
            variant="text"
            width={`${width}%`}
            animate={animate}
            style={{
              // 순차 shimmer 효과
              animationDelay: animate ? `${index * 100}ms` : undefined,
            }}
          />
        ))}
      </div>
    )
  }
)
SkeletonText.displayName = 'SkeletonText'

// ============================================
// SKELETON AVATAR
// ============================================

/**
 * 아바타 스켈레톤
 *
 * @example
 * ```tsx
 * <SkeletonAvatar size="lg" />
 * ```
 */
const SkeletonAvatar = forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  ({ className, size = 'md', animate = true, ...props }, ref) => {
    const sizeStyles = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
    }

    return (
      <Skeleton
        ref={ref}
        variant="circular"
        className={cn(sizeStyles[size], className)}
        animate={animate}
        {...props}
      />
    )
  }
)
SkeletonAvatar.displayName = 'SkeletonAvatar'

// ============================================
// SKELETON CARD (템플릿 카드용)
// ============================================

/**
 * 카드 스켈레톤 (템플릿 목록용)
 *
 * @example
 * ```tsx
 * <SkeletonCard hasImage imageHeight={200} lines={2} hasAvatar />
 * ```
 */
const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    {
      className,
      hasImage = true,
      imageHeight = 180,
      lines = 2,
      hasAvatar = false,
      animate = true,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-[20px] border border-gray-200 overflow-hidden',
          className
        )}
        {...props}
      >
        {/* 이미지 영역 */}
        {hasImage && (
          <Skeleton
            variant="rectangular"
            height={imageHeight}
            animate={animate}
            className="w-full"
          />
        )}

        {/* 콘텐츠 영역 */}
        <div className="p-4 space-y-3">
          {/* 아바타 + 제목 */}
          {hasAvatar ? (
            <div className="flex items-center gap-3">
              <SkeletonAvatar size="sm" animate={animate} />
              <Skeleton
                variant="text"
                width="60%"
                animate={animate}
                className="h-5"
              />
            </div>
          ) : (
            <Skeleton
              variant="text"
              width="70%"
              animate={animate}
              className="h-5"
            />
          )}

          {/* 설명 텍스트 */}
          <SkeletonText lines={lines} lastLineWidth={50} animate={animate} gap="sm" />

          {/* 태그/메타 영역 */}
          <div className="flex gap-2 pt-1">
            <Skeleton
              variant="rounded"
              width={60}
              height={24}
              animate={animate}
            />
            <Skeleton
              variant="rounded"
              width={48}
              height={24}
              animate={animate}
              style={{ animationDelay: '50ms' }}
            />
          </div>
        </div>
      </div>
    )
  }
)
SkeletonCard.displayName = 'SkeletonCard'

// ============================================
// SKELETON GRID (템플릿 목록용)
// ============================================

export interface SkeletonGridProps extends HTMLAttributes<HTMLDivElement> {
  /** 카드 개수 */
  count?: number
  /** 컬럼 수 (반응형) */
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
  }
  /** 카드 설정 */
  cardProps?: Omit<SkeletonCardProps, 'ref'>
}

/**
 * 그리드 스켈레톤 (템플릿 목록 페이지용)
 *
 * @example
 * ```tsx
 * <SkeletonGrid count={8} columns={{ default: 1, sm: 2, lg: 4 }} />
 * ```
 */
const SkeletonGrid = forwardRef<HTMLDivElement, SkeletonGridProps>(
  (
    {
      className,
      count = 8,
      columns = { default: 1, sm: 2, md: 3, lg: 4 },
      cardProps,
      ...props
    },
    ref
  ) => {
    // 그리드 컬럼 클래스 생성
    const gridCols = useMemo(() => {
      const classes: string[] = []
      if (columns.default) classes.push(`grid-cols-${columns.default}`)
      if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`)
      if (columns.md) classes.push(`md:grid-cols-${columns.md}`)
      if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`)
      return classes.join(' ')
    }, [columns])

    return (
      <div
        ref={ref}
        className={cn('grid gap-6', gridCols, className)}
        {...props}
      >
        {Array.from({ length: count }, (_, index) => (
          <SkeletonCard
            key={index}
            {...cardProps}
            style={{
              // 순차 등장 효과
              animationDelay: `${index * 50}ms`,
              ...cardProps?.style,
            }}
          />
        ))}
      </div>
    )
  }
)
SkeletonGrid.displayName = 'SkeletonGrid'

// ============================================
// SKELETON PROFILE (프로필 페이지용)
// ============================================

export interface SkeletonProfileProps extends HTMLAttributes<HTMLDivElement> {
  /** 배너 표시 */
  hasBanner?: boolean
  /** 통계 항목 수 */
  statsCount?: number
  /** Shimmer 애니메이션 활성화 */
  animate?: boolean
}

/**
 * 프로필 스켈레톤
 *
 * @example
 * ```tsx
 * <SkeletonProfile hasBanner statsCount={3} />
 * ```
 */
const SkeletonProfile = forwardRef<HTMLDivElement, SkeletonProfileProps>(
  (
    { className, hasBanner = true, statsCount = 3, animate = true, ...props },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('space-y-6', className)} {...props}>
        {/* 배너 */}
        {hasBanner && (
          <Skeleton
            variant="rounded"
            height={160}
            animate={animate}
            className="w-full"
          />
        )}

        {/* 프로필 정보 */}
        <div className="flex items-start gap-4">
          <SkeletonAvatar size="xl" animate={animate} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" animate={animate} className="h-6" />
            <Skeleton variant="text" width="25%" animate={animate} className="h-4" />
          </div>
        </div>

        {/* 통계 */}
        <div className="flex gap-6">
          {Array.from({ length: statsCount }, (_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton
                variant="text"
                width={60}
                animate={animate}
                className="h-6"
                style={{ animationDelay: `${i * 100}ms` }}
              />
              <Skeleton
                variant="text"
                width={40}
                animate={animate}
                className="h-4"
                style={{ animationDelay: `${i * 100 + 50}ms` }}
              />
            </div>
          ))}
        </div>

        {/* 바이오 */}
        <SkeletonText lines={2} lastLineWidth={80} animate={animate} />
      </div>
    )
  }
)
SkeletonProfile.displayName = 'SkeletonProfile'

// ============================================
// EXPORTS
// ============================================

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonGrid,
  SkeletonProfile,
}
