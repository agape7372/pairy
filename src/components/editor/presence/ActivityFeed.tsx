'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, UserPlus, UserMinus, Edit3, ImagePlus, Palette, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ActivityItem } from '@/types/editor-entry'

// ============================================
// Props
// ============================================

interface ActivityFeedProps {
  activities: ActivityItem[]
  maxItems?: number
  className?: string
}

// ============================================
// 유틸리티
// ============================================

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)

  if (diffSecs < 10) return '방금'
  if (diffSecs < 60) return `${diffSecs}초 전`
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  return '하루 이상 전'
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'join':
      return UserPlus
    case 'leave':
      return UserMinus
    case 'edit':
      return Edit3
    case 'upload':
      return ImagePlus
    case 'color-change':
      return Palette
    default:
      return Activity
  }
}

function getActivityColor(type: ActivityItem['type']) {
  switch (type) {
    case 'join':
      return 'text-green-500 bg-green-100'
    case 'leave':
      return 'text-gray-500 bg-gray-100'
    case 'edit':
      return 'text-blue-500 bg-blue-100'
    case 'upload':
      return 'text-purple-500 bg-purple-100'
    case 'color-change':
      return 'text-pink-500 bg-pink-100'
    default:
      return 'text-gray-500 bg-gray-100'
  }
}

// ============================================
// 메인 컴포넌트
// ============================================

export function ActivityFeed({
  activities,
  maxItems = 10,
  className,
}: ActivityFeedProps) {
  // 최근 활동만 표시
  const displayedActivities = useMemo(
    () => activities.slice(0, maxItems),
    [activities, maxItems]
  )

  if (displayedActivities.length === 0) {
    return (
      <div className={cn('p-4', className)}>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <Activity className="w-4 h-4 text-gray-400" />
        <h3 className="font-semibold text-sm text-gray-900">활동</h3>
      </div>

      {/* 활동 목록 */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {displayedActivities.map((activity, index) => (
            <ActivityItemRow
              key={activity.id}
              activity={activity}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ============================================
// 활동 아이템 컴포넌트
// ============================================

interface ActivityItemRowProps {
  activity: ActivityItem
  index: number
}

function ActivityItemRow({ activity, index }: ActivityItemRowProps) {
  const Icon = getActivityIcon(activity.type)
  const colorClasses = getActivityColor(activity.type)
  const timeAgo = formatTimeAgo(activity.timestamp)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      {/* 아이콘 */}
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', colorClasses)}>
        <Icon className="w-4 h-4" />
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {/* 사용자 + 메시지 */}
            <p className="text-sm text-gray-900">
              <span className="font-medium">{activity.nickname}</span>
              <span className="text-gray-500"> {activity.message}</span>
            </p>
          </div>

          {/* 시간 */}
          <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// 빈 상태
// ============================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <Activity className="w-6 h-6 text-gray-300" />
      </div>
      <p className="text-sm text-gray-500">아직 활동이 없어요</p>
      <p className="text-xs text-gray-400 mt-1">
        함께 작업하면 여기에 표시돼요
      </p>
    </div>
  )
}

// ============================================
// 컴팩트 활동 피드 (토스트 스타일)
// ============================================

interface CompactActivityToastProps {
  activity: ActivityItem
  onDismiss?: () => void
}

export function CompactActivityToast({ activity, onDismiss }: CompactActivityToastProps) {
  const Icon = getActivityIcon(activity.type)
  const colorClasses = getActivityColor(activity.type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-lg max-w-sm"
    >
      {/* 아바타 */}
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center overflow-hidden">
          {activity.avatarUrl ? (
            <Image
              src={activity.avatarUrl}
              alt={activity.nickname || '사용자'}
              width={32}
              height={32}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            /* NOTE: 빈 문자열 방어 */
            <span className="text-sm font-medium text-gray-600">
              {(activity.nickname?.charAt(0) || '?').toUpperCase()}
            </span>
          )}
        </div>
        <div className={cn('absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center', colorClasses)}>
          <Icon className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* 메시지 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 truncate">
          <span className="font-medium">{activity.nickname || '익명'}</span>
          <span className="text-gray-500"> {activity.message}</span>
        </p>
      </div>
    </motion.div>
  )
}
