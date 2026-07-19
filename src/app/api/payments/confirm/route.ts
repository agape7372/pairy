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

  // 확정+부여: 단일 트랜잭션 RPC (20260719000000). 상태 전환과 부여가 함께
  // 커밋되므로 중간 크래시 시 둘 다 롤백돼 재시도 가능하고, granted_at 앵커로
  // 동시 확정 경합·재호출 모두 멱등('already')이다.
  const { data: grantResult, error: grantError } = await admin.rpc('confirm_payment_and_grant', {
    p_payment_id: payment.id,
    p_payment_key: paymentKey,
  })
  if (grantError) {
    return NextResponse.json({ error: '결제 확정 처리에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    alreadyProcessed: grantResult === 'already' ? true : undefined,
    kind: payment.template_id ? 'template' : 'subscription',
    templateId: payment.template_id ?? undefined,
  })
}
