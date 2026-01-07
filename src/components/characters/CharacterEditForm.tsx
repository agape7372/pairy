'use client'

/**
 * 캐릭터 편집 폼 컴포넌트
 * 페이지에서 직접 사용하는 전체 화면 폼
 * - 프로필 사진 업로드
 * - 3색 컬러 시스템 (머리색, 눈색, 메인컬러)
 * - 고급 컬러 피커 (HSV 스펙트럼 + HEX/RGB 입력)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  AlertCircle,
  Check,
  User,
  Sparkles,
  Camera,
  ChevronDown,
  Copy,
  Trash2,
  Save,
  Plus,
  X,
  Hash,
  MessageCircle,
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

interface CharacterEditFormProps {
  character?: Character | null
  onSave: (data: CreateCharacterInput | UpdateCharacterInput) => Promise<Character | boolean | null>
  onDelete?: () => Promise<boolean>
  onDuplicate?: () => Promise<Character | null>
  isSaving: boolean
  isDeleting?: boolean
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
    englishName: '',
    age: '',
    height: '',
    weight: '',
    catchphrase: '',
    features: [],
    tags: [],
  },
}

// ============================================
// 태그 입력 컴포넌트 (특징, 키워드용)
// ============================================

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  prefix?: string
  disabled?: boolean
}

function TagInput({
  value,
  onChange,
  placeholder = '입력 후 Enter',
  maxTags = 10,
  prefix,
  disabled,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // 입력값이 없을 때 백스페이스 누르면 마지막 태그 삭제
      removeTag(value.length - 1)
    }
  }

  const addTag = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    if (value.length >= maxTags) return
    if (value.includes(trimmed)) {
      setInputValue('')
      return
    }
    onChange([...value, trimmed])
    setInputValue('')
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[48px] cursor-text',
        'focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <motion.span
          key={`${tag}-${index}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-full',
            prefix === '#'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-200 text-gray-700'
          )}
        >
          {prefix && <span className="text-xs opacity-60">{prefix}</span>}
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(index)
              }}
              className="ml-0.5 p-0.5 hover:bg-black/10 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </motion.span>
      ))}

      {value.length < maxTags && !disabled && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] bg-transparent outline-none text-sm placeholder:text-gray-400"
          disabled={disabled}
        />
      )}

      {value.length >= maxTags && (
        <span className="text-xs text-gray-400">최대 {maxTags}개</span>
      )}
    </div>
  )
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
            <div className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
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
// 메인 폼 컴포넌트
// ============================================

export function CharacterEditForm({
  character,
  onSave,
  onDelete,
  onDuplicate,
  isSaving,
  isDeleting = false,
  validationError,
}: CharacterEditFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const isEditMode = !!character

  // 초기 데이터 로드
  useEffect(() => {
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
          englishName: metadata?.englishName || '',
          birthday: metadata?.birthday,
          age: metadata?.age || '',
          height: metadata?.height || '',
          weight: metadata?.weight || '',
          catchphrase: metadata?.catchphrase || '',
          features: metadata?.features || [],
          tags: metadata?.tags || [],
        },
      })
    } else {
      setFormData(initialFormData)
    }
    setErrors({})
    setHasChanges(false)

    // 자동 포커스 (새 캐릭터일 때만)
    if (!character) {
      setTimeout(() => nameInputRef.current?.focus(), 100)
    }
  }, [character])

  // 필드 업데이트
  const updateField = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setHasChanges(true)
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
    setHasChanges(true)
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
      router.push('/my/characters')
    }
  }

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!onDelete) return
    const success = await onDelete()
    if (success) {
      router.push('/my/characters')
    }
  }

  // 복제 핸들러
  const handleDuplicate = async () => {
    if (!onDuplicate) return
    const newCharacter = await onDuplicate()
    if (newCharacter) {
      router.push(`/my/characters/${newCharacter.id}`)
    }
  }

  // 뒤로가기
  const handleBack = () => {
    if (hasChanges) {
      if (confirm('변경사항이 저장되지 않았습니다. 정말 나가시겠어요?')) {
        router.push('/my/characters')
      }
    } else {
      router.push('/my/characters')
    }
  }

  const isDisabled = isSaving || isUploading || isDeleting

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>돌아가기</span>
        </button>

        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-400" />
          {isEditMode ? '캐릭터 수정' : '새 캐릭터'}
        </h1>

        <div className="w-20" /> {/* 균형을 위한 빈 공간 */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 프로필 사진 업로드 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
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
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">기본 정보</h2>

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
        </div>

        {/* 컬러 설정 섹션 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            캐릭터 컬러
          </h2>

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

        {/* 추가 정보 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            추가 정보 (선택)
          </h2>

          {/* 영문명 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              영문명
            </label>
            <Input
              value={formData.metadata.englishName || ''}
              onChange={(e) => updateMetadata('englishName', e.target.value)}
              placeholder="English Name"
              className="text-sm"
              disabled={isDisabled}
            />
          </div>

          {/* 한마디 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              한마디
            </label>
            <Input
              value={formData.metadata.catchphrase || ''}
              onChange={(e) => updateMetadata('catchphrase', e.target.value)}
              placeholder="대표 대사나 좌우명"
              className="text-sm"
              disabled={isDisabled}
            />
          </div>

          {/* 나이, 키, 몸무게 - 한 줄에 배치 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                나이
              </label>
              <Input
                value={formData.metadata.age || ''}
                onChange={(e) => updateMetadata('age', e.target.value)}
                placeholder="예: 20"
                className="text-sm"
                disabled={isDisabled}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                키
              </label>
              <Input
                value={formData.metadata.height || ''}
                onChange={(e) => updateMetadata('height', e.target.value)}
                placeholder="예: 170cm"
                className="text-sm"
                disabled={isDisabled}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                몸무게
              </label>
              <Input
                value={formData.metadata.weight || ''}
                onChange={(e) => updateMetadata('weight', e.target.value)}
                placeholder="예: 60kg"
                className="text-sm"
                disabled={isDisabled}
              />
            </div>
          </div>

          {/* 생일 */}
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

          {/* 특징 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Plus className="w-3 h-3" />
              특징
            </label>
            <TagInput
              value={formData.metadata.features || []}
              onChange={(tags) => updateMetadata('features', tags)}
              placeholder="특징 입력 후 Enter (예: 긴 머리)"
              maxTags={10}
              disabled={isDisabled}
            />
            <p className="text-xs text-gray-400 mt-1">
              캐릭터의 외형이나 성격적 특징
            </p>
          </div>

          {/* 키워드/태그 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              키워드
            </label>
            <TagInput
              value={formData.metadata.tags || []}
              onChange={(tags) => updateMetadata('tags', tags)}
              placeholder="키워드 입력 후 Enter"
              maxTags={15}
              prefix="#"
              disabled={isDisabled}
            />
            <p className="text-xs text-gray-400 mt-1">
              검색이나 분류에 사용할 태그
            </p>
          </div>
        </div>

        {/* 유효성 검증 에러 */}
        {validationError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <p className="text-sm text-error">{validationError}</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* 삭제/복제 버튼 (편집 모드일 때만) */}
          {isEditMode && (
            <div className="flex gap-2">
              {onDelete && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDisabled}
                  className="text-error hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              {onDuplicate && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDuplicate}
                  disabled={isDisabled}
                  title="캐릭터 복제"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          <div className="flex-1 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={isDisabled}
              className="flex-1 sm:flex-none"
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
                  <Save className="w-4 h-4 mr-1" />
                  {isEditMode ? '저장' : '캐릭터 만들기'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* 삭제 확인 대화상자 */}
      <AnimatePresence>
        {showDeleteConfirm && character && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
              onClick={() => !isDeleting && setShowDeleteConfirm(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[24px] shadow-xl p-6 z-[100]"
            >
              <div className="text-center mb-6">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: character.color }}
                >
                  {character.name[0]?.toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  캐릭터를 삭제할까요?
                </h3>
                <p className="text-sm text-gray-500">
                  <strong className="text-gray-700">{character.name}</strong>을(를)
                  삭제하면 되돌릴 수 없어요.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  isLoading={isDeleting}
                  className="flex-1 bg-error hover:bg-red-600"
                >
                  삭제
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CharacterEditForm
