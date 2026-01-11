'use client'

/**
 * 위스퍼 페이지
 *
 * 기능:
 * - 받은 위스퍼 / 보낸 위스퍼 탭
 * - 위스퍼 목록 표시
 * - 위스퍼 상세 모달
 * - 새 위스퍼 작성 (크리에이터)
 *
 * UX:
 * - 스켈레톤 로딩
 * - 빈 상태 안내
 * - 무한 스크롤
 * - 부드러운 트랜지션
 */

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Inbox,
  Send,
  RefreshCw,
  Plus,
  MessageCircle,
  Gift,
  Bell,
  Clock,
  Check,
  AlertCircle,
  ChevronDown,
  Moon,
  Heart,
  Star,
  Sparkles,
  Flower2,
} from 'lucide-react'
import type { WhisperThemeConfig } from '@/types/whisper'

// 테마 아이콘 매핑
const THEME_ICONS: Record<WhisperThemeConfig['iconName'], typeof Moon> = {
  Moon,
  Heart,
  Star,
  Sparkles,
  Flower2,
}
import { cn } from '@/lib/utils/cn'
import { useWhispers } from '@/hooks/useWhispers'
import { WhisperCard } from '@/components/whisper/WhisperCard'
import { WhisperComposer } from '@/components/whisper/WhisperComposer'
import type { Whisper } from '@/types/whisper'
import {
  WHISPER_THEMES,
  getWhisperTypeLabel,
  hasGift,
} from '@/types/whisper'

// ============================================
// 타입 정의
// ============================================

type TabType = 'received' | 'sent'
type FilterType = 'all' | 'unread' | 'gift' | 'expired'

interface TabConfig {
  id: TabType
  label: string
  icon: typeof Inbox
}

// ============================================
// 상수
// ============================================

const TABS: TabConfig[] = [
  { id: 'received', label: '받은 위스퍼', icon: Inbox },
  { id: 'sent', label: '보낸 위스퍼', icon: Send },
]

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'unread', label: '미확인' },
  { id: 'gift', label: '선물' },
]

// ============================================
// 스켈레톤 컴포넌트
// ============================================

function WhisperSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
          <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
      </div>
    </div>
  )
}

function WhisperListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <WhisperSkeleton key={i} />
      ))}
    </div>
  )
}

// ============================================
// 빈 상태 컴포넌트
// ============================================

interface EmptyStateProps {
  type: TabType
  filter: FilterType
}

function EmptyState({ type, filter }: EmptyStateProps) {
  const messages = {
    received: {
      all: {
        title: '아직 받은 위스퍼가 없어요',
        description: '크리에이터를 구독하면 특별한 위스퍼를 받을 수 있어요',
      },
      unread: {
        title: '모든 위스퍼를 확인했어요',
        description: '새로운 위스퍼가 오면 알려드릴게요',
      },
      gift: {
        title: '선물이 담긴 위스퍼가 없어요',
        description: '크리에이터가 보내는 특별한 선물을 기다려보세요',
      },
      expired: {
        title: '만료된 위스퍼가 없어요',
        description: '',
      },
    },
    sent: {
      all: {
        title: '아직 보낸 위스퍼가 없어요',
        description: '구독자에게 특별한 메시지를 보내보세요',
      },
      unread: {
        title: '모든 위스퍼가 읽혔어요',
        description: '구독자들이 위스퍼를 확인했어요',
      },
      gift: {
        title: '선물을 보낸 적이 없어요',
        description: '구독자에게 특별한 선물을 보내보세요',
      },
      expired: {
        title: '만료된 위스퍼가 없어요',
        description: '',
      },
    },
  }

  const content = messages[type][filter]

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-primary-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {content.title}
      </h3>
      {content.description && (
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
          {content.description}
        </p>
      )}
    </motion.div>
  )
}

// ============================================
// 에러 상태 컴포넌트
// ============================================

interface ErrorStateProps {
  error: Error
  onRetry: () => void
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        오류가 발생했어요
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">
        {error.message}
      </p>
      <button
        onClick={onRetry}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg',
          'bg-primary-400 text-white hover:bg-primary-500',
          'transition-colors'
        )}
      >
        <RefreshCw className="w-4 h-4" />
        다시 시도
      </button>
    </motion.div>
  )
}

// ============================================
// 위스퍼 아이템 컴포넌트
// ============================================

interface WhisperListItemProps {
  whisper: Whisper
  onClick: () => void
}

function WhisperListItem({ whisper, onClick }: WhisperListItemProps) {
  const theme = WHISPER_THEMES[whisper.theme]
  const isUnread = whisper.status === 'SENT'
  const hasPendingGift = hasGift(whisper) && whisper.status !== 'CLAIMED'

  // 상태 뱃지
  const statusBadge = useMemo(() => {
    switch (whisper.status) {
      case 'PENDING':
        return { label: '예약됨', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock }
      case 'SENT':
        return { label: '미확인', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: Bell }
      case 'READ':
        return hasPendingGift
          ? { label: '선물 대기', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Gift }
          : null
      case 'CLAIMED':
        return { label: '수령 완료', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Check }
      case 'EXPIRED':
        return { label: '만료됨', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500', icon: Clock }
      default:
        return null
    }
  }, [whisper.status, hasPendingGift])

  // 시간 포맷
  const timeAgo = useMemo(() => {
    const date = whisper.sentAt ? new Date(whisper.sentAt) : new Date(whisper.createdAt)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }, [whisper.sentAt, whisper.createdAt])

  return (
    <motion.button
      className={cn(
        'w-full text-left p-4 rounded-2xl',
        'bg-gradient-to-br transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.01]',
        'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
        isUnread
          ? `${theme.backgroundGradient} ${theme.glowColor}`
          : 'from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700'
      )}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        {/* 테마 아이콘 */}
        {(() => {
          const ThemeIcon = THEME_ICONS[theme.iconName]
          return (
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isUnread ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
              )}
            >
              <ThemeIcon className={cn('w-5 h-5', isUnread ? theme.textColor : 'text-gray-500')} />
            </div>
          )
        })()}

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'text-sm font-medium',
                isUnread ? theme.accentColor : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {getWhisperTypeLabel(whisper.whisperType)}
            </span>
            {statusBadge && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                  statusBadge.color
                )}
              >
                <statusBadge.icon className="w-3 h-3" />
                {statusBadge.label}
              </span>
            )}
          </div>

          <p
            className={cn(
              'text-sm line-clamp-2',
              isUnread ? theme.textColor : 'text-gray-700 dark:text-gray-300'
            )}
          >
            {whisper.payload.message}
          </p>

          {/* 선물 표시 */}
          {hasGift(whisper) && (
            <div
              className={cn(
                'inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs',
                isUnread
                  ? 'bg-white/20 ' + theme.textColor
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
              )}
            >
              <Gift className="w-3 h-3" />
              선물 포함
            </div>
          )}
        </div>

        {/* 시간 */}
        <span
          className={cn(
            'text-xs whitespace-nowrap',
            isUnread ? theme.textColor + ' opacity-60' : 'text-gray-400'
          )}
        >
          {timeAgo}
        </span>
      </div>
    </motion.button>
  )
}

// ============================================
// 메인 페이지 컴포넌트
// ============================================

export default function WhispersPage() {
  // 상태
  const [activeTab, setActiveTab] = useState<TabType>('received')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedWhisper, setSelectedWhisper] = useState<Whisper | null>(null)
  const [showComposer, setShowComposer] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 데이터 훅
  const {
    receivedWhispers,
    sentWhispers,
    unreadCount,
    isLoading,
    error,
    refetchReceived,
    refetchSent,
    markAsRead,
    claimGift,
    loadMoreReceived,
    loadMoreSent,
    hasMoreReceived,
    hasMoreSent,
  } = useWhispers()

  // 필터링된 위스퍼
  const filteredWhispers = useMemo(() => {
    const whispers = activeTab === 'received' ? receivedWhispers : sentWhispers

    switch (filter) {
      case 'unread':
        return whispers.filter((w) => w.status === 'SENT')
      case 'gift':
        return whispers.filter((w) => hasGift(w))
      default:
        return whispers
    }
  }, [activeTab, receivedWhispers, sentWhispers, filter])

  // 새로고침
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      if (activeTab === 'received') {
        await refetchReceived()
      } else {
        await refetchSent()
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [activeTab, refetchReceived, refetchSent])

  // 위스퍼 클릭
  const handleWhisperClick = useCallback(async (whisper: Whisper) => {
    setSelectedWhisper(whisper)

    // 미읽은 위스퍼면 읽음 처리
    if (whisper.status === 'SENT') {
      await markAsRead(whisper.id)
    }
  }, [markAsRead])

  // 위스퍼 모달 닫기
  const handleCloseModal = useCallback(() => {
    setSelectedWhisper(null)
  }, [])

  // 선물 수령
  const handleClaimGift = useCallback(async (whisper: Whisper) => {
    await claimGift(whisper.id)
  }, [claimGift])

  // 더 불러오기
  const handleLoadMore = useCallback(async () => {
    if (activeTab === 'received') {
      await loadMoreReceived()
    } else {
      await loadMoreSent()
    }
  }, [activeTab, loadMoreReceived, loadMoreSent])

  const hasMore = activeTab === 'received' ? hasMoreReceived : hasMoreSent

  return (
    <div className="animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            위스퍼
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* 새로고침 버튼 */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800',
              isRefreshing && 'animate-spin'
            )}
            title="새로고침"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* 새 위스퍼 작성 버튼 (크리에이터용) */}
          <button
            onClick={() => setShowComposer(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl',
              'bg-primary-400 text-white',
              'hover:bg-primary-500',
              'transition-colors'
            )}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">새 위스퍼</span>
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const count = tab.id === 'received' ? unreadCount : 0

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
                'text-sm font-medium transition-all',
                isActive
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {count > 0 && (
                <span className="px-1.5 py-0.5 bg-pink-500 text-white text-[10px] font-bold rounded-full">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              filter === f.id
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 위스퍼 목록 */}
      {isLoading ? (
        <WhisperListSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={handleRefresh} />
      ) : filteredWhispers.length === 0 ? (
        <EmptyState type={activeTab} filter={filter} />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredWhispers.map((whisper, index) => (
              <motion.div
                key={whisper.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <WhisperListItem
                  whisper={whisper}
                  onClick={() => handleWhisperClick(whisper)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 더 불러오기 버튼 */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                  'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
                )}
              >
                <ChevronDown className="w-4 h-4" />
                더 보기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 위스퍼 상세 모달 */}
      <AnimatePresence>
        {selectedWhisper && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <WhisperCard
                whisper={selectedWhisper}
                onClaim={handleClaimGift}
                onClose={handleCloseModal}
                readOnly={selectedWhisper.status !== 'SENT'}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 위스퍼 작성 모달 */}
      <AnimatePresence>
        {showComposer && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowComposer(false)}
          >
            <motion.div
              className="w-full max-w-lg"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <WhisperComposer
                isOpen={showComposer}
                onClose={() => setShowComposer(false)}
                onSend={async () => {
                  setShowComposer(false)
                  await refetchSent()
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
