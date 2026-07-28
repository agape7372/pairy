import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import { EditorErrorBoundary } from '@/components/editor'
import CanvasEditorClient from './CanvasEditorClient'

interface PageProps {
  params: Promise<{ templateId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function EditorLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
    </div>
  )
}

export default async function CanvasEditorPage({ params, searchParams }: PageProps) {
  const { templateId } = await params
  const query = await searchParams
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value
  const sessionId = first(query.session)
  const workId = first(query.work)
  const draftId = first(query.draft)

  // 세션/서버 작품이 아닌 모든 단독 문서는 고유 draft ID를 가져야 같은
  // 템플릿을 여러 번 열었을 때 자동 저장 복구본이 서로 덮이지 않는다.
  if (!sessionId && !workId && (!draftId || !UUID_RE.test(draftId))) {
    const nextParams = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => nextParams.append(key, item))
      } else if (value !== undefined) {
        nextParams.set(key, value)
      }
    })
    nextParams.set('draft', crypto.randomUUID())
    redirect(
      `/canvas-editor/${encodeURIComponent(templateId)}?${nextParams.toString()}`
    )
  }

  return (
    <EditorErrorBoundary>
      <Suspense fallback={<EditorLoading />}>
        <CanvasEditorClient templateId={templateId} />
      </Suspense>
    </EditorErrorBoundary>
  )
}
