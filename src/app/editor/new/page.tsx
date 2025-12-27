'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useUser } from '@/hooks/useUser'

// 임시 템플릿 데이터
const templates: Record<string, { title: string; emoji: string }> = {
  '1': { title: '커플 프로필 틀', emoji: '💕' },
  '2': { title: '친구 관계도', emoji: '✨' },
  '3': { title: 'OC 소개 카드', emoji: '🌙' },
}

function NewEditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isLoading: userLoading } = useUser()

  const templateId = searchParams.get('template')
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const template = templateId ? templates[templateId] : null

  useEffect(() => {
    if (template) {
      setTitle(`나의 ${template.title}`)
    }
  }, [template])

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      router.push(`/login?redirectTo=/editor/new${templateId ? `?template=${templateId}` : ''}`)
    }
  }, [user, userLoading, router, templateId])

  const handleCreate = async () => {
    if (!title.trim()) return

    setIsCreating(true)
    try {
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
        <div className="text-6xl mb-4">🤔</div>
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
            <div className="w-20 h-20 rounded-[16px] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-4xl">
              {template.emoji}
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
