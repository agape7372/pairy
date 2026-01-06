'use client'

/**
 * Sprint 33: 캐릭터 선택/적용 UI 컴포넌트
 *
 * 사용자가 에디터에서 캐릭터를 선택하고 퍼스널 컬러를 적용할 수 있는 UI
 */

import { useState, useCallback } from 'react'
import { User, ChevronDown, ChevronUp, Check, X, Palette, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useCharacters } from '@/hooks/useCharacters'
import {
  useSelectedCharacter,
  useCharacterColors,
  useApplyCharacter,
  useClearCharacter,
} from '@/stores/canvasEditorStore'
import type { Character } from '@/types/database.types'
import { CHARACTER_COLOR_LABELS } from '@/lib/utils/characterColors'

interface CharacterSelectorProps {
  /** 컴팩트 모드 (색상 팔레트 숨김) */
  compact?: boolean
  /** 클래스명 추가 */
  className?: string
}

/**
 * 캐릭터 아바타 컴포넌트
 */
function CharacterAvatar({
  character,
  size = 'md',
  selected = false,
}: {
  character: Character
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  return (
    <div
      className={cn(
        'rounded-full overflow-hidden ring-2 transition-all',
        sizeClasses[size],
        selected
          ? 'ring-primary-400 ring-offset-2'
          : 'ring-gray-200 hover:ring-gray-300'
      )}
      style={{ backgroundColor: character.color || '#E5E7EB' }}
    >
      {character.avatar_url ? (
        <img
          src={character.avatar_url}
          alt={character.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <User className="w-1/2 h-1/2 text-white/80" />
        </div>
      )}
    </div>
  )
}

/**
 * 캐릭터 컬러 미리보기
 */
function CharacterColorPreview({
  hairColor,
  eyeColor,
  themeColor,
}: {
  hairColor?: string | null
  eyeColor?: string | null
  themeColor?: string | null
}) {
  const colors = [
    { key: 'hairColor', label: '머리', color: hairColor },
    { key: 'eyeColor', label: '눈', color: eyeColor },
    { key: 'themeColor', label: '테마', color: themeColor },
  ].filter((c) => c.color)

  if (colors.length === 0) return null

  return (
    <div className="flex gap-1.5">
      {colors.map((c) => (
        <div
          key={c.key}
          className="w-5 h-5 rounded-full border border-white shadow-sm"
          style={{ backgroundColor: c.color || '#E5E7EB' }}
          title={`${c.label}색`}
        />
      ))}
    </div>
  )
}

/**
 * 캐릭터 선택 드롭다운
 */
export function CharacterSelector({ compact = false, className }: CharacterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { characters, isLoading } = useCharacters()
  const selectedCharacter = useSelectedCharacter()
  const characterColors = useCharacterColors()
  const applyCharacter = useApplyCharacter()
  const clearCharacter = useClearCharacter()

  const handleSelect = useCallback(
    (character: Character) => {
      applyCharacter(character)
      setIsOpen(false)
    },
    [applyCharacter]
  )

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      clearCharacter()
    },
    [clearCharacter]
  )

  return (
    <div className={cn('relative', className)}>
      {/* 선택 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors',
          selectedCharacter
            ? 'border-primary-300 bg-primary-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-3">
          {selectedCharacter ? (
            <>
              <CharacterAvatar character={selectedCharacter} size="md" selected />
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">
                  {selectedCharacter.name}
                </p>
                {!compact && characterColors && (
                  <CharacterColorPreview
                    hairColor={characterColors.hairColor}
                    eyeColor={characterColors.eyeColor}
                    themeColor={characterColors.themeColor}
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-gray-500 text-sm">캐릭터 선택</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedCharacter && (
            <button
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="캐릭터 선택 해제"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* 드롭다운 목록 */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
            role="listbox"
          >
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <RefreshCw className="w-5 h-5 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">불러오는 중...</p>
              </div>
            ) : characters.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-1">캐릭터가 없습니다</p>
                <p className="text-xs text-gray-400">
                  마이페이지에서 캐릭터를 먼저 만들어주세요
                </p>
              </div>
            ) : (
              <ul className="py-2">
                {characters.map((character) => {
                  const isSelected = selectedCharacter?.id === character.id
                  const metadata = character.metadata as Record<string, string> | null

                  return (
                    <li key={character.id}>
                      <button
                        onClick={() => handleSelect(character)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors',
                          isSelected && 'bg-primary-50'
                        )}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <CharacterAvatar
                          character={character}
                          size="md"
                          selected={isSelected}
                        />
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900 text-sm">
                            {character.name}
                          </p>
                          <CharacterColorPreview
                            hairColor={metadata?.hairColor}
                            eyeColor={metadata?.eyeColor}
                            themeColor={metadata?.mainColor}
                          />
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-primary-500" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * 캐릭터 컬러 편집 패널
 * 선택된 캐릭터의 색상을 개별적으로 수정할 수 있음
 */
export function CharacterColorPanel({ className }: { className?: string }) {
  const selectedCharacter = useSelectedCharacter()
  const characterColors = useCharacterColors()

  if (!selectedCharacter || !characterColors) {
    return null
  }

  const colorItems = [
    {
      key: 'hairColor' as const,
      label: CHARACTER_COLOR_LABELS.hairColor,
      color: characterColors.hairColor,
      colorRef: 'characterHairColor',
    },
    {
      key: 'eyeColor' as const,
      label: CHARACTER_COLOR_LABELS.eyeColor,
      color: characterColors.eyeColor,
      colorRef: 'characterEyeColor',
    },
    {
      key: 'themeColor' as const,
      label: CHARACTER_COLOR_LABELS.themeColor,
      color: characterColors.themeColor,
      colorRef: 'characterThemeColor',
    },
  ]

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Palette className="w-4 h-4" />
        <span>캐릭터 퍼스널 컬러</span>
      </div>

      <div className="space-y-2">
        {colorItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg"
          >
            <div
              className="w-6 h-6 rounded-full border border-gray-200"
              style={{ backgroundColor: item.color || '#E5E7EB' }}
            />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600">{item.label}</p>
              <p className="text-xs text-gray-400 font-mono">
                {item.color || '미설정'}
              </p>
            </div>
            <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {item.colorRef}
            </code>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        템플릿에서 위 변수를 사용하면 캐릭터 색상이 자동 적용됩니다
      </p>
    </div>
  )
}

/**
 * 캐릭터 선택 섹션 (선택기 + 컬러 패널 통합)
 */
export function CharacterSection({ className }: { className?: string }) {
  const selectedCharacter = useSelectedCharacter()

  return (
    <div className={cn('space-y-4', className)}>
      <CharacterSelector />
      {selectedCharacter && <CharacterColorPanel />}
    </div>
  )
}

export default CharacterSelector
