'use client'

import { useSearchParams } from 'next/navigation'
import { CanvasEditor } from '@/components/editor/canvas'
import { CollabProvider } from '@/lib/collab'

interface CanvasEditorClientProps {
  templateId: string
}

export default function CanvasEditorClient({ templateId }: CanvasEditorClientProps) {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') ?? undefined

  return (
    <CollabProvider sessionId={sessionId}>
      <CanvasEditor templateId={templateId} sessionId={sessionId} />
    </CollabProvider>
  )
}
