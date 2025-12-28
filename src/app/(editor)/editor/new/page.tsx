'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { useUser } from '@/hooks/useUser'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getIcon, getIconColor, type IconName } from '@/lib/utils/icons'

// 임시 템플릿 데이터
const templates: Record<string, { title: string; icon: IconName }> = {
  '1': { title: '커플 프로필 틀', icon: 'heart' },
  '2': { title: '친구 관계도', icon: 'sparkles' },
  '3': { title: 'OC 소개 카드', icon: 'moon' },
  '4': { title: '베프 케미 틀', icon: 'clover' },
  '5': { title: '삼각관계 틀', icon: 'triangle' },
  '6': { title: '캐릭터 프로필 카드', icon: 'file' },
  '7': { title: '팬아트 커플 틀', icon: 'flower' },
  '8': { title: '단체 관계도', icon: 'users' },
}

function NewEditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isLoading: userLoading } = useUser()

  const templateId = searchParams.get('template')
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const template = templateId ? templates[templateId] : null
  const isDemoMode = !isSupabaseConfigured()

  useEffect(() => {
    if (template) {
      setTitle(`나의 ${template.title}`)
    }
  }, [template])

  // Redirect if not logged in (데모 모드에서는 스킵)
  useEffect(() => {
    if (!isDemoMode && !userLoading && !user) {
      router.push(`/login?redirectTo=/editor/new${templateId ? `?template=${templateId}` : ''}`)
    }
  }, [user, userLoading, router, templateId, isDemoMode])

  const handleCreate = async () => {
    if (!title.trim()) return

    setIsCreating(true)
    try {
      if (isDemoMode) {
        // 데모 모드: 미리 생성된 에디터 페이지로 이동 (템플릿 ID와 제목 전달)
        const params = new URLSearchParams()
        if (templateId) params.set('template', templateId)
        if (title) params.set('title', title)
        router.push(`/editor/1?${params.toString()}`)
        return
      }

      // TODO: Create work in Supabase and get the new work ID
      const newWorkId = 'new-' + Date.now()

      // Redirect to the editor
      router.push(`/editor/${newWorkId}`)
    } catch (err) {
      console.error('Failed to create work:', err)
      setIsCreating(false)
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <HelpCircle className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          템플릿을 찾을 수 없어요
        </h1>
        <p className="text-gray-500 mb-6">
          먼저 틀을 선택해주세요.
        </p>
        <Button asChild>
          <Link href="/templates">틀 둘러보기</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-[600px] mx-auto flex items-center gap-3">
          <Link
            href={`/templates/${templateId}`}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">새 작업 만들기</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[600px] mx-auto px-4 py-8">
        {/* Template Info */}
        <div className="bg-white rounded-[20px] border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-[16px] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center">
              {(() => {
                const TemplateIcon = getIcon(template.icon)
                const templateColor = getIconColor(template.icon)
                return <TemplateIcon className={`w-10 h-10 ${templateColor}`} strokeWidth={1.5} />
              })()}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">선택한 틀</p>
              <h2 className="text-xl font-bold text-gray-900">{template.title}</h2>
            </div>
          </div>
        </div>

        {/* Title Input */}
        <div className="bg-white rounded-[20px] border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            작업 제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="작업 제목을 입력하세요"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            maxLength={50}
          />
          <p className="text-xs text-gray-400 mt-2 text-right">
            {title.length}/50
          </p>
        </div>

        {/* Create Button */}
        <div className="mt-6">
          <Button
            size="lg"
            className="w-full"
            onClick={handleCreate}
            isLoading={isCreating}
            disabled={!title.trim()}
          >
            작업 시작하기
          </Button>
        </div>
      </main>
    </div>
  )
}

export default function NewEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      }
    >
      <NewEditorContent />
    </Suspense>
  )
}
