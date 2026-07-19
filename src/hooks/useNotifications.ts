'use client'

/**
 * 알림 훅 (F-31 실배선, 2026-07-19)
 *
 * 이벤트원: DB 트리거(팔로우/댓글/좋아요, 20260719000001)가 notifications 에 기록.
 * 프로덕션: 본인 알림 조회(RLS) + read_at 갱신 + Realtime INSERT 구독.
 * 데모: 이벤트원이 없어 빈 목록 (가짜 알림 생성 금지 — 정직한 빈 상태).
 */

import { useCallback, useEffect, useState } from 'react'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'
import type { NotificationType } from '@/components/notifications/NotificationPanel'

/** 패널이 그리는 뷰모델 (NotificationPanel.Notification 과 동일 형태) */
export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  createdAt: string
  read: boolean
  link?: string
}

interface DbNotificationRow {
  id: string
  type: 'follow' | 'comment' | 'like' | 'system'
  message: string | null
  read_at: string | null
  created_at: string
  template_id: string | null
  actor: { username: string | null; display_name: string | null } | null
  template: { title: string } | null
}

function mapRow(row: DbNotificationRow): NotificationItem {
  const actorName = row.actor?.display_name || '누군가'
  const templateTitle = row.template?.title

  let title = '알림'
  let message = row.message ?? ''
  let link: string | undefined

  switch (row.type) {
    case 'follow':
      title = '새 팔로워'
      message = `${actorName}님이 나를 팔로우하기 시작했어요`
      link = row.actor?.username ? `/creator/${row.actor.username}` : undefined
      break
    case 'comment':
      title = '새 댓글'
      message = templateTitle
        ? `${actorName}님이 '${templateTitle}'에 댓글을 남겼어요`
        : `${actorName}님이 내 틀에 댓글을 남겼어요`
      link = row.template_id ? `/templates/${row.template_id}` : undefined
      break
    case 'like':
      title = '좋아요'
      message = templateTitle
        ? `${actorName}님이 '${templateTitle}'을(를) 좋아해요`
        : `${actorName}님이 내 틀을 좋아해요`
      link = row.template_id ? `/templates/${row.template_id}` : undefined
      break
    case 'system':
      title = '안내'
      break
  }

  return {
    id: row.id,
    type: row.type,
    title,
    message,
    createdAt: row.created_at,
    read: row.read_at !== null,
    link,
  }
}

const SELECT_WITH_JOINS =
  'id, type, message, read_at, created_at, template_id, actor:profiles!actor_id(username, display_name), template:templates!template_id(title)'

export function useNotifications(limit = 30) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(!IS_DEMO_MODE)
  const [userId, setUserId] = useState<string | null>(null)

  // 초기 로드
  useEffect(() => {
    if (IS_DEMO_MODE) return
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) {
          if (!cancelled) setIsLoading(false)
          return
        }
        setUserId(user.id)

        const { data } = await supabase
          .from('notifications')
          .select(SELECT_WITH_JOINS)
          .order('created_at', { ascending: false })
          .limit(limit)
        if (cancelled) return
        if (data) {
          setNotifications((data as unknown as DbNotificationRow[]).map(mapRow))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [limit])

  // Realtime: 새 알림 실시간 반영
  useEffect(() => {
    if (IS_DEMO_MODE || !userId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        async (payload) => {
          // 조인 정보가 없으므로 방금 행만 재조회해서 매핑
          const { data } = await supabase
            .from('notifications')
            .select(SELECT_WITH_JOINS)
            .eq('id', (payload.new as { id: string }).id)
            .maybeSingle()
          if (data) {
            setNotifications((prev) => [mapRow(data as unknown as DbNotificationRow), ...prev])
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    if (IS_DEMO_MODE) return
    const supabase = createClient()
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    if (IS_DEMO_MODE) return
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)
  }, [])

  const removeNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (IS_DEMO_MODE) return
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('id', id)
  }, [])

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, removeNotification }
}
