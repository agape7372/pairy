'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import { useUser } from '@/hooks/useUser'
import { isSupabaseConfigured } from '@/lib/supabase/client'

// 임시 템플릿 데이터 (레거시 - 이전 템플릿 ID용)
const legacyTemplates: Record<string, { title: string; emoji: string }> = {
  '1': { title: '커플 프로필 틀', emoji: '💕' },
  '2': { title: '친구 관계도', emoji: '✨' },
  '3': { title: 'OC 소개 카드', emoji: '🌙' },
  '4': { title: '베프 케미 틀', emoji: '🍀' },
  '5': { title: '삼각관계 틀', emoji: '🔺' },
  '6': { title: '캐릭터 프로필 카드', emoji: '📋' },
  '7': { title: '팬아트 커플 틀', emoji: '🌸' },
  '8': { title: '단체 관계도', emoji: '🥥' },
}

// 캔버스 에디터용 템플릿
const canvasTemplates = [
  {
    id: 'couple-magazine',
    title: '매거진 커버 스타일',
    description: '세련된 매거진 커버 레이아웃으로 캐릭터 페어를 표현해보세요',
    emoji: '📰',
    category: 'pair',
    tags: ['매거진', '커플', '세련된'],
    isNew: true,
  },
  // 추가 템플릿은 여기에
]

function NewEditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isLoading: userLoading } = useUser()

  const templateId = searchParams.get('template')
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof canvasTemplates[0] | null>(null)

  // 레거시 템플릿 체크 (이전 URL 호환)
  const legacyTemplate = templateId ? legacyTemplates[templateId] : null
  const isDemoMode = !isSupabaseConfigured()

  useEffect(() => {
    if (legacyTemplate) {
      setTitle(`나의 ${legacyTemplate.title}`)
    } else if (selectedTemplate) {
      setTitle(`나의 ${selectedTemplate.title}`)
    }
  }, [legacyTemplate, selectedTemplate])

  // Redirect if not logged in (데모 모드에서는 스킵)
  useEffect(() => {
    if (!isDemoMode && !userLoading && !user) {
      router.push(`/login?redirectTo=/editor/new${templateId ? `?template=${templateId}` : ''}`)
    }
  }, [user, userLoading, router, templateId, isDemoMode])

  const handleSelectTemplate = (template: typeof canvasTemplates[0]) => {
    setSelectedTemplate(template)
    setTitle(`나의 ${template.title}`)
  }

  const handleCreate = async () => {
    if (!title.trim() || !selectedTemplate) return

    setIsCreating(true)
    try {
      const params = new URLSearchParams()
      if (title) params.set('title', encodeURIComponent(title))
      router.push(`/canvas-editor/${selectedTemplate.id}?${params.toString()}`)
    } catch (err) {
      console.error('Failed to create work:', err)
      setIsCreating(false)
    }
  }

  // 레거시 템플릿 핸들러 (이전 URL 호환)
  const handleCreateLegacy = async () => {
    if (!title.trim()) return

    setIsCreating(true)
    try {
      const params = new URLSearchParams()
      if (title) params.set('title', encodeURIComponent(title))
      router.push(`/canvas-editor/couple-magazine?${params.toString()}`)
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

  // 템플릿 선택 화면 (기본)
  if (!legacyTemplate && !selectedTemplate) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-[800px] mx-auto flex items-center gap-3">
            <Link
              href="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">새 작업 만들기</h1>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-[800px] mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              어떤 틀로 시작할까요?
            </h2>
            <p className="text-gray-500">
              마음에 드는 템플릿을 선택하세요
            </p>
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {canvasTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="group relative bg-white rounded-2xl border-2 border-gray-200 p-6 text-left hover:border-primary-400 hover:shadow-lg transition-all"
              >
                {template.isNew && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-primary-400 to-accent-400 text-white text-xs font-medium rounded-full">
                    <Sparkles className="w-3 h-3" />
                    NEW
                  </span>
                )}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  {template.emoji}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {template.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}

            {/* 더 많은 템플릿 Coming Soon */}
            <div className="bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center text-3xl mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-400 mb-1">
                더 많은 템플릿
              </h3>
              <p className="text-sm text-gray-400">
                곧 추가될 예정이에요!
              </p>
            </div>
          </div>

          {/* 자료 허브 링크 */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-2">
              다른 사용자들이 만든 틀도 구경해보세요
            </p>
            <Button variant="ghost" asChild>
              <Link href="/templates">자료 허브 둘러보기</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // 레거시 템플릿이 선택된 경우 (이전 URL 호환)
  const currentTemplate = legacyTemplate || selectedTemplate

  const templateEmoji = legacyTemplate?.emoji || selectedTemplate?.emoji || '📰'
  const templateTitle = legacyTemplate?.title || selectedTemplate?.title || ''

  const handleBack = () => {
    if (selectedTemplate) {
      setSelectedTemplate(null)
      setTitle('')
    } else if (templateId) {
      router.push(`/templates/${templateId}`)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-[600px] mx-auto flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">새 작업 만들기</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[600px] mx-auto px-4 py-8">
        {/* Template Info */}
        <div className="bg-white rounded-[20px] border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-[16px] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-4xl">
              {templateEmoji}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">선택한 틀</p>
              <h2 className="text-xl font-bold text-gray-900">{templateTitle}</h2>
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
            onClick={legacyTemplate ? handleCreateLegacy : handleCreate}
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
