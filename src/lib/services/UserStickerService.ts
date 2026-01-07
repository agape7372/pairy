'use client'

/**
 * Sprint 34: 유저 스티커 서비스
 *
 * 책임:
 * - 파일 유효성 검사
 * - 이미지 압축 및 최적화
 * - localStorage/Supabase 저장소 관리
 * - 메모리 관리 (Blob URL 생명주기)
 *
 * 설계 원칙:
 * - Single Responsibility: 스티커 관련 비즈니스 로직만 담당
 * - 예외 안전성: 모든 에러를 명시적으로 처리
 * - 메모리 안전성: Blob URL 누수 방지
 */

import {
  type UserSticker,
  type FileValidationResult,
  type FileValidationErrorCode,
  type StickerUploadOptions,
  type StickerUploadResult,
  type AllowedMimeType,
  USER_STICKER_LIMITS,
} from '@/types/sticker'
import { processImageFile, formatFileSize } from '@/lib/utils/imageCompressor'

// ============================================
// 에러 메시지 맵
// ============================================

const ERROR_MESSAGES: Record<FileValidationErrorCode | 'UNKNOWN_ERROR', string> = {
  INVALID_TYPE: 'PNG, JPG, GIF, WEBP 파일만 업로드할 수 있어요',
  FILE_TOO_LARGE: `파일 크기는 ${formatFileSize(USER_STICKER_LIMITS.MAX_FILE_SIZE)} 이하여야 해요`,
  STORAGE_FULL: '스티커 저장 공간이 가득 찼어요',
  QUOTA_EXCEEDED: '브라우저 저장 공간이 부족해요. 사용하지 않는 스티커를 삭제해주세요',
  COMPRESSION_FAILED: '이미지 처리 중 오류가 발생했어요. 다른 이미지를 시도해주세요',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요',
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * UUID v4 생성
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // 폴백: 간단한 UUID 생성
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 파일명에서 확장자 제거
 */
function removeFileExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '')
}

/**
 * 안전한 localStorage 접근
 */
function safeLocalStorage() {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    // localStorage 접근 테스트
    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return window.localStorage
  } catch {
    return null
  }
}

// ============================================
// 저장소 인터페이스
// ============================================

interface StickerStorageMetadata {
  /** 이미지 데이터 (base64 또는 URL) */
  imageData: string
  /** 썸네일 데이터 (base64) */
  thumbnailData?: string
  /** 저장 타입 */
  storageType: 'base64' | 'url'
}

interface StoredStickerData {
  sticker: Omit<UserSticker, 'imageUrl' | 'thumbnailUrl'>
  metadata: StickerStorageMetadata
}

// ============================================
// UserStickerService 클래스
// ============================================

export class UserStickerService {
  private blobUrls: Map<string, string> = new Map()
  private storage = safeLocalStorage()

  // ============================================
  // 파일 유효성 검사
  // ============================================

  /**
   * 파일 유효성 검사
   */
  validateFile(file: File, currentCount: number, maxCount: number): FileValidationResult {
    // 1. MIME 타입 검사
    if (!this.isAllowedMimeType(file.type)) {
      return {
        valid: false,
        errorCode: 'INVALID_TYPE',
        errorMessage: ERROR_MESSAGES.INVALID_TYPE,
      }
    }

    // 2. 파일 크기 검사
    if (file.size > USER_STICKER_LIMITS.MAX_FILE_SIZE) {
      return {
        valid: false,
        errorCode: 'FILE_TOO_LARGE',
        errorMessage: ERROR_MESSAGES.FILE_TOO_LARGE,
      }
    }

    // 3. 저장 공간 검사
    if (currentCount >= maxCount) {
      return {
        valid: false,
        errorCode: 'STORAGE_FULL',
        errorMessage: ERROR_MESSAGES.STORAGE_FULL,
      }
    }

    return { valid: true }
  }

  /**
   * MIME 타입 검사
   */
  private isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
    return USER_STICKER_LIMITS.ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)
  }

  // ============================================
  // 이미지 처리
  // ============================================

  /**
   * 스티커 이미지 처리 (압축 + 썸네일 생성)
   */
  async processImage(
    file: File,
    options?: { onProgress?: (progress: number) => void }
  ): Promise<{
    imageBlob: Blob
    imageUrl: string
    thumbnailUrl?: string
    width: number
    height: number
    compressedSize: number
  }> {
    const { onProgress } = options || {}

    try {
      onProgress?.(10)

      // 1. 이미지 압축
      const result = await processImageFile(file, {
        maxDimension: USER_STICKER_LIMITS.STICKER_MAX_SIZE,
        maxFileSize: USER_STICKER_LIMITS.TARGET_COMPRESSED_SIZE,
        quality: 0.85,
        format: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
      })

      onProgress?.(60)

      // 2. 썸네일 생성 (150x150)
      let thumbnailUrl: string | undefined
      if (result.width > USER_STICKER_LIMITS.THUMBNAIL_MAX_SIZE ||
          result.height > USER_STICKER_LIMITS.THUMBNAIL_MAX_SIZE) {
        const thumbnailResult = await processImageFile(file, {
          maxDimension: USER_STICKER_LIMITS.THUMBNAIL_MAX_SIZE,
          quality: 0.7,
          format: 'image/jpeg',
        })
        thumbnailUrl = thumbnailResult.url
        this.blobUrls.set(`thumb-${result.url}`, thumbnailResult.url)
      }

      onProgress?.(100)

      // Blob URL 추적
      this.blobUrls.set(result.url, result.url)

      return {
        imageBlob: result.blob,
        imageUrl: result.url,
        thumbnailUrl,
        width: result.width,
        height: result.height,
        compressedSize: result.compressedSize,
      }
    } catch (error) {
      console.error('[UserStickerService] Image processing failed:', error)
      throw new Error('COMPRESSION_FAILED')
    }
  }

  // ============================================
  // 스티커 생성
  // ============================================

  /**
   * 새 스티커 생성
   */
  async createSticker(
    file: File,
    currentCount: number,
    maxCount: number,
    options: StickerUploadOptions = {}
  ): Promise<StickerUploadResult> {
    const { name, tags = [], onProgress } = options

    // 1. 유효성 검사
    const validation = this.validateFile(file, currentCount, maxCount)
    if (!validation.valid) {
      return {
        success: false,
        errorCode: validation.errorCode,
        errorMessage: validation.errorMessage,
      }
    }

    try {
      // 2. 이미지 처리
      const processed = await this.processImage(file, { onProgress })

      // 3. 스티커 객체 생성
      const sticker: UserSticker = {
        id: generateId(),
        name: name || removeFileExtension(file.name),
        imageUrl: processed.imageUrl,
        thumbnailUrl: processed.thumbnailUrl,
        defaultSize: {
          width: Math.min(processed.width, 200),
          height: Math.min(processed.height, 200),
        },
        tags: Object.freeze([...tags]),
        originalFileSize: file.size,
        compressedFileSize: processed.compressedSize,
        mimeType: file.type,
        createdAt: new Date().toISOString(),
        useCount: 0,
      }

      return {
        success: true,
        sticker,
      }
    } catch (error) {
      const errorCode = error instanceof Error && error.message === 'COMPRESSION_FAILED'
        ? 'COMPRESSION_FAILED'
        : 'UNKNOWN_ERROR'

      return {
        success: false,
        errorCode,
        errorMessage: ERROR_MESSAGES[errorCode],
      }
    }
  }

  // ============================================
  // localStorage 저장소 관리
  // ============================================

  /**
   * 스티커 목록 로드
   */
  async loadStickers(): Promise<UserSticker[]> {
    if (!this.storage) {
      console.warn('[UserStickerService] localStorage not available')
      return []
    }

    try {
      const data = this.storage.getItem(USER_STICKER_LIMITS.STORAGE_KEY)
      if (!data) return []

      const parsed = JSON.parse(data) as StoredStickerData[]

      // 저장된 데이터를 UserSticker로 변환
      const stickers: UserSticker[] = []

      for (const item of parsed) {
        try {
          // Base64 데이터를 Blob URL로 변환
          let imageUrl: string
          let thumbnailUrl: string | undefined

          if (item.metadata.storageType === 'base64') {
            const blob = this.base64ToBlob(
              item.metadata.imageData,
              item.sticker.mimeType
            )
            imageUrl = URL.createObjectURL(blob)
            this.blobUrls.set(imageUrl, imageUrl)

            if (item.metadata.thumbnailData) {
              const thumbBlob = this.base64ToBlob(item.metadata.thumbnailData, 'image/jpeg')
              thumbnailUrl = URL.createObjectURL(thumbBlob)
              this.blobUrls.set(thumbnailUrl, thumbnailUrl)
            }
          } else {
            imageUrl = item.metadata.imageData
            thumbnailUrl = item.metadata.thumbnailData
          }

          stickers.push({
            ...item.sticker,
            imageUrl,
            thumbnailUrl,
          })
        } catch (err) {
          console.error('[UserStickerService] Failed to restore sticker:', err)
        }
      }

      return stickers
    } catch (error) {
      console.error('[UserStickerService] Failed to load stickers:', error)
      return []
    }
  }

  /**
   * 스티커 목록 저장
   */
  async saveStickers(stickers: UserSticker[]): Promise<boolean> {
    if (!this.storage) {
      console.warn('[UserStickerService] localStorage not available')
      return false
    }

    try {
      const dataToStore: StoredStickerData[] = []

      for (const sticker of stickers) {
        // Blob URL을 base64로 변환
        let imageData: string
        let thumbnailData: string | undefined

        if (sticker.imageUrl.startsWith('blob:')) {
          const response = await fetch(sticker.imageUrl)
          const blob = await response.blob()
          imageData = await this.blobToBase64(blob)
        } else {
          imageData = sticker.imageUrl
        }

        if (sticker.thumbnailUrl?.startsWith('blob:')) {
          const response = await fetch(sticker.thumbnailUrl)
          const blob = await response.blob()
          thumbnailData = await this.blobToBase64(blob)
        } else {
          thumbnailData = sticker.thumbnailUrl
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { imageUrl, thumbnailUrl, ...stickerData } = sticker

        dataToStore.push({
          sticker: stickerData,
          metadata: {
            imageData,
            thumbnailData,
            storageType: 'base64',
          },
        })
      }

      this.storage.setItem(
        USER_STICKER_LIMITS.STORAGE_KEY,
        JSON.stringify(dataToStore)
      )

      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('[UserStickerService] localStorage quota exceeded')
        throw new Error('QUOTA_EXCEEDED')
      }
      console.error('[UserStickerService] Failed to save stickers:', error)
      return false
    }
  }

  // ============================================
  // Base64 변환 유틸리티
  // ============================================

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert blob to base64'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read blob'))
      reader.readAsDataURL(blob)
    })
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    // data:image/png;base64, 접두사 제거
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  // ============================================
  // 메모리 관리
  // ============================================

  /**
   * 특정 스티커의 Blob URL 해제
   */
  releaseSticker(sticker: UserSticker): void {
    if (sticker.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(sticker.imageUrl)
      this.blobUrls.delete(sticker.imageUrl)
    }
    if (sticker.thumbnailUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(sticker.thumbnailUrl)
      this.blobUrls.delete(sticker.thumbnailUrl)
    }
  }

  /**
   * 모든 Blob URL 해제
   */
  releaseAll(): void {
    for (const url of this.blobUrls.values()) {
      URL.revokeObjectURL(url)
    }
    this.blobUrls.clear()
  }

  /**
   * 현재 메모리 사용량 통계
   */
  getMemoryStats(): { blobCount: number } {
    return {
      blobCount: this.blobUrls.size,
    }
  }
}

// 싱글톤 인스턴스
export const userStickerService = new UserStickerService()
