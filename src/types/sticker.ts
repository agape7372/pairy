/**
 * Sprint 31: 스티커 시스템 타입 정의
 * 이미지 스티커만 지원 (이모지 배제)
 */

import type { Transform } from './template'

/** 스티커 카테고리 */
export type StickerCategory = 'decoration' | 'frame' | 'effect' | 'seasonal' | 'shape'

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
