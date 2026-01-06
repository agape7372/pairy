'use client'

/**
 * 캐릭터 프로필 관리 페이지
 * 사용자의 캐릭터를 생성, 편집, 삭제할 수 있는 페이지
 */

import { CharacterManager } from '@/components/characters'

export default function CharactersPage() {
  return (
    <div className="animate-fade-in">
      <CharacterManager />
    </div>
  )
}
