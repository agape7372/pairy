'use client'

/**
 * Sprint 36: 텍스트 스타일 프리셋 피커
 *
 * 기능:
 * - 프리셋 스타일 선택
 * - 커스텀 프리셋 저장
 * - 실시간 미리보기
 * - 카테고리별 분류
 *
 * UX 원칙:
 * - 한눈에 보이는 스타일 미리보기
 * - 빠른 적용
 */

import React, { memo, useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Save,
  Trash2,
  ChevronDown,
  Plus,
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
  category: PresetCategory
  style: Partial<TextStyle>
  effects?: Partial<TextEffects>
  isCustom?: boolean
}

type PresetCategory = 'basic' | 'modern' | 'retro' | 'fun' | 'elegant' | 'custom'

const CATEGORY_LABELS: Record<PresetCategory, string> = {
  basic: '기본',
  modern: '모던',
  retro: '레트로',
  fun: '펀',
  elegant: '엘레강스',
  custom: '내 프리셋',
}

// ============================================
// 기본 프리셋
// ============================================

const BUILT_IN_PRESETS: StylePreset[] = [
  // 기본
  {
    id: 'clean',
    name: '클린',
    category: 'basic',
    style: {
      fontFamily: 'Pretendard Variable',
      fontSize: 24,
      fontWeight: '400',
      color: '#333333',
    },
  },
  {
    id: 'bold-title',
    name: '볼드 타이틀',
    category: 'basic',
    style: {
      fontFamily: 'Pretendard Variable',
      fontSize: 36,
      fontWeight: '700',
      color: '#111111',
      letterSpacing: -0.5,
    },
  },
  {
    id: 'subtle',
    name: '서브텍스트',
    category: 'basic',
    style: {
      fontFamily: 'Pretendard Variable',
      fontSize: 14,
      fontWeight: '400',
      color: '#666666',
      letterSpacing: 0.5,
    },
  },

  // 모던
  {
    id: 'modern-gradient',
    name: '모던 그라디언트',
    category: 'modern',
    style: {
      fontFamily: 'Pretendard Variable',
      fontSize: 32,
      fontWeight: '600',
      gradient: {
        type: 'linear',
        angle: 45,
        stops: [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' },
        ],
      },
    },
  },
  {
    id: 'neon-pink',
    name: '네온 핑크',
    category: 'modern',
    style: {
      fontFamily: 'Pretendard Variable',
      fontSize: 28,
      fontWeight: '700',
      color: '#FF1493',
    },
    effects: {
      glow: {
        color: '#FF1493',
        blur: 12,
      },
    },
  },
  {
    id: 'glassmorphism',
    name: '글래스',
    category: 'modern',
    style: {
      fontFamily: 'Pretendard Variable',
      fontSize: 24,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    effects: {
      shadow: {
        color: 'rgba(0,0,0,0.2)',
        blur: 8,
        offsetX: 2,
        offsetY: 2,
      },
    },
  },

  // 레트로
  {
    id: 'retro-shadow',
    name: '레트로 그림자',
    category: 'retro',
    style: {
      fontFamily: 'Nanum Gothic',
      fontSize: 28,
      fontWeight: '700',
      color: '#FF6B35',
    },
    effects: {
      shadow: {
        color: '#004E89',
        blur: 0,
        offsetX: 3,
        offsetY: 3,
      },
    },
  },
  {
    id: 'vintage',
    name: '빈티지',
    category: 'retro',
    style: {
      fontFamily: 'Nanum Myeongjo',
      fontSize: 24,
      fontWeight: '400',
      color: '#8B4513',
      letterSpacing: 2,
    },
  },
  {
    id: 'pixel',
    name: '8비트',
    category: 'retro',
    style: {
      fontFamily: 'DungGeunMo',
      fontSize: 20,
      fontWeight: '400',
      color: '#00FF00',
    },
    effects: {
      stroke: {
        color: '#003300',
        width: 1,
      },
    },
  },

  // 펀
  {
    id: 'rainbow',
    name: '레인보우',
    category: 'fun',
    style: {
      fontFamily: 'Jua',
      fontSize: 32,
      fontWeight: '400',
      gradient: {
        type: 'linear',
        angle: 90,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 0.2, color: '#ff8000' },
          { offset: 0.4, color: '#ffff00' },
          { offset: 0.6, color: '#00ff00' },
          { offset: 0.8, color: '#0080ff' },
          { offset: 1, color: '#8000ff' },
        ],
      },
    },
  },
  {
    id: 'comic',
    name: '만화',
    category: 'fun',
    style: {
      fontFamily: 'Black Han Sans',
      fontSize: 36,
      fontWeight: '400',
      color: '#FFFF00',
    },
    effects: {
      stroke: {
        color: '#000000',
        width: 3,
      },
    },
  },
  {
    id: 'bubble',
    name: '버블',
    category: 'fun',
    style: {
      fontFamily: 'Jua',
      fontSize: 28,
      fontWeight: '400',
      color: '#FF69B4',
    },
    effects: {
      stroke: {
        color: '#FFFFFF',
        width: 4,
      },
      shadow: {
        color: 'rgba(0,0,0,0.3)',
        blur: 4,
        offsetX: 2,
        offsetY: 2,
      },
    },
  },

  // 엘레강스
  {
    id: 'elegant-serif',
    name: '엘레강트 세리프',
    category: 'elegant',
    style: {
      fontFamily: 'Nanum Myeongjo',
      fontSize: 28,
      fontWeight: '400',
      color: '#2C3E50',
      letterSpacing: 1,
      lineHeight: 1.6,
    },
  },
  {
    id: 'gold-luxury',
    name: '골드 럭셔리',
    category: 'elegant',
    style: {
      fontFamily: 'Nanum Myeongjo',
      fontSize: 32,
      fontWeight: '700',
      gradient: {
        type: 'linear',
        angle: 135,
        stops: [
          { offset: 0, color: '#f9d423' },
          { offset: 0.5, color: '#e6b800' },
          { offset: 1, color: '#f9d423' },
        ],
      },
    },
    effects: {
      shadow: {
        color: 'rgba(0,0,0,0.3)',
        blur: 4,
        offsetX: 1,
        offsetY: 1,
      },
    },
  },
  {
    id: 'minimal',
    name: '미니멀',
    category: 'elegant',
    style: {
      fontFamily: 'Noto Sans KR',
      fontSize: 18,
      fontWeight: '300',
      color: '#333333',
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
  },
]

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
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory>('basic')
  const [customPresets, setCustomPresets] = useState<StylePreset[]>(() => {
    // 초기값을 lazy initialization으로 설정
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
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')

  // 커스텀 프리셋 저장
  const saveCustomPresets = useCallback((presets: StylePreset[]) => {
    setCustomPresets(presets)
    try {
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets))
    } catch {
      // 저장 실패 무시
    }
  }, [])

  // 모든 프리셋
  const allPresets = useMemo(() => {
    return [...BUILT_IN_PRESETS, ...customPresets]
  }, [customPresets])

  // 카테고리별 프리셋
  const presetsByCategory = useMemo(() => {
    const grouped: Record<PresetCategory, StylePreset[]> = {
      basic: [],
      modern: [],
      retro: [],
      fun: [],
      elegant: [],
      custom: [],
    }

    allPresets.forEach((preset) => {
      grouped[preset.category].push(preset)
    })

    return grouped
  }, [allPresets])

  // 프리셋 적용
  const handleApplyPreset = useCallback(
    (preset: StylePreset) => {
      onApplyPreset(preset.style, preset.effects)
    },
    [onApplyPreset]
  )

  // 현재 스타일을 프리셋으로 저장
  const handleSaveAsPreset = useCallback(() => {
    if (!newPresetName.trim()) return

    const newPreset: StylePreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      category: 'custom',
      style: { ...currentStyle },
      effects: currentEffects ? { ...currentEffects } : undefined,
      isCustom: true,
    }

    saveCustomPresets([...customPresets, newPreset])
    setNewPresetName('')
    setIsSaveModalOpen(false)
    setSelectedCategory('custom')
  }, [newPresetName, currentStyle, currentEffects, customPresets, saveCustomPresets])

  // 커스텀 프리셋 삭제
  const handleDeletePreset = useCallback(
    (presetId: string) => {
      saveCustomPresets(customPresets.filter((p) => p.id !== presetId))
    },
    [customPresets, saveCustomPresets]
  )

  // CSS 그라디언트 문자열 생성
  const getPreviewBackground = useCallback((style: Partial<TextStyle>): string => {
    if (style.gradient) {
      const colors = style.gradient.stops
        .map((s) => `${s.color} ${s.offset * 100}%`)
        .join(', ')

      if (style.gradient.type === 'linear') {
        return `linear-gradient(${style.gradient.angle ?? 0}deg, ${colors})`
      } else {
        return `radial-gradient(circle, ${colors})`
      }
    }

    return typeof style.color === 'string' ? style.color : '#333333'
  }, [])

  // ============================================
  // 렌더링
  // ============================================

  return (
    <div className={cn('space-y-3', className)}>
      {/* 헤더 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all',
          isExpanded
            ? 'bg-pink-50 border-pink-200 text-pink-700'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-pink-300'
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">스타일 프리셋</span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* 확장 패널 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {/* 카테고리 탭 */}
            <div className="flex flex-wrap gap-1">
              {(Object.keys(CATEGORY_LABELS) as PresetCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-full transition-all',
                    selectedCategory === cat
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                  {cat === 'custom' && customPresets.length > 0 && (
                    <span className="ml-1 text-[10px]">({customPresets.length})</span>
                  )}
                </button>
              ))}
            </div>

            {/* 프리셋 그리드 */}
            <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto">
              {presetsByCategory[selectedCategory].map((preset) => (
                <motion.button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={cn(
                    'relative group p-3 rounded-lg border text-left transition-all',
                    'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                    'hover:border-pink-300 hover:shadow-sm'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* 미리보기 텍스트 */}
                  <div
                    className="text-base font-medium truncate"
                    style={{
                      fontFamily: preset.style.fontFamily || 'inherit',
                      fontWeight: preset.style.fontWeight || 'normal',
                      background: preset.style.gradient
                        ? getPreviewBackground(preset.style)
                        : 'transparent',
                      color: preset.style.gradient
                        ? 'transparent'
                        : (typeof preset.style.color === 'string' ? preset.style.color : '#333'),
                      WebkitBackgroundClip: preset.style.gradient ? 'text' : undefined,
                      backgroundClip: preset.style.gradient ? 'text' : undefined,
                      textShadow: preset.effects?.shadow
                        ? `${preset.effects.shadow.offsetX}px ${preset.effects.shadow.offsetY}px ${preset.effects.shadow.blur}px ${preset.effects.shadow.color}`
                        : undefined,
                    }}
                  >
                    가나다
                  </div>

                  {/* 프리셋 이름 */}
                  <div className="text-[10px] text-gray-400 mt-1 truncate">
                    {preset.name}
                  </div>

                  {/* 커스텀 프리셋 삭제 버튼 */}
                  {preset.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePreset(preset.id)
                      }}
                      className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </motion.button>
              ))}

              {/* 빈 상태 */}
              {presetsByCategory[selectedCategory].length === 0 && (
                <div className="col-span-2 py-8 text-center text-sm text-gray-400">
                  {selectedCategory === 'custom'
                    ? '저장된 프리셋이 없습니다'
                    : '프리셋이 없습니다'}
                </div>
              )}
            </div>

            {/* 현재 스타일 저장 버튼 */}
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-3 py-2 text-sm',
                'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                'rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all'
              )}
            >
              <Save className="w-4 h-4" />
              현재 스타일 저장
            </button>

            {/* 저장 모달 */}
            <AnimatePresence>
              {isSaveModalOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2"
                >
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="프리셋 이름"
                    className={cn(
                      'w-full px-3 py-2 text-sm',
                      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                      'rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400'
                    )}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveAsPreset()
                      } else if (e.key === 'Escape') {
                        setIsSaveModalOpen(false)
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSaveModalOpen(false)}
                      className="flex-1 px-3 py-1.5 text-xs text-gray-600 bg-gray-200 dark:bg-gray-700 rounded-lg"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAsPreset}
                      disabled={!newPresetName.trim()}
                      className={cn(
                        'flex-1 px-3 py-1.5 text-xs rounded-lg flex items-center justify-center gap-1',
                        newPresetName.trim()
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      )}
                    >
                      <Plus className="w-3 h-3" />
                      저장
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default StylePresetPicker
