'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, MoreVertical, Trash2, Edit2, Share2, Clock, Eye, EyeOff, X, Check, AlertTriangle, FileText } from 'lucide-react'
import { Button, Tag } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { getIcon, getIconColor, type IconName } from '@/lib/utils/icons'

// 작품 타입 정의
interface Work {
  id: string
  title: string
  templateTitle: string
  icon: IconName
  status: 'completed' | 'draft'
  isPublic: boolean
  updatedAt: string
}

// 초기 샘플 데이터
const initialWorks: Work[] = [
  {
    id: '1',
    title: '우리 커플 프로필',
    templateTitle: '커플 프로필 틀',
    icon: 'heart',
    status: 'completed',
    isPublic: true,
    updatedAt: '2025-01-20',
  },
  {
    id: '2',
    title: '친구들 관계도',
    templateTitle: '친구 관계도',
    icon: 'sparkles',
    status: 'draft',
    isPublic: false,
    updatedAt: '2025-01-18',
  },
  {
    id: '3',
    title: '내 OC 소개',
    templateTitle: 'OC 소개 카드',
    icon: 'moon',
    status: 'draft',
    isPublic: false,
    updatedAt: '2025-01-15',
  },
]

type WorkStatus = 'all' | 'completed' | 'draft'

export default function MyWorksPage() {
  // 데모 모드에서는 로컬 상태로 작품 관리
  const [works, setWorks] = useState<Work[]>(initialWorks)
  const [filter, setFilter] = useState<WorkStatus>('all')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  // 이름 변경 모달 상태
  const [editingWork, setEditingWork] = useState<Work | null>(null)
  const [editTitle, setEditTitle] = useState('')

  // 삭제 확인 모달 상태
  const [deletingWork, setDeletingWork] = useState<Work | null>(null)

  // 토스트 메시지 상태
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // 토스트 표시 함수
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // 이름 변경 시작
  const startRename = (work: Work) => {
    setEditingWork(work)
    setEditTitle(work.title)
    setMenuOpen(null)
  }

  // 이름 변경 저장
  const saveRename = () => {
    if (!editingWork || !editTitle.trim()) return

    setWorks(prev => prev.map(w =>
      w.id === editingWork.id ? { ...w, title: editTitle.trim() } : w
    ))
    setEditingWork(null)
    showToast('이름이 변경되었어요')
  }

  // 공개/비공개 토글
  const toggleVisibility = (workId: string) => {
    setWorks(prev => prev.map(w => {
      if (w.id === workId) {
        const newIsPublic = !w.isPublic
        showToast(newIsPublic ? '공개로 전환되었어요' : '비공개로 전환되었어요')
        return { ...w, isPublic: newIsPublic }
      }
      return w
    }))
    setMenuOpen(null)
  }

  // 삭제 확인 시작
  const startDelete = (work: Work) => {
    setDeletingWork(work)
    setMenuOpen(null)
  }

  // 삭제 실행
  const confirmDelete = () => {
    if (!deletingWork) return

    setWorks(prev => prev.filter(w => w.id !== deletingWork.id))
    setDeletingWork(null)
    showToast('작업이 삭제되었어요')
  }

  // 공유하기
  const handleShare = async (work: Work) => {
    const shareUrl = `${window.location.origin}/works/${work.id}`

    if (navigator.share) {
      navigator.share({
        title: work.title,
        text: `${work.title} - Pairy에서 만든 작품`,
        url: shareUrl,
      }).catch(() => {
        // 사용자가 공유를 취소한 경우
      })
    } else {
      // 클립보드에 복사 (폴백 지원)
      const success = await copyToClipboard(shareUrl)
      if (success) {
        showToast('링크가 복사되었어요')
      } else {
        showToast('링크 복사에 실패했어요', 'error')
      }
    }
    setMenuOpen(null)
  }

  const filteredWorks = works.filter((work) => {
    if (filter === 'all') return true
    return work.status === filter
  })

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg animate-fade-in',
            toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'
          )}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">내 작업</h2>
          <span className="text-sm text-gray-500">({works.length})</span>
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
                <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center relative">
                  {(() => {
                    const IconComponent = getIcon(work.icon)
                    const iconColor = getIconColor(work.icon)
                    return <IconComponent className={`w-16 h-16 ${iconColor}`} strokeWidth={1.5} />
                  })()}
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
                          <button
                            onClick={() => startRename(work)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit2 className="w-4 h-4" />
                            이름 변경
                          </button>
                          <button
                            onClick={() => handleShare(work)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Share2 className="w-4 h-4" />
                            공유하기
                          </button>
                          <button
                            onClick={() => toggleVisibility(work.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
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
                          <button
                            onClick={() => startDelete(work)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary-400" strokeWidth={1.5} />
          </div>
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

      {/* Rename Modal */}
      {editingWork && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[24px] max-w-[400px] w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">이름 변경</h3>
              <button
                onClick={() => setEditingWork(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="작업 이름을 입력하세요"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent mb-6"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRename()
                if (e.key === 'Escape') setEditingWork(null)
              }}
            />

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setEditingWork(null)}
              >
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={saveRename}
                disabled={!editTitle.trim()}
              >
                <Check className="w-4 h-4 mr-1" />
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingWork && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[24px] max-w-[400px] w-full p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                작업을 삭제할까요?
              </h3>
              <p className="text-gray-500 text-sm">
                &ldquo;{deletingWork.title}&rdquo;을(를) 삭제하면 복구할 수 없어요.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setDeletingWork(null)}
              >
                취소
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-red-500 hover:!bg-red-600"
                onClick={confirmDelete}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
