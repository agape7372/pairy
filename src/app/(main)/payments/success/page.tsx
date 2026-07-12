'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Loader2, AlertCircle } from 'lucide-react'

type State =
  | { kind: 'confirming' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

function SuccessInner() {
  const params = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<State>({ kind: 'confirming' })

  useEffect(() => {
    const paymentKey = params.get('paymentKey')
    const orderId = params.get('orderId')
    const amount = params.get('amount')

    if (!paymentKey || !orderId || !amount) {
      setState({ kind: 'error', message: '결제 정보가 올바르지 않아요.' })
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (res.ok) {
          setState({ kind: 'success' })
          // 새 구독 상태를 반영하기 위해 잠시 후 마이페이지로
          setTimeout(() => router.replace('/my/subscription'), 2000)
        } else {
          setState({ kind: 'error', message: data.error ?? '결제 확정에 실패했어요.' })
        }
      } catch {
        if (!cancelled) setState({ kind: 'error', message: '결제 확정 중 오류가 발생했어요.' })
      }
    })()

    return () => { cancelled = true }
  }, [params, router])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      {state.kind === 'confirming' && (
        <>
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-pink-400" />
          <h1 className="text-lg font-bold text-gray-800">결제를 확인하고 있어요…</h1>
          <p className="mt-1 text-sm text-gray-500">잠시만 기다려 주세요.</p>
        </>
      )}
      {state.kind === 'success' && (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
            <Check className="h-8 w-8 text-pink-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-800">프리미엄이 시작됐어요!</h1>
          <p className="mt-1 text-sm text-gray-500">30일 동안 모든 프리미엄 기능을 즐겨보세요.</p>
        </>
      )}
      {state.kind === 'error' && (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-800">결제를 완료하지 못했어요</h1>
          <p className="mt-1 text-sm text-gray-500">{state.message}</p>
          <Link href="/premium" className="mt-6 rounded-full bg-pink-400 px-6 py-2 text-sm font-medium text-white hover:bg-pink-500">
            다시 시도하기
          </Link>
        </>
      )}
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <SuccessInner />
    </Suspense>
  )
}
