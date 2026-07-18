'use client'

/**
 * /editor/[id] 리졸버 (감사 A1 수정)
 * 기존 구현은 매핑에 없는 모든 id 를 couple-magazine 으로 붕괴시키고 쿼리(?session= 등)도 버렸다.
 * - 레거시 id(new/1/2/3): couple-magazine (기존 동작 유지)
 * - UUID: 저장된 work 로 보고 조회 → /canvas-editor/{template_id}?work={id} (실패 시 템플릿 id 로 시도)
 * - 그 외: 템플릿 id 로 보고 /canvas-editor/{id} 직행 (없으면 에디터가 정직한 에러 표시)
 * 쿼리 파라미터는 전부 보존한다.
 */

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'

// 기존 템플릿 ID → 캔버스 에디터 템플릿 ID 매핑 (레거시 진입점 유지)
const LEGACY_TEMPLATE_MAPPING: Record<string, string> = {
  'new': 'couple-magazine',
  '1': 'couple-magazine', // 커플 프로필 틀 → Magazine Cover
  '2': 'couple-magazine', // 친구 관계도 → Magazine Cover (임시)
  '3': 'couple-magazine', // OC 소개 카드 → Magazine Cover (임시)
  // 과거 버그로 /editor/undefined 링크가 생성된 이력이 있어 방어 (NEW-COLLAB-1)
  'undefined': 'couple-magazine',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type EditorIdKind = 'legacy' | 'uuid' | 'template'

export function classifyEditorId(id: string): EditorIdKind {
  if (id in LEGACY_TEMPLATE_MAPPING) return 'legacy'
  if (UUID_RE.test(id)) return 'uuid'
  return 'template'
}

interface EditorRedirectClientProps {
  id: string
}

export default function EditorRedirectClient({ id }: EditorRedirectClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const query = searchParams.toString()
    const suffix = query ? `?${query}` : ''
    const go = (path: string) => router.replace(path)

    const kind = classifyEditorId(id)

    if (kind === 'legacy') {
      go(`/canvas-editor/${LEGACY_TEMPLATE_MAPPING[id]}${suffix}`)
      return
    }

    if (kind === 'uuid' && !IS_DEMO_MODE) {
      // 저장된 work 인지 조회 (RLS 로 본인 것만 조회됨)
      const supabase = createClient()
      supabase
        .from('works')
        .select('id, template_id')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (!error && data?.template_id) {
            const workQuery = query ? `?work=${id}&${query}` : `?work=${id}`
            go(`/canvas-editor/${data.template_id}${workQuery}`)
          } else {
            // work 가 아니면 UUID 템플릿 id 로 간주하고 에디터에 위임
            go(`/canvas-editor/${id}${suffix}`)
          }
        })
      return
    }

    // 데모 모드 UUID 포함, 일반 템플릿/커스텀 id: 그대로 캔버스 에디터에 위임
    go(`/canvas-editor/${id}${suffix}`)
  }, [id, router, searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  )
}
