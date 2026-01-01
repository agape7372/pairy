'use client'

/**
 * Sprint 33: 컨텍스트 메뉴 (우클릭 메뉴)
 * 캔버스 요소에 대한 빠른 액션 제공
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Copy,
  Trash2,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Clipboard,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ============================================
// 타입 정의
// ============================================

export type ContextMenuTargetType = 'slot' | 'text' | 'sticker' | 'canvas'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  separator?: boolean
  onClick: () => void
}

export interface ContextMenuState {
  isOpen: boolean
  x: number
  y: number
  targetType: ContextMenuTargetType
  targetId: string | null
}

interface ContextMenuProps {
  state: ContextMenuState
  onClose: () => void
  items: ContextMenuItem[]
}

// ============================================
// 메인 컴포넌트
// ============================================

export function ContextMenu({ state, onClose, items }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: state.x, y: state.y })

  // 화면 밖으로 나가지 않도록 위치 조정
  useEffect(() => {
    if (!state.isOpen || !menuRef.current) return

    const rect = menuRef.current.getBoundingClientRect()
    const padding = 8

    let x = state.x
    let y = state.y

    // 오른쪽 경계 체크
    if (x + rect.width > window.innerWidth - padding) {
      x = window.innerWidth - rect.width - padding
    }

    // 아래쪽 경계 체크
    if (y + rect.height > window.innerHeight - padding) {
      y = window.innerHeight - rect.height - padding
    }

    // 왼쪽/위쪽 경계 체크
    x = Math.max(padding, x)
    y = Math.max(padding, y)

    setPosition({ x, y })
  }, [state.isOpen, state.x, state.y])

  // 클릭 외부 감지
  useEffect(() => {
    if (!state.isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [state.isOpen, onClose])

  if (!state.isOpen) return null

  return (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-[200] min-w-[180px] py-1',
        'bg-white rounded-xl shadow-xl border border-gray-200',
        'animate-in fade-in zoom-in-95 duration-150'
      )}
      style={{ left: position.x, top: position.y }}
      role="menu"
      aria-label="컨텍스트 메뉴"
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={`sep-${index}`} className="h-px bg-gray-100 my-1" />
        }

        return (
          <button
            key={item.id}
            className={cn(
              'w-full px-3 py-2 flex items-center gap-3 text-left',
              'text-sm transition-colors',
              item.disabled
                ? 'text-gray-300 cursor-not-allowed'
                : item.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-50'
            )}
            onClick={() => {
              if (!item.disabled) {
                item.onClick()
                onClose()
              }
            }}
            disabled={item.disabled}
            role="menuitem"
          >
            {item.icon && (
              <span className="w-4 h-4 flex items-center justify-center shrink-0">
                {item.icon}
              </span>
            )}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-gray-400 ml-2">{item.shortcut}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ============================================
// 훅: 컨텍스트 메뉴 상태 관리
// ============================================

export function useContextMenu() {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    targetType: 'canvas',
    targetId: null,
  })

  const open = useCallback((
    e: React.MouseEvent,
    targetType: ContextMenuTargetType,
    targetId: string | null = null
  ) => {
    e.preventDefault()
    e.stopPropagation()

    setState({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      targetType,
      targetId,
    })
  }, [])

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return { state, open, close }
}

// ============================================
// 메뉴 아이템 팩토리
// ============================================

interface MenuItemFactoryOptions {
  targetType: ContextMenuTargetType
  targetId: string | null
  isLocked?: boolean
  isHidden?: boolean
  onCopy?: () => void
  onPaste?: () => void
  onDelete?: () => void
  onFlipX?: () => void
  onFlipY?: () => void
  onReset?: () => void
  onToggleLock?: () => void
  onToggleVisibility?: () => void
  onBringForward?: () => void
  onSendBackward?: () => void
}

export function createContextMenuItems(options: MenuItemFactoryOptions): ContextMenuItem[] {
  const items: ContextMenuItem[] = []

  // 슬롯용 메뉴
  if (options.targetType === 'slot') {
    if (options.onPaste) {
      items.push({
        id: 'paste',
        label: '붙여넣기',
        icon: <Clipboard className="w-4 h-4" />,
        shortcut: 'Ctrl+V',
        onClick: options.onPaste,
      })
    }

    if (options.onFlipX) {
      items.push({
        id: 'flipX',
        label: '좌우 반전',
        icon: <FlipHorizontal className="w-4 h-4" />,
        onClick: options.onFlipX,
      })
    }

    if (options.onFlipY) {
      items.push({
        id: 'flipY',
        label: '상하 반전',
        icon: <FlipVertical className="w-4 h-4" />,
        onClick: options.onFlipY,
      })
    }

    if (options.onReset) {
      items.push({
        id: 'reset',
        label: '위치 초기화',
        icon: <RotateCcw className="w-4 h-4" />,
        onClick: options.onReset,
      })
    }

    items.push({ id: 'sep1', label: '', separator: true, onClick: () => {} })

    if (options.onToggleLock) {
      items.push({
        id: 'toggleLock',
        label: options.isLocked ? '잠금 해제' : '잠금',
        icon: options.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />,
        onClick: options.onToggleLock,
      })
    }

    if (options.onToggleVisibility) {
      items.push({
        id: 'toggleVisibility',
        label: options.isHidden ? '표시' : '숨기기',
        icon: options.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />,
        onClick: options.onToggleVisibility,
      })
    }

    if (options.onDelete) {
      items.push({ id: 'sep2', label: '', separator: true, onClick: () => {} })
      items.push({
        id: 'delete',
        label: '이미지 삭제',
        icon: <Trash2 className="w-4 h-4" />,
        shortcut: 'Del',
        danger: true,
        onClick: options.onDelete,
      })
    }
  }

  // 스티커용 메뉴
  if (options.targetType === 'sticker') {
    if (options.onCopy) {
      items.push({
        id: 'copy',
        label: '복제',
        icon: <Copy className="w-4 h-4" />,
        onClick: options.onCopy,
      })
    }

    if (options.onBringForward) {
      items.push({
        id: 'bringForward',
        label: '앞으로 가져오기',
        icon: <ArrowUp className="w-4 h-4" />,
        onClick: options.onBringForward,
      })
    }

    if (options.onSendBackward) {
      items.push({
        id: 'sendBackward',
        label: '뒤로 보내기',
        icon: <ArrowDown className="w-4 h-4" />,
        onClick: options.onSendBackward,
      })
    }

    if (options.onDelete) {
      items.push({ id: 'sep1', label: '', separator: true, onClick: () => {} })
      items.push({
        id: 'delete',
        label: '삭제',
        icon: <Trash2 className="w-4 h-4" />,
        shortcut: 'Del',
        danger: true,
        onClick: options.onDelete,
      })
    }
  }

  // 텍스트용 메뉴
  if (options.targetType === 'text') {
    if (options.onCopy) {
      items.push({
        id: 'copy',
        label: '텍스트 복사',
        icon: <Copy className="w-4 h-4" />,
        shortcut: 'Ctrl+C',
        onClick: options.onCopy,
      })
    }

    if (options.onReset) {
      items.push({
        id: 'reset',
        label: '효과 초기화',
        icon: <RotateCcw className="w-4 h-4" />,
        onClick: options.onReset,
      })
    }
  }

  // 캔버스 빈 영역 메뉴
  if (options.targetType === 'canvas') {
    if (options.onPaste) {
      items.push({
        id: 'paste',
        label: '이미지 붙여넣기',
        icon: <Clipboard className="w-4 h-4" />,
        shortcut: 'Ctrl+V',
        onClick: options.onPaste,
      })
    }

    if (options.onReset) {
      items.push({
        id: 'resetAll',
        label: '전체 초기화',
        icon: <RotateCcw className="w-4 h-4" />,
        onClick: options.onReset,
      })
    }
  }

  return items
}
