'use client'

import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { useLikes } from '@/hooks/useLikes'
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

  const handleClick = async () => {
    if (isToggling) return

    setIsToggling(true)
    setIsAnimating(true)

    const success = await toggle()

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
    <button
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

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsAnimating(true)
    await toggle()
    setTimeout(() => setIsAnimating(false), 300)

    if (onToggle) onToggle()
  }

  const liked = initialIsLiked !== undefined ? initialIsLiked : isLiked

  return (
    <button
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
  )
}
