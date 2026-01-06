'use client'

/**
 * 캐릭터 관리 컴포넌트
 * 캐릭터 목록, CRUD 작업, 필터링 UI 제공
 */

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  Globe,
  Star,
  Users,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { CharacterCard } from './CharacterCard'
import { CharacterEditModal } from './CharacterEditModal'
import {
  useCharacters,
  type CreateCharacterInput,
  type UpdateCharacterInput,
} from '@/hooks/useCharacters'
import type { Character } from '@/types/database.types'
import { cn } from '@/lib/utils/cn'

type FilterTab = 'all' | 'favorites' | 'world'

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
  const {
    characters,
    isLoading,
    isSaving,
    error,
    operationState,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    toggleFavorite,
    reorderCharacters,
    getWorldNames,
    canCreateMore,
    refetch,
    clearError,
    validateCharacter,
  } = useCharacters()

  // UI 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Character | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const worldNames = getWorldNames()

  // 필터링된 캐릭터 목록
  const filteredCharacters = useMemo(() => {
    let result = [...characters]

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.world_name?.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      )
    }

    // 탭 필터
    if (activeTab === 'favorites') {
      result = result.filter((c) => c.is_favorite)
    } else if (activeTab === 'world' && selectedWorld) {
      result = result.filter((c) => c.world_name === selectedWorld)
    }

    return result
  }, [characters, searchQuery, activeTab, selectedWorld])

  // 캐릭터 생성 핸들러
  const handleCreate = useCallback(() => {
    if (!canCreateMore) {
      // TODO: 프리미엄 업그레이드 모달 표시
      return
    }
    setEditingCharacter(null)
    setEditModalOpen(true)
  }, [canCreateMore])

  // 캐릭터 편집 핸들러
  const handleEdit = useCallback((character: Character) => {
    if (selectionMode && onCharacterSelect) {
      onCharacterSelect(character)
      return
    }
    setEditingCharacter(character)
    setEditModalOpen(true)
  }, [selectionMode, onCharacterSelect])

  // 저장 핸들러
  const handleSave = useCallback(async (data: CreateCharacterInput | UpdateCharacterInput) => {
    if (editingCharacter) {
      return updateCharacter(editingCharacter.id, data as UpdateCharacterInput)
    } else {
      return createCharacter(data as CreateCharacterInput)
    }
  }, [editingCharacter, createCharacter, updateCharacter])

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

  // 순서 변경 핸들러
  const handleReorder = useCallback(async (reordered: Character[]) => {
    const newOrder = reordered.map((c) => c.id)
    await reorderCharacters(newOrder)
  }, [reorderCharacters])

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

      {/* 검색 & 필터 */}
      <div className="space-y-4">
        {/* 검색바 */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="캐릭터 검색..."
            className="pl-10"
          />
        </div>

        {/* 필터 탭 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => {
              setActiveTab('all')
              setSelectedWorld(null)
            }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === 'all'
                ? 'bg-primary-100 text-primary-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            전체
          </button>

          <button
            onClick={() => {
              setActiveTab('favorites')
              setSelectedWorld(null)
            }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1',
              activeTab === 'favorites'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <Star className="w-4 h-4" />
            즐겨찾기
          </button>

          {worldNames.length > 0 && (
            <>
              <div className="w-px h-6 bg-gray-200" />
              {worldNames.map((world) => (
                <button
                  key={world}
                  onClick={() => {
                    setActiveTab('world')
                    setSelectedWorld(world)
                  }}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1',
                    activeTab === 'world' && selectedWorld === world
                      ? 'bg-accent-100 text-accent-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <Globe className="w-3 h-3" />
                  {world}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

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
        <Reorder.Group
          axis="y"
          values={filteredCharacters}
          onReorder={handleReorder}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          as="div"
        >
          <AnimatePresence mode="popLayout">
            {filteredCharacters.map((character) => (
              <Reorder.Item
                key={character.id}
                value={character}
                as="div"
                drag={!selectionMode && activeTab === 'all' && !searchQuery}
              >
                <CharacterCard
                  character={character}
                  onEdit={handleEdit}
                  onDelete={handleDeleteConfirm}
                  onToggleFavorite={toggleFavorite}
                  isDeleting={deletingId === character.id}
                  className={cn(
                    selectionMode && selectedCharacterId === character.id &&
                    'ring-2 ring-primary-400 ring-offset-2'
                  )}
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {/* 편집 모달 */}
      <AnimatePresence>
        {editModalOpen && (
          <CharacterEditModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false)
              setEditingCharacter(null)
            }}
            character={editingCharacter}
            onSave={handleSave}
            isSaving={isSaving}
            existingWorldNames={worldNames}
            validationError={operationState === 'error' ? error : null}
          />
        )}
      </AnimatePresence>

      {/* 삭제 확인 대화상자 */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => !isSaving && setDeleteConfirm(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[24px] shadow-xl p-6 z-50"
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
