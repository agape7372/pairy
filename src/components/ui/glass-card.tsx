'use client'

import { forwardRef, type HTMLAttributes, useRef, useCallback, useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Glassmorphism Card 컴포넌트
 *
 * UX 서사: "빛과 안개가 만나는 반투명의 아름다움"
 *
 * 사용 사례:
 * - 프리미엄 UI 요소
 * - 오버레이 카드
 * - 모달/다이얼로그 배경
 */

// ============================================
// TYPES
// ============================================

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Glass 변형 */
  variant?: 'default' | 'subtle' | 'strong' | 'primary' | 'accent'
  /** 호버 효과 */
  hover?: boolean
  /** 마우스 추적 글로우 효과 */
  mouseGlow?: boolean
  /** 노이즈 텍스처 */
  noise?: boolean | 'subtle' | 'medium' | 'strong'
  /** 테두리 글로우 */
  borderGlow?: boolean
  /** 블러 강도 */
  blur?: 'sm' | 'md' | 'lg' | 'xl'
}

// ============================================
// GLASS CARD
// ============================================

/**
 * Glass Card 컴포넌트
 *
 * @example
 * ```tsx
 * <GlassCard variant="primary" hover mouseGlow>
 *   <h2>Premium Content</h2>
 * </GlassCard>
 * ```
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'default',
      hover = false,
      mouseGlow = false,
      noise = false,
      borderGlow = false,
      blur = 'md',
      children,
      style,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLDivElement>(null)
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })

    // 마우스 추적
    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!mouseGlow || !innerRef.current) return

        const rect = innerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        setMousePosition({ x, y })
      },
      [mouseGlow]
    )

    const handleMouseLeave = useCallback(() => {
      if (!mouseGlow) return
      setMousePosition({ x: 50, y: 50 })
    }, [mouseGlow])

    // Variant 클래스 매핑
    const variantClasses = {
      default: 'glass-card',
      subtle: 'glass-card-subtle',
      strong: 'glass-card-strong',
      primary: 'glass-card-primary',
      accent: 'glass-card-accent',
    }

    // Blur 강도 매핑
    const blurStyles = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    }

    // Noise 클래스
    const getNoiseClass = () => {
      if (!noise) return ''
      if (noise === true) return 'noise-overlay'
      return `noise-overlay noise-${noise}`
    }

    // 마우스 글로우 스타일
    const mouseGlowStyle = mouseGlow
      ? {
          '--mouse-x': `${mousePosition.x}%`,
          '--mouse-y': `${mousePosition.y}%`,
        }
      : {}

    return (
      <div
        ref={(node) => {
          // Merge refs
          (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
          }
        }}
        className={cn(
          'rounded-2xl',
          variantClasses[variant],
          hover && 'glass-card-hover',
          mouseGlow && 'mouse-glow-premium',
          borderGlow && 'premium-glow-border',
          getNoiseClass(),
          className
        )}
        style={{
          ...mouseGlowStyle,
          ...style,
        } as React.CSSProperties}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassCard.displayName = 'GlassCard'

// ============================================
// GLASS PANEL (더 큰 영역용)
// ============================================

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** 배경 블롭 표시 */
  blobs?: boolean
  /** 블롭 색상 */
  blobColors?: 'primary' | 'accent' | 'gradient'
  /** 패널 패딩 */
  padding?: 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Glass Panel - 큰 영역용 글래스 패널
 *
 * @example
 * ```tsx
 * <GlassPanel blobs blobColors="gradient" padding="lg">
 *   <SectionContent />
 * </GlassPanel>
 * ```
 */
const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      className,
      blobs = false,
      blobColors = 'gradient',
      padding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const paddingClasses = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-12',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-3xl',
          'bg-white/60 backdrop-blur-xl',
          'border border-white/30',
          'shadow-lg shadow-black/5',
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {/* 배경 블롭 */}
        {blobs && (
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div
              className={cn(
                'absolute -top-1/2 -left-1/4 w-1/2 h-full',
                'blob blob-slow opacity-30',
                blobColors === 'primary' && 'blob-primary',
                blobColors === 'accent' && 'blob-accent',
                blobColors === 'gradient' && 'blob-gradient'
              )}
            />
            <div
              className={cn(
                'absolute -bottom-1/2 -right-1/4 w-1/2 h-full',
                'blob blob-slow opacity-30',
                blobColors === 'primary' && 'blob-accent',
                blobColors === 'accent' && 'blob-primary',
                blobColors === 'gradient' && 'blob-gradient'
              )}
              style={{ animationDelay: '-4s' }}
            />
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="relative z-10">{children}</div>
      </div>
    )
  }
)
GlassPanel.displayName = 'GlassPanel'

// ============================================
// GLASS MODAL OVERLAY
// ============================================

export interface GlassOverlayProps extends HTMLAttributes<HTMLDivElement> {
  /** 오버레이 불투명도 */
  opacity?: 'light' | 'medium' | 'dark'
  /** 블러 강도 */
  blur?: 'sm' | 'md' | 'lg'
}

/**
 * Glass Overlay - 모달 배경용 글래스 오버레이
 *
 * @example
 * ```tsx
 * <GlassOverlay opacity="medium" blur="lg" onClick={onClose}>
 *   <ModalContent />
 * </GlassOverlay>
 * ```
 */
const GlassOverlay = forwardRef<HTMLDivElement, GlassOverlayProps>(
  ({ className, opacity = 'medium', blur = 'md', children, ...props }, ref) => {
    const opacityClasses = {
      light: 'bg-white/30',
      medium: 'bg-white/50',
      dark: 'bg-black/30',
    }

    const blurClasses = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-50',
          'flex items-center justify-center',
          opacityClasses[opacity],
          blurClasses[blur],
          'animate-fade-in',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassOverlay.displayName = 'GlassOverlay'

// ============================================
// EXPORTS
// ============================================

export { GlassCard, GlassPanel, GlassOverlay }
