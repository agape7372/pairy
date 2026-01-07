'use client'

/**
 * Sprint 34: 유저 스티커 관리 훅
 *
 * 기능:
 * - 스티커 CRUD 작업
 * - 낙관적 업데이트
 * - 에러 상태 관리
 * - 로딩 상태 관리
 * - 메모리 관리 (cleanup)
 *
 * 설계 원칙:
 * - 선언적 상태 관리
 * - 안전한 비동기 처리 (AbortController)
 * - 메모리 누수 방지
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  type UserSticker,
  type StickerUploadOptions,
  type StickerUploadResult,
  type FileValidationErrorCode,
  USER_STICKER_LIMITS,
} from '@/types/sticker'
import { userStickerService } from '@/lib/services/UserStickerService'

// ============================================
// 타입 정의
// ============================================

/** 업로드 상태 */
export type UploadStatus = 'idle' | 'validating' | 'compressing' | 'saving' | 'error' | 'success'

/** 훅 반환 타입 */
export interface UseUserStickersReturn {
  /** 스티커 목록 */
  stickers: UserSticker[]
  /** 로딩 상태 */
  isLoading: boolean
  /** 업로드 상태 */
  uploadStatus: UploadStatus
  /** 업로드 진행률 (0-100) */
  uploadProgress: number
  /** 에러 메시지 */
  error: string | null
  /** 에러 코드 */
  errorCode: FileValidationErrorCode | 'UNKNOWN_ERROR' | null
  /** 남은 슬롯 수 */
  remainingSlots: number
  /** 최대 슬롯 수 */
  maxSlots: number
  /** 총 사용 용량 (bytes) */
  totalSize: number
  /** 스티커 추가 */
  addSticker: (file: File, options?: StickerUploadOptions) => Promise<StickerUploadResult>
  /** 스티커 삭제 */
  deleteSticker: (id: string) => Promise<boolean>
  /** 스티커 수정 (이름, 태그) */
  updateSticker: (id: string, updates: Partial<Pick<UserSticker, 'name' | 'tags'>>) => Promise<boolean>
  /** 스티커 사용 기록 업데이트 */
  recordUsage: (id: string) => void
  /** 에러 초기화 */
  clearError: () => void
  /** 목록 새로고침 */
  refresh: () => Promise<void>
}

// ============================================
// 훅 구현
// ============================================

/**
 * 유저 스티커 관리 훅
 *
 * @param isPremium - 프리미엄 유저 여부
 * @returns 스티커 상태 및 조작 메서드
 *
 * @example
 * ```tsx
 * const {
 *   stickers,
 *   isLoading,
 *   addSticker,
 *   deleteSticker,
 *   remainingSlots,
 * } = useUserStickers(isPremium)
 *
 * const handleUpload = async (file: File) => {
 *   const result = await addSticker(file, { name: 'My Sticker' })
 *   if (result.success) {
 *     // 성공 처리
 *   }
 * }
 * ```
 */
export function useUserStickers(isPremium = false): UseUserStickersReturn {
  // ============================================
  // 상태
  // ============================================

  const [stickers, setStickers] = useState<UserSticker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<FileValidationErrorCode | 'UNKNOWN_ERROR' | null>(null)

  // 참조
  const isMountedRef = useRef(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 계산된 값
  const maxSlots = isPremium
    ? USER_STICKER_LIMITS.PREMIUM_MAX_COUNT
    : USER_STICKER_LIMITS.FREE_MAX_COUNT

  const remainingSlots = Math.max(0, maxSlots - stickers.length)

  const totalSize = stickers.reduce((sum, s) => sum + s.compressedFileSize, 0)

  // ============================================
  // 초기 로드
  // ============================================

  useEffect(() => {
    isMountedRef.current = true

    const loadStickers = async () => {
      try {
        const loaded = await userStickerService.loadStickers()
        if (isMountedRef.current) {
          setStickers(loaded)
        }
      } catch (err) {
        console.error('[useUserStickers] Failed to load:', err)
        if (isMountedRef.current) {
          setError('스티커를 불러오는데 실패했어요')
          setErrorCode('UNKNOWN_ERROR')
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    loadStickers()

    // 클린업
    return () => {
      isMountedRef.current = false
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // ============================================
  // 디바운스 저장
  // ============================================

  const debouncedSave = useCallback((stickerList: UserSticker[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await userStickerService.saveStickers(stickerList)
      } catch (err) {
        console.error('[useUserStickers] Save failed:', err)
        if (err instanceof Error && err.message === 'QUOTA_EXCEEDED') {
          if (isMountedRef.current) {
            setError('브라우저 저장 공간이 부족해요')
            setErrorCode('QUOTA_EXCEEDED')
          }
        }
      }
    }, 500) // 500ms 디바운스
  }, [])

  // ============================================
  // 스티커 추가
  // ============================================

  const addSticker = useCallback(async (
    file: File,
    options: StickerUploadOptions = {}
  ): Promise<StickerUploadResult> => {
    // 에러 초기화
    setError(null)
    setErrorCode(null)
    setUploadStatus('validating')
    setUploadProgress(0)

    try {
      // 스티커 생성
      const result = await userStickerService.createSticker(
        file,
        stickers.length,
        maxSlots,
        {
          ...options,
          onProgress: (progress) => {
            setUploadProgress(progress)
            if (progress < 50) {
              setUploadStatus('compressing')
            } else {
              setUploadStatus('saving')
            }
          },
        }
      )

      if (!isMountedRef.current) {
        return { success: false, errorCode: 'UNKNOWN_ERROR', errorMessage: '컴포넌트가 언마운트됨' }
      }

      if (result.success && result.sticker) {
        // 낙관적 업데이트
        const newStickers = [result.sticker, ...stickers]
        setStickers(newStickers)
        setUploadStatus('success')

        // 디바운스 저장
        debouncedSave(newStickers)

        // 2초 후 상태 초기화
        setTimeout(() => {
          if (isMountedRef.current) {
            setUploadStatus('idle')
            setUploadProgress(0)
          }
        }, 2000)

        return result
      } else {
        setUploadStatus('error')
        setError(result.errorMessage || '업로드 실패')
        setErrorCode(result.errorCode || 'UNKNOWN_ERROR')
        return result
      }
    } catch (err) {
      console.error('[useUserStickers] Add failed:', err)
      setUploadStatus('error')
      setError('알 수 없는 오류가 발생했어요')
      setErrorCode('UNKNOWN_ERROR')
      return {
        success: false,
        errorCode: 'UNKNOWN_ERROR',
        errorMessage: '알 수 없는 오류가 발생했어요',
      }
    }
  }, [stickers, maxSlots, debouncedSave])

  // ============================================
  // 스티커 삭제
  // ============================================

  const deleteSticker = useCallback(async (id: string): Promise<boolean> => {
    const stickerToDelete = stickers.find((s) => s.id === id)
    if (!stickerToDelete) {
      return false
    }

    // 낙관적 업데이트
    const newStickers = stickers.filter((s) => s.id !== id)
    setStickers(newStickers)

    // 메모리 해제
    userStickerService.releaseSticker(stickerToDelete)

    // 저장
    debouncedSave(newStickers)

    return true
  }, [stickers, debouncedSave])

  // ============================================
  // 스티커 수정
  // ============================================

  const updateSticker = useCallback(async (
    id: string,
    updates: Partial<Pick<UserSticker, 'name' | 'tags'>>
  ): Promise<boolean> => {
    const index = stickers.findIndex((s) => s.id === id)
    if (index === -1) {
      return false
    }

    // 낙관적 업데이트
    const newStickers = [...stickers]
    newStickers[index] = {
      ...newStickers[index],
      ...updates,
      tags: updates.tags ? Object.freeze([...updates.tags]) : newStickers[index].tags,
    }
    setStickers(newStickers)

    // 저장
    debouncedSave(newStickers)

    return true
  }, [stickers, debouncedSave])

  // ============================================
  // 사용 기록
  // ============================================

  const recordUsage = useCallback((id: string) => {
    const index = stickers.findIndex((s) => s.id === id)
    if (index === -1) return

    const newStickers = [...stickers]
    newStickers[index] = {
      ...newStickers[index],
      useCount: newStickers[index].useCount + 1,
      lastUsedAt: new Date().toISOString(),
    }
    setStickers(newStickers)

    // 저장 (디바운스)
    debouncedSave(newStickers)
  }, [stickers, debouncedSave])

  // ============================================
  // 에러 초기화
  // ============================================

  const clearError = useCallback(() => {
    setError(null)
    setErrorCode(null)
    setUploadStatus('idle')
    setUploadProgress(0)
  }, [])

  // ============================================
  // 새로고침
  // ============================================

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setErrorCode(null)

    try {
      // 기존 Blob URL 정리
      stickers.forEach((s) => userStickerService.releaseSticker(s))

      // 다시 로드
      const loaded = await userStickerService.loadStickers()
      if (isMountedRef.current) {
        setStickers(loaded)
      }
    } catch (err) {
      console.error('[useUserStickers] Refresh failed:', err)
      if (isMountedRef.current) {
        setError('새로고침에 실패했어요')
        setErrorCode('UNKNOWN_ERROR')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [stickers])

  // ============================================
  // 반환
  // ============================================

  return {
    stickers,
    isLoading,
    uploadStatus,
    uploadProgress,
    error,
    errorCode,
    remainingSlots,
    maxSlots,
    totalSize,
    addSticker,
    deleteSticker,
    updateSticker,
    recordUsage,
    clearError,
    refresh,
  }
}

export default useUserStickers
