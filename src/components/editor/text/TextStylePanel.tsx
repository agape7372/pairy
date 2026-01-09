'use client'

/**
 * Sprint 36: 텍스트 스타일 패널
 *
 * 기능:
 * - 폰트 선택 (FontSelector 통합)
 * - 폰트 크기/가중치
 * - 정렬 (가로/세로)
 * - 행간/자간
 * - 색상
 * - 장식 (밑줄, 취소선)
 * - 대소문자 변환
 *
 * UX 원칙:
 * - 실시간 미리보기
 * - 직관적인 아이콘 기반 UI
 * - 접근성 (ARIA)
 */

import React, { memo, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Minus,
  Plus,
  Underline,
  Strikethrough,
  CaseSensitive,
  ArrowUpAZ,
  ArrowDownAZ,
  Palette,
  LetterText,
  MoveVertical,
  Scaling,
  Waves,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { FontSelector } from './FontSelector'
import { GradientPicker } from './GradientPicker'
import { StylePresetPicker } from './StylePresetPicker'
import { CurvePicker } from './CurvePicker'
import type { TextStyle, TextEffects, TextField, TextGradient, TextCurve } from '@/types/template'
import type { FontWeightNumeric } from '@/types/font'

// ============================================
// 타입 정의
// ============================================

/** AutoFit 설정 타입 */
type AutoFitConfig = NonNullable<TextField['autoFit']>

interface TextStylePanelProps {
  /** 텍스트 필드 */
  textField: TextField
  /** 스타일 업데이트 콜백 */
  onUpdateStyle: (style: Partial<TextStyle>) => void
  /** 효과 업데이트 콜백 */
  onUpdateEffects?: (effects: Partial<TextEffects>) => void
  /** 자동 맞춤 업데이트 콜백 */
  onUpdateAutoFit?: (autoFit: Partial<AutoFitConfig> | null) => void
  /** 곡선 업데이트 콜백 */
  onUpdateCurve?: (curve: TextCurve | undefined) => void
  /** 현재 텍스트 값 (미리보기용) */
  currentText?: string
  /** 클래스명 */
  className?: string
}

// ============================================
// 버튼 그룹 컴포넌트
// ============================================

interface ButtonGroupOption<T> {
  value: T
  icon: React.ReactNode
  label: string
}

function ButtonGroup<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
}: {
  value: T
  options: ButtonGroupOption<T>[]
  onChange: (value: T) => void
  size?: 'sm' | 'md'
}) {
  const sizeClasses = size === 'sm' ? 'p-1.5' : 'p-2'
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            'flex items-center justify-center rounded-md transition-all',
            sizeClasses,
            value === option.value
              ? 'bg-white dark:bg-gray-700 text-pink-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          )}
          onClick={() => onChange(option.value)}
          title={option.label}
          aria-label={option.label}
          aria-pressed={value === option.value}
        >
          <span className={iconSize}>{option.icon}</span>
        </button>
      ))}
    </div>
  )
}

// ============================================
// 숫자 입력 컴포넌트
// ============================================

interface NumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  /** 컴팩트 모드 (라벨 숨김, 더 작은 사이즈) */
  compact?: boolean
}

const NumberInput = memo(function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit,
  compact = false,
}: NumberInputProps) {
  const handleDecrement = useCallback(() => {
    const newValue = Math.max(min, value - step)
    onChange(newValue)
  }, [value, min, step, onChange])

  const handleIncrement = useCallback(() => {
    const newValue = Math.min(max, value + step)
    onChange(newValue)
  }, [value, max, step, onChange])

  if (compact) {
    return (
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className={cn(
            'p-1 rounded transition-colors',
            'hover:bg-gray-200 dark:hover:bg-gray-700',
            'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
            value <= min && 'opacity-30 cursor-not-allowed'
          )}
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label={`${label} 감소`}
        >
          <Minus className="w-3 h-3" />
        </button>
        <input
          type="number"
          value={step < 1 ? value.toFixed(1) : value}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value)
            if (!isNaN(parsed)) {
              onChange(Math.min(max, Math.max(min, parsed)))
            }
          }}
          min={min}
          max={max}
          step={step}
          title={label}
          className={cn(
            'w-10 px-1 py-0.5 text-center text-xs',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'rounded focus:outline-none focus:ring-1 focus:ring-pink-400'
          )}
        />
        {unit && <span className="text-[10px] text-gray-400 ml-0.5">{unit}</span>}
        <button
          type="button"
          className={cn(
            'p-1 rounded transition-colors',
            'hover:bg-gray-200 dark:hover:bg-gray-700',
            'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
            value >= max && 'opacity-30 cursor-not-allowed'
          )}
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label={`${label} 증가`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500">{label}</label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
            'text-gray-600 dark:text-gray-400'
          )}
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label={`${label} 감소`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value)
            if (!isNaN(parsed)) {
              onChange(Math.min(max, Math.max(min, parsed)))
            }
          }}
          min={min}
          max={max}
          step={step}
          className={cn(
            'w-16 px-2 py-1.5 text-center text-sm',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400'
          )}
        />
        {unit && <span className="text-xs text-gray-400">{unit}</span>}
        <button
          type="button"
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
            'text-gray-600 dark:text-gray-400'
          )}
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label={`${label} 증가`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
})

// ============================================
// 섹션 컴포넌트
// ============================================

interface SectionProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

const Section = memo(function Section({
  title,
  icon,
  children,
  className,
}: SectionProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  )
})

// ============================================
// 메인 컴포넌트
// ============================================

export const TextStylePanel = memo(function TextStylePanel({
  textField,
  onUpdateStyle,
  onUpdateEffects,
  onUpdateAutoFit,
  onUpdateCurve,
  currentText,
  className,
}: TextStylePanelProps) {
  const { style, autoFit, curve } = textField

  // ============================================
  // 정렬 옵션
  // ============================================

  const alignOptions: ButtonGroupOption<'left' | 'center' | 'right'>[] = useMemo(
    () => [
      { value: 'left', icon: <AlignLeft className="w-full h-full" />, label: '왼쪽 정렬' },
      { value: 'center', icon: <AlignCenter className="w-full h-full" />, label: '가운데 정렬' },
      { value: 'right', icon: <AlignRight className="w-full h-full" />, label: '오른쪽 정렬' },
    ],
    []
  )

  const verticalAlignOptions: ButtonGroupOption<'top' | 'middle' | 'bottom'>[] = useMemo(
    () => [
      { value: 'top', icon: <AlignVerticalJustifyStart className="w-full h-full" />, label: '상단 정렬' },
      { value: 'middle', icon: <AlignVerticalJustifyCenter className="w-full h-full" />, label: '중앙 정렬' },
      { value: 'bottom', icon: <AlignVerticalJustifyEnd className="w-full h-full" />, label: '하단 정렬' },
    ],
    []
  )

  // ============================================
  // 핸들러
  // ============================================

  const handleFontChange = useCallback(
    (family: string) => {
      onUpdateStyle({ fontFamily: family })
    },
    [onUpdateStyle]
  )

  const handleWeightChange = useCallback(
    (weight: FontWeightNumeric) => {
      onUpdateStyle({ fontWeight: String(weight) as TextStyle['fontWeight'] })
    },
    [onUpdateStyle]
  )

  const handleFontSizeChange = useCallback(
    (size: number) => {
      onUpdateStyle({ fontSize: size })
    },
    [onUpdateStyle]
  )

  const handleAlignChange = useCallback(
    (align: 'left' | 'center' | 'right') => {
      onUpdateStyle({ align })
    },
    [onUpdateStyle]
  )

  const handleVerticalAlignChange = useCallback(
    (verticalAlign: 'top' | 'middle' | 'bottom') => {
      onUpdateStyle({ verticalAlign })
    },
    [onUpdateStyle]
  )

  const handleLineHeightChange = useCallback(
    (lineHeight: number) => {
      onUpdateStyle({ lineHeight })
    },
    [onUpdateStyle]
  )

  const handleLetterSpacingChange = useCallback(
    (letterSpacing: number) => {
      onUpdateStyle({ letterSpacing })
    },
    [onUpdateStyle]
  )

  const handleColorChange = useCallback(
    (color: string) => {
      onUpdateStyle({ color })
    },
    [onUpdateStyle]
  )

  const handleGradientChange = useCallback(
    (gradient: TextGradient | undefined) => {
      onUpdateStyle({ gradient })
    },
    [onUpdateStyle]
  )

  const handleApplyPreset = useCallback(
    (presetStyle: Partial<TextStyle>, presetEffects?: Partial<TextEffects>) => {
      // 스타일 적용
      onUpdateStyle(presetStyle)
      // 효과 적용 (콜백이 있을 경우)
      if (onUpdateEffects && presetEffects) {
        onUpdateEffects(presetEffects)
      }
    },
    [onUpdateStyle, onUpdateEffects]
  )

  const handleCurveChange = useCallback(
    (newCurve: TextCurve | undefined) => {
      if (onUpdateCurve) {
        onUpdateCurve(newCurve)
      }
    },
    [onUpdateCurve]
  )

  const handleDecorationToggle = useCallback(
    (decoration: 'underline' | 'line-through') => {
      const current = style.textDecoration
      if (current === decoration) {
        onUpdateStyle({ textDecoration: 'none' })
      } else {
        onUpdateStyle({ textDecoration: decoration })
      }
    },
    [style.textDecoration, onUpdateStyle]
  )

  const handleTransformChange = useCallback(
    (transform: TextStyle['textTransform']) => {
      onUpdateStyle({ textTransform: transform })
    },
    [onUpdateStyle]
  )

  // ============================================
  // 자동 맞춤 핸들러
  // ============================================

  const handleAutoFitModeChange = useCallback(
    (mode: AutoFitConfig['mode']) => {
      if (!onUpdateAutoFit) return

      if (mode === 'none') {
        onUpdateAutoFit(null)
      } else {
        onUpdateAutoFit({
          mode,
          minFontSize: autoFit?.minFontSize ?? 8,
          maxFontSize: autoFit?.maxFontSize ?? style.fontSize * 2,
          wordBreak: autoFit?.wordBreak ?? 'normal',
        })
      }
    },
    [onUpdateAutoFit, autoFit, style.fontSize]
  )

  const handleAutoFitMinSizeChange = useCallback(
    (minFontSize: number) => {
      if (!onUpdateAutoFit || !autoFit) return
      onUpdateAutoFit({ ...autoFit, minFontSize })
    },
    [onUpdateAutoFit, autoFit]
  )

  const handleAutoFitMaxSizeChange = useCallback(
    (maxFontSize: number) => {
      if (!onUpdateAutoFit || !autoFit) return
      onUpdateAutoFit({ ...autoFit, maxFontSize })
    },
    [onUpdateAutoFit, autoFit]
  )

  const handleWordBreakChange = useCallback(
    (wordBreak: AutoFitConfig['wordBreak']) => {
      if (!onUpdateAutoFit || !autoFit) return
      onUpdateAutoFit({ ...autoFit, wordBreak })
    },
    [onUpdateAutoFit, autoFit]
  )

  // ============================================
  // 자동 맞춤 옵션
  // ============================================

  const autoFitModeOptions: ButtonGroupOption<AutoFitConfig['mode'] | 'none'>[] = useMemo(
    () => [
      { value: 'none', icon: <span className="text-[10px] font-medium">OFF</span>, label: '자동 맞춤 끄기' },
      { value: 'shrink', icon: <span className="text-[10px] font-medium">축소</span>, label: '텍스트가 넘치면 축소' },
      { value: 'grow', icon: <span className="text-[10px] font-medium">확대</span>, label: '공간이 남으면 확대' },
      { value: 'fit-box', icon: <span className="text-[10px] font-medium">맞춤</span>, label: '박스에 최적화' },
    ],
    []
  )

  const wordBreakOptions: ButtonGroupOption<'normal' | 'keep-all' | 'break-all'>[] = useMemo(
    () => [
      { value: 'normal', icon: <span className="text-[9px]">일반</span>, label: '일반 줄바꿈' },
      { value: 'keep-all', icon: <span className="text-[9px]">한글</span>, label: '한글 단어 유지' },
      { value: 'break-all', icon: <span className="text-[9px]">글자</span>, label: '글자 단위 줄바꿈' },
    ],
    []
  )

  // 현재 가중치 (숫자로 변환)
  const currentWeight: FontWeightNumeric = useMemo(() => {
    if (!style.fontWeight) return 400
    if (style.fontWeight === 'normal') return 400
    if (style.fontWeight === 'bold') return 700
    const parsed = parseInt(style.fontWeight)
    return (isNaN(parsed) ? 400 : parsed) as FontWeightNumeric
  }, [style.fontWeight])

  // ============================================
  // 렌더링
  // ============================================

  return (
    <motion.div
      className={cn(
        'space-y-5 p-4 bg-gradient-to-b from-pink-50/50 to-white',
        'dark:from-gray-800/50 dark:to-gray-900',
        'rounded-xl border border-pink-100 dark:border-gray-700',
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-pink-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          텍스트 스타일
        </h3>
      </div>

      {/* 스타일 프리셋 */}
      <StylePresetPicker
        currentStyle={style}
        currentEffects={textField.effects}
        onApplyPreset={handleApplyPreset}
      />

      {/* 폰트 선택 */}
      <Section title="폰트" icon={<LetterText className="w-3.5 h-3.5" />}>
        <FontSelector
          value={style.fontFamily}
          onChange={handleFontChange}
          weight={currentWeight}
          onWeightChange={handleWeightChange}
          previewText={currentText}
        />
      </Section>

      {/* 크기 & 행간 - 컴팩트 한 줄 레이아웃 */}
      <Section title="크기 & 간격" icon={<MoveVertical className="w-3.5 h-3.5" />}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 w-6">크기</span>
            <NumberInput
              label="크기"
              value={style.fontSize}
              onChange={handleFontSizeChange}
              min={8}
              max={200}
              step={1}
              unit="px"
              compact
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 w-6">행간</span>
            <NumberInput
              label="행간"
              value={style.lineHeight || 1.2}
              onChange={handleLineHeightChange}
              min={0.5}
              max={3}
              step={0.1}
              compact
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 w-6">자간</span>
            <NumberInput
              label="자간"
              value={style.letterSpacing || 0}
              onChange={handleLetterSpacingChange}
              min={-10}
              max={30}
              step={0.5}
              unit="px"
              compact
            />
          </div>
        </div>
      </Section>

      {/* 자동 맞춤 */}
      {onUpdateAutoFit && (
        <Section title="자동 맞춤" icon={<Scaling className="w-3.5 h-3.5" />}>
          {/* 모드 선택 */}
          <div className="space-y-2">
            <span className="text-xs text-gray-500">모드</span>
            <ButtonGroup
              value={autoFit?.mode || 'none'}
              options={autoFitModeOptions}
              onChange={handleAutoFitModeChange}
              size="sm"
            />
          </div>

          {/* 상세 설정 (자동 맞춤 활성화 시) */}
          {autoFit && autoFit.mode !== 'none' && (
            <motion.div
              className="space-y-3 pt-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* 최소/최대 크기 */}
              <div className="grid grid-cols-2 gap-3">
                {(autoFit.mode === 'shrink' || autoFit.mode === 'fit-box') && (
                  <NumberInput
                    label="최소 크기"
                    value={autoFit.minFontSize ?? 8}
                    onChange={handleAutoFitMinSizeChange}
                    min={4}
                    max={style.fontSize - 1}
                    step={1}
                    unit="px"
                  />
                )}
                {(autoFit.mode === 'grow' || autoFit.mode === 'fit-box') && (
                  <NumberInput
                    label="최대 크기"
                    value={autoFit.maxFontSize ?? style.fontSize * 2}
                    onChange={handleAutoFitMaxSizeChange}
                    min={style.fontSize + 1}
                    max={300}
                    step={1}
                    unit="px"
                  />
                )}
              </div>

              {/* 줄바꿈 모드 */}
              <div className="space-y-2">
                <span className="text-xs text-gray-500">줄바꿈</span>
                <ButtonGroup
                  value={autoFit.wordBreak ?? 'normal'}
                  options={wordBreakOptions}
                  onChange={handleWordBreakChange}
                  size="sm"
                />
              </div>

              {/* 현재 적용 상태 표시 */}
              <div className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                💡 {autoFit.mode === 'shrink' && '텍스트가 박스를 넘으면 자동으로 축소됩니다'}
                {autoFit.mode === 'grow' && '박스에 공간이 남으면 자동으로 확대됩니다'}
                {autoFit.mode === 'fit-box' && '텍스트 크기가 박스에 최적화됩니다'}
              </div>
            </motion.div>
          )}
        </Section>
      )}

      {/* 정렬 - 컴팩트 레이아웃 */}
      <Section title="정렬">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400">가로</span>
          <ButtonGroup
            value={style.align || 'center'}
            options={alignOptions}
            onChange={handleAlignChange}
            size="sm"
          />
          <span className="text-[10px] text-gray-400 ml-2">세로</span>
          <ButtonGroup
            value={style.verticalAlign || 'middle'}
            options={verticalAlignOptions}
            onChange={handleVerticalAlignChange}
            size="sm"
          />
        </div>
      </Section>

      {/* 색상 & 그라디언트 */}
      <Section title="색상" icon={<Palette className="w-3.5 h-3.5" />}>
        {/* 단색 (그라디언트 비활성화 시만 표시) */}
        {!style.gradient && (
          <div className="flex items-center gap-3 mb-3">
            <input
              type="color"
              value={typeof style.color === 'string' ? style.color : '#000000'}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
              title="텍스트 색상"
            />
            <input
              type="text"
              value={typeof style.color === 'string' ? style.color : ''}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#000000"
              className={cn(
                'flex-1 px-3 py-2 text-sm',
                'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                'rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400'
              )}
            />
          </div>
        )}

        {/* 그라디언트 피커 */}
        <GradientPicker
          value={style.gradient}
          onChange={handleGradientChange}
        />
      </Section>

      {/* 장식 & 변환 */}
      <Section title="장식">
        <div className="flex flex-wrap gap-2">
          {/* 밑줄 */}
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all',
              style.textDecoration === 'underline'
                ? 'bg-pink-500 text-white border-pink-500'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-pink-300'
            )}
            onClick={() => handleDecorationToggle('underline')}
          >
            <Underline className="w-3.5 h-3.5" />
            밑줄
          </button>

          {/* 취소선 */}
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all',
              style.textDecoration === 'line-through'
                ? 'bg-pink-500 text-white border-pink-500'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-pink-300'
            )}
            onClick={() => handleDecorationToggle('line-through')}
          >
            <Strikethrough className="w-3.5 h-3.5" />
            취소선
          </button>
        </div>

        {/* 대소문자 변환 */}
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all',
              style.textTransform === 'uppercase'
                ? 'bg-pink-500 text-white border-pink-500'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-pink-300'
            )}
            onClick={() =>
              handleTransformChange(
                style.textTransform === 'uppercase' ? 'none' : 'uppercase'
              )
            }
          >
            <ArrowUpAZ className="w-3.5 h-3.5" />
            대문자
          </button>

          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all',
              style.textTransform === 'lowercase'
                ? 'bg-pink-500 text-white border-pink-500'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-pink-300'
            )}
            onClick={() =>
              handleTransformChange(
                style.textTransform === 'lowercase' ? 'none' : 'lowercase'
              )
            }
          >
            <ArrowDownAZ className="w-3.5 h-3.5" />
            소문자
          </button>

          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all',
              style.textTransform === 'capitalize'
                ? 'bg-pink-500 text-white border-pink-500'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-pink-300'
            )}
            onClick={() =>
              handleTransformChange(
                style.textTransform === 'capitalize' ? 'none' : 'capitalize'
              )
            }
          >
            <CaseSensitive className="w-3.5 h-3.5" />
            첫글자 대문자
          </button>
        </div>
      </Section>

      {/* 곡선/아치 텍스트 */}
      {onUpdateCurve && (
        <Section title="곡선 텍스트" icon={<Waves className="w-3.5 h-3.5" />}>
          <CurvePicker
            value={curve}
            onChange={handleCurveChange}
          />
        </Section>
      )}
    </motion.div>
  )
})

export default TextStylePanel
