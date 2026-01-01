'use client'

/**
 * 협업 채팅 컴포넌트
 * 간단한 메시지 & 이모지 반응 기능
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Smile } from 'lucide-react'
import { useCollabOptional } from '@/lib/collab'

// 빠른 이모지 반응 목록
const QUICK_REACTIONS = ['👍', '❤️', '😊', '🎉', '👀', '✨', '🔥', '💯']

interface ChatMessage {
  id: string
  userId: string
  userName: string
  userColor: string
  content: string
  type: 'text' | 'reaction'
  timestamp: number
}

interface CollabChatProps {
  className?: string
  position?: 'bottom-left' | 'bottom-right'
}

export function CollabChat({ className = '', position = 'bottom-right' }: CollabChatProps) {
  const collab = useCollabOptional()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showReactions, setShowReactions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 채팅창 열릴 때 input 포커스
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const sendMessage = useCallback((content: string, type: 'text' | 'reaction' = 'text') => {
    if (!collab?.localUser || !content.trim()) return

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      userId: collab.localUser.id,
      userName: collab.localUser.name,
      userColor: collab.localUser.color,
      content: content.trim(),
      type,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, newMessage])
    setMessage('')

    // TODO: Supabase Realtime으로 브로드캐스트
    // collab.broadcastChat(newMessage)
  }, [collab])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(message, 'text')
  }

  const handleReaction = (emoji: string) => {
    sendMessage(emoji, 'reaction')
    setShowReactions(false)
  }

  if (!collab || !collab.isConnected) return null

  const positionClasses = position === 'bottom-left' ? 'left-4' : 'right-4'

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

        {/* 알림 배지 */}
        {!isOpen && messages.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center"
          >
            {messages.length > 9 ? '9+' : messages.length}
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
            <div className="px-4 py-3 bg-gradient-to-r from-primary-100 to-accent-100 border-b">
              <h3 className="font-semibold text-gray-800">채팅</h3>
            </div>

            {/* 메시지 영역 */}
            <div className="h-64 overflow-y-auto p-3 space-y-2 bg-gray-50">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  메시지를 보내보세요!
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.userId === collab.localUser?.id}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

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
                className={`p-2 rounded-lg transition-colors ${
                  showReactions ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                <Smile className="w-5 h-5" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="메시지 입력..."
                className="flex-1 px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <button
                type="submit"
                disabled={!message.trim()}
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
  // 이모지 반응인 경우 큰 이모지로 표시
  if (message.type === 'reaction') {
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
            style={{ color: message.userColor }}
          >
            {message.userName}
          </span>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm ${
            isOwn
              ? 'bg-primary-400 text-white rounded-br-sm'
              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
          }`}
        >
          {message.content}
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

  // 새 이모지 반응이 오면 플로팅 표시
  useEffect(() => {
    const reactionMessages = messages.filter((m) => m.type === 'reaction')
    const lastReaction = reactionMessages[reactionMessages.length - 1]

    if (lastReaction && Date.now() - lastReaction.timestamp < 1000) {
      const newFloating = {
        id: lastReaction.id,
        emoji: lastReaction.content,
      }
      setFloatingEmojis((prev) => [...prev, newFloating])

      // 2초 후 제거
      setTimeout(() => {
        setFloatingEmojis((prev) => prev.filter((f) => f.id !== newFloating.id))
      }, 2000)
    }
  }, [messages])

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
