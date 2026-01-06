'use client'

/**
 * 캐릭터 상세/편집 페이지 클라이언트 컴포넌트
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'
import { CharacterEditForm } from '@/components/characters/CharacterEditForm'
import {
  useCharacters,
  type UpdateCharacterInput,
  type CreateCharacterInput,
} from '@/hooks/useCharacters'
import type { Character } from '@/types/database.types'

interface CharacterEditPageClientProps {
  characterId: string
}

export default function CharacterEditPageClient({ characterId }: CharacterEditPageClientProps) {
  const router = useRouter()

  const {
    characters,
    isLoading,
    isSaving,
    error,
    operationState,
    updateCharacter,
    deleteCharacter,
    createCharacter,
    refetch,
  } = useCharacters()

  const [character, setCharacter] = useState<Character | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notFound, setNotFound] = useState(false)

  // 캐릭터 찾기
  useEffect(() => {
    if (!isLoading && characters.length > 0) {
      const found = characters.find((c) => c.id === characterId)
      if (found) {
        setCharacter(found)
        setNotFound(false)
      } else {
        setNotFound(true)
      }
    } else if (!isLoading && characters.length === 0) {
      // 캐릭터가 없는 경우
      setNotFound(true)
    }
  }, [characters, characterId, isLoading])

  // 저장 핸들러
  const handleSave = useCallback(async (data: UpdateCharacterInput | CreateCharacterInput) => {
    if (!character) return null
    return updateCharacter(character.id, data as UpdateCharacterInput)
  }, [character, updateCharacter])

  // 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (!character) return false
    setIsDeleting(true)
    const success = await deleteCharacter(character.id)
    setIsDeleting(false)
    return success
  }, [character, deleteCharacter])

  // 복제 핸들러
  const handleDuplicate = useCallback(async () => {
    if (!character) return null

    const duplicateData: CreateCharacterInput = {
      name: `${character.name} (복사본)`,
      color: character.color,
      description: character.description,
      avatar_url: character.avatar_url,
      metadata: character.metadata as CreateCharacterInput['metadata'],
    }

    return createCharacter(duplicateData)
  }, [character, createCharacter])

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-4" />
        <p className="text-gray-500">캐릭터를 불러오는 중...</p>
      </div>
    )
  }

  // 찾을 수 없음
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            캐릭터를 찾을 수 없어요
          </h2>
          <p className="text-gray-500 mb-6">
            삭제되었거나 존재하지 않는 캐릭터예요.
          </p>
          <Button onClick={() => router.push('/my/characters')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            캐릭터 목록으로
          </Button>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error && !character) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            오류가 발생했어요
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button variant="secondary" onClick={() => refetch()}>
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  return (
    <CharacterEditForm
      character={character}
      onSave={handleSave}
      onDelete={handleDelete}
      onDuplicate={handleDuplicate}
      isSaving={isSaving}
      isDeleting={isDeleting}
      validationError={operationState === 'error' ? error : null}
    />
  )
}
