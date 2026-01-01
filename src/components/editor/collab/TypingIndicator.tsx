'use client'

/**
 * 타이핑 인디케이터 컴포넌트
 * 다른 사용자가 입력 중일 때 표시
 */

import { motion, AnimatePresence } from 'framer-motion'
import type { TypingUser } from '@/hooks/useCollabChat'

interface TypingIndicatorProps {
  typingUsers: TypingUser[]
  className?: string
  variant?: 'inline' | 'bubble' | 'dots'
}

export function TypingIndicator({
  typingUsers,
  className = '',
  variant = 'inline',
}: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  // 타이핑 중인 사용자 이름 생성
  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName}님이 입력 중...`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName}, ${typingUsers[1].userName}님이 입력 중...`
    } else {
      return `${typingUsers[0].userName} 외 ${typingUsers.length - 1}명이 입력 중...`
    }
  }

  if (variant === 'dots') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`flex items-center gap-1 ${className}`}
        >
          <TypingDots color={typingUsers[0]?.userColor} />
        </motion.div>
      </AnimatePresence>
    )
  }

  if (variant === 'bubble') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-2xl rounded-bl-sm ${className}`}
        >
          <div className="flex -space-x-2">
            {typingUsers.slice(0, 3).map(user => (
              <div
                key={user.userId}
                className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: user.userColor }}
              >
                {user.userName[0]?.toUpperCase()}
              </div>
            ))}
          </div>
          <TypingDots color={typingUsers[0]?.userColor} />
        </motion.div>
      </AnimatePresence>
    )
  }

  // inline variant
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}
      >
        <TypingDots color={typingUsers[0]?.userColor} size="sm" />
        <span>{getTypingText()}</span>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================
// 타이핑 점 애니메이션
// ============================================

interface TypingDotsProps {
  color?: string
  size?: 'sm' | 'md'
}

function TypingDots({ color = '#888', size = 'md' }: TypingDotsProps) {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'

  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className={`${dotSize} rounded-full`}
          style={{ backgroundColor: color }}
          animate={{
            y: [0, -4, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default TypingIndicator
