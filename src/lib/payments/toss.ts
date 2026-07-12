/**
 * Toss Payments 서버 유틸 (테스트모드 스캐폴드).
 * 실 상점 계약 후 TOSS_SECRET_KEY 를 실 키로 교체하면 실결제로 전환된다.
 */

// 구독 정가(서버 정본). 클라가 금액을 정하지 못하게 서버가 강제. src/stores PRICING 과 일치.
export const SUBSCRIPTION_PRICE_KRW = 2900
export const SUBSCRIPTION_GRANT_DAYS = 30

const TOSS_API = 'https://api.tosspayments.com/v1/payments/confirm'

interface TossConfirmResult {
  ok: boolean
  status?: string
  code?: string
  message?: string
}

/**
 * Toss 결제 승인. 성공 리다이렉트로 받은 (paymentKey, orderId, amount)를 서버에서 확정한다.
 * Idempotency-Key 로 같은 주문의 중복 승인 요청을 Toss 측에서도 멱등 처리.
 */
export async function confirmTossPayment(params: {
  paymentKey: string
  orderId: string
  amount: number
  idempotencyKey: string
}): Promise<TossConfirmResult> {
  const secretKey = process.env.TOSS_SECRET_KEY
  if (!secretKey) {
    return { ok: false, code: 'CONFIG', message: 'TOSS_SECRET_KEY 누락' }
  }

  // Basic base64('{secretKey}:') — 시크릿키 뒤 콜론 필수
  const auth = Buffer.from(`${secretKey}:`).toString('base64')

  try {
    const res = await fetch(TOSS_API, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': params.idempotencyKey,
      },
      body: JSON.stringify({
        paymentKey: params.paymentKey,
        orderId: params.orderId,
        amount: params.amount,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { ok: false, code: data.code, message: data.message }
    }
    return { ok: true, status: data.status }
  } catch (err) {
    return { ok: false, code: 'NETWORK', message: err instanceof Error ? err.message : 'unknown' }
  }
}

/** 서버 발급 주문번호 — 영숫자/-/_ 6~64자(Toss 규격). uid 접두로 소유 추적. */
export function makeOrderId(userId: string): string {
  const rand = crypto.randomUUID().replace(/-/g, '')
  return `sub_${userId.slice(0, 8)}_${rand}`.slice(0, 64)
}
