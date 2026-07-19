import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { EditorErrorBoundary } from '@/components/editor'
import CanvasEditorClient from './CanvasEditorClient'

interface PageProps {
  params: Promise<{ templateId: string }>
}

function EditorLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
    </div>
  )
}

export default async function CanvasEditorPage({ params }: PageProps) {
  const { templateId } = await params

  return (
    <EditorErrorBoundary>
      <Suspense fallback={<EditorLoading />}>
        <CanvasEditorClient templateId={templateId} />
      </Suspense>
    </EditorErrorBoundary>
  )
}
