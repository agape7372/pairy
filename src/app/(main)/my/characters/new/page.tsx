'use client'

/**
 * 새 캐릭터 생성 페이지
 * URL: /my/characters/new
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Users } from 'lucide-react'
import { Button } from '@/components/ui'
import { CharacterEditForm } from '@/components/characters/CharacterEditForm'
import { useCharacters, type CreateCharacterInput, type UpdateCharacterInput } from '@/hooks/useCharacters'

export default function NewCharacterPage() {
  const router = useRouter()

  const {
    isSaving,
    error,
    operationState,
    createCharacter,
    canCreateMore,
  } = useCharacters()

  // 저장 핸들러
  const handleSave = useCallback(async (data: CreateCharacterInput | UpdateCharacterInput) => {
    // 새 캐릭터 생성이므로 CreateCharacterInput으로 처리
    const result = await createCharacter(data as CreateCharacterInput)
    return result
  }, [createCharacter])

  // 최대 개수 도달 시
  if (!canCreateMore) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md text-center">
          <Users className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            최대 캐릭터 수에 도달했어요
          </h2>
          <p className="text-gray-500 mb-6">
            더 많은 캐릭터를 만들려면 기존 캐릭터를 삭제하거나
            프리미엄으로 업그레이드해주세요.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={() => router.push('/my/characters')}
            >
              캐릭터 관리
            </Button>
            <Button onClick={() => router.push('/premium')}>
              프리미엄 보기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <CharacterEditForm
      character={null}
      onSave={handleSave}
      isSaving={isSaving}
      validationError={operationState === 'error' ? error : null}
    />
  )
}
