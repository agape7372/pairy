/**
 * 캐릭터 상세/편집 페이지
 * URL: /my/characters/[id]
 */

import CharacterEditPageClient from '@/components/pages/CharacterEditPageClient'

// Static export용 기본 경로
// 실제 ID는 클라이언트에서 localStorage로 관리
export function generateStaticParams() {
  return [
    { id: 'demo-1' },
    { id: 'demo-2' },
    { id: 'demo-3' },
  ]
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CharacterEditPage({ params }: PageProps) {
  const { id } = await params
  return <CharacterEditPageClient characterId={id} />
}
