import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SUBSCRIPTION_PRICE_KRW, SUBSCRIPTION_GRANT_DAYS, makeOrderId } from '@/lib/payments/toss'

// 결제 준비: pending 결제 row 를 서버가 생성하고 orderId·amount 를 확정한다.
// body 없음 = 구독 / { templateId } = 마켓 단건구매(M4). 금액은 둘 다 서버가 정함(금액 위조 차단).
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const templateId: string | undefined =
    typeof body?.templateId === 'string' ? body.templateId : undefined

  const admin = createAdminClient()
  const orderId = makeOrderId(user.id)

  // ── 마켓 단건구매 ──
  if (templateId) {
    // 금액·판매가능 여부는 서버 기록(templates)으로 강제
    const { data: template } = await admin
      .from('templates')
      .select('id, title, price, pricing_type, is_public, creator_id')
      .eq('id', templateId)
      .maybeSingle()

    if (!template || !template.is_public) {
      return NextResponse.json({ error: '판매 중인 틀이 아닙니다.' }, { status: 404 })
    }
    if (template.pricing_type !== 'paid' || template.price <= 0) {
      return NextResponse.json({ error: '유료 판매 틀이 아닙니다.' }, { status: 400 })
    }
    if (template.creator_id === user.id) {
      return NextResponse.json({ error: '본인 틀은 구매할 수 없습니다.' }, { status: 400 })
    }

    // 중복 구매 차단
    const { data: existing } = await admin
      .from('purchases')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('template_id', templateId)
      .eq('status', 'completed')
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: '이미 구매한 틀입니다.' }, { status: 409 })
    }

    const { error } = await admin.from('payments').insert({
      user_id: user.id,
      order_id: orderId,
      template_id: templateId,
      amount: template.price,
      status: 'pending',
      grant_days: 0, // 단건구매는 구독 부여 없음
    })
    if (error) {
      return NextResponse.json({ error: '결제 준비에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      orderId,
      amount: template.price,
      orderName: template.title.slice(0, 100),
      customerEmail: user.email ?? undefined,
    })
  }

  // ── 구독 결제 (기존 경로) ──
  const amount = SUBSCRIPTION_PRICE_KRW

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
