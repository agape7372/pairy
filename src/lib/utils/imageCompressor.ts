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
  // 디코딩 전에 거부할 원본 파일 상한. maxFileSize는 압축 결과 목표라서
  // 별도 값으로 둬야 사용자 스티커처럼 더 작은 출력 목표를 지정할 수 있다.
  maxSourceFileSize: 10 * 1024 * 1024, // 10MB
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
  maxSourceFileSize?: number
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

/**
 * 압축을 시작하기 전에 원본 바이트 크기를 제한한다.
 * createImageBitmap 이후에 검사하면 이미 큰 디코드 버퍼가 할당된 뒤라서
 * 모바일 브라우저의 메모리 급증을 막을 수 없다.
 */
function assertSourceFileSize(file: File, maxSourceFileSize: number): void {
  if (file.size > maxSourceFileSize) {
    throw new Error(
      `이미지 파일은 ${formatFileSize(maxSourceFileSize)} 이하여야 합니다.`
    )
  }
}

/**
 * 명시적인 출력 형식이 없으면 입력의 알파 채널을 보존한다.
 */
function getDefaultOutputFormat(
  file: File
): 'image/jpeg' | 'image/png' | 'image/webp' {
  if (file.type === 'image/png') return 'image/png'
  if (file.type === 'image/webp') return 'image/webp'
  return 'image/jpeg'
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
    maxSourceFileSize = IMAGE_COMPRESSION_CONFIG.maxSourceFileSize,
    quality = IMAGE_COMPRESSION_CONFIG.initialQuality,
  } = options
  const format = options.format ?? getDefaultOutputFormat(file)

  assertSourceFileSize(file, maxSourceFileSize)

  // 이미지 비트맵 생성
  const img = await createImageBitmap(file)

  try {
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

    // 품질 조정하며 압축. PNG는 브라우저가 quality를 무시할 수 있지만,
    // 알파 채널을 보존하기 위해 JPEG로 강제 변환하지 않는다.
    let currentQuality = quality
    let blob = await canvas.convertToBlob({ type: format, quality: currentQuality })

    while (
      format !== 'image/png' &&
      blob.size > maxFileSize &&
      currentQuality > IMAGE_COMPRESSION_CONFIG.minQuality
    ) {
      currentQuality -= IMAGE_COMPRESSION_CONFIG.qualityStep
      blob = await canvas.convertToBlob({ type: format, quality: currentQuality })
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
  } finally {
    // ImageBitmap은 GC만 기다리면 고해상도 업로드 반복 시 디코드 메모리가
    // 급격히 누적될 수 있으므로 성공/실패 모두 즉시 해제한다.
    img.close()
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

  const maxSourceFileSize =
    options.maxSourceFileSize ?? IMAGE_COMPRESSION_CONFIG.maxSourceFileSize
  assertSourceFileSize(file, maxSourceFileSize)

  // GIF는 압축하지 않음 (애니메이션 손실 방지)
  if (file.type === 'image/gif') {
    const img = await createImageBitmap(file)
    try {
      const width = img.width
      const height = img.height
      const url = URL.createObjectURL(file)
      return {
        blob: file,
        url,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        width,
        height,
      }
    } finally {
      img.close()
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
