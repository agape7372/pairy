'use client'

import { useState, useRef } from 'react'
import { Users, UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useFollow } from '@/hooks/useFollow'
import { useParticle, ParticleContainer } from '@/hooks/useParticle'
import { cn } from '@/lib/utils/cn'

interface FollowButtonProps {
  userId: string
  initialFollowing?: boolean
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({
  userId,
  initialFollowing = false,
  showIcon = true,
  size = 'md',
  className,
  onFollowChange,
}: FollowButtonProps) {
  const { isFollowing, isLoading, toggle } = useFollow(userId)
  const [isToggling, setIsToggling] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // ✨ 팔로우 시 스파클 파티클
  const { emit, containerProps } = useParticle({
    type: 'sparkle',
    count: 12,
    direction: 'radial',
    colors: ['#FFD9D9', '#D7FAFA', '#FFCACA', '#B8F0F0', '#FFF5B8'],
    sizeRange: [6, 14],
    duration: 800,
    distanceRange: [30, 70],
  })

  const handleClick = async () => {
    if (isToggling) return

    setIsToggling(true)
    const success = await toggle()
    setIsToggling(false)

    if (success) {
      // 팔로우할 때만 파티클 효과
      if (!isFollowing && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        emit(rect.width / 2, rect.height / 2)
      }

      if (onFollowChange) {
        onFollowChange(!isFollowing)
      }
    }
  }

  const buttonText = isFollowing ? '팔로잉' : '팔로우'
  const Icon = isFollowing ? UserMinus : UserPlus

  if (isLoading) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={className}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    )
  }

  return (
    <div className="relative inline-block">
      <Button
        ref={buttonRef}
        variant={isFollowing ? 'outline' : 'primary'}
        size={size}
        onClick={handleClick}
        disabled={isToggling}
        className={cn(
          'transition-all duration-200',
          isFollowing && 'hover:border-red-300 hover:text-red-500 hover:bg-red-50',
          className
        )}
      >
        {isToggling ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : showIcon ? (
          <Icon className="w-4 h-4 mr-2" />
        ) : null}
        {isToggling ? '처리 중...' : buttonText}
      </Button>
      <ParticleContainer {...containerProps} />
    </div>
  )
}

// 간단한 팔로워/팔로잉 카운트 표시 컴포넌트
interface FollowStatsProps {
  userId: string
  followerCount?: number
  followingCount?: number
  onFollowersClick?: () => void
  onFollowingClick?: () => void
  className?: string
}

export function FollowStats({
  userId,
  followerCount: initialFollowerCount,
  followingCount: initialFollowingCount,
  onFollowersClick,
  onFollowingClick,
  className,
}: FollowStatsProps) {
  const { followerCount, followingCount } = useFollow(userId)

  const displayFollowers = initialFollowerCount ?? followerCount
  const displayFollowing = initialFollowingCount ?? followingCount

  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      <button
        onClick={onFollowersClick}
        className="flex items-center gap-1 hover:text-primary-400 transition-colors"
      >
        <span className="font-semibold text-gray-900">
          {displayFollowers.toLocaleString()}
        </span>
        <span className="text-gray-500">팔로워</span>
      </button>
      <button
        onClick={onFollowingClick}
        className="flex items-center gap-1 hover:text-primary-400 transition-colors"
      >
        <span className="font-semibold text-gray-900">
          {displayFollowing.toLocaleString()}
        </span>
        <span className="text-gray-500">팔로잉</span>
      </button>
    </div>
  )
}
