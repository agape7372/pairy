'use client'

/**
 * 캐릭터 편집 모달
 * 캐릭터 생성 및 수정 폼 제공
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Loader2,
  Upload,
  Palette,
  AlertCircle,
  Check,
  Globe,
  User,
  Heart,
  Sparkles,
} from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import type {
  Character,
  CharacterMetadata,
} from '@/types/database.types'
import type { CreateCharacterInput, UpdateCharacterInput } from '@/hooks/useCharacters'
import {
  CHARACTER_NAME_MAX_LENGTH,
  CHARACTER_DESCRIPTION_MAX_LENGTH,
  WORLD_NAME_MAX_LENGTH,
} from '@/types/database.types'
import { CHARACTER_COLORS } from '@/hooks/useCharacters'

// MBTI 옵션
const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const

// 혈액형 옵션
const BLOOD_TYPES = ['A', 'B', 'O', 'AB'] as const

interface CharacterEditModalProps {
  isOpen: boolean
  onClose: () => void
  character?: Character | null // null이면 생성 모드, 있으면 편집 모드
  onSave: (data: CreateCharacterInput | UpdateCharacterInput) => Promise<Character | boolean | null>
  isSaving: boolean
  existingWorldNames?: string[]
  validationError?: string | null
}

interface FormData {
  name: string
  color: string
  description: string
  world_name: string
  avatar_url: string
  metadata: CharacterMetadata
}

const initialFormData: FormData = {
  name: '',
  color: CHARACTER_COLORS[0],
  description: '',
  world_name: '',
  avatar_url: '',
  metadata: {},
}

export function CharacterEditModal({
  isOpen,
  onClose,
  character,
  onSave,
  isSaving,
  existingWorldNames = [],
  validationError,
}: CharacterEditModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showMbtiPicker, setShowMbtiPicker] = useState(false)
  const [showWorldSuggestions, setShowWorldSuggestions] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const isEditMode = !!character

  // 모달 열릴 때 폼 데이터 초기화
  useEffect(() => {
    if (isOpen) {
      if (character) {
        const metadata = character.metadata as CharacterMetadata | null
        setFormData({
          name: character.name,
          color: character.color,
          description: character.description || '',
          world_name: character.world_name || '',
          avatar_url: character.avatar_url || '',
          metadata: metadata || {},
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

    if (formData.world_name.length > WORLD_NAME_MAX_LENGTH) {
      newErrors.world_name = `세계관 이름은 ${WORLD_NAME_MAX_LENGTH}자 이내로 입력해주세요`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // 저장 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const saveData: CreateCharacterInput | UpdateCharacterInput = {
      name: formData.name.trim(),
      color: formData.color,
      description: formData.description.trim() || null,
      world_name: formData.world_name.trim() || null,
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

  return (
    <>
      {/* 배경 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={isSaving ? undefined : onClose}
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
              disabled={isSaving}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* 아바타 & 색상 프리뷰 */}
            <div className="flex items-center gap-4">
              {/* 아바타 프리뷰 */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white cursor-pointer hover:ring-primary-100 transition-all"
                style={{
                  backgroundColor: formData.avatar_url ? undefined : formData.color,
                  backgroundImage: formData.avatar_url ? `url(${formData.avatar_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              >
                {!formData.avatar_url && (
                  formData.name[0]?.toUpperCase() || <User className="w-10 h-10" />
                )}
              </div>

              {/* 색상 선택 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  색상 선택
                </label>
                <div className="flex flex-wrap gap-2">
                  {CHARACTER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateField('color', color)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        formData.color === color
                          ? 'ring-2 ring-offset-2 ring-primary-400 scale-110'
                          : 'hover:scale-110'
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`색상 ${color}`}
                    />
                  ))}
                </div>
              </div>
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
                disabled={isSaving}
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

            {/* 세계관 입력 */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                세계관
              </label>
              <Input
                value={formData.world_name}
                onChange={(e) => {
                  updateField('world_name', e.target.value)
                  setShowWorldSuggestions(true)
                }}
                onFocus={() => setShowWorldSuggestions(true)}
                onBlur={() => setTimeout(() => setShowWorldSuggestions(false), 200)}
                placeholder="캐릭터가 속한 세계관 (선택사항)"
                maxLength={WORLD_NAME_MAX_LENGTH}
                error={!!errors.world_name}
                disabled={isSaving}
              />

              {/* 세계관 자동완성 */}
              <AnimatePresence>
                {showWorldSuggestions && existingWorldNames.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto"
                  >
                    {existingWorldNames
                      .filter((w) =>
                        w.toLowerCase().includes(formData.world_name.toLowerCase())
                      )
                      .map((worldName) => (
                        <button
                          key={worldName}
                          type="button"
                          onClick={() => {
                            updateField('world_name', worldName)
                            setShowWorldSuggestions(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Globe className="w-4 h-4 text-gray-400" />
                          {worldName}
                        </button>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {errors.world_name && (
                <span className="text-xs text-error flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.world_name}
                </span>
              )}
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
                disabled={isSaving}
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

            {/* 추가 정보 섹션 */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary-400" />
                추가 정보 (선택사항)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* MBTI */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    MBTI
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMbtiPicker(!showMbtiPicker)}
                    className={cn(
                      'w-full px-3 py-2 text-sm text-left bg-white border border-gray-200 rounded-lg',
                      'hover:border-primary-200 transition-colors',
                      formData.metadata.mbti ? 'text-gray-900' : 'text-gray-400'
                    )}
                  >
                    {formData.metadata.mbti || 'MBTI 선택'}
                  </button>

                  <AnimatePresence>
                    {showMbtiPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-2 grid grid-cols-4 gap-1"
                      >
                        {MBTI_TYPES.map((mbti) => (
                          <button
                            key={mbti}
                            type="button"
                            onClick={() => {
                              updateMetadata('mbti', mbti)
                              setShowMbtiPicker(false)
                            }}
                            className={cn(
                              'px-2 py-1.5 text-xs rounded-lg transition-colors',
                              formData.metadata.mbti === mbti
                                ? 'bg-primary-100 text-primary-600 font-medium'
                                : 'hover:bg-gray-100'
                            )}
                          >
                            {mbti}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 혈액형 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    혈액형
                  </label>
                  <div className="flex gap-1">
                    {BLOOD_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateMetadata('bloodType', type)}
                        className={cn(
                          'flex-1 py-2 text-xs rounded-lg border transition-colors',
                          formData.metadata.bloodType === type
                            ? 'bg-primary-100 border-primary-300 text-primary-600 font-medium'
                            : 'border-gray-200 hover:border-primary-200'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 생일 */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    생일
                  </label>
                  <Input
                    type="date"
                    value={formData.metadata.birthday || ''}
                    onChange={(e) => updateMetadata('birthday', e.target.value)}
                    className="text-sm"
                    disabled={isSaving}
                  />
                </div>
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
              disabled={isSaving}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !formData.name.trim()}
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
