import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SUBSCRIPTION_PRICE_KRW, SUBSCRIPTION_GRANT_DAYS, makeOrderId } from '@/lib/payments/toss'

// 결제 준비: pending 결제 row 를 서버가 생성하고 orderId·amount 를 확정한다.
// 클라는 tier 만 고르고 금액은 서버가 정함(금액 위조 차단).
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const orderId = makeOrderId(user.id)
  const amount = SUBSCRIPTION_PRICE_KRW

  // service_role 로 pending 결제 기록(payments 쓰기는 service_role 만).
  const admin = createAdminClient()
  const { error } = await admin.from('payments').insert({
    user_id: user.id,
    order_id: orderId,
    tier: 'premium',
    amount,
    status: 'pending',
    grant_days: SUBSCRIPTION_GRANT_DAYS,
  })

  if (error) {
    return NextResponse.json({ error: '결제 준비에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({
    orderId,
    amount,
    orderName: '페어리 프리미엄 30일',
    customerEmail: user.email ?? undefined,
  })
}
