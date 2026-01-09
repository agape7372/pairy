'use client'

/**
 * Sprint 36: 텍스트 곡선 피커
 *
 * 기능:
 * - 곡선 타입 선택 (아치, 원형, 파동)
 * - 곡률 강도 조절
 * - 실시간 미리보기
 *
 * UX 원칙:
 * - 직관적인 비주얼 선택
 * - 간단한 슬라이더 조작
 */

import React, { memo, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Minus,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Circle,
  Waves,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { TextCurve } from '@/types/template'

// ============================================
// 타입 정의
// ============================================

interface CurvePickerProps {
  /** 현재 곡선 설정 */
  value: TextCurve | undefined
  /** 곡선 변경 콜백 */
  onChange: (curve: TextCurve | undefined) => void
  /** 클래스명 */
  className?: string
}

// ============================================
// 곡선 타입 옵션
// ============================================

const CURVE_OPTIONS: {
  type: TextCurve['type']
  label: string
  icon: React.ReactNode
  description: string
}[] = [
  {
    type: 'none',
    label: '없음',
    icon: <Minus className="w-4 h-4" />,
    description: '직선 텍스트',
  },
  {
    type: 'arc-up',
    label: '위로 휘기',
    icon: <ArrowUpFromLine className="w-4 h-4" />,
    description: '무지개처럼 위로 휘는 아치',
  },
  {
    type: 'arc-down',
    label: '아래로 휘기',
    icon: <ArrowDownFromLine className="w-4 h-4" />,
    description: '아래로 처지는 아치',
  },
  {
    type: 'circle',
    label: '원형',
    icon: <Circle className="w-4 h-4" />,
    description: '원을 따라 배치',
  },
  {
    type: 'wave',
    label: '파동',
    icon: <Waves className="w-4 h-4" />,
    description: '물결처럼 출렁이는 효과',
  },
]

// ============================================
// SVG 미리보기 경로 생성
// ============================================

function generatePreviewPath(
  type: TextCurve['type'],
  strength: number,
  width: number = 60,
  height: number = 24
): string {
  switch (type) {
    case 'arc-up': {
      const curveHeight = height * strength * 0.8
      const midX = width / 2
      const baseY = height * 0.8
      const peakY = baseY - curveHeight
      return `M 0 ${baseY} Q ${midX} ${peakY} ${width} ${baseY}`
    }
    case 'arc-down': {
      const curveHeight = height * strength * 0.8
      const midX = width / 2
      const baseY = height * 0.2
      const peakY = baseY + curveHeight
      return `M 0 ${baseY} Q ${midX} ${peakY} ${width} ${baseY}`
    }
    case 'circle': {
      const radius = Math.min(width, height) * 0.4
      const arcAngle = 180 * strength
      const cx = width / 2
      const cy = height
      const startRad = ((-90 - arcAngle / 2) * Math.PI) / 180
      const endRad = ((-90 + arcAngle / 2) * Math.PI) / 180
      const startX = cx + radius * Math.cos(startRad)
      const startY = cy + radius * Math.sin(startRad)
      const endX = cx + radius * Math.cos(endRad)
      const endY = cy + radius * Math.sin(endRad)
      return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`
    }
    case 'wave': {
      const amplitude = height * 0.3 * strength
      const centerY = height / 2
      const segments = 4
      const segmentWidth = width / segments
      let path = `M 0 ${centerY}`
      for (let i = 0; i < segments; i++) {
        const x1 = (i + 0.5) * segmentWidth
        const x2 = (i + 1) * segmentWidth
        const direction = i % 2 === 0 ? -1 : 1
        const y1 = centerY + direction * amplitude
        path += ` Q ${x1} ${y1} ${x2} ${centerY}`
      }
      return path
    }
    case 'none':
    default:
      return `M 0 ${height / 2} L ${width} ${height / 2}`
  }
}

// ============================================
// 메인 컴포넌트
// ============================================

export const CurvePicker = memo(function CurvePicker({
  value,
  onChange,
  className,
}: CurvePickerProps) {
  const currentCurve: TextCurve = useMemo(() => value || {
    type: 'none',
    strength: 0.5,
  }, [value])

  // ============================================
  // 핸들러
  // ============================================

  const handleTypeChange = useCallback(
    (type: TextCurve['type']) => {
      if (type === 'none') {
        onChange(undefined)
      } else {
        onChange({
          ...currentCurve,
          type,
          strength: currentCurve.strength || 0.5,
        })
      }
    },
    [currentCurve, onChange]
  )

  const handleStrengthChange = useCallback(
    (strength: number) => {
      onChange({
        ...currentCurve,
        strength: Math.max(0, Math.min(1, strength)),
      })
    },
    [currentCurve, onChange]
  )

  const handleWaveFrequencyChange = useCallback(
    (frequency: number) => {
      onChange({
        ...currentCurve,
        waveFrequency: Math.max(1, Math.min(5, frequency)),
      })
    },
    [currentCurve, onChange]
  )

  // ============================================
  // 렌더링
  // ============================================

  return (
    <div className={cn('space-y-3', className)}>
      {/* 곡선 타입 그리드 */}
      <div className="grid grid-cols-5 gap-1.5">
        {CURVE_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => handleTypeChange(option.type)}
            className={cn(
              'flex flex-col items-center justify-center p-2 rounded-lg border transition-all',
              currentCurve.type === option.type
                ? 'bg-pink-50 border-pink-300 text-pink-600'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-pink-200'
            )}
            title={option.description}
          >
            {/* SVG 미리보기 */}
            <svg
              width="40"
              height="20"
              viewBox="0 0 60 24"
              className="mb-1"
            >
              <path
                d={generatePreviewPath(option.type, 0.5)}
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            <span className="text-[10px]">{option.label}</span>
          </button>
        ))}
      </div>

      {/* 상세 설정 (곡선 활성화 시) */}
      <AnimatePresence>
        {currentCurve.type !== 'none' && value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {/* 강도 슬라이더 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">강도</span>
                <span className="text-xs text-gray-400">
                  {Math.round(currentCurve.strength * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={currentCurve.strength * 100}
                onChange={(e) => handleStrengthChange(parseInt(e.target.value) / 100)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* 파동 주파수 (wave 타입만) */}
            {currentCurve.type === 'wave' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">파동 주기</span>
                  <span className="text-xs text-gray-400">
                    {currentCurve.waveFrequency ?? 2}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={0.5}
                  value={currentCurve.waveFrequency ?? 2}
                  onChange={(e) => handleWaveFrequencyChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* 실시간 미리보기 */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <svg
                width="100%"
                height="40"
                viewBox="0 0 200 40"
                preserveAspectRatio="xMidYMid meet"
              >
                <path
                  d={generatePreviewPath(currentCurve.type, currentCurve.strength, 200, 40)}
                  stroke="#EC4899"
                  strokeWidth="2"
                  fill="none"
                />
                {/* 텍스트 힌트 */}
                <text
                  x="100"
                  y="35"
                  textAnchor="middle"
                  className="text-[10px] fill-gray-400"
                >
                  텍스트 미리보기
                </text>
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default CurvePicker
