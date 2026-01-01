'use client'

/**
 * 협업 채팅 훅
 * Supabase Realtime 기반 실시간 메시지 동기화
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { CollabUser } from '@/lib/collab/types'

// ============================================
// Types
// ============================================

export interface ChatMessage {
  id: string
  sessionId: string
  userId: string
  userName: string
  userColor: string
  userAvatar?: string
  content: string
  type: 'text' | 'reaction' | 'system'
  timestamp: number
  isLocal?: boolean
}

export interface TypingUser {
  userId: string
  userName: string
  userColor: string
  startedAt: number
}

interface UseCollabChatOptions {
  sessionId: string | null
  user: CollabUser | null
  maxMessages?: number
}

interface UseCollabChatReturn {
  // 메시지
  messages: ChatMessage[]
  sendMessage: (content: string, type?: 'text' | 'reaction') => void
  clearMessages: () => void

  // 타이핑 인디케이터
  typingUsers: TypingUser[]
  startTyping: () => void
  stopTyping: () => void

  // 연결 상태
  isConnected: boolean
  unreadCount: number
  markAsRead: () => void
}

// ============================================
// Constants
// ============================================

const TYPING_TIMEOUT_MS = 3000 // 타이핑 상태 유지 시간
const MAX_MESSAGES_DEFAULT = 100

// ============================================
// Hook
// ============================================

export function useCollabChat(options: UseCollabChatOptions): UseCollabChatReturn {
  const { sessionId, user, maxMessages = MAX_MESSAGES_DEFAULT } = options

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  // 메시지 추가 (중복 방지)
  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      // 중복 체크
      if (prev.some(m => m.id === msg.id)) {
        return prev
      }

      const newMessages = [...prev, msg]
      // 최대 메시지 수 제한
      if (newMessages.length > maxMessages) {
        return newMessages.slice(-maxMessages)
      }
      return newMessages
    })

    // 읽지 않은 메시지 카운트 (자신의 메시지 제외)
    if (!msg.isLocal) {
      setUnreadCount(prev => prev + 1)
    }
  }, [maxMessages])

  // 채널 연결
  useEffect(() => {
    if (!sessionId || !user || !isSupabaseConfigured()) {
      setIsConnected(false)
      return
    }

    const supabase = createClient()
    const channelName = `collab-chat:${sessionId}`

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    })

    // 메시지 수신
    channel.on('broadcast', { event: 'chat-message' }, ({ payload }) => {
      const msg = payload as ChatMessage
      addMessage({
        ...msg,
        isLocal: false,
      })
    })

    // 타이핑 상태 수신
    channel.on('broadcast', { event: 'typing-start' }, ({ payload }) => {
      const { userId, userName, userColor } = payload as TypingUser
      if (userId === user.id) return

      setTypingUsers(prev => {
        // 이미 존재하면 시간만 업데이트
        const existing = prev.find(t => t.userId === userId)
        if (existing) {
          return prev.map(t =>
            t.userId === userId ? { ...t, startedAt: Date.now() } : t
          )
        }
        return [...prev, { userId, userName, userColor, startedAt: Date.now() }]
      })
    })

    channel.on('broadcast', { event: 'typing-stop' }, ({ payload }) => {
      const { userId } = payload as { userId: string }
      setTypingUsers(prev => prev.filter(t => t.userId !== userId))
    })

    // 시스템 메시지 수신 (참가/퇴장)
    channel.on('broadcast', { event: 'system-message' }, ({ payload }) => {
      addMessage({
        id: `sys-${Date.now()}`,
        sessionId,
        userId: 'system',
        userName: 'System',
        userColor: '#888888',
        content: payload.content,
        type: 'system',
        timestamp: Date.now(),
        isLocal: false,
      })
    })

    // 구독 시작
    channel.subscribe(status => {
      setIsConnected(status === 'SUBSCRIBED')

      // 참가 메시지 전송
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'system-message',
          payload: {
            content: `${user.name}님이 참가했습니다`,
          },
        })
      }
    })

    channelRef.current = channel

    // 클린업
    return () => {
      // 퇴장 메시지 전송
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'system-message',
          payload: {
            content: `${user.name}님이 나갔습니다`,
          },
        })
        supabase.removeChannel(channelRef.current)
      }
      channelRef.current = null
      setIsConnected(false)
    }
  }, [sessionId, user, addMessage])

  // 타이핑 상태 자동 정리
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypingUsers(prev =>
        prev.filter(t => now - t.startedAt < TYPING_TIMEOUT_MS)
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // 메시지 전송
  const sendMessage = useCallback((content: string, type: 'text' | 'reaction' = 'text') => {
    if (!content.trim() || !sessionId || !user || !channelRef.current) return

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sessionId,
      userId: user.id,
      userName: user.name,
      userColor: user.color,
      userAvatar: user.avatar,
      content: content.trim(),
      type,
      timestamp: Date.now(),
      isLocal: true,
    }

    // 로컬에 먼저 추가
    addMessage(message)

    // 브로드캐스트
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat-message',
      payload: message,
    })

    // 타이핑 중지
    stopTyping()
  }, [sessionId, user, addMessage])

  // 메시지 초기화
  const clearMessages = useCallback(() => {
    setMessages([])
    setUnreadCount(0)
  }, [])

  // 타이핑 시작
  const startTyping = useCallback(() => {
    if (!user || !channelRef.current || isTypingRef.current) return

    isTypingRef.current = true

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing-start',
      payload: {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
      },
    })

    // 자동 중지 타이머
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, TYPING_TIMEOUT_MS)
  }, [user])

  // 타이핑 중지
  const stopTyping = useCallback(() => {
    if (!user || !channelRef.current || !isTypingRef.current) return

    isTypingRef.current = false

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing-stop',
      payload: {
        userId: user.id,
      },
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [user])

  // 읽음 처리
  const markAsRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  return {
    messages,
    sendMessage,
    clearMessages,
    typingUsers,
    startTyping,
    stopTyping,
    isConnected,
    unreadCount,
    markAsRead,
  }
}
