'use client'

/**
 * 캐릭터 관리 컴포넌트
 * 캐릭터 목록, 페이지 이동 및 삭제 UI 제공
 */

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Users,
  AlertCircle,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { CharacterCard } from './CharacterCard'
import { useCharacters } from '@/hooks/useCharacters'
import type { Character } from '@/types/database.types'
import { cn } from '@/lib/utils/cn'

// 정렬 옵션
type SortOption = 'created_desc' | 'created_asc' | 'name_asc' | 'name_desc' | 'updated_desc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'created_desc', label: '최신순' },
  { value: 'created_asc', label: '오래된순' },
  { value: 'name_asc', label: '이름 (가나다)' },
  { value: 'name_desc', label: '이름 (역순)' },
  { value: 'updated_desc', label: '최근 수정' },
]

interface CharacterManagerProps {
  className?: string
  onCharacterSelect?: (character: Character) => void
  selectionMode?: boolean
  selectedCharacterId?: string | null
}

export function CharacterManager({
  className,
  onCharacterSelect,
  selectionMode = false,
  selectedCharacterId,
}: CharacterManagerProps) {
  const router = useRouter()
  const {
    characters,
    isLoading,
    isSaving,
    error,
    deleteCharacter,
    canCreateMore,
    refetch,
    clearError,
  } = useCharacters()

  // UI 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('created_desc')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Character | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 필터링 및 정렬된 캐릭터 목록
  const filteredCharacters = useMemo(() => {
    let result = [...characters]

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      )
    }

    // 정렬
    switch (sortOption) {
      case 'created_desc':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'created_asc':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
        break
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name, 'ko'))
        break
      case 'updated_desc':
        result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        break
    }

    return result
  }, [characters, searchQuery, sortOption])

  // 캐릭터 생성 페이지로 이동
  const handleCreate = useCallback(() => {
    if (!canCreateMore) return
    router.push('/my/characters/new')
  }, [canCreateMore, router])

  // 캐릭터 편집 페이지로 이동 또는 선택
  const handleEdit = useCallback((character: Character) => {
    if (selectionMode && onCharacterSelect) {
      onCharacterSelect(character)
      return
    }
    // 정적 내보내기 호환을 위해 쿼리 파라미터 방식 사용
    router.push(`/my/characters/edit?id=${character.id}`)
  }, [selectionMode, onCharacterSelect, router])

  // 삭제 확인 핸들러
  const handleDeleteConfirm = useCallback((character: Character) => {
    setDeleteConfirm(character)
  }, [])

  // 삭제 실행 핸들러
  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return

    setDeletingId(deleteConfirm.id)
    const success = await deleteCharacter(deleteConfirm.id)
    setDeletingId(null)

    if (success) {
      setDeleteConfirm(null)
    }
  }, [deleteConfirm, deleteCharacter])

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-4" />
        <p className="text-gray-500">캐릭터를 불러오는 중...</p>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-error mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">오류가 발생했어요</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button
            variant="secondary"
            onClick={() => {
              clearError()
              refetch()
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-400" />
            내 캐릭터
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {characters.length}개의 캐릭터
            {!canCreateMore && ' (최대 개수 도달)'}
          </p>
        </div>

        <Button onClick={handleCreate} disabled={!canCreateMore || isSaving}>
          <Plus className="w-4 h-4 mr-1" />
          새 캐릭터
        </Button>
      </div>

      {/* 검색 및 필터 */}
      {characters.length > 0 && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="캐릭터 검색..."
              className="pl-10"
            />
          </div>

          {/* 정렬 드롭다운 */}
          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="gap-2"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">
                {SORT_OPTIONS.find((o) => o.value === sortOption)?.label}
              </span>
            </Button>

            <AnimatePresence>
              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortOption(option.value)
                          setShowSortMenu(false)
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
                          sortOption === option.value && 'text-primary-600 font-medium bg-primary-50'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 캐릭터 그리드 */}
      {filteredCharacters.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            {searchQuery ? '검색 결과가 없어요' : '캐릭터가 없어요'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery
              ? '다른 키워드로 검색해보세요'
              : '첫 번째 캐릭터를 만들어보세요!'}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-1" />
              캐릭터 만들기
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onEdit={handleEdit}
                onDelete={handleDeleteConfirm}
                isDeleting={deletingId === character.id}
                className={cn(
                  selectionMode && selectedCharacterId === character.id &&
                  'ring-2 ring-primary-400 ring-offset-2'
                )}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 삭제 확인 대화상자 */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
              onClick={() => !isSaving && setDeleteConfirm(null)}
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
                  style={{ backgroundColor: deleteConfirm.color }}
                >
                  {deleteConfirm.name[0]?.toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  캐릭터를 삭제할까요?
                </h3>
                <p className="text-sm text-gray-500">
                  <strong className="text-gray-700">{deleteConfirm.name}</strong>을(를)
                  삭제하면 되돌릴 수 없어요.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isSaving}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDelete}
                  disabled={isSaving}
                  isLoading={isSaving}
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

export default CharacterManager
