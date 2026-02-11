'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, BookHeart, Globe, Sparkles, Plus, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui'
import { useEditorEntryStore } from '@/stores/editorEntryStore'
import {
  TEMPLATE_SOURCE_TABS,
  type TemplateSource,
  type SelectedTemplate,
} from '@/types/editor-entry'
import { WordReveal } from '@/components/ui/text-reveal'

// ============================================
// 기본 템플릿 데이터
// ============================================

const BUILT_IN_TEMPLATES: SelectedTemplate[] = [
  {
    id: 'couple-magazine',
    title: '매거진 커버 스타일',
    description: '세련된 매거진 커버 레이아웃으로 캐릭터 페어를 표현해보세요',
    emoji: '📰',
    source: 'built-in',
    category: 'pair',
    tags: ['매거진', '커플', '세련된'],
    isNew: true,
  },
  // 추가 템플릿은 여기에
]

// ============================================
// 컴포넌트
// ============================================

interface TemplateSelectionStepProps {
  className?: string
}

export function TemplateSelectionStep({ className }: TemplateSelectionStepProps) {
  const { selectTemplate, mode } = useEditorEntryStore()
  const [activeTab, setActiveTab] = useState<TemplateSource>('built-in')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 내 서재 템플릿 (데모용 빈 배열)
  const [myLibraryTemplates] = useState<SelectedTemplate[]>([])

  // 허브 템플릿 (데모용 빈 배열)
  const [hubTemplates] = useState<SelectedTemplate[]>([])

  const handleSelectTemplate = useCallback(
    (template: SelectedTemplate) => {
      selectTemplate(template)
    },
    [selectTemplate]
  )

  const handleRetry = useCallback(() => {
    setError(null)
    // 여기서 데이터 다시 로드
  }, [])

  // 탭에 따른 템플릿 목록 결정
  const getTemplatesForTab = (tab: TemplateSource): SelectedTemplate[] => {
    switch (tab) {
      case 'built-in':
        return BUILT_IN_TEMPLATES
      case 'my-library':
        return myLibraryTemplates
      case 'hub':
        return hubTemplates
      default:
        return []
    }
  }

  const currentTemplates = getTemplatesForTab(activeTab)
  const currentTabInfo = TEMPLATE_SOURCE_TABS.find((t) => t.id === activeTab)

  // 탭 아이콘 매핑
  const getTabIcon = (tabId: TemplateSource) => {
    switch (tabId) {
      case 'built-in':
        return Package
      case 'my-library':
        return BookHeart
      case 'hub':
        return Globe
      default:
        return Package
    }
  }

  return (
    <div className={cn('w-full max-w-3xl mx-auto', className)}>
      {/* 헤더 - WordReveal 적용 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          <WordReveal text="어떤 틀로 시작할까요?" wordDelay={0.06} />
        </h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500"
        >
          {mode === 'duo' ? '친구와 함께 작업할 템플릿을 선택하세요' : '마음에 드는 템플릿을 선택하세요'}
        </motion.p>
      </div>

      {/* 탭 네비게이션 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center mb-6"
      >
        <div className="inline-flex bg-gray-100 rounded-xl p-1">
          {TEMPLATE_SOURCE_TABS.map((tab) => {
            const Icon = getTabIcon(tab.id)
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* 에러 상태 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            다시 시도
          </Button>
        </motion.div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      )}

      {/* 템플릿 그리드 */}
      {!isLoading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentTemplates.map((template, index) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    index={index}
                    onSelect={handleSelectTemplate}
                  />
                ))}

                {/* 더 많은 템플릿 Coming Soon (기본 템플릿 탭에서만) */}
                {activeTab === 'built-in' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: currentTemplates.length * 0.1 }}
                    className="bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center min-h-[200px]"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center text-3xl mb-4">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400 mb-1">
                      더 많은 템플릿
                    </h3>
                    <p className="text-sm text-gray-400">
                      곧 추가될 예정이에요!
                    </p>
                  </motion.div>
                )}
              </div>
            ) : (
              <EmptyState message={currentTabInfo?.emptyMessage || '템플릿이 없어요'} tabId={activeTab} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

// ============================================
// 템플릿 카드 컴포넌트
// ============================================

interface TemplateCardProps {
  template: SelectedTemplate
  index: number
  onSelect: (template: SelectedTemplate) => void
}

function TemplateCard({ template, index, onSelect }: TemplateCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(template)}
      className={cn(
        'group relative bg-white rounded-2xl border-2 border-gray-200 p-6 text-left',
        'transition-all duration-300 ease-out',
        'hover:border-primary-400 hover:shadow-[0_8px_24px_rgba(255,180,180,0.3)]',
        'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2'
      )}
    >
      {/* NEW 뱃지 - 반짝 효과 */}
      {template.isNew && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 400 }}
          className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-primary-400 to-accent-400 text-white text-xs font-medium rounded-full badge-sparkle"
        >
          <Sparkles className="w-3 h-3" />
          NEW
        </motion.span>
      )}

      {/* 이모지 아이콘 - 호버 시 살랑살랑 */}
      <motion.div
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-3xl mb-4"
        whileHover={{
          scale: 1.1,
          rotate: [0, -5, 5, -3, 3, 0],
          transition: { rotate: { duration: 0.6 } }
        }}
      >
        {template.emoji}
      </motion.div>

      {/* 제목 */}
      <h3 className="text-lg font-bold text-gray-900 mb-1">
        {template.title}
      </h3>

      {/* 설명 */}
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
        {template.description}
      </p>

      {/* 태그 */}
      {template.tags && template.tags.length > 0 && (
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
      )}

      {/* 작성자 (허브 템플릿) */}
      {template.author && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            by {template.author}
          </p>
        </div>
      )}
    </motion.button>
  )
}

// ============================================
// 빈 상태 컴포넌트
// ============================================

interface EmptyStateProps {
  message: string
  tabId: TemplateSource
}

/* eslint-disable react-hooks/purity, react-hooks/static-components */
function EmptyState({ message, tabId }: EmptyStateProps) {
  const getIcon = () => {
    switch (tabId) {
      case 'my-library':
        return BookHeart
      case 'hub':
        return Globe
      default:
        return Package
    }
  }

  const Icon = getIcon()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-gray-300" />
      </div>
      <p className="text-gray-500 mb-4">{message}</p>

      {tabId === 'my-library' && (
        <Button variant="secondary" asChild>
          <Link href="/templates">자료 허브에서 템플릿 찾기</Link>
        </Button>
      )}

      {tabId === 'hub' && (
        <Button variant="secondary" asChild>
          <Link href="/templates">자료 허브 둘러보기</Link>
        </Button>
      )}
    </motion.div>
  )
}
/* eslint-enable react-hooks/purity, react-hooks/static-components */
