'use client'

/**
 * 구매 관련 훅 (M4 실배선)
 * - 데모 모드: 기존 marketplaceStore(localStorage) 경로 유지
 * - 프로덕션: 무료 = purchases 직접 기록(0원만 RLS 허용) / 유료 = payments prepare→Toss→confirm
 * [FIXED: useRef로 race condition 방지 - 빠른 더블클릭 시 중복 구매 방지]
 */

import { useCallback, useEffect, useState, useRef } from 'react'
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function usePurchase(template: TemplateForPurchase): UsePurchaseReturn {
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverPurchased, setServerPurchased] = useState(false)

  // [FIXED: useRef로 동기적 체크 - 상태는 비동기라 race condition 발생 가능]
  const purchasingRef = useRef(false)

  const storePurchase = useMarketplaceStore((state) => state.purchaseTemplate)
  const demoPurchased = useMarketplaceStore((state) => state.hasPurchased(template.id))
  const existingPurchase = useMarketplaceStore((state) => state.getPurchasesByTemplate(template.id))

  const isRealTemplate = UUID_RE.test(template.id)

  // 프로덕션: 서버 purchases 에서 구매 여부 조회
  useEffect(() => {
    if (IS_DEMO_MODE || !isRealTemplate) return
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase
        .from('purchases')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('template_id', template.id)
        .eq('status', 'completed')
        .maybeSingle()
      if (!cancelled) setServerPurchased(!!data)
    })()
    return () => { cancelled = true }
  }, [template.id, isRealTemplate])

  const hasPurchased = IS_DEMO_MODE ? demoPurchased : serverPurchased

  const purchaseTemplate = useCallback(async (): Promise<Purchase | null> => {
    // [FIXED: ref 기반 동기적 체크로 race condition 완전 방지]
    if (purchasingRef.current) {
      return null
    }
    purchasingRef.current = true

    if (hasPurchased) {
      purchasingRef.current = false
      setError('이미 구매한 템플릿입니다.')
      return null
    }

    // ── 데모 모드: 기존 localStorage 경로 ──
    if (IS_DEMO_MODE) {
      try {
        setIsPurchasing(true)
        setError(null)
        const purchase = storePurchase({
          id: template.id,
          title: template.title,
          preview: template.preview,
          creatorId: template.creatorId,
          creatorName: template.creatorName,
          price: template.pricingType === 'free' ? 0 : template.price,
          pricingType: template.pricingType,
        })
        return purchase
      } finally {
        setIsPurchasing(false)
        purchasingRef.current = false
      }
    }

    // ── 프로덕션 ──
    setIsPurchasing(true)
    setError(null)

    try {
      if (!isRealTemplate) {
        throw new Error('아직 판매 준비 중인 자료예요.')
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요해요.')

      if (template.pricingType === 'free') {
        // 무료: 확정 기록 직접 삽입 (RLS 가 0원·completed 만 허용)
        const { error: insertError } = await supabase.from('purchases').insert({
          buyer_id: user.id,
          template_id: template.id,
          amount: 0,
          currency: 'KRW',
          status: 'completed',
        })
        // 23505 = 이미 기록됨 — 성공으로 취급
        if (insertError && insertError.code !== '23505') {
          throw new Error(insertError.message)
        }
        setServerPurchased(true)
        return null
      }

      // 유료: 서버 prepare → Toss 결제창 (성공 시 /payments/success 가 confirm)
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      if (!clientKey) throw new Error('결제가 아직 설정되지 않았어요.')

      const res = await fetch('/api/payments/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '결제 준비에 실패했어요.')
      }
      const { orderId, amount, orderName, customerEmail } = await res.json()

      const tossPayments = await loadTossPayments(clientKey)
      const payment = tossPayments.payment({ customerKey: user.id ?? ANONYMOUS })
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: amount },
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
        customerEmail,
        card: { useEscrow: false, flowMode: 'DEFAULT', useCardPoint: false, useAppCardOnly: false },
      })
      // requestPayment 성공 시 리다이렉트 — 이후 코드는 실행되지 않음.
      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : '구매 중 오류가 발생했습니다.'
      // 사용자가 결제창을 닫은 경우는 조용히 무시
      if (!/사용자.*취소|cancel/i.test(message)) {
        setError(message)
      }
      return null
    } finally {
      setIsPurchasing(false)
      purchasingRef.current = false  // [FIXED: 반드시 해제]
    }
  }, [template, hasPurchased, storePurchase, isRealTemplate])

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
