import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Toss 웹훅 — 결제 상태 변경 통지(보조 경로). 승인 주경로는 /confirm.
// 테스트 스캐폴드: 상태 동기화(취소/실패)만 반영. 실 운영 시 서명 검증 강화 필요.
//
// ⚠ 보안 주의(실 운영 전 필수): Toss 웹훅은 발신 IP 허용목록 또는 이벤트 재조회로
// 위조를 차단해야 한다. 지금은 웹훅으로 "부여"를 하지 않으므로(부여는 confirm 만),
// 위조 웹훅이 할 수 있는 최대치는 "상태를 canceled/failed 로 바꾸기"뿐 —
// 부여 위조는 불가하나, 실 운영에선 정당 결제를 취소로 뒤집는 것도 막아야 한다.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const orderId: string | undefined = body?.data?.orderId ?? body?.orderId
  const status: string | undefined = body?.data?.status ?? body?.status

  if (!orderId || !status) {
    // 알 수 없는 이벤트는 200 으로 무시(Toss 재시도 폭주 방지).
    return NextResponse.json({ ok: true, ignored: true })
  }

  const admin = createAdminClient()

  // 취소/실패만 반영. 부여(paid)는 confirm 만 담당 — 웹훅으로 부여하지 않음(위조 방어).
  if (status === 'CANCELED' || status === 'EXPIRED' || status === 'ABORTED') {
    await admin.from('payments')
      .update({ status: status === 'CANCELED' ? 'canceled' : 'failed', updated_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .neq('status', 'paid') // 이미 확정된 결제는 웹훅으로 뒤집지 않음
  }

  return NextResponse.json({ ok: true })
}
