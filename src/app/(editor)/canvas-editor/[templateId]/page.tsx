import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { CanvasEditor } from '@/components/editor/canvas'
import { EditorErrorBoundary } from '@/components/editor'

// Static export를 위한 미리 정의된 템플릿 ID
export function generateStaticParams() {
  return [
    { templateId: 'couple-magazine' },
    { templateId: 'custom' }, // 커스텀 템플릿용 (실제 ID는 query param으로 전달)
    // 추가 템플릿은 여기에 추가
  ]
}

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
        <CanvasEditor templateId={templateId} />
      </Suspense>
    </EditorErrorBoundary>
  )
}
