'use client'

/**
 * 캐릭터 편집 모달
 * 캐릭터 생성 및 수정 폼 제공
 * - 프로필 사진 업로드
 * - 3색 컬러 시스템 (머리색, 눈색, 메인컬러)
 * - 고급 컬러 피커 (HSV 스펙트럼 + HEX/RGB 입력)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  AlertCircle,
  Check,
  User,
  Sparkles,
  Camera,
  ChevronDown,
} from 'lucide-react'
import { Button, Input, ImageUpload, ColorPicker } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { uploadFile } from '@/lib/supabase/storage'
import { addRecentColor } from '@/lib/utils/color'
import type {
  Character,
  CharacterMetadata,
} from '@/types/database.types'
import type { CreateCharacterInput, UpdateCharacterInput } from '@/hooks/useCharacters'
import {
  CHARACTER_NAME_MAX_LENGTH,
  CHARACTER_DESCRIPTION_MAX_LENGTH,
} from '@/types/database.types'

// 컬러별 프리셋
const COLOR_PRESETS = {
  hair: ['#2C1810', '#4A3728', '#8B4513', '#D4A574', '#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6', '#1ABC9C', '#E74C3C', '#3498DB', '#E91E63'],
  eye: ['#2C1810', '#4A3728', '#3498DB', '#27AE60', '#8E44AD', '#E74C3C', '#F39C12', '#1ABC9C', '#95A5A6', '#34495E', '#9C27B0', '#00BCD4'],
  main: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#F8B500', '#98D8C8', '#FF85A2', '#7C73E6', '#6C5CE7', '#00B894'],
}

interface CharacterEditModalProps {
  isOpen: boolean
  onClose: () => void
  character?: Character | null
  onSave: (data: CreateCharacterInput | UpdateCharacterInput) => Promise<Character | boolean | null>
  isSaving: boolean
  validationError?: string | null
}

interface FormData {
  name: string
  description: string
  avatar_url: string
  metadata: CharacterMetadata
}

const initialFormData: FormData = {
  name: '',
  description: '',
  avatar_url: '',
  metadata: {
    hairColor: '#4A3728',
    eyeColor: '#4A3728',
    mainColor: '#FF6B6B',
  },
}

// ============================================
// 확장형 컬러 피커 컴포넌트
// ============================================

interface ExpandableColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  presets: string[]
  disabled?: boolean
}

function ExpandableColorPicker({
  label,
  value,
  onChange,
  presets,
  disabled,
}: ExpandableColorPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isExpanded])

  const handleColorChange = useCallback((color: string) => {
    onChange(color)
    addRecentColor(color)
  }, [onChange])

  return (
    <div ref={containerRef} className="space-y-2">
      {/* 헤더: 라벨 + 미리보기 + 토글 */}
      <button
        type="button"
        onClick={() => !disabled && setIsExpanded(!isExpanded)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between p-3 rounded-xl border border-gray-200',
          'transition-all hover:border-primary-300 hover:bg-gray-50',
          isExpanded && 'border-primary-400 bg-primary-50/30',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-3">
          {/* 색상 미리보기 */}
          <div
            className="w-8 h-8 rounded-lg border border-gray-200 shadow-inner"
            style={{ backgroundColor: value }}
          />
          <div className="text-left">
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs font-mono text-gray-400">{value.toUpperCase()}</p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-400 transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* 확장된 컬러 피커 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <ColorPicker
                value={value}
                onChange={handleColorChange}
                disabled={disabled}
                presetColors={presets}
                showRecentColors={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// 메인 모달 컴포넌트
// ============================================

export function CharacterEditModal({
  isOpen,
  onClose,
  character,
  onSave,
  isSaving,
  validationError,
}: CharacterEditModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isUploading, setIsUploading] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const isEditMode = !!character

  // 모달 열릴 때 폼 데이터 초기화
  useEffect(() => {
    if (isOpen) {
      if (character) {
        const metadata = character.metadata as CharacterMetadata | null
        setFormData({
          name: character.name,
          description: character.description || '',
          avatar_url: character.avatar_url || '',
          metadata: {
            hairColor: metadata?.hairColor || character.color || '#4A3728',
            eyeColor: metadata?.eyeColor || '#4A3728',
            mainColor: metadata?.mainColor || character.color || '#FF6B6B',
            birthday: metadata?.birthday,
          },
        })
      } else {
        setFormData(initialFormData)
      }
      setErrors({})

      // 자동 포커스
      setTimeout(() => nameInputRef.current?.focus(), 100)
    }
  }, [isOpen, character])

  // 필드 업데이트
  const updateField = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  // 메타데이터 업데이트
  const updateMetadata = useCallback(<K extends keyof CharacterMetadata>(
    key: K,
    value: CharacterMetadata[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [key]: value },
    }))
  }, [])

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true)
    try {
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop() || 'jpg'
      const path = `characters/${timestamp}.${fileExt}`

      const result = await uploadFile({
        bucket: 'avatars',
        path,
        file,
        upsert: true,
      })

      if (result.error) {
        throw result.error
      }

      return result.url
    } catch (err) {
      console.error('Image upload error:', err)
      return null
    } finally {
      setIsUploading(false)
    }
  }, [])

  // 유효성 검증
  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = '캐릭터 이름을 입력해주세요'
    } else if (formData.name.length > CHARACTER_NAME_MAX_LENGTH) {
      newErrors.name = `이름은 ${CHARACTER_NAME_MAX_LENGTH}자 이내로 입력해주세요`
    }

    if (formData.description.length > CHARACTER_DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `설명은 ${CHARACTER_DESCRIPTION_MAX_LENGTH}자 이내로 입력해주세요`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // 저장 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    // 최근 색상에 추가
    if (formData.metadata.hairColor) addRecentColor(formData.metadata.hairColor)
    if (formData.metadata.eyeColor) addRecentColor(formData.metadata.eyeColor)
    if (formData.metadata.mainColor) addRecentColor(formData.metadata.mainColor)

    const saveData: CreateCharacterInput | UpdateCharacterInput = {
      name: formData.name.trim(),
      color: formData.metadata.mainColor || '#FF6B6B',
      description: formData.description.trim() || null,
      avatar_url: formData.avatar_url.trim() || null,
      metadata: formData.metadata,
    }

    const result = await onSave(saveData)
    if (result) {
      onClose()
    }
  }

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, onClose])

  if (!isOpen) return null

  const isDisabled = isSaving || isUploading

  return (
    <>
      {/* 배경 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={isDisabled ? undefined : onClose}
      />

      {/* 모달 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-[24px] shadow-xl z-50"
      >
        <form onSubmit={handleSubmit}>
          {/* 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-[24px] z-10">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-400" />
              {isEditMode ? '캐릭터 수정' : '새 캐릭터 만들기'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isDisabled}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* 프로필 사진 업로드 */}
            <div className="flex flex-col items-center gap-3">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                <Camera className="w-4 h-4" />
                프로필 사진
              </label>

              <div className="relative">
                <ImageUpload
                  value={formData.avatar_url || null}
                  onChange={(url) => updateField('avatar_url', url || '')}
                  onUpload={handleImageUpload}
                  shape="circle"
                  size="lg"
                  placeholder="사진 추가"
                  disabled={isDisabled}
                />

                {/* 사진이 없을 때 기본 아바타 표시 */}
                {!formData.avatar_url && (
                  <div
                    className="absolute inset-0 rounded-full flex items-center justify-center text-white text-4xl font-bold pointer-events-none"
                    style={{ backgroundColor: formData.metadata.mainColor || '#FF6B6B' }}
                  >
                    {formData.name[0]?.toUpperCase() || <User className="w-12 h-12" />}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400">
                JPG, PNG, GIF (최대 5MB)
              </p>
            </div>

            {/* 이름 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-error">*</span>
              </label>
              <Input
                ref={nameInputRef}
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="캐릭터 이름을 입력하세요"
                maxLength={CHARACTER_NAME_MAX_LENGTH}
                error={!!errors.name}
                disabled={isDisabled}
              />
              <div className="flex justify-between mt-1">
                {errors.name ? (
                  <span className="text-xs text-error flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </span>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">
                  {formData.name.length}/{CHARACTER_NAME_MAX_LENGTH}
                </span>
              </div>
            </div>

            {/* 설명 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                소개
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="캐릭터 소개를 입력하세요 (선택사항)"
                maxLength={CHARACTER_DESCRIPTION_MAX_LENGTH}
                rows={3}
                disabled={isDisabled}
                className={cn(
                  'w-full px-4 py-2.5 text-base bg-white border rounded-xl resize-none',
                  'transition-all duration-200 placeholder:text-gray-400',
                  'focus:outline-none focus:border-transparent',
                  'focus:ring-2 focus:ring-primary-200',
                  'focus:shadow-[0_0_0_3px_rgba(255,217,217,0.3),0_0_12px_rgba(255,180,180,0.2)]',
                  errors.description ? 'border-error' : 'border-gray-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50'
                )}
              />
              <div className="flex justify-between mt-1">
                {errors.description && (
                  <span className="text-xs text-error flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.description}
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {formData.description.length}/{CHARACTER_DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
            </div>

            {/* 컬러 설정 섹션 */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">
                캐릭터 컬러
              </h3>

              <div className="space-y-3">
                {/* 머리색 */}
                <ExpandableColorPicker
                  label="머리색"
                  value={formData.metadata.hairColor || '#4A3728'}
                  onChange={(color) => updateMetadata('hairColor', color)}
                  presets={COLOR_PRESETS.hair}
                  disabled={isDisabled}
                />

                {/* 눈색 */}
                <ExpandableColorPicker
                  label="눈색"
                  value={formData.metadata.eyeColor || '#4A3728'}
                  onChange={(color) => updateMetadata('eyeColor', color)}
                  presets={COLOR_PRESETS.eye}
                  disabled={isDisabled}
                />

                {/* 메인 컬러 */}
                <ExpandableColorPicker
                  label="메인 컬러 (테마색)"
                  value={formData.metadata.mainColor || '#FF6B6B'}
                  onChange={(color) => updateMetadata('mainColor', color)}
                  presets={COLOR_PRESETS.main}
                  disabled={isDisabled}
                />
              </div>
            </div>

            {/* 생일 (선택) */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">
                추가 정보 (선택)
              </h3>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  생일
                </label>
                <Input
                  type="date"
                  value={formData.metadata.birthday || ''}
                  onChange={(e) => updateMetadata('birthday', e.target.value)}
                  className="text-sm"
                  disabled={isDisabled}
                />
              </div>
            </div>

            {/* 유효성 검증 에러 */}
            {validationError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <p className="text-sm text-error">{validationError}</p>
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-[24px]">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isDisabled}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isDisabled || !formData.name.trim()}
              isLoading={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                '저장 중...'
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  {isEditMode ? '수정 완료' : '캐릭터 만들기'}
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </>
  )
}

export default CharacterEditModal
