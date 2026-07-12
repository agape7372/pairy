'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Folder,
  FolderPlus,
  Download,
  Clock,
  Heart,
  MoreVertical,
  Grid,
  List,
  Search,
  Plus,
  Users,
  Sparkles,
  HardDrive,
  CheckCircle,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { Button, useToast, EmptyState } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { useSubscriptionStore, TIER_LIMITS, PRICING } from '@/stores/subscriptionStore'
import { useLibraryFolders } from '@/hooks/useLibraryFolders'
import { RESOURCE_CATEGORIES, type ResourceCategory } from '@/types/resources'
import { FOLDER_NAME_MAX_LENGTH, type LibraryFolder } from '@/types/database.types'

// 다운로드 기록 타입 (실 배선은 M5 resources — 그때까지 빈 목록)
interface DownloadItem {
  id: string
  resourceId: string
  resourceTitle: string
  resourceCategory: ResourceCategory
  creatorName: string
  downloadedAt: string
  folderId: string | null
}

const downloads: DownloadItem[] = [] // 다운로드 이력 실 배선은 M5(resources)

// 폴더 이모지 선택지
const FOLDER_EMOJIS = ['📁', '🎨', '💕', '⭐', '🌸', '🎀', '📌', '✨'] as const

// 상대 시간 포맷
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

// ============================================
// 폴더 생성/이름변경 모달
// ============================================

interface FolderModalProps {
  mode: 'create' | 'rename'
  initialName?: string
  initialEmoji?: string
  isSaving: boolean
  onClose: () => void
  onSubmit: (name: string, emoji: string) => void
}

// 조건부 렌더 + key 로 마운트 시점에 초기값 주입 (effect 내 setState 회피)
function FolderModal({
  mode,
  initialName = '',
  initialEmoji = '📁',
  isSaving,
  onClose,
  onSubmit,
}: FolderModalProps) {
  const [name, setName] = useState(initialName)
  const [emoji, setEmoji] = useState(initialEmoji)

  const canSubmit = name.trim().length > 0 && name.trim().length <= FOLDER_NAME_MAX_LENGTH && !isSaving

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 pointer-events-auto animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {mode === 'create' ? '새 폴더' : '폴더 이름 변경'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="닫기"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* 이모지 선택 */}
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            {FOLDER_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={cn(
                  'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors',
                  emoji === e
                    ? 'bg-primary-100 ring-2 ring-primary-400'
                    : 'bg-gray-50 hover:bg-gray-100'
                )}
                aria-label={`이모지 ${e}`}
              >
                {e}
              </button>
            ))}
          </div>

          <input
            autoFocus
            type="text"
            placeholder="폴더 이름"
            value={name}
            maxLength={FOLDER_NAME_MAX_LENGTH}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSubmit) onSubmit(name.trim(), emoji)
              if (e.key === 'Escape') onClose()
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 mb-4"
          />

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              취소
            </Button>
            <Button
              size="sm"
              disabled={!canSubmit}
              onClick={() => onSubmit(name.trim(), emoji)}
            >
              {isSaving ? '저장 중...' : mode === 'create' ? '만들기' : '변경'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================
// 페이지
// ============================================

export default function MyLibraryPage() {
  const { subscription } = useSubscriptionStore()
  const limits = TIER_LIMITS[subscription.tier]
  const toast = useToast()
  const { folders, isLoading, createFolder, renameFolder, deleteFolder } = useLibraryFolders()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState<'folders' | 'downloads' | 'favorites'>('folders')
  const [searchQuery, setSearchQuery] = useState('')
  const [modalState, setModalState] = useState<
    | { mode: 'create' }
    | { mode: 'rename'; folder: LibraryFolder }
    | null
  >(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [menuFolderId, setMenuFolderId] = useState<string | null>(null)

  // ⋮ 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (!menuFolderId) return
    const close = () => setMenuFolderId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuFolderId])

  // 스토리지 사용량 — 실 집계는 M5(리소스/스토리지 배선) 후. 그때까지 0 표기(가짜 수치 금지)
  const usedStorageMB = 0
  const maxStorageMB = limits.cloudStorageMB

  // 폴더 수 제한 (UX 용 — 서버 트리거가 최종 강제)
  const canCreateFolder = folders.length < limits.maxLibraryFolders

  // 듀오 구독 체크
  const isDuo = subscription.tier === 'duo'
  const duoPartner = subscription.duoPartner

  // 검색 필터
  const query = searchQuery.trim().toLowerCase()
  const filteredFolders = query
    ? folders.filter((f) => f.name.toLowerCase().includes(query))
    : folders
  const filteredDownloads = query
    ? downloads.filter(
        (d) =>
          d.resourceTitle.toLowerCase().includes(query) ||
          d.creatorName.toLowerCase().includes(query)
      )
    : downloads

  // 모달 제출
  const handleModalSubmit = async (name: string, emoji: string) => {
    if (!modalState) return
    setIsSaving(true)
    try {
      if (modalState.mode === 'create') {
        const created = await createFolder(name, emoji)
        if (created) {
          toast.success('폴더를 만들었어요!')
          setModalState(null)
        } else {
          toast.error('폴더 생성에 실패했어요. 로그인 상태를 확인해주세요.')
        }
      } else {
        const ok = await renameFolder(modalState.folder.id, name)
        if (ok) {
          toast.success('폴더 이름을 변경했어요!')
          setModalState(null)
        } else {
          toast.error('이름 변경에 실패했어요.')
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  // 폴더 삭제
  const handleDelete = async (folder: LibraryFolder) => {
    if (!window.confirm(`'${folder.name}' 폴더를 삭제할까요?`)) return
    const ok = await deleteFolder(folder.id)
    if (ok) toast.success('폴더를 삭제했어요.')
    else toast.error('폴더 삭제에 실패했어요.')
  }

  return (
    <div className="py-8 px-4 animate-fade-in">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              내 <span className="text-primary-400">서재</span>
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              다운로드한 자료와 북마크를 정리하세요
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-48 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>

            {/* 보기 모드 */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-primary-50 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">클라우드 스토리지</span>
            </div>
            <span className="text-sm text-gray-500">
              {usedStorageMB}MB / {maxStorageMB === Infinity ? '무제한' : `${maxStorageMB}MB`}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-accent-400 rounded-full transition-all"
              style={{ width: maxStorageMB === Infinity ? '10%' : `${Math.min((usedStorageMB / maxStorageMB) * 100, 100)}%` }}
            />
          </div>
          {subscription.tier === 'free' && (
            <p className="text-xs text-gray-500 mt-2">
              프리미엄으로 업그레이드하면 1GB 스토리지를 사용할 수 있어요
            </p>
          )}
        </div>

        {/* Duo Shared Library Banner */}
        {isDuo && duoPartner && (
          <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {duoPartner.displayName}님과 함께하는 서재
                </h3>
                <p className="text-sm text-gray-500">
                  공유 폴더 {folders.filter(f => f.is_shared).length}개 · 듀오 크레딧 {subscription.duoCredits}개
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
          {[
            { id: 'folders', label: '폴더', icon: Folder, count: folders.length },
            { id: 'downloads', label: '다운로드', icon: Download, count: downloads.length },
            { id: 'favorites', label: '즐겨찾기', icon: Heart, count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-primary-400 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'folders' && (
          <>
            {/* Folders Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {folders.length}개 폴더
                {limits.maxLibraryFolders !== Infinity && (
                  <span className="text-gray-400"> / 최대 {limits.maxLibraryFolders}개</span>
                )}
              </p>
              <Button
                size="sm"
                onClick={() => setModalState({ mode: 'create' })}
                disabled={!canCreateFolder}
              >
                <FolderPlus className="w-4 h-4 mr-1" />
                새 폴더
              </Button>
            </div>

            {/* Folders Grid */}
            <div className={cn(
              'gap-4',
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                : 'flex flex-col'
            )}>
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={cn(
                    'group bg-white rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md relative',
                    viewMode === 'grid' ? 'p-4' : 'p-3 flex items-center gap-4',
                    selectedFolder === folder.id ? 'border-primary-400' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {/* Folder Icon */}
                  <div className={cn(
                    'flex items-center justify-center rounded-xl bg-gray-100 group-hover:bg-primary-100 transition-colors',
                    viewMode === 'grid' ? 'w-full aspect-square mb-3 text-4xl' : 'w-12 h-12 text-2xl shrink-0'
                  )}>
                    {folder.emoji}
                  </div>

                  <div className={cn(viewMode === 'list' && 'flex-1')}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {folder.name}
                      </h3>
                      {folder.is_shared && (
                        <Users className="w-3.5 h-3.5 text-pink-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(folder.created_at)} 생성
                    </p>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuFolderId(menuFolderId === folder.id ? null : folder.id)
                    }}
                    className={cn(
                      'p-1.5 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity',
                      menuFolderId === folder.id && 'opacity-100 bg-gray-100',
                      viewMode === 'grid' ? 'absolute top-3 right-3' : ''
                    )}
                    aria-label="폴더 메뉴"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* ⋮ 드롭다운 메뉴 */}
                  {menuFolderId === folder.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'absolute z-10 w-36 bg-white rounded-xl border border-gray-200 shadow-lg py-1 animate-fade-in',
                        viewMode === 'grid' ? 'top-10 right-3' : 'top-12 right-3'
                      )}
                    >
                      <button
                        onClick={() => {
                          setMenuFolderId(null)
                          setModalState({ mode: 'rename', folder })
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        이름 변경
                      </button>
                      <button
                        onClick={() => {
                          setMenuFolderId(null)
                          handleDelete(folder)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Create Folder Card */}
              {canCreateFolder && viewMode === 'grid' && !query && (
                <button
                  onClick={() => setModalState({ mode: 'create' })}
                  className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all group"
                >
                  <div className="w-full aspect-square flex flex-col items-center justify-center">
                    <Plus className="w-8 h-8 text-gray-400 group-hover:text-primary-400 mb-2" />
                    <span className="text-sm text-gray-500 group-hover:text-primary-600">
                      새 폴더
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* 검색 결과 없음 */}
            {query && filteredFolders.length === 0 && !isLoading && (
              <EmptyState
                compact
                icon={Search}
                title="검색 결과가 없어요"
                description={`'${searchQuery}' 와 일치하는 폴더가 없습니다`}
              />
            )}

            {/* Folder Limit Warning */}
            {!canCreateFolder && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-700">
                  폴더를 최대 {limits.maxLibraryFolders}개까지 만들 수 있어요.
                  <Link href="/premium" className="ml-1 underline font-medium">
                    업그레이드하기
                  </Link>
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'downloads' && (
          filteredDownloads.length === 0 ? (
            <EmptyState
              compact
              icon={Download}
              title="다운로드 기록이 없어요"
              description="자료 허브에서 다운로드한 자료가 여기에 표시됩니다"
              actionLabel="자료 허브 둘러보기"
              actionHref="/templates"
            />
          ) : (
          <div className="space-y-3">
            {filteredDownloads.map((item) => {
              const categoryInfo = RESOURCE_CATEGORIES[item.resourceCategory]
              return (
                <Link
                  key={item.id}
                  href={`/templates/${item.resourceId}`}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all"
                >
                  {/* Thumbnail */}
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0',
                    categoryInfo.bgColor
                  )}>
                    {categoryInfo.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.resourceTitle}
                      </h3>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                        categoryInfo.bgColor,
                        categoryInfo.color
                      )}>
                        {categoryInfo.nameKo}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>by {item.creatorName}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(item.downloadedAt)}
                      </span>
                      {item.folderId && (
                        <span className="flex items-center gap-1">
                          <Folder className="w-3 h-3" />
                          {folders.find(f => f.id === item.folderId)?.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        toast.success('다시 다운로드 시작!')
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Download className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </Link>
              )
            })}
          </div>
          )
        )}

        {activeTab === 'favorites' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              즐겨찾기한 자료
            </h3>
            <p className="text-gray-500 mb-4">
              좋아요를 누른 자료들이 여기에 표시됩니다
            </p>
            <Button asChild>
              <Link href="/templates">자료 허브 둘러보기</Link>
            </Button>
          </div>
        )}

        {/* Upgrade CTA for Free Users */}
        {subscription.tier === 'free' && (
          <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl border border-primary-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">
                  프리미엄으로 더 많은 기능을!
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    무제한 다운로드
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    폴더 20개까지 생성
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    1GB 클라우드 스토리지
                  </li>
                </ul>
                <div className="flex items-center gap-3">
                  <Button asChild>
                    <Link href="/premium">
                      ₩{PRICING.premium.monthly.toLocaleString()}/월 시작하기
                    </Link>
                  </Button>
                  <span className="text-sm text-gray-500">
                    또는 듀오로 함께 ₩{PRICING.duo.perPerson.toLocaleString()}/인
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 폴더 생성/이름변경 모달 */}
      {modalState && (
        <FolderModal
          key={modalState.mode === 'rename' ? `rename-${modalState.folder.id}` : 'create'}
          mode={modalState.mode}
          initialName={modalState.mode === 'rename' ? modalState.folder.name : ''}
          initialEmoji={modalState.mode === 'rename' ? modalState.folder.emoji : '📁'}
          isSaving={isSaving}
          onClose={() => setModalState(null)}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  )
}
