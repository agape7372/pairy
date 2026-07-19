'use client'

/**
 * 알림 전체 목록 (F-31, 2026-07-19)
 * 벨 패널의 "모든 알림 보기" 랜딩 — 최근 50건 + 모두 읽음.
 */

import Link from 'next/link'
import { Bell, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useNotifications } from '@/hooks/useNotifications'

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function MyNotificationsPage() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications(50)

  return (
    <div className="py-8 px-4 animate-fade-in">
      <div className="max-w-[600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">알림</h1>
            <p className="text-gray-500 text-sm">
              팔로우·댓글·좋아요 소식을 모아 보여드려요
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllAsRead()}
              className="flex items-center gap-1 text-sm text-primary-700 hover:underline"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              모두 읽음
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-400" aria-hidden="true" />
            </div>
            <p className="text-gray-500">아직 알림이 없어요</p>
            <p className="text-gray-400 text-sm mt-1">
              틀을 게시하면 좋아요·댓글 소식이 여기에 모여요
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {notifications.map((n) => {
              // 중첩 인터랙티브 방지 + 키보드 접근성: 링크형은 Link 자체가,
              // 비링크형은 네이티브 button 이 클릭을 받는다
              const content = (
                <>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-500">{n.title}</span>
                    {!n.read && <span className="w-2 h-2 bg-primary-400 rounded-full" />}
                  </div>
                  <p className="text-sm text-gray-700">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                </>
              )
              const itemClass = cn(
                'block w-full text-left p-4 hover:bg-gray-50 transition-colors',
                !n.read && 'bg-primary-50/30'
              )
              return n.link ? (
                <Link
                  key={n.id}
                  href={n.link}
                  className={itemClass}
                  onClick={() => void markAsRead(n.id)}
                >
                  {content}
                </Link>
              ) : (
                <button key={n.id} className={itemClass} onClick={() => void markAsRead(n.id)}>
                  {content}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
