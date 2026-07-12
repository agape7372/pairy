import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmTossPayment } from '@/lib/payments/toss'

// 결제 확정: 성공 리다이렉트로 온 (paymentKey, orderId, amount)를 서버가 검증·승인한다.
// 방어선: (1) 로그인 유저 = 주문 소유자 (2) 금액 = 서버 pending row 대조 (3) 멱등(이미 paid 면 재부여 안 함).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const paymentKey: string | undefined = body?.paymentKey
  const orderId: string | undefined = body?.orderId
  const amount: number | undefined = body?.amount

  if (!paymentKey || !orderId || typeof amount !== 'number') {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const admin = createAdminClient()

  // pending 결제 조회 — 소유자·금액을 서버 기록과 대조(클라 값 신뢰 안 함).
  const { data: payment } = await admin
    .from('payments')
    .select('id, user_id, amount, status, grant_days, template_id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (!payment) {
    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
  }
  if (payment.user_id !== user.id) {
    return NextResponse.json({ error: '주문 소유자가 아닙니다.' }, { status: 403 })
  }
  // 멱등: 이미 확정된 주문이면 부여 반복 없이 성공만 반환.
  if (payment.status === 'paid') {
    return NextResponse.json({
      ok: true,
      alreadyProcessed: true,
      kind: payment.template_id ? 'template' : 'subscription',
      templateId: payment.template_id ?? undefined,
    })
  }
  // 금액 위조 차단: 클라가 보낸 amount 도, Toss 로 보낼 amount 도 서버 기록값으로 강제.
  if (payment.amount !== amount) {
    return NextResponse.json({ error: '결제 금액이 일치하지 않습니다.' }, { status: 400 })
  }

  // Toss 승인 (서버 기록 금액 사용). Idempotency-Key = orderId 로 Toss 측 중복 방지.
  const result = await confirmTossPayment({
    paymentKey,
    orderId,
    amount: payment.amount,
    idempotencyKey: orderId,
  })

  if (!result.ok) {
    await admin.from('payments')
      .update({ status: 'failed', payment_key: paymentKey, updated_at: new Date().toISOString() })
      .eq('id', payment.id)
    return NextResponse.json({ error: result.message ?? '결제 승인에 실패했습니다.' }, { status: 402 })
  }

  // 확정: payments=paid + 구독 부여. paid 전환은 이미-paid 가드로 멱등.
  const { error: markError } = await admin.from('payments')
    .update({ status: 'paid', payment_key: paymentKey, updated_at: new Date().toISOString() })
    .eq('id', payment.id)
    .eq('status', 'pending') // 동시 확정 경합에서 한 번만 통과

  if (markError) {
    return NextResponse.json({ error: '결제 기록 갱신 실패' }, { status: 500 })
  }

  // ── 부여: 단건구매면 purchases 확정 기록, 아니면 구독 부여 ──
  if (payment.template_id) {
    // pending→paid 가드로 exactly-once, unique index 는 이중 안전망
    const { error: purchaseError } = await admin.from('purchases').insert({
      buyer_id: user.id,
      template_id: payment.template_id,
      amount: payment.amount,
      currency: 'KRW',
      status: 'completed',
    })
    // 23505(unique) = 이미 기록됨 — 멱등 성공으로 취급
    if (purchaseError && purchaseError.code !== '23505') {
      return NextResponse.json({ error: '구매 기록 저장 실패' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, kind: 'template', templateId: payment.template_id })
  }

  const { error: grantError } = await admin.rpc('grant_subscription', {
    p_uid: user.id,
    p_days: payment.grant_days,
  })
  if (grantError) {
    return NextResponse.json({ error: '구독 부여 실패' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, kind: 'subscription' })
}
