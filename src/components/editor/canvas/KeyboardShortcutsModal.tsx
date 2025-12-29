'use client'

import { useEffect, useCallback } from 'react'
import { X, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ShortcutItem {
  keys: string[]
  description: string
}

interface ShortcutGroup {
  title: string
  shortcuts: ShortcutItem[]
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: '일반',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: '저장' },
      { keys: ['Ctrl', 'Z'], description: '실행 취소' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: '다시 실행' },
      { keys: ['Ctrl', 'Y'], description: '다시 실행' },
      { keys: ['?'], description: '단축키 도움말' },
      { keys: ['Esc'], description: '선택 해제 / 모달 닫기' },
    ],
  },
  {
    title: '줌',
    shortcuts: [
      { keys: ['Ctrl', '+'], description: '확대' },
      { keys: ['Ctrl', '-'], description: '축소' },
      { keys: ['Ctrl', '0'], description: '100%로 리셋' },
      { keys: ['Ctrl', '1'], description: '화면에 맞춤' },
    ],
  },
  {
    title: '선택 요소 이동',
    shortcuts: [
      { keys: ['↑', '↓', '←', '→'], description: '1px 이동' },
      { keys: ['Shift', '↑↓←→'], description: '10px 이동' },
      { keys: ['Delete'], description: '선택 이미지 삭제' },
    ],
  },
  {
    title: '내보내기',
    shortcuts: [
      { keys: ['Ctrl', 'E'], description: '내보내기 모달 열기' },
    ],
  },
]

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  // ESC 키로 닫기
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-gray-600" aria-hidden="true" />
            <h2 id="shortcuts-modal-title" className="text-lg font-bold text-gray-900">
              키보드 단축키
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="space-y-6">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center">
                            <kbd
                              className={cn(
                                'px-2 py-1 text-xs font-mono font-medium rounded',
                                'bg-white border border-gray-300 shadow-sm text-gray-700'
                              )}
                            >
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-gray-400">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 힌트 */}
          <div className="mt-6 p-3 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-xs text-primary-700">
              <strong>팁:</strong> Mac에서는 Ctrl 대신 Cmd(⌘)를 사용하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
