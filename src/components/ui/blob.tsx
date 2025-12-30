'use client'

import { forwardRef, type HTMLAttributes, useMemo } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Blob / Liquid Effects 컴포넌트
 *
 * UX 서사: "유기적으로 흐르는 생명력"
 *
 * 사용 사례:
 * - 배경 장식
 * - 히어로 섹션 비주얼
 * - 로딩/대기 상태 표현
 */

// ============================================
// TYPES
// ============================================

export interface BlobProps extends HTMLAttributes<HTMLDivElement> {
  /** 블롭 색상 */
  color?: 'primary' | 'accent' | 'gradient' | 'custom'
  /** 커스텀 색상 (color="custom" 시) */
  customColor?: string
  /** 애니메이션 속도 */
  speed?: 'slow' | 'normal' | 'fast'
  /** 블롭 크기 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** 불투명도 */
  opacity?: number
  /** 블러 효과 */
  blur?: boolean
  /** 위치 (absolute positioning) */
  position?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
}

export interface BlobBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  /** 블롭 개수 */
  count?: number
  /** 블롭들의 색상 배열 */
  colors?: Array<'primary' | 'accent'>
  /** 전체 불투명도 */
  opacity?: number
}

// ============================================
// BLOB COMPONENT
// ============================================

/**
 * 단일 블롭 컴포넌트
 *
 * @example
 * ```tsx
 * <Blob color="primary" size="lg" speed="slow" blur />
 * ```
 */
const Blob = forwardRef<HTMLDivElement, BlobProps>(
  (
    {
      className,
      color = 'gradient',
      customColor,
      speed = 'normal',
      size = 'md',
      opacity = 0.5,
      blur = true,
      position,
      style,
      ...props
    },
    ref
  ) => {
    // 색상 클래스
    const colorClasses = {
      primary: 'blob-primary',
      accent: 'blob-accent',
      gradient: 'blob-gradient',
      custom: '',
    }

    // 속도 클래스
    const speedClasses = {
      slow: 'blob-slow',
      normal: 'blob',
      fast: 'blob-fast',
    }

    // 크기 클래스
    const sizeClasses = {
      sm: 'w-32 h-32',
      md: 'w-48 h-48',
      lg: 'w-72 h-72',
      xl: 'w-96 h-96',
      full: 'w-full h-full',
    }

    // 위치 스타일
    const positionStyle = useMemo(() => {
      if (!position) return {}
      return {
        position: 'absolute' as const,
        ...position,
      }
    }, [position])

    return (
      <div
        ref={ref}
        className={cn(
          speedClasses[speed],
          colorClasses[color],
          sizeClasses[size],
          blur && 'blur-3xl',
          'pointer-events-none',
          className
        )}
        style={{
          opacity,
          background: color === 'custom' ? customColor : undefined,
          ...positionStyle,
          ...style,
        }}
        aria-hidden="true"
        {...props}
      />
    )
  }
)
Blob.displayName = 'Blob'

// ============================================
// BLOB BACKGROUND
// ============================================

/**
 * 블롭 배경 컨테이너
 *
 * @example
 * ```tsx
 * <BlobBackground count={3} colors={['primary', 'accent']}>
 *   <YourContent />
 * </BlobBackground>
 * ```
 */
const BlobBackground = forwardRef<HTMLDivElement, BlobBackgroundProps>(
  (
    {
      className,
      count = 2,
      colors = ['primary', 'accent'],
      opacity = 0.3,
      children,
      ...props
    },
    ref
  ) => {
    // 블롭 위치 프리셋
    const blobPositions = useMemo(
      () => [
        { top: '-20%', left: '-10%' },
        { top: '40%', right: '-15%' },
        { bottom: '-25%', left: '30%' },
        { top: '10%', right: '20%' },
      ],
      []
    )

    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        {...props}
      >
        {/* 블롭들 */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {Array.from({ length: count }).map((_, index) => (
            <Blob
              key={index}
              color={colors[index % colors.length]}
              size="xl"
              speed={index % 2 === 0 ? 'slow' : 'normal'}
              opacity={opacity}
              position={blobPositions[index % blobPositions.length]}
              style={{
                animationDelay: `${-index * 2}s`,
              }}
            />
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="relative z-10">{children}</div>
      </div>
    )
  }
)
BlobBackground.displayName = 'BlobBackground'

// ============================================
// ANIMATED BLOB (인터랙티브)
// ============================================

export interface AnimatedBlobProps extends BlobProps {
  /** 마우스 반응 */
  mouseReactive?: boolean
  /** 스크롤 반응 */
  scrollReactive?: boolean
}

/**
 * 인터랙티브 블롭
 *
 * @example
 * ```tsx
 * <AnimatedBlob mouseReactive color="gradient" />
 * ```
 */
const AnimatedBlob = forwardRef<HTMLDivElement, AnimatedBlobProps>(
  (
    { className, mouseReactive = false, scrollReactive = false, ...props },
    ref
  ) => {
    // 마우스/스크롤 반응은 훅으로 분리 가능
    // 현재는 기본 블롭에 추가 클래스만 적용

    return (
      <Blob
        ref={ref}
        className={cn(
          mouseReactive && 'transition-transform duration-300',
          scrollReactive && 'transform-gpu',
          className
        )}
        {...props}
      />
    )
  }
)
AnimatedBlob.displayName = 'AnimatedBlob'

// ============================================
// GOOEY CONTAINER (끈적한 효과)
// ============================================

export interface GooeyContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** SVG 필터 ID */
  filterId?: string
}

/**
 * Gooey 컨테이너 (끈적한 블롭 효과)
 *
 * @example
 * ```tsx
 * <GooeyContainer>
 *   <Blob color="primary" />
 *   <Blob color="accent" />
 * </GooeyContainer>
 * ```
 */
const GooeyContainer = forwardRef<HTMLDivElement, GooeyContainerProps>(
  ({ className, filterId = 'gooey', children, ...props }, ref) => {
    return (
      <>
        {/* SVG 필터 정의 */}
        <svg
          style={{ position: 'absolute', width: 0, height: 0 }}
          aria-hidden="true"
        >
          <defs>
            <filter id={filterId}>
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="10"
                result="blur"
              />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                result="gooey"
              />
            </filter>
          </defs>
        </svg>

        {/* 컨테이너 */}
        <div
          ref={ref}
          className={cn('relative', className)}
          style={{ filter: `url(#${filterId})` }}
          {...props}
        >
          {children}
        </div>
      </>
    )
  }
)
GooeyContainer.displayName = 'GooeyContainer'

// ============================================
// EXPORTS
// ============================================

export { Blob, BlobBackground, AnimatedBlob, GooeyContainer }
