'use client'

import { useSearchParams } from 'next/navigation'
import { CanvasEditor } from '@/components/editor/canvas'

interface CanvasEditorClientProps {
  templateId: string
}

export default function CanvasEditorClient({ templateId }: CanvasEditorClientProps) {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? undefined
  const initialTitle = searchParams.get('title') ?? undefined
  const customTemplateId = searchParams.get('id') ?? undefined
  const workId = searchParams.get('work') ?? undefined
  const draftId = searchParams.get('draft') ?? undefined
  const startCollab = searchParams.get('collab') === '1'
  const effectiveTemplateId =
    templateId === 'custom' && customTemplateId ? customTemplateId : templateId

  return (
    <CanvasEditor
      templateId={effectiveTemplateId}
      sessionId={sessionId}
      initialTitle={initialTitle}
      workId={workId}
      draftId={draftId}
      startCollab={startCollab}
    />
  )
}
