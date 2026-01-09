'use client'

/**
 * Sprint 36: 그라디언트 피커
 *
 * 기능:
 * - 선형/방사형 그라디언트 선택
 * - 각도 조절 (선형)
 * - 색상 정지점 추가/삭제/편집
 * - 프리셋 그라디언트
 * - 실시간 미리보기
 *
 * UX 원칙:
 * - 직관적인 비주얼 피커
 * - 드래그로 정지점 위치 조절
 * - 모바일 친화적
 */

import React, { memo, useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette,
  Plus,
  Trash2,
  RotateCw,
  Circle,
  ArrowRight,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { TextGradient } from '@/types/template'

// ============================================
// 프리셋 그라디언트
// ============================================

interface GradientPreset {
  id: string
  name: string
  gradient: TextGradient
}

const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'sunset',
    name: '선셋',
    gradient: {
      type: 'linear',
      angle: 45,
      stops: [
        { offset: 0, color: '#FF6B6B' },
        { offset: 0.5, color: '#FFA07A' },
        { offset: 1, color: '#FFD93D' },
      ],
    },
  },
  {
    id: 'ocean',
    name: '오션',
    gradient: {
      type: 'linear',
      angle: 135,
      stops: [
        { offset: 0, color: '#667eea' },
        { offset: 1, color: '#764ba2' },
      ],
    },
  },
  {
    id: 'mint',
    name: '민트',
    gradient: {
      type: 'linear',
      angle: 90,
      stops: [
        { offset: 0, color: '#11998e' },
        { offset: 1, color: '#38ef7d' },
      ],
    },
  },
  {
    id: 'cherry',
    name: '체리',
    gradient: {
      type: 'linear',
      angle: 0,
      stops: [
        { offset: 0, color: '#eb3349' },
        { offset: 1, color: '#f45c43' },
      ],
    },
  },
  {
    id: 'sky',
    name: '스카이',
    gradient: {
      type: 'linear',
      angle: 180,
      stops: [
        { offset: 0, color: '#2193b0' },
        { offset: 1, color: '#6dd5ed' },
      ],
    },
  },
  {
    id: 'lavender',
    name: '라벤더',
    gradient: {
      type: 'linear',
      angle: 135,
      stops: [
        { offset: 0, color: '#c471f5' },
        { offset: 1, color: '#fa71cd' },
      ],
    },
  },
  {
    id: 'gold',
    name: '골드',
    gradient: {
      type: 'linear',
      angle: 45,
      stops: [
        { offset: 0, color: '#f9d423' },
        { offset: 0.5, color: '#ff4e50' },
        { offset: 1, color: '#f9d423' },
      ],
    },
  },
  {
    id: 'rainbow',
    name: '레인보우',
    gradient: {
      type: 'linear',
      angle: 90,
      stops: [
        { offset: 0, color: '#ff0000' },
        { offset: 0.17, color: '#ff8000' },
        { offset: 0.33, color: '#ffff00' },
        { offset: 0.5, color: '#00ff00' },
        { offset: 0.67, color: '#0080ff' },
        { offset: 0.83, color: '#8000ff' },
        { offset: 1, color: '#ff0080' },
      ],
    },
  },
  {
    id: 'radial-glow',
    name: '글로우',
    gradient: {
      type: 'radial',
      centerX: 0.5,
      centerY: 0.5,
      radius: 0.7,
      stops: [
        { offset: 0, color: '#ffffff' },
        { offset: 1, color: '#ff69b4' },
      ],
    },
  },
]

// ============================================
// 타입 정의
// ============================================

interface GradientPickerProps {
  /** 현재 그라디언트 (null이면 비활성화) */
  value: TextGradient | undefined
  /** 그라디언트 변경 콜백 */
  onChange: (gradient: TextGradient | undefined) => void
  /** 클래스명 */
  className?: string
}

// ============================================
// 유틸리티 함수
// ============================================

function gradientToCSS(gradient: TextGradient): string {
  const colors = gradient.stops
    .map((s) => `${s.color} ${s.offset * 100}%`)
    .join(', ')

  if (gradient.type === 'linear') {
    return `linear-gradient(${gradient.angle ?? 0}deg, ${colors})`
  } else {
    return `radial-gradient(circle at ${(gradient.centerX ?? 0.5) * 100}% ${(gradient.centerY ?? 0.5) * 100}%, ${colors})`
  }
}

// ============================================
// 메인 컴포넌트
// ============================================

export const GradientPicker = memo(function GradientPicker({
  value,
  onChange,
  className,
}: GradientPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null)

  // 현재 그라디언트 또는 기본값
  const currentGradient: TextGradient = useMemo(() => value || {
    type: 'linear',
    angle: 45,
    stops: [
      { offset: 0, color: '#FF6B6B' },
      { offset: 1, color: '#4ECDC4' },
    ],
  }, [value])

  // ============================================
  // 핸들러
  // ============================================

  const handleToggle = useCallback(() => {
    if (value) {
      // 그라디언트 비활성화
      onChange(undefined)
    } else {
      // 기본 그라디언트 활성화
      onChange(GRADIENT_PRESETS[0].gradient)
    }
  }, [value, onChange])

  const handleTypeChange = useCallback(
    (type: 'linear' | 'radial') => {
      onChange({
        ...currentGradient,
        type,
        ...(type === 'radial' ? { centerX: 0.5, centerY: 0.5, radius: 0.5 } : {}),
      })
    },
    [currentGradient, onChange]
  )

  const handleAngleChange = useCallback(
    (angle: number) => {
      onChange({ ...currentGradient, angle })
    },
    [currentGradient, onChange]
  )

  const handlePresetSelect = useCallback(
    (preset: GradientPreset) => {
      onChange(preset.gradient)
    },
    [onChange]
  )

  const handleStopColorChange = useCallback(
    (index: number, color: string) => {
      const newStops = [...currentGradient.stops]
      newStops[index] = { ...newStops[index], color }
      onChange({ ...currentGradient, stops: newStops })
    },
    [currentGradient, onChange]
  )

  const handleStopOffsetChange = useCallback(
    (index: number, offset: number) => {
      const newStops = [...currentGradient.stops]
      newStops[index] = { ...newStops[index], offset: Math.max(0, Math.min(1, offset)) }
      // 오프셋 순서대로 정렬
      newStops.sort((a, b) => a.offset - b.offset)
      onChange({ ...currentGradient, stops: newStops })
    },
    [currentGradient, onChange]
  )

  const handleAddStop = useCallback(() => {
    if (currentGradient.stops.length >= 8) return // 최대 8개

    // 중간 지점에 새 정지점 추가
    const newOffset = 0.5
    const newColor = '#888888'

    const newStops = [...currentGradient.stops, { offset: newOffset, color: newColor }]
    newStops.sort((a, b) => a.offset - b.offset)

    onChange({ ...currentGradient, stops: newStops })
  }, [currentGradient, onChange])

  const handleRemoveStop = useCallback(
    (index: number) => {
      if (currentGradient.stops.length <= 2) return // 최소 2개

      const newStops = currentGradient.stops.filter((_, i) => i !== index)
      onChange({ ...currentGradient, stops: newStops })
      setEditingStopIndex(null)
    },
    [currentGradient, onChange]
  )

  // CSS 미리보기
  const previewCSS = useMemo(() => {
    if (!value) return 'transparent'
    return gradientToCSS(value)
  }, [value])

  // ============================================
  // 렌더링
  // ============================================

  return (
    <div className={cn('space-y-3', className)}>
      {/* 헤더: 활성화 토글 + 미리보기 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
            value
              ? 'bg-pink-500 text-white border-pink-500'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-pink-300'
          )}
        >
          <Palette className="w-4 h-4" />
          <span className="text-sm">그라디언트</span>
        </button>

        {value && (
          <div
            className="flex-1 h-8 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
            style={{ background: previewCSS }}
            onClick={() => setIsExpanded(!isExpanded)}
            title="클릭하여 편집"
          />
        )}
      </div>

      {/* 확장된 편집 패널 */}
      <AnimatePresence>
        {value && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* 프리셋 */}
            <div className="space-y-2">
              <span className="text-xs text-gray-500">프리셋</span>
              <div className="grid grid-cols-4 gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={cn(
                      'relative h-8 rounded-lg border-2 transition-all',
                      JSON.stringify(value) === JSON.stringify(preset.gradient)
                        ? 'border-pink-500 ring-2 ring-pink-200'
                        : 'border-transparent hover:border-gray-300'
                    )}
                    style={{ background: gradientToCSS(preset.gradient) }}
                    title={preset.name}
                  >
                    {JSON.stringify(value) === JSON.stringify(preset.gradient) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 타입 선택 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('linear')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all',
                  currentGradient.type === 'linear'
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                )}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                선형
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('radial')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all',
                  currentGradient.type === 'radial'
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                )}
              >
                <Circle className="w-3.5 h-3.5" />
                방사형
              </button>
            </div>

            {/* 각도 조절 (선형만) */}
            {currentGradient.type === 'linear' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">각도</span>
                  <span className="text-xs text-gray-400">{currentGradient.angle ?? 0}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={currentGradient.angle ?? 0}
                    onChange={(e) => handleAngleChange(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleAngleChange((currentGradient.angle ?? 0) + 45)}
                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                    title="45° 회전"
                  >
                    <RotateCw className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}

            {/* 색상 정지점 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">색상 정지점</span>
                <button
                  type="button"
                  onClick={handleAddStop}
                  disabled={currentGradient.stops.length >= 8}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all',
                    currentGradient.stops.length >= 8
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-pink-500 hover:bg-pink-50'
                  )}
                >
                  <Plus className="w-3 h-3" />
                  추가
                </button>
              </div>

              {/* 그라디언트 바 */}
              <div
                className="relative h-6 rounded-lg border border-gray-200"
                style={{ background: previewCSS }}
              >
                {currentGradient.stops.map((stop, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setEditingStopIndex(editingStopIndex === index ? null : index)}
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-transform',
                      editingStopIndex === index && 'scale-125 ring-2 ring-pink-400'
                    )}
                    style={{
                      left: `calc(${stop.offset * 100}% - 8px)`,
                      backgroundColor: stop.color,
                    }}
                    title={`${Math.round(stop.offset * 100)}%`}
                  />
                ))}
              </div>

              {/* 선택된 정지점 편집 */}
              <AnimatePresence>
                {editingStopIndex !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <input
                      type="color"
                      value={currentGradient.stops[editingStopIndex].color}
                      onChange={(e) => handleStopColorChange(editingStopIndex, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentGradient.stops[editingStopIndex].color}
                      onChange={(e) => handleStopColorChange(editingStopIndex, e.target.value)}
                      className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                      placeholder="#000000"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round(currentGradient.stops[editingStopIndex].offset * 100)}
                        onChange={(e) =>
                          handleStopOffsetChange(editingStopIndex, parseInt(e.target.value) / 100)
                        }
                        className="w-14 px-2 py-1 text-sm text-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                    {currentGradient.stops.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(editingStopIndex)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default GradientPicker
