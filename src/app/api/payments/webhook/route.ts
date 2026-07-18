import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchTossPaymentByOrderId } from '@/lib/payments/toss'

// Toss 웹훅 — 결제 상태 변경 통지(보조 경로). 승인 주경로는 /confirm.
//
// 위조 방어: Toss 는 웹훅 서명(HMAC)을 제공하지 않으므로, 본문을 신뢰하지 않고
// 시크릿키 인증으로 Toss API 에서 해당 주문의 정본 상태를 재조회해 그 결과만 반영한다.
// 웹훅으로 "부여"는 하지 않으며(부여는 confirm 만), 취소/실패 하향 동기화만 수행 —
// 위조 웹훅이 할 수 있는 최대치는 "재조회를 유발"하는 것뿐이다.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const orderId: string | undefined = body?.data?.orderId ?? body?.orderId
  const claimedStatus: string | undefined = body?.data?.status ?? body?.status

  if (!orderId || !claimedStatus) {
    // 알 수 없는 이벤트는 200 으로 무시(Toss 재시도 폭주 방지).
    return NextResponse.json({ ok: true, ignored: true })
  }

  // 하향(취소/실패) 통지만 처리 대상 — 그 외 상태는 confirm 경로 소관.
  const DOWNGRADE_CLAIMS = ['CANCELED', 'PARTIAL_CANCELED', 'EXPIRED', 'ABORTED']
  if (!DOWNGRADE_CLAIMS.includes(claimedStatus)) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  // 정본 재조회 — 본문 status 는 위조 가능하므로 사용하지 않는다.
  const verified = await fetchTossPaymentByOrderId(orderId)
  if (!verified.ok || !verified.status) {
    // 재조회 실패(미존재 주문 포함) → 아무것도 반영하지 않음.
    return NextResponse.json({ ok: true, ignored: true })
  }

  const admin = createAdminClient()

  if (verified.status === 'CANCELED' || verified.status === 'PARTIAL_CANCELED') {
    await admin.from('payments')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .neq('status', 'paid') // 이미 확정된 결제는 웹훅으로 뒤집지 않음
  } else if (verified.status === 'EXPIRED' || verified.status === 'ABORTED') {
    await admin.from('payments')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .neq('status', 'paid')
  }

  return NextResponse.json({ ok: true })
}
