/**
 * Sprint 31: 스티커 시스템 타입 정의
 * 이미지 스티커만 지원 (이모지 배제)
 */

import type { Transform } from './template'

/** 스티커 카테고리 */
export type StickerCategory = 'decoration' | 'frame' | 'effect' | 'seasonal' | 'shape' | 'user'

/** 개별 스티커 */
export interface Sticker {
  id: string
  /** 이미지 URL */
  imageUrl: string
  /** 썸네일 URL (목록용) */
  thumbnailUrl?: string
  /** 검색용 태그 */
  tags: string[]
  /** 기본 크기 */
  defaultSize: { width: number; height: number }
}

/** 스티커 팩 */
export interface StickerPack {
  id: string
  name: string
  category: StickerCategory
  thumbnailUrl: string
  stickers: Sticker[]
  isPremium?: boolean
}

/** 캔버스에 배치된 스티커 레이어 */
export interface StickerLayer {
  id: string
  /** 참조하는 스티커 ID */
  stickerId: string
  /** 스티커 이미지 URL */
  imageUrl: string
  /** 위치 및 크기 */
  transform: Transform
  /** 투명도 (0-1) */
  opacity?: number
  /** 좌우 반전 */
  flipX?: boolean
  /** 상하 반전 */
  flipY?: boolean
}

/** 스티커 레이어 기본값 */
export const DEFAULT_STICKER_LAYER: Omit<StickerLayer, 'id' | 'stickerId' | 'imageUrl' | 'transform'> = {
  opacity: 1,
  flipX: false,
  flipY: false,
}

/** 기본 장식 스티커 팩 (데모용 placeholder) */
export const DECORATION_STICKER_PACK: StickerPack = {
  id: 'decoration-basic',
  name: '장식',
  category: 'decoration',
  thumbnailUrl: '/stickers/decoration/thumbnail.png',
  stickers: [
    // TODO: 실제 이미지 스티커 추가 예정
    // { id: 'deco-heart', imageUrl: '/stickers/decoration/heart.png', tags: ['하트', 'heart'], defaultSize: { width: 60, height: 60 } },
  ],
}

/** 프레임 스티커 팩 */
export const FRAME_STICKER_PACK: StickerPack = {
  id: 'frame-basic',
  name: '프레임',
  category: 'frame',
  thumbnailUrl: '/stickers/frame/thumbnail.png',
  stickers: [
    // TODO: 실제 이미지 스티커 추가 예정
  ],
}

/** 모든 스티커 팩 */
export const ALL_STICKER_PACKS: StickerPack[] = [
  DECORATION_STICKER_PACK,
  FRAME_STICKER_PACK,
]

/** 스티커 검색 함수 */
export function searchStickers(query: string, packs: StickerPack[] = ALL_STICKER_PACKS): Sticker[] {
  if (!query.trim()) return []

  const normalizedQuery = query.toLowerCase().trim()
  const results: Sticker[] = []

  for (const pack of packs) {
    for (const sticker of pack.stickers) {
      const matchesTag = sticker.tags.some(tag =>
        tag.toLowerCase().includes(normalizedQuery)
      )

      if (matchesTag) {
        results.push(sticker)
      }
    }
  }

  return results
}

// ============================================
// Sprint 34: 유저 스티커 시스템
// 오타쿠들의 수집욕을 충족시키기 위한 넉넉한 용량 제공
// ============================================

/** 유저 스티커 저장소 타입 */
export type UserStickerStorageType = 'localStorage' | 'supabase'

/** 유저 스티커 인터페이스 */
export interface UserSticker {
  /** 고유 ID (UUID v4 형식) */
  readonly id: string
  /** 스티커 이름 */
  name: string
  /** 원본 이미지 URL (Blob URL 또는 Supabase URL) */
  imageUrl: string
  /** 썸네일 URL (리스트 표시용, 선택사항) */
  thumbnailUrl?: string
  /** 이미지 기본 크기 (px) */
  defaultSize: Readonly<{ width: number; height: number }>
  /** 검색용 태그 */
  tags: readonly string[]
  /** 원본 파일 크기 (bytes) */
  originalFileSize: number
  /** 압축 후 파일 크기 (bytes) */
  compressedFileSize: number
  /** MIME 타입 */
  mimeType: string
  /** 생성 일시 (ISO 8601) */
  createdAt: string
  /** 마지막 사용 일시 (ISO 8601) */
  lastUsedAt?: string
  /** 사용 횟수 */
  useCount: number
}

/** 유저 스티커 저장 제한 설정 */
export const USER_STICKER_LIMITS = {
  /** 무료 유저 최대 스티커 수 */
  FREE_MAX_COUNT: 50,
  /** 프리미엄 유저 최대 스티커 수 (수집욕 충족!) */
  PREMIUM_MAX_COUNT: 500,
  /** 최대 파일 크기 (5MB) */
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  /** 압축 후 목표 크기 (500KB) - localStorage 용량 관리 */
  TARGET_COMPRESSED_SIZE: 500 * 1024,
  /** 썸네일 최대 크기 (px) */
  THUMBNAIL_MAX_SIZE: 150,
  /** 스티커 최대 크기 (px) */
  STICKER_MAX_SIZE: 512,
  /** 지원 MIME 타입 */
  ALLOWED_MIME_TYPES: [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
  ] as const,
  /** localStorage 키 */
  STORAGE_KEY: 'pairy_user_stickers_v1',
  /** 메타데이터 localStorage 키 */
  METADATA_KEY: 'pairy_user_stickers_meta_v1',
} as const

/** 지원되는 MIME 타입 */
export type AllowedMimeType = typeof USER_STICKER_LIMITS.ALLOWED_MIME_TYPES[number]

/** 파일 유효성 검사 결과 */
export interface FileValidationResult {
  /** 유효 여부 */
  valid: boolean
  /** 에러 코드 (유효하지 않을 때) */
  errorCode?: FileValidationErrorCode
  /** 사용자 친화적 에러 메시지 */
  errorMessage?: string
}

/** 파일 유효성 에러 코드 */
export type FileValidationErrorCode =
  | 'INVALID_TYPE'
  | 'FILE_TOO_LARGE'
  | 'STORAGE_FULL'
  | 'QUOTA_EXCEEDED'
  | 'COMPRESSION_FAILED'

/** 스티커 업로드 옵션 */
export interface StickerUploadOptions {
  /** 스티커 이름 (기본값: 파일명) */
  name?: string
  /** 검색용 태그 */
  tags?: string[]
  /** 업로드 진행 콜백 */
  onProgress?: (progress: number) => void
}

/** 스티커 업로드 결과 */
export interface StickerUploadResult {
  /** 성공 여부 */
  success: boolean
  /** 업로드된 스티커 (성공 시) */
  sticker?: UserSticker
  /** 에러 코드 (실패 시) */
  errorCode?: FileValidationErrorCode | 'UNKNOWN_ERROR'
  /** 사용자 친화적 에러 메시지 */
  errorMessage?: string
}

/** 유저 스티커 목록 상태 */
export interface UserStickerListState {
  /** 스티커 목록 */
  stickers: UserSticker[]
  /** 총 사용 용량 (bytes) */
  totalSize: number
  /** 최대 개수 */
  maxCount: number
  /** 남은 슬롯 수 */
  remainingSlots: number
}

/**
 * UserSticker를 Sticker 형식으로 변환
 * 에디터에서 기존 스티커 시스템과 호환되도록 변환
 */
export function userStickerToSticker(userSticker: UserSticker): Sticker {
  return {
    id: userSticker.id,
    imageUrl: userSticker.imageUrl,
    thumbnailUrl: userSticker.thumbnailUrl,
    tags: [...userSticker.tags],
    defaultSize: { ...userSticker.defaultSize },
  }
}

/**
 * 유저 스티커 목록을 스티커 팩으로 변환
 */
export function createUserStickerPack(stickers: UserSticker[]): StickerPack {
  return {
    id: 'user-stickers',
    name: '내 스티커',
    category: 'user',
    thumbnailUrl: stickers[0]?.thumbnailUrl || stickers[0]?.imageUrl || '',
    stickers: stickers.map(userStickerToSticker),
    isPremium: false,
  }
}
