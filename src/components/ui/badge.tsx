'use client'

/**
 * Badge & Level Display Components
 *
 * UX 서사: "모든 창작자의 여정을 빛나는 배지로 기록한다.
 *          작은 성취도 자랑할 수 있는 훈장이 된다."
 *
 * 이 컴포넌트들은 사용자의 성장을 시각화하여
 * 지속적인 참여 동기를 부여합니다.
 */

import { useMemo } from 'react'
import { cn } from '@/lib/utils/cn'
import { usePrefersReducedMotion } from '@/hooks/useAccessibility'
import {
  Star,
  Crown,
  Heart,
  Sparkles,
  TrendingUp,
  Users,
  Upload,
  Archive,
  Compass,
  Footprints,
  type LucideIcon,
} from 'lucide-react'
import { LEVEL_CONFIG, type Badge as BadgeType } from '@/stores/gamificationStore'

// 아이콘 매핑
const iconMap: Record<string, LucideIcon> = {
  Star,
  Crown,
  Heart,
  Sparkles,
  TrendingUp,
  Users,
  Upload,
  Archive,
  Compass,
  Footprints,
}

// 레어도 스타일
const rarityStyles = {
  common: {
    border: 'border-gray-300',
    bg: 'bg-gray-100',
    glow: '',
    text: 'text-gray-600',
  },
  rare: {
    border: 'border-blue-300',
    bg: 'bg-blue-50',
    glow: 'shadow-blue-200/50',
    text: 'text-blue-600',
  },
  epic: {
    border: 'border-purple-300',
    bg: 'bg-purple-50',
    glow: 'shadow-purple-200/50',
    text: 'text-purple-600',
  },
  legendary: {
    border: 'border-amber-300',
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    glow: 'shadow-amber-200/50',
    text: 'text-amber-600',
  },
}

/**
 * 뱃지 아이콘 컴포넌트
 */
export function BadgeIcon({
  badge,
  size = 'md',
  showGlow = true,
  className,
}: {
  badge: BadgeType
  size?: 'sm' | 'md' | 'lg'
  showGlow?: boolean
  className?: string
}) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const Icon = iconMap[badge.icon] || Star
  const style = rarityStyles[badge.rarity]

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div
      className={cn(
        'relative rounded-xl flex items-center justify-center border-2 transition-all',
        sizeClasses[size],
        style.border,
        style.bg,
        showGlow && badge.rarity !== 'common' && `shadow-lg ${style.glow}`,
        !prefersReducedMotion && badge.rarity === 'legendary' && 'animate-pulse-glow',
        className
      )}
      title={badge.name}
    >
      <Icon className={cn(iconSizes[size], style.text)} />

      {/* Legendary 반짝이 효과 */}
      {badge.rarity === 'legendary' && !prefersReducedMotion && (
        <span className="absolute -top-1 -right-1 text-xs animate-twinkle">✦</span>
      )}
    </div>
  )
}

/**
 * 뱃지 카드 - 자세한 정보 표시
 */
export function BadgeCard({
  badge,
  isLocked = false,
  className,
}: {
  badge: BadgeType | Omit<BadgeType, 'id' | 'unlockedAt'>
  isLocked?: boolean
  className?: string
}) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const style = rarityStyles[badge.rarity]

  return (
    <div
      className={cn(
        'relative p-4 rounded-2xl border-2 transition-all',
        isLocked
          ? 'border-gray-200 bg-gray-50 opacity-60'
          : `${style.border} ${style.bg}`,
        !prefersReducedMotion && !isLocked && 'hover:scale-105 hover:shadow-lg',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <BadgeIcon
          badge={badge as BadgeType}
          size="md"
          showGlow={!isLocked}
        />
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            'font-bold text-sm',
            isLocked ? 'text-gray-400' : 'text-gray-800'
          )}>
            {badge.name}
          </h4>
          <p className={cn(
            'text-xs mt-0.5',
            isLocked ? 'text-gray-400' : 'text-gray-500'
          )}>
            {badge.description}
          </p>

          {/* 획득 날짜 */}
          {'unlockedAt' in badge && badge.unlockedAt && (
            <p className="text-xs text-gray-400 mt-2">
              {new Date(badge.unlockedAt).toLocaleDateString('ko-KR')} 획득
            </p>
          )}
        </div>
      </div>

      {/* 잠금 오버레이 */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl opacity-50">🔒</span>
        </div>
      )}
    </div>
  )
}

/**
 * 레벨 뱃지 - 유저 프로필에 표시
 */
export function LevelBadge({
  level,
  size = 'md',
  showLabel = true,
  className,
}: {
  level: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const colorClass = LEVEL_CONFIG.colors[Math.min(level, LEVEL_CONFIG.colors.length - 1)]
  const levelName = LEVEL_CONFIG.names[Math.min(level, LEVEL_CONFIG.names.length - 1)]

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r text-white font-bold',
        colorClass,
        sizeClasses[size],
        !prefersReducedMotion && 'shadow-lg',
        className
      )}
      title={`Lv.${level} ${levelName}`}
    >
      <Star className={cn(
        size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
      )} fill="currentColor" />
      <span>Lv.{level}</span>
      {showLabel && size !== 'sm' && (
        <span className="opacity-90 font-medium">
          {levelName.split(' ')[0]}
        </span>
      )}
    </div>
  )
}

/**
 * 레벨 진행 바
 */
export function LevelProgress({
  level,
  progress,
  xp,
  xpToNext,
  showNumbers = true,
  className,
}: {
  level: number
  progress: number
  xp: number
  xpToNext: number
  showNumbers?: boolean
  className?: string
}) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const colorClass = LEVEL_CONFIG.colors[Math.min(level, LEVEL_CONFIG.colors.length - 1)]

  return (
    <div className={cn('space-y-2', className)}>
      {/* 레벨 & XP 정보 */}
      {showNumbers && (
        <div className="flex items-center justify-between text-sm">
          <LevelBadge level={level} size="sm" showLabel={false} />
          <span className="text-gray-500">
            {xpToNext === Infinity ? 'MAX' : `다음 레벨까지 ${xpToNext.toLocaleString()} XP`}
          </span>
        </div>
      )}

      {/* 진행 바 */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute inset-y-0 left-0 bg-gradient-to-r rounded-full transition-all duration-500',
            colorClass,
            !prefersReducedMotion && 'progress-sparkle'
          )}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      {/* XP 수치 */}
      {showNumbers && (
        <p className="text-xs text-gray-400 text-right">
          총 {xp.toLocaleString()} XP
        </p>
      )}
    </div>
  )
}

/**
 * 서포터 티어 뱃지 (구독 관련)
 */
export function SupporterBadge({
  tier,
  size = 'md',
  className,
}: {
  tier: 'free' | 'premium' | 'duo' | 'creator'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const tierConfig = {
    free: {
      label: '일반',
      icon: Star,
      color: 'bg-gray-100 text-gray-600 border-gray-200',
    },
    premium: {
      label: '서포터',
      icon: Heart,
      color: 'bg-pink-100 text-pink-600 border-pink-200',
    },
    duo: {
      label: '페어',
      icon: Users,
      color: 'bg-rose-100 text-rose-600 border-rose-200',
    },
    creator: {
      label: '크리에이터',
      icon: Crown,
      color: 'bg-amber-100 text-amber-600 border-amber-200',
    },
  }

  const config = tierConfig[tier]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  if (tier === 'free') return null

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        config.color,
        sizeClasses[size],
        !prefersReducedMotion && tier === 'creator' && 'badge-sparkle',
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </div>
  )
}

/**
 * 스트릭 뱃지 (연속 방문)
 */
export function StreakBadge({
  streak,
  size = 'md',
  className,
}: {
  streak: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const prefersReducedMotion = usePrefersReducedMotion()

  if (streak < 2) return null

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  // 스트릭에 따른 색상
  const colorClass = streak >= 7
    ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white'
    : streak >= 3
      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
      : 'bg-amber-100 text-amber-600'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-bold',
        colorClass,
        sizeClasses[size],
        !prefersReducedMotion && streak >= 7 && 'animate-pulse',
        className
      )}
      title={`${streak}일 연속 방문`}
    >
      <span className={!prefersReducedMotion && streak >= 7 ? 'animate-wiggle' : ''}>
        🔥
      </span>
      <span>{streak}일</span>
    </div>
  )
}

export default { BadgeIcon, BadgeCard, LevelBadge, LevelProgress, SupporterBadge, StreakBadge }
