'use client'

import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react'
import { cn } from '@/lib/utils/cn'
import { X, ChevronDown, Check, Search, SlidersHorizontal } from 'lucide-react'

/**
 * 마켓플레이스 필터 UX 컴포넌트
 *
 * UX 서사: "원하는 것을 쉽게 찾는 여정"
 *
 * 사용 사례:
 * - 템플릿 마켓플레이스 필터링
 * - 검색 결과 정제
 * - 카테고리/태그 기반 탐색
 */

// ============================================
// TYPES
// ============================================

export interface FilterOption {
  id: string
  label: string
  value: string
  count?: number
  icon?: ReactNode
}

export interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
  multiple?: boolean
}

export interface FilterChipProps extends HTMLAttributes<HTMLButtonElement> {
  /** 라벨 */
  label: string
  /** 선택 상태 */
  selected?: boolean
  /** 제거 가능 */
  removable?: boolean
  /** 개수 표시 */
  count?: number
  /** 제거 핸들러 */
  onRemove?: () => void
  /** 아이콘 */
  icon?: ReactNode
  /** 크기 */
  size?: 'sm' | 'md'
}

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  /** 필터 그룹들 */
  groups: FilterGroup[]
  /** 선택된 필터들 */
  selected: Record<string, string[]>
  /** 필터 변경 핸들러 */
  onFilterChange: (groupId: string, values: string[]) => void
  /** 전체 초기화 핸들러 */
  onClearAll?: () => void
  /** 검색 활성화 */
  searchable?: boolean
  /** 검색어 */
  searchValue?: string
  /** 검색 변경 핸들러 */
  onSearchChange?: (value: string) => void
  /** 모바일 토글 */
  collapsible?: boolean
}

export interface FilterDropdownProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 레이블 */
  label: string
  /** 옵션들 */
  options: FilterOption[]
  /** 선택된 값들 */
  selected: string[]
  /** 변경 핸들러 */
  onChange: (values: string[]) => void
  /** 다중 선택 */
  multiple?: boolean
  /** 플레이스홀더 */
  placeholder?: string
}

// ============================================
// FILTER CHIP
// ============================================

/**
 * 필터 칩 컴포넌트
 *
 * @example
 * ```tsx
 * <FilterChip
 *   label="페어틀"
 *   selected
 *   count={42}
 *   onRemove={() => handleRemove('pair')}
 * />
 * ```
 */
const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(
  (
    {
      className,
      label,
      selected = false,
      removable = false,
      count,
      onRemove,
      icon,
      size = 'md',
      onClick,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-2.5 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (removable && onRemove) {
        e.stopPropagation()
        onRemove()
      } else if (onClick) {
        onClick(e)
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex items-center gap-1.5',
          'rounded-full',
          'font-medium',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-1',
          sizeClasses[size],
          selected
            ? [
                'bg-primary-100 text-primary-700',
                'border border-primary-200',
                'hover:bg-primary-200',
              ]
            : [
                'bg-gray-100 text-gray-600',
                'border border-gray-200',
                'hover:bg-gray-200 hover:text-gray-700',
              ],
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {icon && <span className="w-3.5 h-3.5">{icon}</span>}

        <span>{label}</span>

        {count !== undefined && (
          <span
            className={cn(
              'px-1.5 py-0.5 rounded-full text-xs',
              selected ? 'bg-primary-200 text-primary-800' : 'bg-gray-200 text-gray-500'
            )}
          >
            {count}
          </span>
        )}

        {/* 변경 이유: X 아이콘은 button 내부에서 별도 onClick 없이 표시만 함
            실제 제거 동작은 handleClick에서 처리 */}
        {removable && selected && (
          <X
            className="w-3.5 h-3.5 ml-0.5"
            aria-hidden="true"
          />
        )}
      </button>
    )
  }
)
FilterChip.displayName = 'FilterChip'

// ============================================
// FILTER DROPDOWN
// ============================================

/**
 * 필터 드롭다운 컴포넌트
 *
 * @example
 * ```tsx
 * <FilterDropdown
 *   label="카테고리"
 *   options={categories}
 *   selected={selectedCategories}
 *   onChange={setSelectedCategories}
 *   multiple
 * />
 * ```
 */
const FilterDropdown = forwardRef<HTMLDivElement, FilterDropdownProps>(
  (
    {
      className,
      label,
      options,
      selected,
      onChange,
      multiple = false,
      placeholder = '선택...',
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // 외부 클릭 감지
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // 옵션 선택 핸들러
    const handleOptionClick = useCallback(
      (value: string) => {
        if (multiple) {
          const newSelected = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value]
          onChange(newSelected)
        } else {
          onChange([value])
          setIsOpen(false)
        }
      },
      [multiple, selected, onChange]
    )

    // 선택된 레이블 표시
    const displayLabel = useMemo(() => {
      if (selected.length === 0) return placeholder
      if (selected.length === 1) {
        return options.find((o) => o.value === selected[0])?.label || placeholder
      }
      return `${selected.length}개 선택됨`
    }, [selected, options, placeholder])

    return (
      <div ref={dropdownRef} className={cn('relative', className)} {...props}>
        {/* 트리거 버튼 */}
        <button
          type="button"
          className={cn(
            'flex items-center justify-between gap-2',
            'w-full px-3 py-2',
            'bg-white border border-gray-200 rounded-lg',
            'text-sm text-gray-700',
            'hover:border-primary-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-200',
            'transition-all duration-200',
            isOpen && 'border-primary-300 ring-2 ring-primary-100'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">{label}</span>
            <span className={selected.length > 0 ? 'text-gray-900' : 'text-gray-400'}>
              {displayLabel}
            </span>
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {/* 드롭다운 메뉴 */}
        {isOpen && (
          <div
            className={cn(
              'absolute z-50 top-full left-0 right-0 mt-1',
              'bg-white border border-gray-200 rounded-lg shadow-lg',
              'py-1 max-h-60 overflow-auto',
              'animate-scale-in'
            )}
          >
            {options.map((option) => {
              const isSelected = selected.includes(option.value)

              return (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    'w-full flex items-center justify-between gap-2',
                    'px-3 py-2 text-sm text-left',
                    'hover:bg-gray-50',
                    'transition-colors duration-150',
                    isSelected && 'bg-primary-50 text-primary-700'
                  )}
                  onClick={() => handleOptionClick(option.value)}
                >
                  <span className="flex items-center gap-2">
                    {option.icon && <span className="w-4 h-4">{option.icon}</span>}
                    <span>{option.label}</span>
                  </span>

                  <span className="flex items-center gap-2">
                    {option.count !== undefined && (
                      <span className="text-xs text-gray-400">{option.count}</span>
                    )}
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary-600" />
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }
)
FilterDropdown.displayName = 'FilterDropdown'

// ============================================
// FILTER BAR
// ============================================

/**
 * 필터 바 (전체 필터 UI)
 *
 * @example
 * ```tsx
 * <FilterBar
 *   groups={filterGroups}
 *   selected={selectedFilters}
 *   onFilterChange={handleFilterChange}
 *   searchable
 *   searchValue={search}
 *   onSearchChange={setSearch}
 * />
 * ```
 */
const FilterBar = forwardRef<HTMLDivElement, FilterBarProps>(
  (
    {
      className,
      groups,
      selected,
      onFilterChange,
      onClearAll,
      searchable = false,
      searchValue = '',
      onSearchChange,
      collapsible = false,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = useState(!collapsible)

    // 선택된 필터 총 개수
    const selectedCount = useMemo(() => {
      return Object.values(selected).reduce((acc, arr) => acc + arr.length, 0)
    }, [selected])

    // 활성 필터 칩들
    const activeFilters = useMemo(() => {
      const filters: Array<{
        groupId: string
        groupLabel: string
        option: FilterOption
      }> = []

      groups.forEach((group) => {
        const selectedValues = selected[group.id] || []
        selectedValues.forEach((value) => {
          const option = group.options.find((o) => o.value === value)
          if (option) {
            filters.push({
              groupId: group.id,
              groupLabel: group.label,
              option,
            })
          }
        })
      })

      return filters
    }, [groups, selected])

    // 필터 제거
    const handleRemoveFilter = useCallback(
      (groupId: string, value: string) => {
        const currentValues = selected[groupId] || []
        onFilterChange(
          groupId,
          currentValues.filter((v) => v !== value)
        )
      },
      [selected, onFilterChange]
    )

    return (
      <div
        ref={ref}
        className={cn('space-y-3', className)}
        {...props}
      >
        {/* 상단 바: 검색 + 필터 토글 */}
        <div className="flex items-center gap-3">
          {/* 검색 */}
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="검색..."
                className={cn(
                  'w-full pl-9 pr-4 py-2',
                  'bg-white border border-gray-200 rounded-lg',
                  'text-sm placeholder:text-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300',
                  'transition-all duration-200'
                )}
              />
            </div>
          )}

          {/* 필터 토글 (모바일) */}
          {collapsible && (
            <button
              type="button"
              className={cn(
                'flex items-center gap-2',
                'px-3 py-2',
                'bg-white border border-gray-200 rounded-lg',
                'text-sm text-gray-600',
                'hover:bg-gray-50',
                'transition-all duration-200',
                selectedCount > 0 && 'border-primary-200 bg-primary-50'
              )}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>필터</span>
              {selectedCount > 0 && (
                <span className="px-1.5 py-0.5 bg-primary-200 text-primary-800 rounded-full text-xs">
                  {selectedCount}
                </span>
              )}
            </button>
          )}

          {/* 전체 초기화 */}
          {selectedCount > 0 && onClearAll && (
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              onClick={onClearAll}
            >
              초기화
            </button>
          )}
        </div>

        {/* 필터 드롭다운들 */}
        {isExpanded && (
          <div className="flex flex-wrap gap-2 animate-slide-up">
            {groups.map((group) => (
              <FilterDropdown
                key={group.id}
                label={group.label}
                options={group.options}
                selected={selected[group.id] || []}
                onChange={(values) => onFilterChange(group.id, values)}
                multiple={group.multiple}
                className="min-w-[140px]"
              />
            ))}
          </div>
        )}

        {/* 활성 필터 칩들 */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {activeFilters.map(({ groupId, option }) => (
              <FilterChip
                key={`${groupId}-${option.value}`}
                label={option.label}
                selected
                removable
                size="sm"
                onRemove={() => handleRemoveFilter(groupId, option.value)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }
)
FilterBar.displayName = 'FilterBar'

// ============================================
// SORT DROPDOWN
// ============================================

export interface SortOption {
  id: string
  label: string
  value: string
}

export interface SortDropdownProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 정렬 옵션들 */
  options: SortOption[]
  /** 선택된 값 */
  value: string
  /** 변경 핸들러 */
  onChange: (value: string) => void
  /** 레이블 */
  label?: string
}

/**
 * 정렬 드롭다운
 *
 * @example
 * ```tsx
 * <SortDropdown
 *   options={[
 *     { id: '1', label: '최신순', value: 'latest' },
 *     { id: '2', label: '인기순', value: 'popular' },
 *   ]}
 *   value={sortBy}
 *   onChange={setSortBy}
 * />
 * ```
 */
const SortDropdown = forwardRef<HTMLDivElement, SortDropdownProps>(
  ({ className, options, value, onChange, label = '정렬', ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedOption = options.find((o) => o.value === value)

    return (
      <div ref={dropdownRef} className={cn('relative', className)} {...props}>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2',
            'px-3 py-2',
            'bg-white border border-gray-200 rounded-lg',
            'text-sm',
            'hover:border-gray-300',
            'focus:outline-none focus:ring-2 focus:ring-primary-200',
            'transition-all duration-200'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-gray-400">{label}:</span>
          <span className="text-gray-700">{selectedOption?.label}</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <div
            className={cn(
              'absolute z-50 top-full right-0 mt-1',
              'bg-white border border-gray-200 rounded-lg shadow-lg',
              'py-1 min-w-[120px]',
              'animate-scale-in'
            )}
          >
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={cn(
                  'w-full flex items-center justify-between gap-2',
                  'px-3 py-2 text-sm text-left',
                  'hover:bg-gray-50',
                  'transition-colors duration-150',
                  option.value === value && 'bg-primary-50 text-primary-700'
                )}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <Check className="w-4 h-4 text-primary-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)
SortDropdown.displayName = 'SortDropdown'

// ============================================
// EXPORTS
// ============================================

export { FilterChip, FilterDropdown, FilterBar, SortDropdown }
