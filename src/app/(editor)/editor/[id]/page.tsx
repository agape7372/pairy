import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import EditorClient from '@/components/pages/EditorClient'
import { EditorErrorBoundary } from '@/components/editor'

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

function EditorLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
    </div>
  )
}

export default async function EditorPage({ params }: PageProps) {
  const { id } = await params
  return (
    <EditorErrorBoundary>
      <Suspense fallback={<EditorLoading />}>
        <EditorClient workId={id} />
      </Suspense>
    </EditorErrorBoundary>
  )
}
