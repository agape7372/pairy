'use client'

/**
 * Sprint 36: 고급 폰트 선택기 컴포넌트
 *
 * 기능:
 * - 카테고리별 폰트 탐색
 * - 실시간 미리보기
 * - 검색 기능
 * - 폰트 로딩 상태 표시
 * - 최근 사용 폰트
 *
 * UX 원칙:
 * - 스켈레톤 로딩
 * - 부드러운 트랜지션
 * - 접근성 (키보드 네비게이션)
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  memo,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ChevronDown,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { FontService } from '@/lib/services/FontService'
import {
  ALL_FONTS,
  FONTS_BY_CATEGORY,
  FONT_CATEGORY_LABELS,
  searchFonts,
  type FontDefinition,
  type FontCategory,
  type FontLoadingState,
  type FontWeightNumeric,
} from '@/types/font'

// ============================================
// 타입 정의
// ============================================

interface FontSelectorProps {
  /** 현재 선택된 폰트 family */
  value: string
  /** 폰트 변경 콜백 */
  onChange: (family: string) => void
  /** 현재 선택된 가중치 */
  weight?: FontWeightNumeric
  /** 가중치 변경 콜백 */
  onWeightChange?: (weight: FontWeightNumeric) => void
  /** 미리보기 텍스트 */
  previewText?: string
  /** 비활성화 */
  disabled?: boolean
  /** 클래스명 */
  className?: string
}

// ============================================
// 로컬 스토리지 키
// ============================================

const RECENT_FONTS_KEY = 'pairy_recent_fonts_v1'
const MAX_RECENT_FONTS = 5

// ============================================
// 유틸리티
// ============================================

function getRecentFonts(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RECENT_FONTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecentFont(fontId: string): void {
  if (typeof window === 'undefined') return
  try {
    const recent = getRecentFonts().filter((id) => id !== fontId)
    recent.unshift(fontId)
    localStorage.setItem(
      RECENT_FONTS_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT_FONTS))
    )
  } catch {
    // 무시
  }
}

// ============================================
// 폰트 아이템 컴포넌트
// ============================================

interface FontItemProps {
  font: FontDefinition
  isSelected: boolean
  loadingState: FontLoadingState
  previewText: string
  onClick: () => void
}

const FontItem = memo(function FontItem({
  font,
  isSelected,
  loadingState,
  previewText,
  onClick,
}: FontItemProps) {
  const isLoading = loadingState.status === 'loading'
  const isLoaded = loadingState.status === 'loaded'
  const hasError = loadingState.status === 'error'

  // 폰트 로딩
  useEffect(() => {
    if (loadingState.status === 'idle') {
      FontService.loadFont(font)
    }
  }, [font, loadingState.status])

  return (
    <motion.button
      type="button"
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'text-left transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400',
        isSelected
          ? 'bg-pink-500/20 border border-pink-400/50'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
      )}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      role="option"
      aria-selected={isSelected}
    >
      {/* 미리보기 */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-lg truncate transition-opacity',
            isLoading && 'opacity-50'
          )}
          style={{
            fontFamily: isLoaded || isLoading ? `"${font.family}", sans-serif` : 'inherit',
          }}
        >
          {previewText || font.previewText || font.displayName}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500 truncate">
            {font.displayName}
          </span>
          {font.language === 'korean' && (
            <span className="px-1 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
              한글
            </span>
          )}
          {font.isVariable && (
            <span className="px-1 py-0.5 text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
              가변
            </span>
          )}
        </div>
      </div>

      {/* 상태 아이콘 */}
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {isLoading && (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        )}
        {hasError && <AlertCircle className="w-4 h-4 text-red-400" />}
        {isSelected && !isLoading && (
          <Check className="w-4 h-4 text-pink-500" />
        )}
      </div>
    </motion.button>
  )
})

// ============================================
// 카테고리 탭 컴포넌트
// ============================================

interface CategoryTabsProps {
  selectedCategory: FontCategory | 'all' | 'recent'
  onSelect: (category: FontCategory | 'all' | 'recent') => void
}

const CategoryTabs = memo(function CategoryTabs({
  selectedCategory,
  onSelect,
}: CategoryTabsProps) {
  const categories: Array<{ key: FontCategory | 'all' | 'recent'; label: string; icon?: React.ReactNode }> = [
    { key: 'recent', label: '최근', icon: <Clock className="w-3.5 h-3.5" /> },
    { key: 'all', label: '전체', icon: <Star className="w-3.5 h-3.5" /> },
    { key: 'sans-serif', label: '고딕' },
    { key: 'serif', label: '명조' },
    { key: 'handwriting', label: '손글씨' },
    { key: 'display', label: '장식' },
  ]

  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto scrollbar-hide">
      {categories.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md',
            'transition-all duration-150 whitespace-nowrap',
            selectedCategory === key
              ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
          onClick={() => onSelect(key)}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  )
})

// ============================================
// 가중치 선택기 컴포넌트
// ============================================

interface WeightSelectorProps {
  font: FontDefinition | undefined
  value: FontWeightNumeric
  onChange: (weight: FontWeightNumeric) => void
}

const WeightSelector = memo(function WeightSelector({
  font,
  value,
  onChange,
}: WeightSelectorProps) {
  if (!font || font.weights.length <= 1) return null

  const weightLabels: Record<FontWeightNumeric, string> = {
    100: 'Thin',
    200: 'ExtraLight',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'SemiBold',
    700: 'Bold',
    800: 'ExtraBold',
    900: 'Black',
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {font.weights.map((weight) => (
        <button
          key={weight}
          type="button"
          className={cn(
            'px-2 py-1 text-xs rounded border transition-all',
            value === weight
              ? 'bg-pink-500 text-white border-pink-500'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-pink-300'
          )}
          onClick={() => onChange(weight)}
        >
          {weightLabels[weight]}
        </button>
      ))}
    </div>
  )
})

// ============================================
// 메인 컴포넌트
// ============================================

export const FontSelector = memo(function FontSelector({
  value,
  onChange,
  weight = 400,
  onWeightChange,
  previewText,
  disabled = false,
  className,
}: FontSelectorProps) {
  // ============================================
  // 상태
  // ============================================

  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState<FontCategory | 'all' | 'recent'>('all')
  const [loadingStates, setLoadingStates] = useState<Map<string, FontLoadingState>>(
    () => FontService.getAllLoadingStates()
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 현재 선택된 폰트 정의
  const selectedFont = useMemo(
    () => ALL_FONTS.find((f) => f.family === value),
    [value]
  )

  // 최근 사용 폰트
  const recentFontIds = useMemo(() => getRecentFonts(), [])
  const recentFonts = useMemo(
    () => recentFontIds.map((id) => ALL_FONTS.find((f) => f.id === id)).filter(Boolean) as FontDefinition[],
    [recentFontIds]
  )

  // 필터링된 폰트 목록
  const filteredFonts = useMemo(() => {
    let fonts: FontDefinition[]

    if (searchQuery.trim()) {
      fonts = searchFonts(searchQuery)
    } else if (category === 'recent') {
      fonts = recentFonts
    } else if (category === 'all') {
      fonts = ALL_FONTS
    } else {
      fonts = FONTS_BY_CATEGORY[category] || []
    }

    return fonts.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999))
  }, [searchQuery, category, recentFonts])

  // ============================================
  // 폰트 로딩 상태 구독
  // ============================================

  useEffect(() => {
    const unsubscribe = FontService.subscribe((event, { fontId, state }) => {
      setLoadingStates((prev) => {
        const next = new Map(prev)
        next.set(fontId, state)
        return next
      })
    })

    return unsubscribe
  }, [])

  // ============================================
  // 드롭다운 외부 클릭 닫기
  // ============================================

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // ============================================
  // 키보드 네비게이션
  // ============================================

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // 열릴 때 검색 포커스
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // ============================================
  // 핸들러
  // ============================================

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev)
    }
  }, [disabled])

  const handleSelectFont = useCallback(
    (font: FontDefinition) => {
      onChange(font.family)
      addRecentFont(font.id)
      setIsOpen(false)
      setSearchQuery('')

      // 가중치 리셋 (새 폰트가 현재 가중치를 지원하지 않을 수 있음)
      if (onWeightChange && !font.weights.includes(weight)) {
        const closestWeight = font.weights.reduce((prev, curr) =>
          Math.abs(curr - weight) < Math.abs(prev - weight) ? curr : prev
        )
        onWeightChange(closestWeight)
      }
    },
    [onChange, onWeightChange, weight]
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
      if (e.target.value && category !== 'all') {
        setCategory('all')
      }
    },
    [category]
  )

  // ============================================
  // 렌더링
  // ============================================

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* 선택 버튼 */}
      <button
        type="button"
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2.5',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          'rounded-lg transition-all duration-150',
          'hover:border-pink-300 dark:hover:border-pink-600',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400',
          isOpen && 'border-pink-400 ring-2 ring-pink-400/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex-1 text-left min-w-0">
          <div
            className="text-sm truncate"
            style={{
              fontFamily: selectedFont
                ? `"${selectedFont.family}", sans-serif`
                : 'inherit',
            }}
          >
            {selectedFont?.displayName || value || '폰트 선택'}
          </div>
          {selectedFont && (
            <div className="text-xs text-gray-500 truncate">
              {FONT_CATEGORY_LABELS[selectedFont.category]}
            </div>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* 드롭다운 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={cn(
              'absolute z-50 left-0 right-0 mt-1',
              'bg-white dark:bg-gray-900 rounded-xl shadow-xl',
              'border border-gray-200 dark:border-gray-700',
              'overflow-hidden'
            )}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="listbox"
          >
            {/* 검색 */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className={cn(
                    'w-full pl-9 pr-3 py-2 text-sm',
                    'bg-gray-50 dark:bg-gray-800 rounded-lg',
                    'border-none focus:outline-none focus:ring-2 focus:ring-pink-400',
                    'placeholder:text-gray-400'
                  )}
                  placeholder="폰트 검색..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* 카테고리 탭 */}
            {!searchQuery && (
              <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                <CategoryTabs
                  selectedCategory={category}
                  onSelect={setCategory}
                />
              </div>
            )}

            {/* 폰트 목록 */}
            <div className="max-h-[300px] overflow-y-auto p-1">
              {filteredFonts.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  {searchQuery
                    ? `"${searchQuery}" 검색 결과가 없습니다`
                    : category === 'recent'
                      ? '최근 사용한 폰트가 없습니다'
                      : '폰트가 없습니다'}
                </div>
              ) : (
                filteredFonts.map((font) => (
                  <FontItem
                    key={font.id}
                    font={font}
                    isSelected={font.family === value}
                    loadingState={
                      loadingStates.get(font.id) || {
                        fontId: font.id,
                        status: 'idle',
                      }
                    }
                    previewText={previewText || ''}
                    onClick={() => handleSelectFont(font)}
                  />
                ))
              )}
            </div>

            {/* 가중치 선택 (선택된 폰트가 있을 때) */}
            {selectedFont && onWeightChange && (
              <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                <WeightSelector
                  font={selectedFont}
                  value={weight}
                  onChange={onWeightChange}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default FontSelector
