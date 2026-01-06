'use client'

/**
 * 캐릭터 선택 컴포넌트
 * 에디터/협업 모드에서 사용자 아바타로 표시할 캐릭터를 선택
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  ChevronDown,
  Search,
  Star,
  Check,
  X,
  Plus,
  Loader2,
} from 'lucide-react'
import { useCharacters } from '@/hooks/useCharacters'
import type { Character } from '@/types/database.types'
import { cn } from '@/lib/utils/cn'

interface CharacterSelectorProps {
  /** 현재 선택된 캐릭터 ID */
  selectedCharacterId?: string | null
  /** 캐릭터 선택 시 콜백 */
  onSelect: (character: Character | null) => void
  /** 기본 프로필 사용 옵션 표시 여부 */
  showDefaultOption?: boolean
  /** 컴팩트 모드 (드롭다운 스타일) */
  compact?: boolean
  /** 비활성화 */
  disabled?: boolean
  /** 클래스명 */
  className?: string
  /** 플레이스홀더 텍스트 */
  placeholder?: string
}

export function CharacterSelector({
  selectedCharacterId,
  onSelect,
  showDefaultOption = true,
  compact = true,
  disabled = false,
  className,
  placeholder = '캐릭터 선택',
}: CharacterSelectorProps) {
  const { characters, isLoading } = useCharacters()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // 선택된 캐릭터
  const selectedCharacter = useMemo(() => {
    if (!selectedCharacterId) return null
    return characters.find((c) => c.id === selectedCharacterId) || null
  }, [characters, selectedCharacterId])

  // 검색 필터링된 캐릭터
  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return characters

    const query = searchQuery.toLowerCase()
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.world_name?.toLowerCase().includes(query)
    )
  }, [characters, searchQuery])

  // 즐겨찾기 캐릭터를 상단에 정렬
  const sortedCharacters = useMemo(() => {
    return [...filteredCharacters].sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1
      if (!a.is_favorite && b.is_favorite) return 1
      return a.sort_order - b.sort_order
    })
  }, [filteredCharacters])

  // 선택 핸들러
  const handleSelect = useCallback((character: Character | null) => {
    onSelect(character)
    setIsOpen(false)
    setSearchQuery('')
  }, [onSelect])

  // 외부 클릭으로 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-character-selector]')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // ESC로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (compact) {
    return (
      <div
        className={cn('relative', className)}
        data-character-selector
      >
        {/* 트리거 버튼 */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl',
            'transition-all duration-200',
            'hover:border-primary-200 hover:shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-200',
            disabled && 'opacity-50 cursor-not-allowed',
            isOpen && 'border-primary-300 ring-2 ring-primary-200'
          )}
        >
          {/* 선택된 캐릭터 미리보기 */}
          {selectedCharacter ? (
            <>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{
                  backgroundColor: selectedCharacter.avatar_url ? undefined : selectedCharacter.color,
                  backgroundImage: selectedCharacter.avatar_url ? `url(${selectedCharacter.avatar_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!selectedCharacter.avatar_url && selectedCharacter.name[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">
                {selectedCharacter.name}
              </span>
            </>
          ) : (
            <>
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">{placeholder}</span>
            </>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {/* 드롭다운 */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 overflow-hidden min-w-[240px]"
            >
              {/* 검색 */}
              {characters.length > 5 && (
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="캐릭터 검색..."
                      autoFocus
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                </div>
              )}

              {/* 옵션 목록 */}
              <div className="max-h-[240px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* 기본 프로필 옵션 */}
                    {showDefaultOption && (
                      <button
                        onClick={() => handleSelect(null)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 text-left',
                          'hover:bg-gray-50 transition-colors',
                          !selectedCharacterId && 'bg-primary-50'
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700">기본 프로필</p>
                          <p className="text-xs text-gray-400">내 계정 프로필 사용</p>
                        </div>
                        {!selectedCharacterId && (
                          <Check className="w-4 h-4 text-primary-500" />
                        )}
                      </button>
                    )}

                    {/* 캐릭터 목록 */}
                    {sortedCharacters.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-gray-500">
                          {searchQuery ? '검색 결과가 없어요' : '등록된 캐릭터가 없어요'}
                        </p>
                      </div>
                    ) : (
                      sortedCharacters.map((character) => (
                        <button
                          key={character.id}
                          onClick={() => handleSelect(character)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 text-left',
                            'hover:bg-gray-50 transition-colors',
                            selectedCharacterId === character.id && 'bg-primary-50'
                          )}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{
                              backgroundColor: character.avatar_url ? undefined : character.color,
                              backgroundImage: character.avatar_url ? `url(${character.avatar_url})` : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            {!character.avatar_url && character.name[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {character.name}
                              </p>
                              {character.is_favorite && (
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                              )}
                            </div>
                            {character.world_name && (
                              <p className="text-xs text-gray-400 truncate">
                                {character.world_name}
                              </p>
                            )}
                          </div>
                          {selectedCharacterId === character.id && (
                            <Check className="w-4 h-4 text-primary-500 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // 비컴팩트 모드 (그리드 스타일)
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">캐릭터 선택</h3>
        {selectedCharacter && (
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            선택 해제
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
        </div>
      ) : characters.length === 0 ? (
        <div className="text-center py-8">
          <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">등록된 캐릭터가 없어요</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {/* 기본 프로필 */}
          {showDefaultOption && (
            <button
              onClick={() => onSelect(null)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                !selectedCharacterId
                  ? 'bg-primary-100 ring-2 ring-primary-400'
                  : 'hover:bg-gray-100'
              )}
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <span className="text-xs text-gray-600 truncate w-full text-center">
                기본
              </span>
            </button>
          )}

          {/* 캐릭터들 */}
          {sortedCharacters.map((character) => (
            <button
              key={character.id}
              onClick={() => onSelect(character)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                selectedCharacterId === character.id
                  ? 'bg-primary-100 ring-2 ring-primary-400'
                  : 'hover:bg-gray-100'
              )}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold relative"
                style={{
                  backgroundColor: character.avatar_url ? undefined : character.color,
                  backgroundImage: character.avatar_url ? `url(${character.avatar_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!character.avatar_url && character.name[0]?.toUpperCase()}
                {character.is_favorite && (
                  <Star className="absolute -top-1 -right-1 w-3 h-3 text-amber-400 fill-amber-400" />
                )}
              </div>
              <span className="text-xs text-gray-600 truncate w-full text-center">
                {character.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CharacterSelector
