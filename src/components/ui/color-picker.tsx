'use client'

/**
 * 고급 컬러 피커 컴포넌트
 *
 * 기능:
 * - HSV 기반 2D 스펙트럼 피커
 * - 무지개 Hue 슬라이더
 * - HEX 직접 입력
 * - RGB 개별 입력
 * - 최근 사용 색상
 * - 드래그 & 클릭 지원
 * - 키보드 접근성
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import {
  hexToHsv,
  hsvToHex,
  hexToRgb,
  rgbToHex,
  isValidHex,
  getRecentColors,
  addRecentColor,
  type HSV,
  type RGB,
} from '@/lib/utils/color'

// ============================================
// 타입 정의
// ============================================

interface ColorPickerProps {
  /** 현재 색상 (HEX) */
  value: string
  /** 색상 변경 핸들러 */
  onChange: (color: string) => void
  /** 비활성화 여부 */
  disabled?: boolean
  /** 추가 클래스명 */
  className?: string
  /** 최근 색상 표시 여부 */
  showRecentColors?: boolean
  /** 프리셋 색상 목록 */
  presetColors?: string[]
  /** 라벨 */
  label?: string
}

// ============================================
// 상수
// ============================================

const DEFAULT_PRESETS = [
  '#FF6B6B', '#FF8E53', '#FECA57', '#48DBFB', '#1DD1A1',
  '#5F27CD', '#EE5A24', '#009432', '#0652DD', '#833471',
  '#2C3E50', '#7F8C8D', '#FFFFFF', '#000000',
]

// ============================================
// 서브 컴포넌트: ColorSpectrum (2D 피커)
// ============================================

interface ColorSpectrumProps {
  hue: number
  saturation: number
  value: number
  onChange: (s: number, v: number) => void
  disabled?: boolean
}

const ColorSpectrum = memo(function ColorSpectrum({
  hue,
  saturation,
  value,
  onChange,
  disabled,
}: ColorSpectrumProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const updateColor = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const y = Math.max(0, Math.min(clientY - rect.top, rect.height))

      const newSaturation = Math.round((x / rect.width) * 100)
      const newValue = Math.round(100 - (y / rect.height) * 100)

      onChange(newSaturation, newValue)
    },
    [onChange, disabled]
  )

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return
      e.preventDefault()
      setIsDragging(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      updateColor(e.clientX, e.clientY)
    },
    [updateColor, disabled]
  )

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging || disabled) return
      updateColor(e.clientX, e.clientY)
    },
    [isDragging, updateColor, disabled]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 키보드 지원
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (disabled) return
      const step = e.shiftKey ? 10 : 1
      let newS = saturation
      let newV = value

      switch (e.key) {
        case 'ArrowLeft':
          newS = Math.max(0, saturation - step)
          break
        case 'ArrowRight':
          newS = Math.min(100, saturation + step)
          break
        case 'ArrowUp':
          newV = Math.min(100, value + step)
          break
        case 'ArrowDown':
          newV = Math.max(0, value - step)
          break
        default:
          return
      }

      e.preventDefault()
      onChange(newS, newV)
    },
    [saturation, value, onChange, disabled]
  )

  const cursorX = (saturation / 100) * 100
  const cursorY = 100 - (value / 100) * 100

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="색상 채도와 밝기"
      aria-valuetext={`채도 ${saturation}%, 밝기 ${value}%`}
      className={cn(
        // 모바일: 컴팩트 비율, 데스크탑: 약간 넓게
        'relative w-full aspect-[5/3] sm:aspect-[16/10] max-h-[180px] sm:max-h-[220px] rounded-xl overflow-hidden cursor-crosshair touch-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      style={{
        background: `
          linear-gradient(to top, #000, transparent),
          linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))
        `,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      {/* 커서 */}
      <motion.div
        className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: `${cursorX}%`,
          top: `${cursorY}%`,
        }}
        animate={{
          scale: isDragging ? 1.2 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div
          className={cn(
            'w-full h-full rounded-full border-2 border-white shadow-lg',
            'ring-1 ring-black/20'
          )}
          style={{ backgroundColor: hsvToHex({ h: hue, s: saturation, v: value }) }}
        />
      </motion.div>
    </div>
  )
})

// ============================================
// 서브 컴포넌트: HueSlider
// ============================================

interface HueSliderProps {
  hue: number
  onChange: (hue: number) => void
  disabled?: boolean
}

const HueSlider = memo(function HueSlider({
  hue,
  onChange,
  disabled,
}: HueSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const updateHue = useCallback(
    (clientX: number) => {
      if (disabled) return
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const newHue = Math.round((x / rect.width) * 360)

      onChange(newHue)
    },
    [onChange, disabled]
  )

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return
      e.preventDefault()
      setIsDragging(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      updateHue(e.clientX)
    },
    [updateHue, disabled]
  )

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging || disabled) return
      updateHue(e.clientX)
    },
    [isDragging, updateHue, disabled]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (disabled) return
      const step = e.shiftKey ? 10 : 1

      switch (e.key) {
        case 'ArrowLeft':
          onChange(Math.max(0, hue - step))
          break
        case 'ArrowRight':
          onChange(Math.min(360, hue + step))
          break
        default:
          return
      }
      e.preventDefault()
    },
    [hue, onChange, disabled]
  )

  const cursorX = (hue / 360) * 100

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="색상 (Hue)"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={hue}
      className={cn(
        'relative h-4 rounded-full cursor-pointer touch-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      style={{
        background: `linear-gradient(to right,
          hsl(0, 100%, 50%),
          hsl(60, 100%, 50%),
          hsl(120, 100%, 50%),
          hsl(180, 100%, 50%),
          hsl(240, 100%, 50%),
          hsl(300, 100%, 50%),
          hsl(360, 100%, 50%)
        )`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 -ml-2.5 pointer-events-none"
        style={{ left: `${cursorX}%` }}
        animate={{ scale: isDragging ? 1.2 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div
          className="w-full h-full rounded-full bg-white border-2 border-gray-300 shadow-md"
          style={{
            backgroundColor: `hsl(${hue}, 100%, 50%)`,
          }}
        />
      </motion.div>
    </div>
  )
})

// ============================================
// 서브 컴포넌트: ColorInput (HEX)
// ============================================

interface ColorInputProps {
  value: string
  onChange: (hex: string) => void
  disabled?: boolean
}

const ColorInput = memo(function ColorInput({
  value,
  onChange,
  disabled,
}: ColorInputProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    setInputValue(value)
    setIsValid(true)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toUpperCase()

    // # 자동 추가
    if (newValue && !newValue.startsWith('#')) {
      newValue = '#' + newValue
    }

    setInputValue(newValue)

    // HEX 유효성 검사
    if (isValidHex(newValue)) {
      setIsValid(true)
      onChange(newValue)
    } else {
      setIsValid(newValue.length <= 1) // 빈 값이거나 # 만 있으면 유효
    }
  }

  const handleBlur = () => {
    // 유효하지 않으면 원래 값으로 복원
    if (!isValidHex(inputValue)) {
      setInputValue(value)
      setIsValid(true)
    }
  }

  return (
    <div className="flex-1">
      <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wide">
        HEX
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        maxLength={7}
        placeholder="#FFFFFF"
        className={cn(
          'w-full px-3 py-2 text-sm font-mono text-center bg-gray-50 border rounded-lg',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200',
          !isValid && 'border-red-300 bg-red-50',
          isValid && 'border-gray-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
    </div>
  )
})

// ============================================
// 서브 컴포넌트: RGBInputs
// ============================================

interface RGBInputsProps {
  rgb: RGB
  onChange: (rgb: RGB) => void
  disabled?: boolean
}

const RGBInputs = memo(function RGBInputs({
  rgb,
  onChange,
  disabled,
}: RGBInputsProps) {
  const handleChange = (channel: keyof RGB, value: string) => {
    const numValue = parseInt(value, 10)
    if (isNaN(numValue)) {
      onChange({ ...rgb, [channel]: 0 })
    } else {
      onChange({ ...rgb, [channel]: Math.max(0, Math.min(255, numValue)) })
    }
  }

  const channels: Array<{ key: keyof RGB; label: string; color: string }> = [
    { key: 'r', label: 'R', color: 'text-red-500' },
    { key: 'g', label: 'G', color: 'text-green-500' },
    { key: 'b', label: 'B', color: 'text-blue-500' },
  ]

  return (
    <div className="flex gap-2">
      {channels.map(({ key, label, color }) => (
        <div key={key} className="flex-1">
          <label className={cn('block text-[10px] font-medium mb-1 uppercase tracking-wide', color)}>
            {label}
          </label>
          <input
            type="number"
            min={0}
            max={255}
            value={rgb[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            disabled={disabled}
            className={cn(
              'w-full px-2 py-2 text-sm text-center bg-gray-50 border border-gray-200 rounded-lg',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200',
              '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        </div>
      ))}
    </div>
  )
})

// ============================================
// 서브 컴포넌트: RecentColors
// ============================================

interface RecentColorsProps {
  colors: string[]
  onSelect: (color: string) => void
  disabled?: boolean
}

const RecentColors = memo(function RecentColors({
  colors,
  onSelect,
  disabled,
}: RecentColorsProps) {
  if (colors.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-2">
        최근 사용한 색상이 없습니다
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((color, index) => (
        <motion.button
          key={`${color}-${index}`}
          type="button"
          onClick={() => !disabled && onSelect(color)}
          disabled={disabled}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'w-6 h-6 rounded-full border border-gray-200 shadow-sm',
            'transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ backgroundColor: color }}
          aria-label={`색상 ${color} 선택`}
        />
      ))}
    </div>
  )
})

// ============================================
// 서브 컴포넌트: PresetColors
// ============================================

interface PresetColorsProps {
  colors: string[]
  currentColor: string
  onSelect: (color: string) => void
  disabled?: boolean
}

const PresetColors = memo(function PresetColors({
  colors,
  currentColor,
  onSelect,
  disabled,
}: PresetColorsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((color) => (
        <motion.button
          key={color}
          type="button"
          onClick={() => !disabled && onSelect(color)}
          disabled={disabled}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'w-6 h-6 rounded-full transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1',
            currentColor.toUpperCase() === color.toUpperCase()
              ? 'ring-2 ring-gray-800 ring-offset-1'
              : 'border border-gray-200 shadow-sm hover:shadow-md',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ backgroundColor: color }}
          aria-label={`프리셋 색상 ${color}`}
          aria-pressed={currentColor.toUpperCase() === color.toUpperCase()}
        />
      ))}
    </div>
  )
})

// ============================================
// 메인 컴포넌트: ColorPicker
// ============================================

export const ColorPicker = memo(function ColorPicker({
  value,
  onChange,
  disabled = false,
  className,
  showRecentColors = true,
  presetColors = DEFAULT_PRESETS,
  label,
}: ColorPickerProps) {
  // HSV 상태
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value) || { h: 0, s: 100, v: 100 })
  const [recentColors, setRecentColors] = useState<string[]>([])

  // value가 외부에서 변경되면 HSV 동기화
  useEffect(() => {
    const newHsv = hexToHsv(value)
    if (newHsv) {
      setHsv(newHsv)
    }
  }, [value])

  // 최근 색상 로드
  useEffect(() => {
    setRecentColors(getRecentColors())
  }, [])

  // HSV 변경 → HEX 출력
  const handleHsvChange = useCallback(
    (newHsv: Partial<HSV>) => {
      const updatedHsv = { ...hsv, ...newHsv }
      setHsv(updatedHsv)
      const hex = hsvToHex(updatedHsv)
      onChange(hex)
    },
    [hsv, onChange]
  )

  // 채도/밝기 변경
  const handleSpectrumChange = useCallback(
    (s: number, v: number) => {
      handleHsvChange({ s, v })
    },
    [handleHsvChange]
  )

  // Hue 변경
  const handleHueChange = useCallback(
    (h: number) => {
      handleHsvChange({ h })
    },
    [handleHsvChange]
  )

  // HEX 직접 입력
  const handleHexChange = useCallback(
    (hex: string) => {
      const newHsv = hexToHsv(hex)
      if (newHsv) {
        setHsv(newHsv)
        onChange(hex)
      }
    },
    [onChange]
  )

  // RGB 입력
  const handleRgbChange = useCallback(
    (rgb: RGB) => {
      const hex = rgbToHex(rgb)
      const newHsv = hexToHsv(hex)
      if (newHsv) {
        setHsv(newHsv)
        onChange(hex)
      }
    },
    [onChange]
  )

  // 색상 선택 (프리셋/최근)
  const handleColorSelect = useCallback(
    (color: string) => {
      const newHsv = hexToHsv(color)
      if (newHsv) {
        setHsv(newHsv)
        onChange(color)
      }
    },
    [onChange]
  )

  // 최근 색상에 추가 (색상 선택 완료 시)
  const handleAddToRecent = useCallback(() => {
    addRecentColor(value)
    setRecentColors(getRecentColors())
  }, [value])

  const currentRgb = hexToRgb(value) || { r: 255, g: 255, b: 255 }

  return (
    <div className={cn('space-y-3 sm:space-y-4', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {/* 스펙트럼 피커 */}
      <ColorSpectrum
        hue={hsv.h}
        saturation={hsv.s}
        value={hsv.v}
        onChange={handleSpectrumChange}
        disabled={disabled}
      />

      {/* Hue 슬라이더 */}
      <HueSlider
        hue={hsv.h}
        onChange={handleHueChange}
        disabled={disabled}
      />

      {/* 미리보기 + 입력 */}
      <div className="flex gap-3 items-end">
        {/* 색상 미리보기 */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">미리보기</span>
          <motion.div
            className="w-12 h-12 rounded-xl border border-gray-200 shadow-inner cursor-pointer"
            style={{ backgroundColor: value }}
            onClick={handleAddToRecent}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="클릭하여 최근 색상에 추가"
          />
        </div>

        {/* HEX 입력 */}
        <ColorInput
          value={value}
          onChange={handleHexChange}
          disabled={disabled}
        />
      </div>

      {/* RGB 입력 */}
      <RGBInputs
        rgb={currentRgb}
        onChange={handleRgbChange}
        disabled={disabled}
      />

      {/* 프리셋 색상 */}
      {presetColors.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2">
            프리셋
          </p>
          <PresetColors
            colors={presetColors}
            currentColor={value}
            onSelect={handleColorSelect}
            disabled={disabled}
          />
        </div>
      )}

      {/* 최근 사용 색상 */}
      {showRecentColors && (
        <div>
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2">
            최근 사용
          </p>
          <RecentColors
            colors={recentColors}
            onSelect={handleColorSelect}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
})

// ============================================
// 팝오버 형태 ColorPicker
// ============================================

interface ColorPickerPopoverProps extends Omit<ColorPickerProps, 'className'> {
  /** 트리거 버튼 크기 */
  size?: 'sm' | 'md' | 'lg'
  /** 트리거 버튼 모양 */
  shape?: 'square' | 'circle'
  /** 추가 클래스명 */
  className?: string
  /** 팝오버 위치 */
  align?: 'start' | 'center' | 'end'
}

export function ColorPickerPopover({
  value,
  onChange,
  disabled = false,
  size = 'md',
  shape = 'circle',
  className,
  align = 'start',
  ...props
}: ColorPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  const alignments = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }

  const handleChange = useCallback(
    (color: string) => {
      onChange(color)
    },
    [onChange]
  )

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      {/* 트리거 버튼 */}
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          sizes[size],
          shape === 'circle' ? 'rounded-full' : 'rounded-lg',
          'border-2 border-gray-200 shadow-sm cursor-pointer',
          'transition-shadow hover:shadow-md',
          'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{ backgroundColor: value }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="색상 선택"
      />

      {/* 팝오버 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-full mt-2 z-50',
              'w-72 p-4 bg-white rounded-2xl shadow-xl border border-gray-100',
              alignments[align]
            )}
            role="dialog"
            aria-label="색상 선택기"
          >
            <ColorPicker
              value={value}
              onChange={handleChange}
              disabled={disabled}
              {...props}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ColorPicker
