'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

function FailInner() {
  const params = useSearchParams()
  const message = params.get('message') ?? '결제가 취소되었거나 완료되지 않았어요.'

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-lg font-bold text-gray-800">결제가 완료되지 않았어요</h1>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      <Link href="/premium" className="mt-6 rounded-full bg-pink-400 px-6 py-2 text-sm font-medium text-white hover:bg-pink-500">
        다시 시도하기
      </Link>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <FailInner />
    </Suspense>
  )
}
