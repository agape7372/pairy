import { redirect } from 'next/navigation'

// 기존 템플릿 ID → 새 캔버스 에디터 템플릿 ID 매핑
const templateMapping: Record<string, string> = {
  'new': 'couple-magazine',
  '1': 'couple-magazine', // 커플 프로필 틀 → Magazine Cover
  '2': 'couple-magazine', // 친구 관계도 → Magazine Cover (임시)
  '3': 'couple-magazine', // OC 소개 카드 → Magazine Cover (임시)
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function EditorPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const query = await searchParams
  const requestedTemplateId = firstQueryValue(query.template)
  const isSavedWork = UUID_RE.test(id) && id !== 'new'
  const templateId =
    (id === 'new' ? requestedTemplateId : undefined) ||
    templateMapping[id] ||
    'couple-magazine'
  const nextParams = new URLSearchParams()
  const session = firstQueryValue(query.session)
  const title = firstQueryValue(query.title)
  const requestedDraft = firstQueryValue(query.draft)
  const startCollab = firstQueryValue(query.collab)
  if (session) nextParams.set('session', session)
  if (title) nextParams.set('title', title)
  if (startCollab === '1') nextParams.set('collab', '1')
  if (isSavedWork) nextParams.set('work', id)
  if (!isSavedWork && !session) {
    nextParams.set(
      'draft',
      requestedDraft && UUID_RE.test(requestedDraft)
        ? requestedDraft
        : crypto.randomUUID()
    )
  }
  const suffix = nextParams.size > 0 ? `?${nextParams.toString()}` : ''

  // 새 캔버스 에디터로 리다이렉트
  redirect(`/canvas-editor/${encodeURIComponent(templateId)}${suffix}`)
}
