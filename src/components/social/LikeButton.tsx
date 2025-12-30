'use client'

import { useState, useRef } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { useLikes } from '@/hooks/useLikes'
import { useParticle, ParticleContainer } from '@/hooks/useParticle'
import { cn } from '@/lib/utils/cn'

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

  // 좋아요 시 하트 파티클
  const { emit, containerProps } = useParticle({
    type: 'heart',
    count: 8,
    direction: 'fountain',
    colors: ['#FFD9D9', '#FFCACA', '#E8A8A8', '#FF9E9E'],
    sizeRange: [10, 18],
    duration: 900,
    distanceRange: [40, 80],
  })

  const handleClick = async () => {
    if (isToggling) return

    setIsToggling(true)
    setIsAnimating(true)

    const success = await toggle()

    // 좋아요할 때만 파티클 효과
    if (success && !isLiked && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      emit(rect.width / 2, rect.height / 2)
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
      <ParticleContainer {...containerProps} />
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

  // 좋아요 시 하트 파티클
  const { emit, containerProps } = useParticle({
    type: 'heart',
    count: 6,
    direction: 'fountain',
    colors: ['#FFD9D9', '#FFCACA', '#E8A8A8'],
    sizeRange: [8, 14],
    duration: 700,
    distanceRange: [30, 60],
  })

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const wasLiked = initialIsLiked !== undefined ? initialIsLiked : isLiked

    setIsAnimating(true)
    await toggle()

    // 좋아요할 때만 파티클 효과
    if (!wasLiked && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      emit(rect.width / 2, rect.height / 2)
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
      <ParticleContainer {...containerProps} />
    </div>
  )
}
