'use client'

/**
 * 캐릭터 편집 페이지
 * URL: /my/characters/edit?id=xxx
 *
 * 정적 내보내기와 호환되도록 쿼리 파라미터 방식 사용
 */

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import CharacterEditPageClient from '@/components/pages/CharacterEditPageClient'
import { Loader2 } from 'lucide-react'

function CharacterEditContent() {
  const searchParams = useSearchParams()
  const characterId = searchParams.get('id')

  if (!characterId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">캐릭터 ID가 필요합니다</p>
          <a
            href="/my/characters"
            className="text-primary-500 hover:text-primary-600"
          >
            캐릭터 목록으로 돌아가기
          </a>
        </div>
      </div>
    )
  }

  return <CharacterEditPageClient characterId={characterId} />
}

export default function CharacterEditPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      }
    >
      <CharacterEditContent />
    </Suspense>
  )
}
