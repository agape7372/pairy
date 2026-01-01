'use client'

/**
 * Sprint 34: 이미지 압축 유틸리티
 * 업로드 시 자동 리사이징 및 품질 최적화
 */

// ============================================
// 설정
// ============================================

export const IMAGE_COMPRESSION_CONFIG = {
  maxDimension: 4000, // 최대 너비/높이 (px) - 4K 지원
  maxFileSize: 10 * 1024 * 1024, // 10MB
  initialQuality: 0.92,
  minQuality: 0.6,
  qualityStep: 0.1,
  supportedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
}

// ============================================
// 타입 정의
// ============================================

export interface CompressionResult {
  blob: Blob
  url: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  width: number
  height: number
}

export interface CompressionOptions {
  maxDimension?: number
  maxFileSize?: number
  quality?: number
  format?: 'image/jpeg' | 'image/png' | 'image/webp'
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 이미지 파일이 지원되는 형식인지 확인
 */
export function isSupportedImageType(file: File): boolean {
  return IMAGE_COMPRESSION_CONFIG.supportedTypes.includes(
    file.type as typeof IMAGE_COMPRESSION_CONFIG.supportedTypes[number]
  )
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * 이미지 비율을 유지하면서 새 크기 계산
 */
function calculateNewDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }

  const ratio = Math.min(maxDimension / width, maxDimension / height)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

// ============================================
// 메인 압축 함수
// ============================================

/**
 * 이미지 파일 압축
 * - 최대 크기 제한 (기본 2000px)
 * - 파일 크기 제한 (기본 5MB)
 * - 품질 자동 조정
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxDimension = IMAGE_COMPRESSION_CONFIG.maxDimension,
    maxFileSize = IMAGE_COMPRESSION_CONFIG.maxFileSize,
    quality = IMAGE_COMPRESSION_CONFIG.initialQuality,
    format = 'image/jpeg',
  } = options

  // 이미지 비트맵 생성
  const img = await createImageBitmap(file)
  const originalSize = file.size

  // 새 크기 계산
  const { width, height } = calculateNewDimensions(
    img.width,
    img.height,
    maxDimension
  )

  // OffscreenCanvas 사용 (메인 스레드 블로킹 최소화)
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas context를 생성할 수 없습니다')
  }

  // 이미지 그리기
  ctx.drawImage(img, 0, 0, width, height)

  // 품질 조정하며 압축
  let currentQuality = quality
  let blob = await canvas.convertToBlob({ type: format, quality: currentQuality })

  // 파일 크기가 제한을 초과하면 품질 낮추기
  while (
    blob.size > maxFileSize &&
    currentQuality > IMAGE_COMPRESSION_CONFIG.minQuality
  ) {
    currentQuality -= IMAGE_COMPRESSION_CONFIG.qualityStep
    blob = await canvas.convertToBlob({ type: format, quality: currentQuality })
  }

  // PNG는 품질 파라미터가 무시되므로 JPEG로 변환 시도
  if (blob.size > maxFileSize && format === 'image/png') {
    currentQuality = quality
    blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: currentQuality })

    while (
      blob.size > maxFileSize &&
      currentQuality > IMAGE_COMPRESSION_CONFIG.minQuality
    ) {
      currentQuality -= IMAGE_COMPRESSION_CONFIG.qualityStep
      blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: currentQuality })
    }
  }

  const url = URL.createObjectURL(blob)

  return {
    blob,
    url,
    originalSize,
    compressedSize: blob.size,
    compressionRatio: originalSize > 0 ? blob.size / originalSize : 1,
    width,
    height,
  }
}

/**
 * 이미지 압축이 필요한지 확인
 */
export function needsCompression(file: File): boolean {
  return file.size > IMAGE_COMPRESSION_CONFIG.maxFileSize
}

/**
 * 이미지 파일 처리 (압축 필요시 자동 압축)
 */
export async function processImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  // 지원되지 않는 형식 체크
  if (!isSupportedImageType(file)) {
    throw new Error(`지원되지 않는 이미지 형식입니다: ${file.type}`)
  }

  // GIF는 압축하지 않음 (애니메이션 손실 방지)
  if (file.type === 'image/gif') {
    const url = URL.createObjectURL(file)
    const img = await createImageBitmap(file)
    return {
      blob: file,
      url,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
      width: img.width,
      height: img.height,
    }
  }

  return compressImage(file, options)
}

// ============================================
// 이미지 매니저 클래스 (메모리 관리)
// ============================================

interface ImageEntry {
  url: string
  type: 'blob' | 'data' | 'external'
  refCount: number
  size?: number
}

class ImageManager {
  private cache = new Map<string, ImageEntry>()

  /**
   * 이미지 파일 로드 및 압축
   */
  async load(file: File, options?: CompressionOptions): Promise<string> {
    const result = await processImageFile(file, options)
    this.cache.set(result.url, {
      url: result.url,
      type: 'blob',
      refCount: 1,
      size: result.compressedSize,
    })
    return result.url
  }

  /**
   * 외부 URL 등록
   */
  register(url: string, type: 'data' | 'external' = 'external'): void {
    const existing = this.cache.get(url)
    if (existing) {
      existing.refCount++
    } else {
      this.cache.set(url, { url, type, refCount: 1 })
    }
  }

  /**
   * 참조 카운트 증가
   */
  retain(url: string): void {
    const entry = this.cache.get(url)
    if (entry) {
      entry.refCount++
    }
  }

  /**
   * 참조 카운트 감소 및 해제
   */
  release(url: string): void {
    const entry = this.cache.get(url)
    if (entry) {
      entry.refCount--
      if (entry.refCount <= 0 && entry.type === 'blob') {
        URL.revokeObjectURL(url)
        this.cache.delete(url)
      }
    }
  }

  /**
   * 모든 이미지 해제
   */
  cleanup(): void {
    for (const [url, entry] of this.cache) {
      if (entry.type === 'blob') {
        URL.revokeObjectURL(url)
      }
    }
    this.cache.clear()
  }

  /**
   * 캐시 통계
   */
  getStats(): { count: number; totalSize: number } {
    let totalSize = 0
    for (const entry of this.cache.values()) {
      if (entry.size) totalSize += entry.size
    }
    return { count: this.cache.size, totalSize }
  }
}

export const imageManager = new ImageManager()
