'use client'

import { useCallback, useState } from 'react'
import { useMarketplaceStore, PricingType, Purchase } from '@/stores/marketplaceStore'

interface TemplateForPurchase {
  id: string
  title: string
  preview: string
  creatorId: string
  creatorName: string
  price: number
  pricingType: PricingType
}

interface UsePurchaseReturn {
  isPurchasing: boolean
  hasPurchased: boolean
  purchase: Purchase | undefined
  purchaseTemplate: () => Promise<Purchase | null>
  error: string | null
}

export function usePurchase(template: TemplateForPurchase): UsePurchaseReturn {
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const storePurchase = useMarketplaceStore((state) => state.purchaseTemplate)
  const hasPurchased = useMarketplaceStore((state) => state.hasPurchased(template.id))
  const existingPurchase = useMarketplaceStore((state) => state.getPurchasesByTemplate(template.id))

  const purchaseTemplate = useCallback(async (): Promise<Purchase | null> => {
    // Race condition 방지: 이미 구매 중이면 무시
    if (isPurchasing) {
      return null
    }

    if (hasPurchased) {
      setError('이미 구매한 템플릿입니다.')
      return null
    }

    if (template.pricingType === 'free') {
      // 무료 템플릿은 바로 구매 완료
      const purchase = storePurchase({
        id: template.id,
        title: template.title,
        preview: template.preview,
        creatorId: template.creatorId,
        creatorName: template.creatorName,
        price: 0,
        pricingType: 'free',
      })
      return purchase
    }

    setIsPurchasing(true)
    setError(null)

    try {
      // 데모 모드: 실제 결제 없이 바로 구매 처리
      // 실제 구현 시 여기서 결제 API 호출

      // 약간의 지연으로 구매 과정 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const purchase = storePurchase({
        id: template.id,
        title: template.title,
        preview: template.preview,
        creatorId: template.creatorId,
        creatorName: template.creatorName,
        price: template.price,
        pricingType: template.pricingType,
      })

      return purchase
    } catch (err) {
      setError(err instanceof Error ? err.message : '구매 중 오류가 발생했습니다.')
      return null
    } finally {
      setIsPurchasing(false)
    }
  }, [template, hasPurchased, storePurchase, isPurchasing])

  return {
    isPurchasing,
    hasPurchased,
    purchase: existingPurchase,
    purchaseTemplate,
    error,
  }
}

// 무료 템플릿 여부 확인
export function useIsFreeTemplate(pricingType: PricingType): boolean {
  return pricingType === 'free'
}

// 가격 포맷팅
export function formatPrice(price: number, pricingType: PricingType): string {
  if (pricingType === 'free') return '무료'
  if (pricingType === 'credit') return `${price} 크레딧`
  return `${price.toLocaleString()}원`
}
