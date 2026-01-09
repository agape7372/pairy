'use client'

/**
 * Sprint 36: 텍스트 스타일 프리셋 피커
 *
 * 기능:
 * - 커스텀 프리셋 저장/적용/삭제
 * - 드롭다운 UI (공간 효율적)
 *
 * UX 원칙:
 * - 컴팩트한 드롭다운으로 공간 절약
 * - 프리셋이 늘어나도 스크롤로 대응
 */

import React, { memo, useCallback, useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Save,
  Trash2,
  ChevronDown,
  Plus,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { TextStyle, TextEffects } from '@/types/template'

// ============================================
// 타입 정의
// ============================================

/** 스타일 프리셋 */
export interface StylePreset {
  id: string
  name: string
  style: Partial<TextStyle>
  effects?: Partial<TextEffects>
}

// ============================================
// localStorage 키
// ============================================

const CUSTOM_PRESETS_KEY = 'pairy_text_style_presets'

// ============================================
// 타입 정의
// ============================================

interface StylePresetPickerProps {
  /** 현재 스타일 */
  currentStyle: TextStyle
  /** 현재 효과 */
  currentEffects?: TextEffects
  /** 프리셋 적용 콜백 */
  onApplyPreset: (style: Partial<TextStyle>, effects?: Partial<TextEffects>) => void
  /** 클래스명 */
  className?: string
}

// ============================================
// 메인 컴포넌트
// ============================================

export const StylePresetPicker = memo(function StylePresetPicker({
  currentStyle,
  currentEffects,
  onApplyPreset,
  className,
}: StylePresetPickerProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [customPresets, setCustomPresets] = useState<StylePreset[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(CUSTOM_PRESETS_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // 파싱 실패 무시
    }
    return []
  })
  const [isSaveMode, setIsSaveMode] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setIsSaveMode(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // 저장 모드 진입 시 input focus
  useEffect(() => {
    if (isSaveMode && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSaveMode])

  // 커스텀 프리셋 저장
  const saveCustomPresets = useCallback((presets: StylePreset[]) => {
    setCustomPresets(presets)
    try {
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets))
    } catch {
      // 저장 실패 무시
    }
  }, [])

  // 프리셋 적용
  const handleApplyPreset = useCallback(
    (preset: StylePreset) => {
      onApplyPreset(preset.style, preset.effects)
      setSelectedPresetId(preset.id)
      setIsDropdownOpen(false)
    },
    [onApplyPreset]
  )

  // 새 프리셋 저장
  const handleSaveNewPreset = useCallback(() => {
    if (!newPresetName.trim()) return

    const newPreset: StylePreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      style: { ...currentStyle },
      effects: currentEffects ? { ...currentEffects } : undefined,
    }

    saveCustomPresets([...customPresets, newPreset])
    setNewPresetName('')
    setIsSaveMode(false)
    setSelectedPresetId(newPreset.id)
  }, [newPresetName, currentStyle, currentEffects, customPresets, saveCustomPresets])

  // 프리셋 삭제
  const handleDeletePreset = useCallback(
    (e: React.MouseEvent, presetId: string) => {
      e.stopPropagation()
      saveCustomPresets(customPresets.filter((p) => p.id !== presetId))
      if (selectedPresetId === presetId) {
        setSelectedPresetId(null)
      }
    },
    [customPresets, saveCustomPresets, selectedPresetId]
  )

  // CSS 그라디언트 문자열 생성
  const getPreviewStyle = useCallback((style: Partial<TextStyle>): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      fontFamily: style.fontFamily || 'inherit',
      fontWeight: style.fontWeight || 'normal',
    }

    if (style.gradient) {
      const colors = style.gradient.stops
        .map((s) => `${s.color} ${s.offset * 100}%`)
        .join(', ')

      const gradient = style.gradient.type === 'linear'
        ? `linear-gradient(${style.gradient.angle ?? 0}deg, ${colors})`
        : `radial-gradient(circle, ${colors})`

      return {
        ...baseStyle,
        background: gradient,
        color: 'transparent',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
      }
    }

    return {
      ...baseStyle,
      color: typeof style.color === 'string' ? style.color : '#333',
    }
  }, [])

  // 선택된 프리셋 이름
  const selectedPresetName = customPresets.find((p) => p.id === selectedPresetId)?.name

  // ============================================
  // 렌더링
  // ============================================

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* 드롭다운 트리거 */}
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all',
          isDropdownOpen
            ? 'bg-pink-50 border-pink-200 text-pink-700'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-pink-300'
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">
            {selectedPresetName || '스타일 프리셋'}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            isDropdownOpen && 'rotate-180'
          )}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 w-full mt-1 py-1',
              'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
              'rounded-lg shadow-lg overflow-hidden'
            )}
          >
            {/* 프리셋 목록 */}
            <div className="max-h-[200px] overflow-y-auto">
              {customPresets.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-gray-400">
                  저장된 프리셋이 없습니다
                </div>
              ) : (
                customPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-left transition-colors',
                      'hover:bg-gray-50 dark:hover:bg-gray-700',
                      selectedPresetId === preset.id && 'bg-pink-50 dark:bg-pink-900/20'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* 선택 체크 */}
                      <div className="w-4 h-4 flex-shrink-0">
                        {selectedPresetId === preset.id && (
                          <Check className="w-4 h-4 text-pink-500" />
                        )}
                      </div>

                      {/* 미리보기 텍스트 */}
                      <span
                        className="text-sm truncate"
                        style={getPreviewStyle(preset.style)}
                      >
                        {preset.name}
                      </span>
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={(e) => handleDeletePreset(e, preset.id)}
                      className={cn(
                        'p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50',
                        'dark:hover:bg-red-900/20 transition-colors flex-shrink-0'
                      )}
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                ))
              )}
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

            {/* 새 프리셋 저장 */}
            {isSaveMode ? (
              <div className="px-2 py-2 space-y-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="프리셋 이름 입력"
                  className={cn(
                    'w-full px-2.5 py-1.5 text-sm',
                    'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600',
                    'rounded focus:outline-none focus:ring-2 focus:ring-pink-400'
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveNewPreset()
                    } else if (e.key === 'Escape') {
                      setIsSaveMode(false)
                      setNewPresetName('')
                    }
                  }}
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSaveMode(false)
                      setNewPresetName('')
                    }}
                    className="flex-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewPreset}
                    disabled={!newPresetName.trim()}
                    className={cn(
                      'flex-1 px-2 py-1 text-xs rounded flex items-center justify-center gap-1',
                      newPresetName.trim()
                        ? 'bg-pink-500 text-white hover:bg-pink-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <Plus className="w-3 h-3" />
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSaveMode(true)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm',
                  'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
                  'transition-colors'
                )}
              >
                <Save className="w-4 h-4" />
                현재 스타일 저장
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default StylePresetPicker
