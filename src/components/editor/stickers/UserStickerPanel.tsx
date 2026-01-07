'use client'

/**
 * Sprint 34: 유저 스티커 패널
 *
 * UX 특징:
 * - 스켈레톤 로딩
 * - 드래그 앤 드롭 업로드
 * - 업로드 진행률 표시
 * - 부드러운 애니메이션
 * - 키보드 접근성 (A11y)
 * - 에러 상태 시각적 피드백
 */

import React, { useCallback, useRef, useState, memo, useMemo } from 'react'
import {
  Plus,
  X,
  FolderHeart,
  Loader2,
  AlertCircle,
  CheckCircle,
  Upload,
  ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserStickers, type UploadStatus } from '@/hooks/useUserStickers'
import {
  type UserSticker,
  type Sticker,
  userStickerToSticker,
  USER_STICKER_LIMITS,
} from '@/types/sticker'
import { formatFileSize } from '@/lib/utils/imageCompressor'

// ============================================
// 타입 정의
// ============================================

interface UserStickerPanelProps {
  /** 스티커 클릭 시 콜백 */
  onAddToCanvas: (sticker: Sticker) => void
  /** 프리미엄 유저 여부 */
  isPremium?: boolean
}

// ============================================
// 서브 컴포넌트: 스켈레톤 로더
// ============================================

const StickerSkeleton = memo(function StickerSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          className="aspect-square"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  )
})

// ============================================
// 서브 컴포넌트: 업로드 영역
// ============================================

interface UploadZoneProps {
  onUpload: (file: File) => void
  disabled: boolean
  uploadStatus: UploadStatus
  uploadProgress: number
  remainingSlots: number
  maxSlots: number
  currentCount: number
  totalSize: number
}

const UploadZone = memo(function UploadZone({
  onUpload,
  disabled,
  uploadStatus,
  uploadProgress,
  remainingSlots,
  maxSlots,
  currentCount,
  totalSize,
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // 파일 선택 핸들러
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onUpload(file)
      }
      // 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [onUpload]
  )

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        onUpload(file)
      }
    },
    [disabled, onUpload]
  )

  // 키보드 접근성
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
        e.preventDefault()
        fileInputRef.current?.click()
      }
    },
    [disabled]
  )

  // 상태별 아이콘 (useMemo로 최적화)
  const statusIcon = useMemo(() => {
    switch (uploadStatus) {
      case 'validating':
      case 'compressing':
      case 'saving':
        return <Loader2 className="w-5 h-5 animate-spin" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Plus className="w-5 h-5" />
    }
  }, [uploadStatus])

  // 상태별 텍스트
  const statusText = useMemo(() => {
    switch (uploadStatus) {
      case 'validating':
        return '파일 확인 중...'
      case 'compressing':
        return '이미지 최적화 중...'
      case 'saving':
        return '저장 중...'
      case 'success':
        return '업로드 완료!'
      case 'error':
        return '업로드 실패'
      default:
        return disabled ? '저장 공간 부족' : '스티커 추가'
    }
  }, [uploadStatus, disabled])

  const isUploading = ['validating', 'compressing', 'saving'].includes(uploadStatus)

  return (
    <div className="space-y-2">
      {/* 파일 입력 (숨김) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={USER_STICKER_LIMITS.ALLOWED_MIME_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
        aria-label="스티커 이미지 업로드"
        disabled={disabled || isUploading}
      />

      {/* 업로드 버튼 / 드롭존 */}
      <div
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
          isDragging && 'border-primary-400 bg-primary-50 scale-[1.02]',
          disabled
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            : isUploading
            ? 'border-primary-300 bg-primary-50 text-primary-600 cursor-wait'
            : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50 cursor-pointer'
        )}
        aria-disabled={disabled || isUploading}
        aria-busy={isUploading}
      >
        {statusIcon}
        <span className="text-sm font-medium">{statusText}</span>

        {/* 진행률 바 */}
        {isUploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
            <div
              className="h-full bg-primary-400 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* 용량 정보 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {currentCount}/{maxSlots}개
          {remainingSlots <= 5 && remainingSlots > 0 && (
            <span className="text-amber-500 ml-1">({remainingSlots}개 남음)</span>
          )}
        </span>
        <span>{formatFileSize(totalSize)}</span>
      </div>
    </div>
  )
})

// ============================================
// 서브 컴포넌트: 스티커 아이템
// ============================================

interface StickerItemProps {
  sticker: UserSticker
  onAdd: () => void
  onDelete: () => void
  index: number
}

const StickerItem = memo(function StickerItem({
  sticker,
  onAdd,
  onDelete,
  index,
}: StickerItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsDeleting(true)
      // 애니메이션 후 삭제
      setTimeout(() => {
        onDelete()
      }, 150)
    },
    [onDelete]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onAdd()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        handleDelete(e as unknown as React.MouseEvent)
      }
    },
    [onAdd, handleDelete]
  )

  return (
    <div
      className={cn(
        'relative group aspect-square',
        'transform transition-all duration-200',
        isDeleting && 'scale-0 opacity-0'
      )}
      style={{ animationDelay: `${index * 30}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 스티커 버튼 */}
      <button
        type="button"
        onClick={onAdd}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full h-full flex items-center justify-center',
          'bg-gray-50 rounded-xl border border-gray-200 overflow-hidden',
          'transition-all duration-200',
          'hover:bg-primary-50 hover:border-primary-300 hover:shadow-sm',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1',
          'active:scale-95'
        )}
        title={`${sticker.name} 추가`}
        aria-label={`${sticker.name} 스티커를 캔버스에 추가`}
      >
        {imageError ? (
          <ImageIcon className="w-8 h-8 text-gray-300" />
        ) : (
          <img
            src={sticker.thumbnailUrl || sticker.imageUrl}
            alt={sticker.name}
            className="w-full h-full object-contain p-1.5"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}
      </button>

      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={handleDelete}
        className={cn(
          'absolute -top-1.5 -right-1.5 w-6 h-6',
          'bg-red-500 text-white rounded-full shadow-md',
          'flex items-center justify-center',
          'transition-all duration-200',
          'hover:bg-red-600 hover:scale-110',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1',
          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
          'group-focus-within:opacity-100 group-focus-within:scale-100'
        )}
        title="삭제"
        aria-label={`${sticker.name} 스티커 삭제`}
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* 사용 횟수 배지 */}
      {sticker.useCount > 0 && (
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded-full">
          {sticker.useCount}
        </div>
      )}
    </div>
  )
})

// ============================================
// 서브 컴포넌트: 빈 상태
// ============================================

interface EmptyStateProps {
  onUploadClick: () => void
}

const EmptyState = memo(function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-primary-50 flex items-center justify-center">
        <FolderHeart className="w-8 h-8 text-primary-400" />
      </div>
      <p className="text-gray-600 font-medium mb-1">나만의 스티커를 추가해보세요!</p>
      <p className="text-gray-400 text-sm mb-4">
        PNG, JPG, GIF, WEBP 지원 (최대 {formatFileSize(USER_STICKER_LIMITS.MAX_FILE_SIZE)})
      </p>
      <button
        type="button"
        onClick={onUploadClick}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl',
          'bg-primary-400 text-white font-medium',
          'transition-all duration-200',
          'hover:bg-primary-500 hover:shadow-md',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
          'active:scale-95'
        )}
      >
        <Upload className="w-4 h-4" />
        첫 스티커 업로드하기
      </button>
    </div>
  )
})

// ============================================
// 서브 컴포넌트: 에러 배너
// ============================================

interface ErrorBannerProps {
  message: string
  onDismiss: () => void
}

const ErrorBanner = memo(function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-red-50 text-red-600 text-sm',
        'animate-in slide-in-from-top-2 duration-200'
      )}
      role="alert"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="p-0.5 rounded hover:bg-red-100 transition-colors"
        aria-label="에러 메시지 닫기"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
})

// ============================================
// 메인 컴포넌트
// ============================================

export const UserStickerPanel = memo(function UserStickerPanel({
  onAddToCanvas,
  isPremium = false,
}: UserStickerPanelProps) {
  const {
    stickers,
    isLoading,
    uploadStatus,
    uploadProgress,
    error,
    remainingSlots,
    maxSlots,
    totalSize,
    addSticker,
    deleteSticker,
    recordUsage,
    clearError,
  } = useUserStickers(isPremium)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 업로드 핸들러
  const handleUpload = useCallback(
    async (file: File) => {
      await addSticker(file)
    },
    [addSticker]
  )

  // 스티커 추가 핸들러
  const handleAddToCanvas = useCallback(
    (sticker: UserSticker) => {
      onAddToCanvas(userStickerToSticker(sticker))
      recordUsage(sticker.id)
    },
    [onAddToCanvas, recordUsage]
  )

  // 스티커 삭제 핸들러
  const handleDelete = useCallback(
    (id: string) => {
      deleteSticker(id)
    },
    [deleteSticker]
  )

  // 빈 상태에서 업로드 클릭
  const handleEmptyUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className="space-y-4" role="region" aria-label="내 스티커">
      {/* 숨김 파일 입력 (빈 상태 업로드용) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={USER_STICKER_LIMITS.ALLOWED_MIME_TYPES.join(',')}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
          e.target.value = ''
        }}
        className="hidden"
      />

      {/* 에러 배너 */}
      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      {/* 업로드 영역 */}
      <UploadZone
        onUpload={handleUpload}
        disabled={remainingSlots <= 0}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        remainingSlots={remainingSlots}
        maxSlots={maxSlots}
        currentCount={stickers.length}
        totalSize={totalSize}
      />

      {/* 로딩 상태 */}
      {isLoading && <StickerSkeleton />}

      {/* 스티커 그리드 */}
      {!isLoading && stickers.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {stickers.map((sticker, index) => (
            <StickerItem
              key={sticker.id}
              sticker={sticker}
              onAdd={() => handleAddToCanvas(sticker)}
              onDelete={() => handleDelete(sticker.id)}
              index={index}
            />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && stickers.length === 0 && (
        <EmptyState onUploadClick={handleEmptyUploadClick} />
      )}

      {/* 프리미엄 업그레이드 안내 */}
      {!isPremium && stickers.length >= USER_STICKER_LIMITS.FREE_MAX_COUNT * 0.8 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-amber-800 text-sm">
            <span className="font-medium">프리미엄</span>으로 업그레이드하면{' '}
            <span className="font-medium">{USER_STICKER_LIMITS.PREMIUM_MAX_COUNT}개</span>까지
            저장할 수 있어요!
          </p>
        </div>
      )}
    </div>
  )
})

export default UserStickerPanel
