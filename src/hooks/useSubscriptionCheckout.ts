'use client'

import { useCallback, useState } from 'react'
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk'
import { useUser } from '@/hooks/useUser'

/**
 * 프리미엄 구독 결제 시작 훅 (Toss 결제창).
 * 흐름: 서버 prepare(orderId·amount 확정) → Toss 결제창 → successUrl 로 리다이렉트 → /payments/success 가 confirm.
 */
export function useSubscriptionCheckout() {
  const { user } = useUser()
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = useCallback(async () => {
    setError(null)

    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    if (!clientKey) {
      setError('결제가 아직 설정되지 않았어요.')
      return
    }
    if (!user) {
      setError('로그인이 필요해요.')
      return
    }

    setIsStarting(true)
    try {
      // 1. 서버가 주문 생성(금액은 서버가 강제)
      const res = await fetch('/api/payments/prepare', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '결제 준비에 실패했어요.')
      }
      const { orderId, amount, orderName, customerEmail } = await res.json()

      // 2. Toss 결제창 — 성공/실패 시 지정 URL 로 리다이렉트
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
      // requestPayment 성공 시 브라우저가 리다이렉트되므로 이후 코드는 실행되지 않음.
    } catch (err) {
      // 사용자가 결제창을 닫으면 SDK 가 에러를 던진다 — 조용히 무시.
      const message = err instanceof Error ? err.message : '결제를 시작하지 못했어요.'
      if (!/사용자.*취소|cancel/i.test(message)) {
        setError(message)
      }
    } finally {
      setIsStarting(false)
    }
  }, [user])

  return { startCheckout, isStarting, error }
}
