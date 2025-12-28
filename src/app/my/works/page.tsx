'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, MoreVertical, Trash2, Edit2, Share2, Clock, Eye, EyeOff } from 'lucide-react'
import { Button, Tag } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

// 샘플 데이터
const sampleWorks = [
  {
    id: '1',
    title: '우리 커플 프로필',
    templateTitle: '커플 프로필 틀',
    emoji: '💕',
    status: 'completed' as const,
    isPublic: true,
    updatedAt: '2025-01-20',
  },
  {
    id: '2',
    title: '친구들 관계도',
    templateTitle: '친구 관계도',
    emoji: '✨',
    status: 'draft' as const,
    isPublic: false,
    updatedAt: '2025-01-18',
  },
  {
    id: '3',
    title: '내 OC 소개',
    templateTitle: 'OC 소개 카드',
    emoji: '🌙',
    status: 'draft' as const,
    isPublic: false,
    updatedAt: '2025-01-15',
  },
]

type WorkStatus = 'all' | 'completed' | 'draft'

export default function MyWorksPage() {
  const [filter, setFilter] = useState<WorkStatus>('all')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const filteredWorks = sampleWorks.filter((work) => {
    if (filter === 'all') return true
    return work.status === filter
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">내 작업</h2>
          <span className="text-sm text-gray-500">({sampleWorks.length})</span>
        </div>
        <Button asChild>
          <Link href="/templates">
            <Plus className="w-4 h-4 mr-2" />
            새 작업
          </Link>
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'all', label: '전체' },
          { value: 'completed', label: '완료' },
          { value: 'draft', label: '작성 중' },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value as WorkStatus)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              filter === item.value
                ? 'bg-primary-400 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Works Grid */}
      {filteredWorks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorks.map((work) => (
            <div
              key={work.id}
              className="bg-white rounded-[20px] border border-gray-200 overflow-hidden hover:shadow-md transition-all group"
            >
              {/* Preview */}
              <Link href={`/editor/${work.id}`}>
                <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-5xl relative">
                  {work.emoji}
                  {work.status === 'draft' && (
                    <div className="absolute top-3 left-3">
                      <Tag variant="outline">작성 중</Tag>
                    </div>
                  )}
                </div>
              </Link>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link href={`/editor/${work.id}`}>
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-400 transition-colors">
                        {work.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 truncate">{work.templateTitle}</p>
                  </div>

                  {/* Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === work.id ? null : work.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {menuOpen === work.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 animate-scale-in">
                          <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Edit2 className="w-4 h-4" />
                            이름 변경
                          </button>
                          <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Share2 className="w-4 h-4" />
                            공유하기
                          </button>
                          <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            {work.isPublic ? (
                              <>
                                <EyeOff className="w-4 h-4" />
                                비공개로 전환
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                공개로 전환
                              </>
                            )}
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                            삭제
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {work.updatedAt}
                  </span>
                  <span className="flex items-center gap-1">
                    {work.isPublic ? (
                      <>
                        <Eye className="w-3 h-3" />
                        공개
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        비공개
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-[20px]">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? '아직 작업이 없어요' : '해당하는 작업이 없어요'}
          </h3>
          <p className="text-gray-500 mb-6">
            틀을 선택해서 새로운 작업을 시작해보세요!
          </p>
          <Button asChild>
            <Link href="/templates">틀 둘러보기</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
