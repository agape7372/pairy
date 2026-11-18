import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchTossPaymentByOrderId } from '@/lib/payments/toss'

// Toss 웹훅 — 결제 상태 변경 통지(보조 경로). 승인 주경로는 /confirm.
//
// 위조 방어: Toss 는 웹훅 서명(HMAC)을 제공하지 않으므로, 본문을 신뢰하지 않고
// 시크릿키 인증으로 Toss API 에서 해당 주문의 정본 상태를 재조회해 그 결과만 반영한다.
// 웹훅으로 "부여"는 하지 않으며(부여는 confirm 만), 취소/실패 하향 동기화와 환불 회수만 수행 —
// 위조 웹훅이 할 수 있는 최대치는 "재조회를 유발"하는 것뿐이다(회수도 Toss 정본이 CANCELED 일 때만).
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

  if (verified.status === 'CANCELED') {
    // 전액 취소(환불): 재조회로 확인된 경우에만 회수한다. 구독 만료를 앞당기고 단건구매를 refunded 로
    // 돌리는 일은 한 트랜잭션 RPC(20260729000001)가 한다. 실패하면 500 → Toss 가 재시도.
    const { error } = await admin.rpc('revoke_payment_and_grant', { p_order_id: orderId })
    if (error) {
      return NextResponse.json({ error: '환불 회수 처리에 실패했습니다.' }, { status: 500 })
    }
  } else if (verified.status === 'PARTIAL_CANCELED') {
    // 부분 취소는 자동 회수하지 않는다(디지털 상품 부분 환불은 운영 판단). 미확정 주문만 정리.
    await admin.from('payments')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .neq('status', 'paid')
  } else if (verified.status === 'EXPIRED' || verified.status === 'ABORTED') {
    await admin.from('payments')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .neq('status', 'paid')
  }

  return NextResponse.json({ ok: true })
}
