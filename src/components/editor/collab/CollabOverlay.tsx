'use client'

/**
 * 협업 오버레이 컴포넌트
 * 원격 사용자의 커서, 선택 영역, 존재 표시를 캔버스 위에 렌더링
 */

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCollabOptional } from '@/lib/collab'
import type { UserEditingState, CollabUser } from '@/lib/collab/types'

interface RemoteCursor {
  userId: string
  userName: string
  color: string
  x: number
  y: number
  lastUpdate: number
}

interface CollabOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  scale?: number
  offsetX?: number
  offsetY?: number
}

export function CollabOverlay({
  containerRef,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
}: CollabOverlayProps) {
  const collab = useCollabOptional()
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map())
  const animationFrameRef = useRef<number | undefined>(undefined)

  // 원격 사용자 커서 업데이트
  useEffect(() => {
    if (!collab) return

    const updateCursors = () => {
      const newCursors = new Map<string, RemoteCursor>()

      collab.remoteUsers.forEach((state, userId) => {
        if (state.cursor) {
          // 사용자 색상 추출 (기본값 사용)
          const userColor = getUserColor(userId)

          newCursors.set(userId, {
            userId,
            userName: userId.slice(0, 8), // 임시: userId 앞 8자
            color: userColor,
            x: state.cursor.x,
            y: state.cursor.y,
            lastUpdate: state.lastActivity,
          })
        }
      })

      setRemoteCursors(newCursors)
    }

    // 30fps로 커서 위치 업데이트
    const interval = setInterval(updateCursors, 33)
    return () => clearInterval(interval)
  }, [collab])

  // 오래된 커서 정리 (5초 이상 업데이트 없으면 fade out)
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now()
      setRemoteCursors((prev) => {
        const filtered = new Map<string, RemoteCursor>()
        prev.forEach((cursor, id) => {
          if (now - cursor.lastUpdate < 5000) {
            filtered.set(id, cursor)
          }
        })
        return filtered
      })
    }

    const interval = setInterval(cleanup, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!collab || !collab.isConnected) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 100 }}
    >
      <AnimatePresence>
        {Array.from(remoteCursors.values()).map((cursor) => (
          <RemoteCursorIndicator
            key={cursor.userId}
            cursor={cursor}
            scale={scale}
            offsetX={offsetX}
            offsetY={offsetY}
          />
        ))}
      </AnimatePresence>

      {/* 원격 사용자 선택 영역 표시 */}
      {Array.from(collab.remoteUsers.entries()).map(([userId, state]) => {
        if (!state.selectedSlotId && !state.selectedTextId) return null

        return (
          <RemoteSelectionIndicator
            key={`selection-${userId}`}
            userId={userId}
            state={state}
            containerRef={containerRef}
          />
        )
      })}
    </div>
  )
}

// ============================================
// 원격 커서 표시
// ============================================

interface RemoteCursorIndicatorProps {
  cursor: RemoteCursor
  scale: number
  offsetX: number
  offsetY: number
}

function RemoteCursorIndicator({ cursor, scale, offsetX, offsetY }: RemoteCursorIndicatorProps) {
  // 캔버스 좌표를 스크린 좌표로 변환
  const screenX = cursor.x * scale + offsetX
  const screenY = cursor.y * scale + offsetY

  const isStale = Date.now() - cursor.lastUpdate > 3000

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: isStale ? 0.3 : 1,
        scale: 1,
        x: screenX,
        y: screenY,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        x: { type: 'spring', stiffness: 500, damping: 30 },
        y: { type: 'spring', stiffness: 500, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      className="absolute top-0 left-0"
      style={{
        willChange: 'transform',
        pointerEvents: 'none',
      }}
    >
      {/* 커서 SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-md"
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.46 0 .68-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35z"
          fill={cursor.color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* 사용자 이름 라벨 */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-5 left-4 px-2 py-0.5 rounded-md text-xs font-medium text-white whitespace-nowrap"
        style={{
          backgroundColor: cursor.color,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        {cursor.userName}
      </motion.div>
    </motion.div>
  )
}

// ============================================
// 원격 선택 영역 표시
// ============================================

interface RemoteSelectionIndicatorProps {
  userId: string
  state: UserEditingState
  containerRef: React.RefObject<HTMLDivElement | null>
}

function RemoteSelectionIndicator({ userId, state, containerRef }: RemoteSelectionIndicatorProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const userColor = getUserColor(userId)

  useEffect(() => {
    const targetId = state.selectedSlotId || state.selectedTextId
    if (!targetId || !containerRef.current) return

    // 해당 요소 찾기
    const element = containerRef.current.querySelector(`[data-id="${targetId}"]`)
    if (element) {
      const rect = element.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      setTargetRect(new DOMRect(
        rect.x - containerRect.x,
        rect.y - containerRect.y,
        rect.width,
        rect.height
      ))
    }
  }, [state.selectedSlotId, state.selectedTextId, containerRef])

  if (!targetRect) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute rounded-lg border-2"
      style={{
        left: targetRect.x - 4,
        top: targetRect.y - 4,
        width: targetRect.width + 8,
        height: targetRect.height + 8,
        borderColor: userColor,
        backgroundColor: `${userColor}15`,
        boxShadow: `0 0 0 1px ${userColor}40`,
      }}
    />
  )
}

// ============================================
// 헬퍼 함수
// ============================================

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
]

function getUserColor(userId: string): string {
  // userId 해시로 일관된 색상 할당
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash = hash & hash
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

export default CollabOverlay
