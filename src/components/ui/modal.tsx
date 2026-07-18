'use client'

/**
 * 공유 Modal 프리미티브 (P1, 2026-07-18)
 *
 * 배경: 27개 파일이 `fixed inset-0` 오버레이를 각자 구현하며 dialog 시맨틱·포커스 트랩·
 * Escape 처리가 전부 빠져 있었다. 신규/이관 모달은 반드시 이 컴포넌트를 사용할 것.
 *
 * 제공: role="dialog" + aria-modal, aria-labelledby(title) 또는 aria-label,
 * 포커스 트랩(Tab 순환), Escape/백드롭 닫기, 열림 중 body 스크롤 잠금,
 * 닫힘 시 이전 포커스 복원, portal 렌더링.
 */

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const emptySubscribe = () => () => {}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  /** 헤더 타이틀 — 지정 시 aria-labelledby 로 연결된다 */
  title?: ReactNode
  /** title 이 없을 때 필수인 접근성 레이블 */
  ariaLabel?: string
  size?: 'sm' | 'md' | 'lg'
  /** 백드롭 클릭으로 닫기 (기본 true) */
  closeOnBackdrop?: boolean
  /** 우상단 닫기 버튼 표시 (기본 true) */
  showClose?: boolean
  /** 패널에 추가할 클래스 */
  className?: string
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  ariaLabel,
  size = 'md',
  closeOnBackdrop = true,
  showClose = true,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  // SSR 안전 portal 게이트 — 서버 스냅샷 false, 클라이언트 true (hydration-safe)
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  // 열림 중 body 스크롤 잠금 + 닫힘 시 이전 포커스 복원
  useEffect(() => {
    if (!isOpen) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // 초기 포커스: 첫 포커서블 요소, 없으면 패널 자체
    const panel = panelRef.current
    if (panel) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      ;(first ?? panel).focus()
    }

    return () => {
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [isOpen])

  // Escape 닫기 + Tab 포커스 트랩
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (focusables.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !panel.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, onClose])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-white rounded-[24px] shadow-2xl p-6 animate-scale-in',
          'max-h-[90vh] overflow-y-auto outline-none',
          sizes[size],
          className
        )}
      >
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        )}

        {title && (
          <h2 id={titleId} className="text-2xl font-bold text-gray-900 mb-2 pr-10">
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>,
    document.body
  )
}
