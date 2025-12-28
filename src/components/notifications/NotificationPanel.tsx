'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  Heart,
  MessageCircle,
  Sparkles,
  Crown,
  Gift,
  Check,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// 알림 타입
export type NotificationType = 'like' | 'comment' | 'use' | 'follow' | 'system' | 'premium'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  createdAt: string
  read: boolean
  link?: string
}

// 목업 알림 데이터
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'like',
    title: '좋아요',
    message: '딸기크림님이 "커플 프로필 틀"을 좋아합니다',
    createdAt: '2025-12-28T10:30:00',
    read: false,
    link: '/templates/1',
  },
  {
    id: '2',
    type: 'use',
    title: '틀 사용',
    message: '누군가 "친구 관계도" 틀을 사용했어요! (+3)',
    createdAt: '2025-12-28T09:15:00',
    read: false,
    link: '/my/creator',
  },
  {
    id: '3',
    type: 'follow',
    title: '새 팔로워',
    message: '페어리님이 회원님을 팔로우하기 시작했습니다',
    createdAt: '2025-12-27T18:45:00',
    read: true,
  },
  {
    id: '4',
    type: 'premium',
    title: '프리미엄',
    message: '무료 체험 기간이 3일 남았어요. 지금 업그레이드하세요!',
    createdAt: '2025-12-27T12:00:00',
    read: true,
    link: '/premium',
  },
  {
    id: '5',
    type: 'system',
    title: '시스템',
    message: '새로운 기능이 추가되었어요! 크리에이터 대시보드를 확인해보세요.',
    createdAt: '2025-12-26T10:00:00',
    read: true,
    link: '/my/creator',
  },
]

const notificationIcons: Record<NotificationType, { icon: typeof Heart; color: string; bgColor: string }> = {
  like: { icon: Heart, color: 'text-red-500', bgColor: 'bg-red-100' },
  comment: { icon: MessageCircle, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  use: { icon: Sparkles, color: 'text-accent-500', bgColor: 'bg-accent-100' },
  follow: { icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-100' },
  system: { icon: Bell, color: 'text-gray-500', bgColor: 'bg-gray-100' },
  premium: { icon: Crown, color: 'text-primary-500', bgColor: 'bg-primary-100' },
}

// 상대 시간 포맷
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState(mockNotifications)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-[20px] shadow-xl border border-gray-200 z-50 animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900">알림</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-primary-400 text-white text-xs font-medium rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary-500 hover:underline"
            >
              모두 읽음
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const iconInfo = notificationIcons[notification.type]
                const Icon = iconInfo.icon

                const content = (
                  <div
                    className={cn(
                      'p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group',
                      !notification.read && 'bg-primary-50/30'
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                        iconInfo.bgColor
                      )}>
                        <Icon className={cn('w-5 h-5', iconInfo.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-gray-500">
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary-400 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => removeNotification(notification.id, e)}
                        className="absolute top-3 right-3 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-full transition-all"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )

                return notification.link ? (
                  <Link key={notification.id} href={notification.link} onClick={onClose}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">알림이 없어요</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-100 text-center">
            <Link
              href="/my/notifications"
              onClick={onClose}
              className="text-sm text-primary-500 hover:underline"
            >
              모든 알림 보기
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

// 알림 벨 버튼 컴포넌트
interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = mockNotifications.filter(n => !n.read).length

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="알림"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary-400 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  )
}
