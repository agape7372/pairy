/**
 * 내보내기 게이팅 정책
 * 티어별 해상도 제한·워터마크 강제를 한 곳에서 결정한다 (C1 회귀 방지).
 * 주의: 클라이언트 UX 게이팅이다 — tier 의 진실은 profiles.subscription_tier(syncFromServer)이며
 * 서버 강제 내보내기는 F-28 로드맵.
 */

import { TIER_LIMITS, type SubscriptionTier } from '@/stores/subscriptionStore'

export interface ExportWatermark {
  text: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity?: number
  fontSize?: number
  color?: string
}

export interface ExportPolicy {
  /** 실제 적용할 스케일 — 고해상도 권한이 없으면 1로 클램프 */
  scale: number
  /** 무료 티어 강제 워터마크 (없으면 undefined) */
  watermark?: ExportWatermark
  canExportHighRes: boolean
  hasWatermark: boolean
}

const FREE_WATERMARK: ExportWatermark = {
  text: '페어리에서 만듦 ✨ pairy.app',
  position: 'bottom-right',
  opacity: 0.8,
  fontSize: 16,
  color: '#888888',
}

export function getExportPolicy(tier: SubscriptionTier, requestedScale: number): ExportPolicy {
  const limits = TIER_LIMITS[tier]
  const canExportHighRes = limits.canExportHighRes
  const hasWatermark = limits.hasWatermark

  return {
    scale: canExportHighRes ? requestedScale : 1,
    watermark: hasWatermark ? { ...FREE_WATERMARK } : undefined,
    canExportHighRes,
    hasWatermark,
  }
}
