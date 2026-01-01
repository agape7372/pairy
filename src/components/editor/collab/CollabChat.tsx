'use client'

/**
 * 협업 채팅 컴포넌트
 * useCollabChat 훅을 사용한 실시간 메시지 & 이모지 반응
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Smile } from 'lucide-react'
import { useCollabChat, type ChatMessage } from '@/hooks/useCollabChat'
import { TypingIndicator } from './TypingIndicator'
import type { CollabUser } from '@/lib/collab/types'

// 빠른 이모지 반응 목록
const QUICK_REACTIONS = ['👍', '❤️', '😊', '🎉', '👀', '✨', '🔥', '💯']

// [FIXED: CSS Injection 방지 - hex color만 허용]
function sanitizeColor(color: string | undefined): string {
  if (!color) return '#888888'
  // hex color 패턴만 허용 (#RGB, #RRGGBB, #RRGGBBAA)
  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/
  return hexPattern.test(color) ? color : '#888888'
}

// 변경 이유: 안전한 텍스트 렌더링 (HTML 태그 무력화)
function SafeText({ children }: { children: string }) {
  // React는 기본적으로 XSS를 방지하지만, 추가 검증
  const sanitized = children.replace(/[<>]/g, (char) =>
    char === '<' ? '&lt;' : '&gt;'
  )
  return <>{sanitized}</>
}

interface CollabChatProps {
  sessionId: string | null
  user: CollabUser | null
  className?: string
  position?: 'bottom-left' | 'bottom-right'
}

export function CollabChat({
  sessionId,
  user,
  className = '',
  position = 'bottom-right',
}: CollabChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showReactions, setShowReactions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // useCollabChat 훅 사용
  const {
    messages,
    sendMessage,
    typingUsers,
    startTyping,
    stopTyping,
    isConnected,
    unreadCount,
    markAsRead,
  } = useCollabChat({
    sessionId,
    user,
  })

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 채팅창 열릴 때 input 포커스 및 읽음 처리
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      markAsRead()
    }
  }, [isOpen, markAsRead])

  // 입력 변경 시 타이핑 상태 업데이트
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    if (value.trim()) {
      startTyping()
    } else {
      stopTyping()
    }
  }, [startTyping, stopTyping])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    sendMessage(inputValue, 'text')
    setInputValue('')
    stopTyping()
  }, [inputValue, sendMessage, stopTyping])

  const handleReaction = useCallback((emoji: string) => {
    sendMessage(emoji, 'reaction')
    setShowReactions(false)
  }, [sendMessage])

  const positionClasses = position === 'bottom-left' ? 'left-4' : 'right-4'

  // 세션이 없으면 렌더링하지 않음
  if (!sessionId) return null

  return (
    <>
      {/* 채팅 토글 버튼 */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 ${positionClasses} z-40 w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full shadow-lg flex items-center justify-center text-white ${className}`}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <MessageCircle className="w-5 h-5" />
        )}

        {/* 읽지 않은 메시지 배지 */}
        {!isOpen && unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* 채팅 패널 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-20 ${positionClasses} z-40 w-80 bg-white rounded-2xl shadow-xl overflow-hidden`}
          >
            {/* 헤더 */}
            <div className="px-4 py-3 bg-gradient-to-r from-primary-100 to-accent-100 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">채팅</h3>
              {isConnected ? (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  연결됨
                </span>
              ) : (
                <span className="text-xs text-gray-400">연결 중...</span>
              )}
            </div>

            {/* 메시지 영역 */}
            <div className="h-64 overflow-y-auto p-3 space-y-2 bg-gray-50">
              {!isConnected ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  <span className="animate-pulse">연결 중...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  메시지를 보내보세요!
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.userId === user?.id}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 타이핑 인디케이터 */}
            {typingUsers.length > 0 && (
              <div className="px-3 py-2 border-t bg-white">
                <TypingIndicator typingUsers={typingUsers} variant="inline" />
              </div>
            )}

            {/* 빠른 이모지 반응 */}
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t bg-white overflow-hidden"
                >
                  <div className="p-2 flex flex-wrap gap-1 justify-center">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="w-10 h-10 text-xl hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 입력 영역 */}
            <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
              <button
                type="button"
                onClick={() => setShowReactions(!showReactions)}
                disabled={!isConnected}
                className={`p-2 rounded-lg transition-colors ${
                  showReactions ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                <Smile className="w-5 h-5" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={stopTyping}
                placeholder={isConnected ? "메시지 입력..." : "연결 대기 중..."}
                disabled={!isConnected}
                className="flex-1 px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!isConnected || !inputValue.trim()}
                className="p-2 bg-primary-400 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-500 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 플로팅 이모지 반응 표시 */}
      <FloatingReactions messages={messages} position={position} />
    </>
  )
}

// ============================================
// 메시지 버블
// ============================================

interface ChatMessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
}

function ChatMessageBubble({ message, isOwn }: ChatMessageBubbleProps) {
  // 시스템 메시지
  if (message.type === 'system') {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {/* 변경 이유: 시스템 메시지도 XSS 방지 적용 */}
          <SafeText>{message.content}</SafeText>
        </span>
      </div>
    )
  }

  // 이모지 반응인 경우 큰 이모지로 표시
  if (message.type === 'reaction') {
    // 변경 이유: 이모지만 허용 (악성 코드 방지)
    const isValidEmoji = /^[\p{Emoji}]+$/u.test(message.content)
    if (!isValidEmoji) return null

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      >
        <div className="text-3xl">{message.content}</div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] ${isOwn ? 'order-2' : ''}`}>
        {!isOwn && (
          <span
            className="text-xs font-medium mb-0.5 block"
            style={{ color: sanitizeColor(message.userColor) }}
          >
            {/* 변경 이유: 사용자 이름도 XSS 방지 */}
            <SafeText>{message.userName}</SafeText>
          </span>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm ${
            isOwn
              ? 'bg-primary-400 text-white rounded-br-sm'
              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
          }`}
        >
          {/* 변경 이유: 메시지 내용 XSS 방지 */}
          <SafeText>{message.content}</SafeText>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// 플로팅 이모지 반응
// ============================================

interface FloatingReactionsProps {
  messages: ChatMessage[]
  position: 'bottom-left' | 'bottom-right'
}

function FloatingReactions({ messages, position }: FloatingReactionsProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: string; emoji: string }>>([])
  // 변경 이유: 타이머 ID를 ref로 관리하여 메모리 누수 방지
  const timeoutIdsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  // 변경 이유: 마지막 처리된 메시지 ID 추적으로 중복 처리 방지
  const lastProcessedIdRef = useRef<string | null>(null)

  // 새 이모지 반응이 오면 플로팅 표시
  useEffect(() => {
    const reactionMessages = messages.filter((m) => m.type === 'reaction')
    const lastReaction = reactionMessages[reactionMessages.length - 1]

    // 변경 이유: 이미 처리된 메시지는 건너뛰어 중복 애니메이션 방지
    if (!lastReaction || lastReaction.id === lastProcessedIdRef.current) {
      return
    }

    // 변경 이유: 3초로 늘려 네트워크 지연 고려
    if (Date.now() - lastReaction.timestamp < 3000) {
      lastProcessedIdRef.current = lastReaction.id
      const newFloating = {
        id: lastReaction.id,
        emoji: lastReaction.content,
      }
      setFloatingEmojis((prev) => [...prev, newFloating])

      // 2초 후 제거
      const timeoutId = setTimeout(() => {
        setFloatingEmojis((prev) => prev.filter((f) => f.id !== newFloating.id))
        timeoutIdsRef.current.delete(newFloating.id)
      }, 2000)

      timeoutIdsRef.current.set(newFloating.id, timeoutId)
    }
  }, [messages])

  // 변경 이유: 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      timeoutIdsRef.current.clear()
    }
  }, [])

  const positionClasses = position === 'bottom-left' ? 'left-20' : 'right-20'

  return (
    <div className={`fixed bottom-20 ${positionClasses} pointer-events-none z-50`}>
      <AnimatePresence>
        {floatingEmojis.map((floating, index) => (
          <motion.div
            key={floating.id}
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{
              y: -100 - index * 30,
              opacity: 0,
              scale: 1.5,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="absolute text-4xl"
          >
            {floating.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default CollabChat
