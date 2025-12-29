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
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useCanvasEditorStore } from '@/stores/canvasEditorStore'
import type { InputFieldConfig, ImageSlot, ColorConfig } from '@/types/template'

// ============================================
// 서브 컴포넌트
// ============================================

/**
 * 텍스트 입력 필드
 */
function TextInputField({
  field,
  value,
  onChange,
}: {
  field: InputFieldConfig
  value: string
  onChange: (value: string) => void
}) {
  if (field.type === 'textarea') {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <textarea
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
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
    </div>
  )
}

/**
 * 이미지 업로드 필드
 */
function ImageUploadField({
  field,
  slot,
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

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-600">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {imageUrl ? (
        <div className="relative group">
          <img
            src={imageUrl}
            alt={field.label}
            className="w-full h-32 object-cover rounded-xl border border-gray-200"
          />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
        >
          <Upload className="w-6 h-6" />
          <span className="text-xs">클릭하여 업로드</span>
        </button>
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
 * 슬롯별 입력 그룹
 */
function SlotInputGroup({
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
}: {
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
}) {
  const imageField = fields.find((f) => f.type === 'image')
  const textFields = fields.filter((f) => f.type !== 'image')

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-700">{slot.name}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
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
}

// ============================================
// 메인 사이드바 컴포넌트
// ============================================

type Tab = 'slots' | 'general' | 'colors'

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
    updateFormField,
    updateImage,
    updateColor,
    resetSlotTransform,
  } = useCanvasEditorStore()

  const [activeTab, setActiveTab] = useState<Tab>('slots')
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set())

  // 버그 수정: 템플릿 변경 시 expandedSlots 동기화
  useEffect(() => {
    if (templateConfig?.layers.slots) {
      setExpandedSlots(new Set(templateConfig.layers.slots.map((s) => s.id)))
    }
  }, [templateConfig])

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
        className={cn(
          'bg-white border-l border-gray-200 flex flex-col h-full w-72',
          // 모바일: 오버레이 슬라이드 (기본 숨김)
          'fixed right-0 top-0 bottom-0 z-50 transition-transform duration-300',
          'md:relative md:z-0 md:translate-x-0 md:transition-none',
          // 모바일에서만 토글 적용
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        )}
      >
        {/* 모바일 닫기 버튼 */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 left-3 p-2 text-gray-500 hover:bg-gray-100 rounded-lg md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* 탭 헤더 */}
        <div className="flex border-b border-gray-200 pt-12 md:pt-0">
        {[
          { id: 'slots' as Tab, label: '캐릭터', icon: ImageIcon },
          { id: 'general' as Tab, label: '텍스트', icon: Type },
          { id: 'colors' as Tab, label: '색상', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-400'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 탭 내용 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 슬롯(캐릭터) 탭 */}
        {activeTab === 'slots' && (
          <div className="space-y-4">
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
                />
              )
            })}
          </div>
        )}

        {/* 일반 텍스트 탭 */}
        {activeTab === 'general' && (
          <div className="space-y-4">
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

        {/* 색상 탭 */}
        {activeTab === 'colors' && (
          <div className="space-y-4">
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
