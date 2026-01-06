'use client'

/**
 * Sprint 33: 크리에이터용 ColorBind 선택 컴포넌트
 *
 * 템플릿 레이어의 색상을 고정값 또는 동적 참조로 설정할 수 있는 UI
 * - 고정 색상: #RRGGBB 형식의 직접 색상 지정
 * - 템플릿 컬러: primaryColor, secondaryColor 등
 * - 캐릭터 컬러: characterHairColor, characterEyeColor, characterThemeColor
 */

import { useState, useCallback, useMemo } from 'react'
import { ChevronDown, Palette, User, Lock, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getColorReferenceOptions, COLOR_REFERENCE_LABELS } from '@/lib/utils/characterColors'
import type { ColorReference } from '@/types/template'

/** 색상 타입 */
type ColorType = 'fixed' | 'template' | 'character'

interface ColorBindSelectorProps {
  /** 현재 색상 값 (hex 또는 ColorReference) */
  value: string
  /** 색상 변경 핸들러 */
  onChange: (value: string) => void
  /** 레이블 */
  label?: string
  /** 비활성화 여부 */
  disabled?: boolean
  /** 캐릭터 컬러 포함 여부 */
  includeCharacterColors?: boolean
  /** 클래스명 */
  className?: string
}

/**
 * 색상 값이 ColorReference인지 확인
 */
function isColorReference(value: string): boolean {
  const references = [
    'primaryColor',
    'secondaryColor',
    'accentColor',
    'textColor',
    'characterHairColor',
    'characterEyeColor',
    'characterThemeColor',
  ]
  return references.includes(value)
}

/**
 * 색상 타입 판별
 */
function getColorType(value: string): ColorType {
  if (value.startsWith('character')) {
    return 'character'
  }
  if (isColorReference(value)) {
    return 'template'
  }
  return 'fixed'
}

/**
 * 색상 미리보기 뱃지
 */
function ColorPreviewBadge({
  value,
  type,
}: {
  value: string
  type: ColorType
}) {
  if (type === 'fixed') {
    return (
      <div
        className="w-6 h-6 rounded-md border border-gray-300"
        style={{ backgroundColor: value }}
      />
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-200 to-accent-200 border border-gray-200 flex items-center justify-center">
        {type === 'character' ? (
          <User className="w-3 h-3 text-primary-600" />
        ) : (
          <Palette className="w-3 h-3 text-primary-600" />
        )}
      </div>
    </div>
  )
}

/**
 * ColorBind 선택 컴포넌트
 */
export function ColorBindSelector({
  value,
  onChange,
  label,
  disabled = false,
  includeCharacterColors = true,
  className,
}: ColorBindSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customColor, setCustomColor] = useState(
    value.startsWith('#') ? value : '#FF6B6B'
  )

  const colorType = useMemo(() => getColorType(value), [value])
  const colorOptions = useMemo(
    () => getColorReferenceOptions(includeCharacterColors),
    [includeCharacterColors]
  )

  const handleSelectFixed = useCallback(() => {
    onChange(customColor)
    setIsOpen(false)
  }, [onChange, customColor])

  const handleSelectReference = useCallback(
    (ref: string) => {
      onChange(ref)
      setIsOpen(false)
    },
    [onChange]
  )

  const handleCustomColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value
      setCustomColor(newColor)
      if (colorType === 'fixed') {
        onChange(newColor)
      }
    },
    [colorType, onChange]
  )

  const displayLabel = useMemo(() => {
    if (colorType === 'fixed') {
      return value.toUpperCase()
    }
    return COLOR_REFERENCE_LABELS[value] || value
  }, [value, colorType])

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          {label}
        </label>
      )}

      {/* 선택 버튼 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition-all',
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
            : 'bg-white border-gray-200 hover:border-gray-300'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2">
          <ColorPreviewBadge value={value} type={colorType} />
          <span className="text-sm text-gray-700 font-medium">
            {displayLabel}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {/* 고정 색상 섹션 */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">
                  고정 색상
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={customColor.toUpperCase()}
                  onChange={(e) => {
                    const hex = e.target.value
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
                      setCustomColor(hex)
                      if (/^#[0-9A-Fa-f]{6}$/.test(hex) && colorType === 'fixed') {
                        onChange(hex)
                      }
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                  maxLength={7}
                />
                <button
                  onClick={handleSelectFixed}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    colorType === 'fixed'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {colorType === 'fixed' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    '선택'
                  )}
                </button>
              </div>
            </div>

            {/* 템플릿 컬러 섹션 */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">
                  템플릿 컬러
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {colorOptions
                  .filter((opt) => opt.group === 'template')
                  .map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSelectReference(option.value)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left',
                        value === option.value
                          ? 'bg-primary-100 text-primary-700'
                          : 'hover:bg-gray-100 text-gray-600'
                      )}
                    >
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 border border-gray-200" />
                      <span className="truncate">{option.label}</span>
                      {value === option.value && (
                        <Check className="w-3.5 h-3.5 ml-auto" />
                      )}
                    </button>
                  ))}
              </div>
            </div>

            {/* 캐릭터 컬러 섹션 */}
            {includeCharacterColors && (
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">
                    캐릭터 컬러
                  </span>
                  <span className="text-xs text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded">
                    자동 바인딩
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  사용자가 캐릭터를 선택하면 자동으로 색상이 적용됩니다
                </p>
                <div className="space-y-1.5">
                  {colorOptions
                    .filter((opt) => opt.group === 'character')
                    .map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSelectReference(option.value)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left',
                          value === option.value
                            ? 'bg-primary-100 text-primary-700'
                            : 'hover:bg-gray-100 text-gray-600'
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border border-gray-200',
                            option.value === 'characterHairColor' &&
                              'bg-amber-400',
                            option.value === 'characterEyeColor' &&
                              'bg-blue-400',
                            option.value === 'characterThemeColor' &&
                              'bg-pink-400'
                          )}
                        />
                        <span className="flex-1">{option.label}</span>
                        <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {option.value}
                        </code>
                        {value === option.value && (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * 간단한 ColorBind 인라인 선택기
 * 폼 내에서 컴팩트하게 사용할 수 있음
 */
export function ColorBindInline({
  value,
  onChange,
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const colorType = getColorType(value)

  return (
    <div className="flex items-center gap-2">
      {/* 고정 색상 선택 */}
      <input
        type="color"
        value={colorType === 'fixed' ? value : '#888888'}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-8 h-8 rounded-lg border cursor-pointer',
          colorType === 'fixed'
            ? 'border-primary-300 ring-2 ring-primary-200'
            : 'border-gray-200'
        )}
        title="고정 색상"
      />

      {/* 캐릭터 컬러 바로가기 버튼 */}
      <div className="flex gap-1">
        {(['characterHairColor', 'characterEyeColor', 'characterThemeColor'] as const).map(
          (ref) => (
            <button
              key={ref}
              onClick={() => onChange(ref)}
              disabled={disabled}
              className={cn(
                'w-8 h-8 rounded-lg border transition-all flex items-center justify-center',
                value === ref
                  ? 'border-primary-400 bg-primary-100 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
              title={COLOR_REFERENCE_LABELS[ref]}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full',
                  ref === 'characterHairColor' && 'bg-amber-400',
                  ref === 'characterEyeColor' && 'bg-blue-400',
                  ref === 'characterThemeColor' && 'bg-pink-400'
                )}
              />
            </button>
          )
        )}
      </div>
    </div>
  )
}

export default ColorBindSelector
