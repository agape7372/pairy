'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import {
  Type,
  Image as ImageIcon,
  Palette,
  Upload,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  SunMedium,
  Contrast,
  // Sprint 30: 텍스트 효과
  Sparkles,
  PenLine,
  Eraser,
  // Sprint 31: 스티커
  Sticker,
  Search,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useCanvasEditorStore } from '@/stores/canvasEditorStore'
import type { InputFieldConfig, ImageSlot, ColorConfig, SlotImageTransform, ImageFilters, TextEffects, TextField, StickerLayer } from '@/types/template'
import { ALL_STICKER_PACKS, searchStickers, type Sticker as StickerType, type StickerPack } from '@/types/sticker'

// ============================================
// 서브 컴포넌트
// ============================================

/**
 * 텍스트 입력 필드
 */
const TextInputField = React.forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, {
  field: InputFieldConfig
  value: string
  onChange: (value: string) => void
}>(function TextInputField({ field, value, onChange }, ref) {
  if (field.type === 'textarea') {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
        />
      </div>
    )
  }

  if (field.type === 'date') {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">
          {field.label}
        </label>
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>
    )
  }

  if (field.type === 'select' && field.options) {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">
          {field.label}
        </label>
        <select
          ref={ref as React.Ref<HTMLSelectElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="">선택하세요</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
    </div>
  )
})

/**
 * 이미지 업로드 필드
 */
function ImageUploadField({
  field,
  slot: _slot,
  imageUrl,
  onUpload,
  onRemove,
}: {
  field: InputFieldConfig
  slot: ImageSlot | null
  imageUrl: string | null
  onUpload: (file: File) => void
  onRemove: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onUpload(file)
      }
      // 같은 파일 다시 선택 가능하도록
      e.target.value = ''
    },
    [onUpload]
  )

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      // 이미지 파일만 허용
      if (file.type.startsWith('image/')) {
        onUpload(file)
      }
    }
  }, [onUpload])

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-600">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {imageUrl ? (
        <div
          className={cn(
            'relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-colors',
            isDragging ? 'border-primary-400 bg-primary-50' : 'border-transparent'
          )}
          onClick={openFileDialog}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <img
            src={imageUrl}
            alt={field.label}
            className="w-full h-32 object-cover rounded-xl"
          />
          {/* 오버레이 - 호버 시 변경 안내 */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-medium">클릭하여 변경</span>
          </div>
          {/* 삭제 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            aria-label={`${field.label} 이미지 삭제`}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div
          onClick={openFileDialog}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors',
            isDragging
              ? 'border-primary-400 bg-primary-50 text-primary-500'
              : 'border-gray-300 text-gray-400 hover:border-primary-400 hover:text-primary-500'
          )}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openFileDialog()
            }
          }}
          aria-label={`${field.label} 이미지 업로드`}
        >
          <Upload className="w-6 h-6" aria-hidden="true" />
          <span className="text-xs text-center">
            {isDragging ? '여기에 놓으세요' : '클릭 또는 드래그하여 업로드'}
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

/**
 * 색상 선택 필드
 */
function ColorPickerField({
  config,
  value,
  onChange,
}: {
  config: ColorConfig
  value: string
  onChange: (value: string) => void
}) {
  // 버그 수정: 입력 중 타이핑 허용을 위한 로컬 상태 추가
  const [inputValue, setInputValue] = React.useState(value.toUpperCase())

  // 외부 value 변경 시 동기화
  React.useEffect(() => {
    setInputValue(value.toUpperCase())
  }, [value])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value.toUpperCase()
    setInputValue(hex)

    // 유효한 Hex일 때만 상위에 전달
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex)
    }
  }

  const handleBlur = () => {
    // 포커스 해제 시 유효하지 않으면 원래 값으로 복원
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(value.toUpperCase())
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {config.label}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
          />
          <input
            type="text"
            value={inputValue}
            onChange={handleTextChange}
            onBlur={handleBlur}
            placeholder="#FFFFFF"
            maxLength={7}
            className="flex-1 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Sprint 30: 텍스트 효과 패널
 */
function TextEffectsPanel({
  textField,
  onUpdateEffects,
  onClearEffects,
}: {
  textField: TextField
  onUpdateEffects: (effects: Partial<TextEffects>) => void
  onClearEffects: () => void
}) {
  const effects = textField.effects || {}

  // 그림자 토글
  const handleShadowToggle = () => {
    if (effects.shadow) {
      onUpdateEffects({ shadow: undefined })
    } else {
      onUpdateEffects({
        shadow: {
          color: '#000000',
          blur: 4,
          offsetX: 2,
          offsetY: 2,
        },
      })
    }
  }

  // 외곽선 토글
  const handleStrokeToggle = () => {
    if (effects.stroke) {
      onUpdateEffects({ stroke: undefined })
    } else {
      onUpdateEffects({
        stroke: {
          color: '#000000',
          width: 2,
        },
      })
    }
  }

  // 글로우 토글
  const handleGlowToggle = () => {
    if (effects.glow) {
      onUpdateEffects({ glow: undefined })
    } else {
      onUpdateEffects({
        glow: {
          color: '#FFFFFF',
          blur: 8,
        },
      })
    }
  }

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-blue-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          텍스트 효과
        </h4>
        {(effects.shadow || effects.stroke || effects.glow) && (
          <button
            onClick={onClearEffects}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Eraser className="w-3 h-3" />
            초기화
          </button>
        )}
      </div>

      {/* 효과 토글 버튼들 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleShadowToggle}
          className={cn(
            'px-3 py-1.5 text-xs rounded-full border transition-colors flex items-center gap-1',
            effects.shadow
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          )}
        >
          그림자
        </button>
        <button
          onClick={handleStrokeToggle}
          className={cn(
            'px-3 py-1.5 text-xs rounded-full border transition-colors flex items-center gap-1',
            effects.stroke
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          )}
        >
          <PenLine className="w-3 h-3" />
          외곽선
        </button>
        <button
          onClick={handleGlowToggle}
          className={cn(
            'px-3 py-1.5 text-xs rounded-full border transition-colors flex items-center gap-1',
            effects.glow
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          )}
        >
          <Sparkles className="w-3 h-3" />
          글로우
        </button>
      </div>

      {/* 그림자 세부 설정 */}
      {effects.shadow && (
        <div className="space-y-2 pt-2 border-t border-blue-200">
          <p className="text-xs font-medium text-blue-700">그림자 설정</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">색상</label>
              <input
                type="color"
                value={effects.shadow.color}
                onChange={(e) =>
                  onUpdateEffects({
                    shadow: { ...effects.shadow!, color: e.target.value },
                  })
                }
                className="w-full h-8 rounded border border-gray-200 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">흐림 ({effects.shadow.blur}px)</label>
              <input
                type="range"
                min="0"
                max="20"
                value={effects.shadow.blur}
                onChange={(e) =>
                  onUpdateEffects({
                    shadow: { ...effects.shadow!, blur: Number(e.target.value) },
                  })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">X 오프셋 ({effects.shadow.offsetX}px)</label>
              <input
                type="range"
                min="-20"
                max="20"
                value={effects.shadow.offsetX}
                onChange={(e) =>
                  onUpdateEffects({
                    shadow: { ...effects.shadow!, offsetX: Number(e.target.value) },
                  })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Y 오프셋 ({effects.shadow.offsetY}px)</label>
              <input
                type="range"
                min="-20"
                max="20"
                value={effects.shadow.offsetY}
                onChange={(e) =>
                  onUpdateEffects({
                    shadow: { ...effects.shadow!, offsetY: Number(e.target.value) },
                  })
                }
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* 외곽선 세부 설정 */}
      {effects.stroke && (
        <div className="space-y-2 pt-2 border-t border-blue-200">
          <p className="text-xs font-medium text-blue-700">외곽선 설정</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">색상</label>
              <input
                type="color"
                value={typeof effects.stroke.color === 'string' ? effects.stroke.color : '#000000'}
                onChange={(e) =>
                  onUpdateEffects({
                    stroke: { ...effects.stroke!, color: e.target.value },
                  })
                }
                className="w-full h-8 rounded border border-gray-200 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">두께 ({effects.stroke.width}px)</label>
              <input
                type="range"
                min="1"
                max="10"
                value={effects.stroke.width}
                onChange={(e) =>
                  onUpdateEffects({
                    stroke: { ...effects.stroke!, width: Number(e.target.value) },
                  })
                }
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* 글로우 세부 설정 */}
      {effects.glow && (
        <div className="space-y-2 pt-2 border-t border-blue-200">
          <p className="text-xs font-medium text-blue-700">글로우 설정</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">색상</label>
              <input
                type="color"
                value={typeof effects.glow.color === 'string' ? effects.glow.color : '#FFFFFF'}
                onChange={(e) =>
                  onUpdateEffects({
                    glow: { ...effects.glow!, color: e.target.value },
                  })
                }
                className="w-full h-8 rounded border border-gray-200 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">흐림 ({effects.glow.blur}px)</label>
              <input
                type="range"
                min="1"
                max="30"
                value={effects.glow.blur}
                onChange={(e) =>
                  onUpdateEffects({
                    glow: { ...effects.glow!, blur: Number(e.target.value) },
                  })
                }
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 슬롯별 입력 그룹
 */
const SlotInputGroup = React.forwardRef<HTMLDivElement, {
  slot: ImageSlot
  fields: InputFieldConfig[]
  formData: Record<string, string | undefined>
  imageUrl: string | null
  onFieldChange: (key: string, value: string) => void
  onImageUpload: (file: File) => void
  onImageRemove: () => void
  onResetTransform?: () => void
  hasTransform?: boolean
  isExpanded: boolean
  onToggle: () => void
  isSelected?: boolean
  // Sprint 29: 이미지 편집 강화
  slotTransform?: SlotImageTransform
  onFlipX?: () => void
  onFlipY?: () => void
  onOpacityChange?: (opacity: number) => void
  onFiltersChange?: (filters: Partial<ImageFilters>) => void
}>(function SlotInputGroup({
  slot,
  fields,
  formData,
  imageUrl,
  onFieldChange,
  onImageUpload,
  onImageRemove,
  onResetTransform,
  hasTransform,
  isExpanded,
  onToggle,
  isSelected,
  slotTransform,
  onFlipX,
  onFlipY,
  onOpacityChange,
  onFiltersChange,
}, ref) {
  const imageField = fields.find((f) => f.type === 'image')
  const textFields = fields.filter((f) => f.type !== 'image')

  return (
    <div
      ref={ref}
      className={cn(
        'border rounded-xl overflow-hidden transition-colors',
        isSelected ? 'border-primary-400 ring-2 ring-primary-200' : 'border-gray-200'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`slot-content-${slot.id}`}
      >
        <span className="font-medium text-gray-700">{slot.name}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" aria-hidden="true" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
        )}
      </button>

      {isExpanded && (
        <div id={`slot-content-${slot.id}`} className="p-4 space-y-4">
          {imageField && (
            <ImageUploadField
              field={imageField}
              slot={slot}
              imageUrl={imageUrl}
              onUpload={onImageUpload}
              onRemove={onImageRemove}
            />
          )}

          {/* 이미지 위치 리셋 버튼 */}
          {imageUrl && hasTransform && onResetTransform && (
            <button
              onClick={onResetTransform}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              이미지 위치 초기화
            </button>
          )}

          {/* Sprint 29: 이미지 편집 강화 */}
          {imageUrl && (
            <div className="space-y-3 border-t border-gray-100 pt-3 mt-3">
              {/* 반전 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={onFlipX}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                    slotTransform?.flipX 
                      ? "bg-primary-100 text-primary-700 border border-primary-300" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                  title="좌우 반전"
                >
                  <FlipHorizontal className="w-4 h-4" />
                  좌우
                </button>
                <button
                  onClick={onFlipY}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                    slotTransform?.flipY 
                      ? "bg-primary-100 text-primary-700 border border-primary-300" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                  title="상하 반전"
                >
                  <FlipVertical className="w-4 h-4" />
                  상하
                </button>
              </div>

              {/* 투명도 슬라이더 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">투명도</label>
                  <span className="text-xs text-gray-500">
                    {Math.round((slotTransform?.opacity ?? 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((slotTransform?.opacity ?? 1) * 100)}
                  onChange={(e) => onOpacityChange?.(Number(e.target.value) / 100)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
              </div>

              {/* 필터 토글 */}
              <div className="flex gap-2">
                <button
                  onClick={() => onFiltersChange?.({ grayscale: !slotTransform?.filters?.grayscale })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                    slotTransform?.filters?.grayscale 
                      ? "bg-gray-700 text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                  title="흑백"
                >
                  <Contrast className="w-4 h-4" />
                  흑백
                </button>
                <button
                  onClick={() => onFiltersChange?.({ sepia: !slotTransform?.filters?.sepia })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                    slotTransform?.filters?.sepia 
                      ? "bg-amber-100 text-amber-700 border border-amber-300" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                  title="세피아"
                >
                  <SunMedium className="w-4 h-4" />
                  세피아
                </button>
              </div>

              {/* 밝기/대비 슬라이더 */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-600">밝기</label>
                    <span className="text-xs text-gray-500">
                      {slotTransform?.filters?.brightness ?? 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={slotTransform?.filters?.brightness ?? 0}
                    onChange={(e) => onFiltersChange?.({ brightness: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-600">대비</label>
                    <span className="text-xs text-gray-500">
                      {slotTransform?.filters?.contrast ?? 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={slotTransform?.filters?.contrast ?? 0}
                    onChange={(e) => onFiltersChange?.({ contrast: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {textFields.map((field) => (
            <TextInputField
              key={field.key}
              field={field}
              value={formData[field.key] || ''}
              onChange={(value) => onFieldChange(field.key, value)}
            />
          ))}
        </div>
      )}
    </div>
  )
})

/**
 * Sprint 31: 스티커 패널
 * 이미지 스티커만 지원 (이모지 배제)
 */
function StickerPanel({
  onAddSticker,
  stickers,
  selectedStickerId,
  onSelectSticker,
  onRemoveSticker,
}: {
  onAddSticker: (sticker: StickerType) => void
  stickers: StickerLayer[]
  selectedStickerId: string | null
  onSelectSticker: (id: string | null) => void
  onRemoveSticker: (id: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activePack, setActivePack] = useState<string>(ALL_STICKER_PACKS[0]?.id || '')

  const currentPack = ALL_STICKER_PACKS.find((p) => p.id === activePack)
  const searchResults = searchQuery.trim() ? searchStickers(searchQuery) : []

  const displayStickers = searchQuery.trim()
    ? searchResults
    : currentPack?.stickers || []

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="스티커 검색..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {/* 팩 선택 탭 */}
      {!searchQuery.trim() && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ALL_STICKER_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => setActivePack(pack.id)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors',
                activePack === pack.id
                  ? 'bg-primary-400 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {pack.name}
            </button>
          ))}
        </div>
      )}

      {/* 스티커 그리드 */}
      <div className="grid grid-cols-4 gap-2">
        {displayStickers.map((sticker) => (
          <button
            key={sticker.id}
            onClick={() => onAddSticker(sticker)}
            className="aspect-square flex items-center justify-center bg-gray-50 hover:bg-primary-50 rounded-xl transition-colors border border-gray-200 hover:border-primary-300 overflow-hidden"
            title={sticker.tags.join(', ')}
          >
            <img
              src={sticker.thumbnailUrl || sticker.imageUrl}
              alt={sticker.tags[0] || 'sticker'}
              className="w-full h-full object-contain p-1"
            />
          </button>
        ))}
      </div>

      {displayStickers.length === 0 && (
        <div className="text-center py-8">
          <Sticker className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">
            {searchQuery.trim() ? '검색 결과가 없습니다' : '스티커 준비 중입니다'}
          </p>
          <p className="text-gray-300 text-xs mt-1">
            곧 다양한 스티커가 추가됩니다
          </p>
        </div>
      )}

      {/* 배치된 스티커 목록 */}
      {stickers.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-xs font-medium text-gray-600 mb-2">배치된 스티커</h4>
          <div className="space-y-2">
            {stickers.map((sticker) => (
              <div
                key={sticker.id}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer',
                  selectedStickerId === sticker.id
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => onSelectSticker(sticker.id)}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={sticker.imageUrl}
                    alt="sticker"
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-xs text-gray-500">
                    {Math.round(sticker.transform.width)}×{Math.round(sticker.transform.height)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveSticker(sticker.id)
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="스티커 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// 메인 사이드바 컴포넌트
// ============================================

type Tab = 'slots' | 'general' | 'colors' | 'stickers'

interface EditorSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function EditorSidebar({ isOpen = true, onClose }: EditorSidebarProps) {
  const {
    templateConfig,
    formData,
    images,
    colors,
    slotTransforms,
    selectedSlotId,
    selectedTextId,
    selectedStickerId, // Sprint 31
    updateFormField,
    updateImage,
    updateColor,
    resetSlotTransform,
    toggleFlipX,
    toggleFlipY,
    setImageOpacity,
    setImageFilters,
    // Sprint 30: 텍스트 효과
    updateTextEffects,
    updateTextStyle,
    clearTextEffects,
    // Sprint 31: 스티커
    addSticker,
    removeSticker,
    selectSticker,
  } = useCanvasEditorStore()

  const [activeTab, setActiveTab] = useState<Tab>('slots')
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set())

  // 슬롯 섹션 refs
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // 버그 수정: 템플릿 변경 시 expandedSlots 동기화
  useEffect(() => {
    if (templateConfig?.layers.slots) {
      setExpandedSlots(new Set(templateConfig.layers.slots.map((s) => s.id)))
    }
  }, [templateConfig])

  // 슬롯 선택 시 자동 탭 전환 및 스크롤
  useEffect(() => {
    if (selectedSlotId && templateConfig) {
      // 슬롯 탭으로 전환
      setActiveTab('slots')

      // 해당 슬롯 펼치기
      setExpandedSlots((prev) => {
        const next = new Set(prev)
        next.add(selectedSlotId)
        return next
      })

      // 약간의 딜레이 후 스크롤 (DOM 업데이트 대기)
      setTimeout(() => {
        const slotElement = slotRefs.current[selectedSlotId]
        if (slotElement) {
          slotElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [selectedSlotId, templateConfig])

  // 텍스트 선택 시 해당 필드로 스크롤
  useEffect(() => {
    if (selectedTextId && templateConfig) {
      // 텍스트 ID로 입력 필드 찾기 (textId는 보통 field.key와 매핑됨)
      const field = templateConfig.inputFields.find(f => f.key === selectedTextId)

      if (field) {
        if (field.slotId) {
          // 슬롯에 속한 필드면 슬롯 탭으로 이동
          setActiveTab('slots')
          setExpandedSlots((prev) => {
            const next = new Set(prev)
            next.add(field.slotId!)
            return next
          })

          setTimeout(() => {
            const slotElement = slotRefs.current[field.slotId!]
            if (slotElement) {
              slotElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 100)
        } else {
          // 일반 텍스트 필드면 텍스트 탭으로 이동
          setActiveTab('general')
        }
      }
    }
  }, [selectedTextId, templateConfig])

  if (!templateConfig) {
    return (
      <aside
        className={cn(
          'bg-white border-l border-gray-200 flex items-center justify-center w-72',
          'fixed right-0 top-0 bottom-0 z-50',
          'md:relative md:z-0',
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        )}
      >
        <p className="text-gray-400 text-sm">템플릿을 불러오는 중...</p>
      </aside>
    )
  }

  const { layers, inputFields, colors: colorConfigs } = templateConfig

  // 슬롯별로 입력 필드 그룹화
  const slotFieldGroups = layers.slots.map((slot) => ({
    slot,
    fields: inputFields.filter((f) => f.slotId === slot.id),
  }))

  // 슬롯에 속하지 않은 일반 필드
  const generalFields = inputFields.filter(
    (f) => !f.slotId && f.type !== 'color'
  )

  const toggleSlotExpand = (slotId: string) => {
    setExpandedSlots((prev) => {
      const next = new Set(prev)
      if (next.has(slotId)) {
        next.delete(slotId)
      } else {
        next.add(slotId)
      }
      return next
    })
  }

  const handleImageUpload = (dataKey: string) => async (file: File) => {
    // 버그 수정: 기존 Object URL 해제 후 새로 생성 (메모리 누수 방지)
    const existingUrl = images[dataKey]
    if (existingUrl && existingUrl.startsWith('blob:')) {
      URL.revokeObjectURL(existingUrl)
    }
    const url = URL.createObjectURL(file)
    updateImage(dataKey, url)
  }

  const handleImageRemove = (dataKey: string) => () => {
    // 버그 수정: Object URL 해제 (메모리 누수 방지)
    const existingUrl = images[dataKey]
    if (existingUrl && existingUrl.startsWith('blob:')) {
      URL.revokeObjectURL(existingUrl)
    }
    updateImage(dataKey, null)
  }

  return (
    <>
      {/* 모바일 오버레이 백드롭 */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="editor-sidebar"
        className={cn(
          'bg-white border-l border-gray-200 flex flex-col h-full w-72',
          // 모바일: 오버레이 슬라이드 (기본 숨김)
          'fixed right-0 top-0 bottom-0 z-50 transition-transform duration-300',
          'md:relative md:z-0 md:translate-x-0 md:transition-none',
          // 모바일에서만 토글 적용
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        )}
        aria-label="편집 패널"
      >
        {/* 모바일 닫기 버튼 */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 left-3 p-2 text-gray-500 hover:bg-gray-100 rounded-lg md:hidden"
            aria-label="편집 패널 닫기"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}

        {/* 탭 헤더 */}
        <div className="flex border-b border-gray-200 pt-12 md:pt-0" role="tablist" aria-label="편집 옵션">
        {[
          { id: 'slots' as Tab, label: '캐릭터', icon: ImageIcon },
          { id: 'general' as Tab, label: '텍스트', icon: Type },
          { id: 'stickers' as Tab, label: '스티커', icon: Sticker }, // Sprint 31
          { id: 'colors' as Tab, label: '색상', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-primary-600 border-b-2 border-primary-400'
                  : 'text-gray-500 hover:text-gray-700'
              )}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 탭 내용 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 슬롯(캐릭터) 탭 */}
        {activeTab === 'slots' && (
          <div
            className="space-y-4"
            role="tabpanel"
            id="tabpanel-slots"
            aria-labelledby="tab-slots"
            data-tour="slot-panel"
          >
            {slotFieldGroups.map(({ slot, fields }) => {
              const slotTransform = slotTransforms[slot.id]
              const hasTransform = slotTransform && (
                slotTransform.x !== 0 ||
                slotTransform.y !== 0 ||
                slotTransform.scale !== 1 ||
                slotTransform.rotation !== 0
              )
              return (
                <SlotInputGroup
                  key={slot.id}
                  ref={(el) => { slotRefs.current[slot.id] = el }}
                  slot={slot}
                  fields={fields}
                  formData={formData}
                  imageUrl={images[slot.dataKey] || null}
                  onFieldChange={updateFormField}
                  onImageUpload={handleImageUpload(slot.dataKey)}
                  onImageRemove={handleImageRemove(slot.dataKey)}
                  onResetTransform={() => resetSlotTransform(slot.id)}
                  hasTransform={hasTransform}
                  isExpanded={expandedSlots.has(slot.id)}
                  onToggle={() => toggleSlotExpand(slot.id)}
                  isSelected={selectedSlotId === slot.id}
                  slotTransform={slotTransforms[slot.id]}
                  onFlipX={() => toggleFlipX(slot.id)}
                  onFlipY={() => toggleFlipY(slot.id)}
                  onOpacityChange={(opacity) => setImageOpacity(slot.id, opacity)}
                  onFiltersChange={(filters) => setImageFilters(slot.id, filters)}
                />
              )
            })}
          </div>
        )}

        {/* 일반 텍스트 탭 */}
        {activeTab === 'general' && (
          <div
            className="space-y-4"
            role="tabpanel"
            id="tabpanel-general"
            aria-labelledby="tab-general"
            data-tour="text-panel"
          >
            {/* Sprint 30: 선택된 텍스트 효과 패널 */}
            {selectedTextId && (() => {
              const selectedTextField = layers.texts.find((t) => t.id === selectedTextId)
              if (selectedTextField) {
                return (
                  <TextEffectsPanel
                    textField={selectedTextField}
                    onUpdateEffects={(effects) => updateTextEffects(selectedTextId, effects)}
                    onClearEffects={() => clearTextEffects(selectedTextId)}
                  />
                )
              }
              return null
            })()}

            {generalFields.length > 0 ? (
              generalFields.map((field) => (
                <TextInputField
                  key={field.key}
                  field={field}
                  value={formData[field.key] || ''}
                  onChange={(value) => updateFormField(field.key, value)}
                />
              ))
            ) : (
              <p className="text-center text-gray-400 text-sm py-8">
                일반 텍스트 필드가 없습니다
              </p>
            )}
          </div>
        )}

        {/* Sprint 31: 스티커 탭 */}
        {activeTab === 'stickers' && (
          <div
            role="tabpanel"
            id="tabpanel-stickers"
            aria-labelledby="tab-stickers"
          >
            <StickerPanel
              onAddSticker={(sticker) => {
                // 스티커를 캔버스 중앙에 추가
                const canvasWidth = templateConfig.canvas.width
                const canvasHeight = templateConfig.canvas.height
                const newSticker: StickerLayer = {
                  id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  stickerId: sticker.id,
                  imageUrl: sticker.imageUrl,
                  transform: {
                    x: canvasWidth / 2 - sticker.defaultSize.width / 2,
                    y: canvasHeight / 2 - sticker.defaultSize.height / 2,
                    width: sticker.defaultSize.width,
                    height: sticker.defaultSize.height,
                    rotation: 0,
                  },
                  opacity: 1,
                  flipX: false,
                  flipY: false,
                }
                addSticker(newSticker)
              }}
              stickers={templateConfig.layers.stickers || []}
              selectedStickerId={selectedStickerId}
              onSelectSticker={selectSticker}
              onRemoveSticker={removeSticker}
            />
          </div>
        )}

        {/* 색상 탭 */}
        {activeTab === 'colors' && (
          <div
            className="space-y-4"
            role="tabpanel"
            id="tabpanel-colors"
            aria-labelledby="tab-colors"
            data-tour="color-panel"
          >
            <p className="text-xs text-gray-500">
              테마 색상을 변경하면 템플릿 전체에 반영됩니다
            </p>
            {colorConfigs.map((config) => (
              <ColorPickerField
                key={config.key}
                config={config}
                value={colors[config.key] || config.defaultValue}
                onChange={(value) => updateColor(config.key, value)}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
    </>
  )
}
