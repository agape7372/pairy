import { Suspense } from 'react'
import EditorRedirectClient from '@/components/pages/EditorRedirectClient'

/**
 * /editor/[id] — 캔버스 에디터 진입 리졸버 (감사 A1 수정)
 * 레거시 id·저장된 work UUID·템플릿 id 를 구분해 /canvas-editor/* 로 보낸다.
 * 쿼리(?session= 등) 보존이 필요해 클라이언트에서 리다이렉트한다.
 */

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditorPage({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <EditorRedirectClient id={id} />
    </Suspense>
  )
}
