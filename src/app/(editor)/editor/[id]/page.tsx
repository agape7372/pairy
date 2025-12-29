import { redirect } from 'next/navigation'

// 기존 템플릿 ID → 새 캔버스 에디터 템플릿 ID 매핑
const templateMapping: Record<string, string> = {
  'new': 'couple-magazine',
  '1': 'couple-magazine', // 커플 프로필 틀 → Magazine Cover
  '2': 'couple-magazine', // 친구 관계도 → Magazine Cover (임시)
  '3': 'couple-magazine', // OC 소개 카드 → Magazine Cover (임시)
}

export function generateStaticParams() {
  return [
    { id: 'new' },
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ]
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditorPage({ params }: PageProps) {
  const { id } = await params
  const templateId = templateMapping[id] || 'couple-magazine'

  // 새 캔버스 에디터로 리다이렉트
  redirect(`/canvas-editor/${templateId}`)
}
