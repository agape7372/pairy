'use client'

import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useMemo,
} from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Bento Grid 레이아웃 컴포넌트
 *
 * UX 서사: "도시락처럼 정갈하게 담긴 콘텐츠"
 *
 * Apple 스타일의 불규칙하지만 조화로운 그리드 레이아웃
 * 각 아이템이 다른 크기를 가지면서도 전체적으로 균형 유지
 */

// ============================================
// TYPES
// ============================================

export interface BentoGridProps extends HTMLAttributes<HTMLDivElement> {
  /** 기본 컬럼 수 */
  columns?: 2 | 3 | 4
  /** 그리드 갭 */
  gap?: 'sm' | 'md' | 'lg'
  /** 자동 배치 */
  autoFit?: boolean
  /** 최소 아이템 너비 (autoFit 사용 시) */
  minItemWidth?: number
}

export interface BentoItemProps extends HTMLAttributes<HTMLDivElement> {
  /** 컬럼 스팬 */
  colSpan?: 1 | 2 | 3
  /** 로우 스팬 */
  rowSpan?: 1 | 2
  /** 강조 아이템 (자동으로 2x2) */
  featured?: boolean
  /** 호버 효과 */
  hover?: boolean
  /** Glass 효과 */
  glass?: boolean
  /** 배경 그라디언트 */
  gradient?: 'none' | 'primary' | 'accent' | 'mixed'
  /** 아이콘 (좌상단) */
  icon?: ReactNode
  /** 제목 */
  title?: string
  /** 설명 */
  description?: string
}

// ============================================
// BENTO GRID
// ============================================

/**
 * Bento Grid 컨테이너
 *
 * @example
 * ```tsx
 * <BentoGrid columns={4} gap="md">
 *   <BentoItem featured>Featured</BentoItem>
 *   <BentoItem>Item 1</BentoItem>
 *   <BentoItem colSpan={2}>Wide Item</BentoItem>
 * </BentoGrid>
 * ```
 */
const BentoGrid = forwardRef<HTMLDivElement, BentoGridProps>(
  (
    {
      className,
      columns = 4,
      gap = 'md',
      autoFit = false,
      minItemWidth = 280,
      children,
      ...props
    },
    ref
  ) => {
    const gapClasses = {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
    }

    const columnClasses = {
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    }

    const gridStyle = autoFit
      ? {
          gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
        }
      : undefined

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          gapClasses[gap],
          !autoFit && columnClasses[columns],
          className
        )}
        style={gridStyle}
        {...props}
      >
        {children}
      </div>
    )
  }
)
BentoGrid.displayName = 'BentoGrid'

// ============================================
// BENTO ITEM
// ============================================

/**
 * Bento Grid 아이템
 *
 * @example
 * ```tsx
 * <BentoItem
 *   colSpan={2}
 *   rowSpan={2}
 *   gradient="primary"
 *   icon={<Star />}
 *   title="Featured"
 *   description="This is a featured item"
 * >
 *   <CustomContent />
 * </BentoItem>
 * ```
 */
const BentoItem = forwardRef<HTMLDivElement, BentoItemProps>(
  (
    {
      className,
      colSpan = 1,
      rowSpan = 1,
      featured = false,
      hover = true,
      glass = false,
      gradient = 'none',
      icon,
      title,
      description,
      children,
      ...props
    },
    ref
  ) => {
    // Featured는 자동으로 2x2
    const effectiveColSpan = featured ? 2 : colSpan
    const effectiveRowSpan = featured ? 2 : rowSpan

    // 스팬 클래스
    const spanClasses = useMemo(() => {
      const classes: string[] = []

      // 컬럼 스팬 (반응형)
      if (effectiveColSpan === 2) {
        classes.push('sm:col-span-2')
      } else if (effectiveColSpan === 3) {
        classes.push('sm:col-span-2 lg:col-span-3')
      }

      // 로우 스팬
      if (effectiveRowSpan === 2) {
        classes.push('row-span-2')
      }

      return classes.join(' ')
    }, [effectiveColSpan, effectiveRowSpan])

    // 그라디언트 클래스
    const gradientClasses = {
      none: '',
      primary:
        'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20',
      accent:
        'bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20',
      mixed:
        'bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-primary-900/20 dark:via-gray-900 dark:to-accent-900/20',
    }

    return (
      <div
        ref={ref}
        className={cn(
          // 기본 스타일
          'relative overflow-hidden',
          'rounded-2xl',
          'p-6',

          // 배경
          gradient === 'none' && 'bg-white dark:bg-gray-900',
          gradientClasses[gradient],

          // 테두리
          'border border-gray-200 dark:border-gray-800',

          // Glass 효과
          glass && 'glass-card',

          // 호버 효과
          hover && [
            'transition-all duration-300',
            'hover:border-primary-200 dark:hover:border-primary-700',
            'hover:shadow-lg hover:shadow-primary-100/20',
            'hover:-translate-y-1',
          ],

          // 스팬
          spanClasses,

          className
        )}
        {...props}
      >
        {/* 배경 장식 (featured 아이템) */}
        {featured && (
          <div className="absolute -top-20 -right-20 w-40 h-40 opacity-10">
            <div className="blob blob-primary w-full h-full" />
          </div>
        )}

        {/* 아이콘 */}
        {icon && (
          <div className="mb-4 w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
            {icon}
          </div>
        )}

        {/* 제목 */}
        {title && (
          <h3
            className={cn(
              'font-semibold text-gray-900 dark:text-gray-100',
              featured ? 'text-xl mb-2' : 'text-base mb-1'
            )}
          >
            {title}
          </h3>
        )}

        {/* 설명 */}
        {description && (
          <p
            className={cn(
              'text-gray-600 dark:text-gray-400',
              featured ? 'text-base' : 'text-sm'
            )}
          >
            {description}
          </p>
        )}

        {/* 커스텀 콘텐츠 */}
        {children && (
          <div className={cn((title || description) && 'mt-4')}>{children}</div>
        )}
      </div>
    )
  }
)
BentoItem.displayName = 'BentoItem'

// ============================================
// BENTO SHOWCASE (프리셋 레이아웃)
// ============================================

export interface BentoShowcaseProps extends HTMLAttributes<HTMLDivElement> {
  /** 레이아웃 프리셋 */
  preset?: 'hero' | 'features' | 'stats' | 'gallery'
  /** 아이템 데이터 */
  items?: Array<{
    id: string
    title?: string
    description?: string
    icon?: ReactNode
    content?: ReactNode
    featured?: boolean
  }>
}

/**
 * Bento Showcase - 프리셋 레이아웃
 *
 * @example
 * ```tsx
 * <BentoShowcase
 *   preset="features"
 *   items={[
 *     { id: '1', title: 'Feature 1', icon: <Star />, featured: true },
 *     { id: '2', title: 'Feature 2', icon: <Heart /> },
 *   ]}
 * />
 * ```
 */
const BentoShowcase = forwardRef<HTMLDivElement, BentoShowcaseProps>(
  ({ className, preset = 'features', items = [], ...props }, ref) => {
    // 프리셋별 그리드 설정
    const presetConfig = {
      hero: { columns: 4 as const, gap: 'lg' as const },
      features: { columns: 3 as const, gap: 'md' as const },
      stats: { columns: 4 as const, gap: 'sm' as const },
      gallery: { columns: 3 as const, gap: 'md' as const },
    }

    const config = presetConfig[preset]

    return (
      <BentoGrid
        ref={ref}
        columns={config.columns}
        gap={config.gap}
        className={className}
        {...props}
      >
        {items.map((item, index) => (
          <BentoItem
            key={item.id}
            featured={item.featured}
            gradient={item.featured ? 'mixed' : 'none'}
            icon={item.icon}
            title={item.title}
            description={item.description}
          >
            {item.content}
          </BentoItem>
        ))}
      </BentoGrid>
    )
  }
)
BentoShowcase.displayName = 'BentoShowcase'

// ============================================
// BENTO STAT ITEM (통계용)
// ============================================

export interface BentoStatProps extends HTMLAttributes<HTMLDivElement> {
  /** 통계 값 */
  value: string | number
  /** 레이블 */
  label: string
  /** 변화량 */
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  /** 아이콘 */
  icon?: ReactNode
}

/**
 * Bento Stat - 통계 표시용 아이템
 *
 * @example
 * ```tsx
 * <BentoStat
 *   value="1,234"
 *   label="Total Users"
 *   change={{ value: 12.5, type: 'increase' }}
 *   icon={<Users />}
 * />
 * ```
 */
const BentoStat = forwardRef<HTMLDivElement, BentoStatProps>(
  ({ className, value, label, change, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'p-4 rounded-xl',
          'bg-white dark:bg-gray-900',
          'border border-gray-200 dark:border-gray-800',
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {label}
            </p>
          </div>
          {icon && (
            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              {icon}
            </div>
          )}
        </div>

        {change && (
          <div
            className={cn(
              'mt-3 text-sm font-medium flex items-center gap-1',
              change.type === 'increase'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            <span>{change.type === 'increase' ? '↑' : '↓'}</span>
            <span>{change.value}%</span>
            <span className="text-gray-500 dark:text-gray-400 font-normal">
              vs last month
            </span>
          </div>
        )}
      </div>
    )
  }
)
BentoStat.displayName = 'BentoStat'

// ============================================
// EXPORTS
// ============================================

export { BentoGrid, BentoItem, BentoShowcase, BentoStat }
