'use client'

import { useState, useRef, useCallback } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { useLikes } from '@/hooks/useLikes'
import { cn } from '@/lib/utils/cn'
import styles from '@/components/interactions/interactions.module.css'

interface LikeButtonProps {
  templateId: string
  initialLikeCount?: number
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal' | 'outline'
  className?: string
  onLikeChange?: (isLiked: boolean, count: number) => void
}

export function LikeButton({
  templateId,
  initialLikeCount,
  showCount = true,
  size = 'md',
  variant = 'default',
  className,
  onLikeChange,
}: LikeButtonProps) {
  const { isLiked, likeCount, isLoading, toggle } = useLikes(templateId, initialLikeCount)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Magic Dust 파티클 효과
  const emitMagicDust = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const particleCount = 20
    const colors = ['#FFD9D9', '#FFB6C1', '#FFCACA', '#FFC0CB', '#FFE4E1']

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      particle.className = styles.magicDust

      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5
      const distance = 30 + Math.random() * 40
      const tx = Math.cos(angle) * distance
      const ty = Math.sin(angle) * distance
      const size = 3 + Math.random() * 4
      const delay = i * 20
      const opacity = 0.6 + Math.random() * 0.4

      particle.style.setProperty('--tx', `${tx}px`)
      particle.style.setProperty('--ty', `${ty}px`)
      particle.style.setProperty('--size', `${size}px`)
      particle.style.setProperty('--delay', `${delay}ms`)
      particle.style.setProperty('--opacity', `${opacity}`)
      particle.style.background = `radial-gradient(circle, ${colors[i % colors.length]}, #FFB6C1)`
      particle.style.boxShadow = `0 0 ${size}px rgba(255, 182, 193, 0.6)`

      container.appendChild(particle)
      setTimeout(() => particle.remove(), 800 + delay)
    }
  }, [])

  const handleClick = async () => {
    if (isToggling) return

    setIsToggling(true)
    setIsAnimating(true)

    const success = await toggle()

    // 좋아요할 때만 Magic Dust 파티클 효과
    if (success && !isLiked) {
      emitMagicDust()
    }

    // 애니메이션 지속 시간
    setTimeout(() => setIsAnimating(false), 300)
    setIsToggling(false)

    if (success && onLikeChange) {
      onLikeChange(!isLiked, isLiked ? likeCount - 1 : likeCount + 1)
    }
  }

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  if (isLoading) {
    return (
      <button
        disabled
        className={cn(
          'flex items-center gap-1.5 rounded-full transition-all',
          sizeClasses[size],
          'text-gray-400',
          className
        )}
      >
        <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        {showCount && <span className={textSizes[size]}>-</span>}
      </button>
    )
  }

  const variantClasses = {
    default: cn(
      'bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50',
      isLiked && 'border-red-200 bg-red-50'
    ),
    minimal: 'hover:bg-gray-100',
    outline: cn(
      'border-2 border-gray-200 hover:border-red-300',
      isLiked && 'border-red-300 bg-red-50'
    ),
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={handleClick}
        disabled={isToggling}
        className={cn(
          'flex items-center gap-1.5 rounded-full transition-all duration-200',
          sizeClasses[size],
          variantClasses[variant],
          'group',
          className
        )}
        aria-label={isLiked ? '좋아요 취소' : '좋아요'}
      >
        <Heart
          className={cn(
            iconSizes[size],
            'transition-all duration-200',
            isLiked
              ? 'fill-red-500 text-red-500'
              : 'text-gray-400 group-hover:text-red-400',
            isAnimating && 'scale-125'
          )}
        />
        {showCount && (
          <span
            className={cn(
              textSizes[size],
              'font-medium transition-colors',
              isLiked ? 'text-red-500' : 'text-gray-500 group-hover:text-red-400'
            )}
          >
            {likeCount.toLocaleString()}
          </span>
        )}
      </button>
      {/* Magic Dust 파티클 컨테이너 */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-visible pointer-events-none"
        aria-hidden="true"
      />
    </div>
  )
}

// 간단한 아이콘 전용 좋아요 버튼
interface LikeIconButtonProps {
  templateId: string
  isLiked?: boolean
  className?: string
  onToggle?: () => void
}

export function LikeIconButton({
  templateId,
  isLiked: initialIsLiked,
  className,
  onToggle,
}: LikeIconButtonProps) {
  const { isLiked, toggle } = useLikes(templateId)
  const [isAnimating, setIsAnimating] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Magic Dust 파티클 효과
  const emitMagicDust = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const particleCount = 15
    const colors = ['#FFD9D9', '#FFB6C1', '#FFCACA', '#FFC0CB', '#FFE4E1']

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      particle.className = styles.magicDust

      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5
      const distance = 25 + Math.random() * 35
      const tx = Math.cos(angle) * distance
      const ty = Math.sin(angle) * distance
      const size = 2 + Math.random() * 3
      const delay = i * 15
      const opacity = 0.6 + Math.random() * 0.4

      particle.style.setProperty('--tx', `${tx}px`)
      particle.style.setProperty('--ty', `${ty}px`)
      particle.style.setProperty('--size', `${size}px`)
      particle.style.setProperty('--delay', `${delay}ms`)
      particle.style.setProperty('--opacity', `${opacity}`)
      particle.style.background = `radial-gradient(circle, ${colors[i % colors.length]}, #FFB6C1)`
      particle.style.boxShadow = `0 0 ${size}px rgba(255, 182, 193, 0.6)`

      container.appendChild(particle)
      setTimeout(() => particle.remove(), 700 + delay)
    }
  }, [])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const wasLiked = initialIsLiked !== undefined ? initialIsLiked : isLiked

    setIsAnimating(true)
    await toggle()

    // 좋아요할 때만 Magic Dust 파티클 효과
    if (!wasLiked) {
      emitMagicDust()
    }

    setTimeout(() => setIsAnimating(false), 300)

    if (onToggle) onToggle()
  }

  const liked = initialIsLiked !== undefined ? initialIsLiked : isLiked

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={cn(
          'p-2 rounded-full transition-all duration-200',
          'hover:bg-red-50',
          className
        )}
        aria-label={liked ? '좋아요 취소' : '좋아요'}
      >
        <Heart
          className={cn(
            'w-5 h-5 transition-all duration-200',
            liked ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400',
            isAnimating && 'scale-125'
          )}
        />
      </button>
      {/* Magic Dust 파티클 컨테이너 */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-visible pointer-events-none"
        aria-hidden="true"
      />
    </div>
  )
}
