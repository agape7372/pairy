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
  // H-02(2차 감사 · DL-0006): `.eq('status','pending')` 만으로는 0행 매치 시에도 error 가 없어
  // 그대로 부여로 넘어가 동시 confirm 시 구독이 이중부여된다(단건은 unique index 로 보호되나
  // 구독 grant_subscription 은 additive 라 60일이 됨). `.select()` 로 실제 claim 한 행 수를 확인해
  // "정확히 1행을 pending→paid 로 바꾼 요청"만 부여하도록 강제(exactly-once).
  const { data: claimed, error: markError } = await admin.from('payments')
    .update({ status: 'paid', payment_key: paymentKey, updated_at: new Date().toISOString() })
    .eq('id', payment.id)
    .eq('status', 'pending') // 동시 확정 경합에서 한 번만 통과
    .select('id')

  if (markError) {
    return NextResponse.json({ error: '결제 기록 갱신 실패' }, { status: 500 })
  }

  // 0행 = 경합에서 졌거나(다른 요청이 이미 paid 로 전환) status 가 pending 이 아님(failed/canceled).
  // 재조회해 paid 면 멱등 성공, 그 외엔 부여하지 않고 충돌로 거절(이중부여·비정상 부여 차단).
  if (!claimed || claimed.length !== 1) {
    const { data: fresh } = await admin.from('payments')
      .select('status, template_id')
      .eq('id', payment.id)
      .maybeSingle()
    if (fresh?.status === 'paid') {
      return NextResponse.json({
        ok: true,
        alreadyProcessed: true,
        kind: fresh.template_id ? 'template' : 'subscription',
        templateId: fresh.template_id ?? undefined,
      })
    }
    return NextResponse.json({ error: '결제 상태가 유효하지 않습니다.' }, { status: 409 })
  }

  // ── 부여(정확히 1행 claim 성공 시에만 도달): 단건구매면 purchases 확정 기록, 아니면 구독 부여 ──
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
