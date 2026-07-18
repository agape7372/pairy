/**
 * @jest-environment node
 *
 * 결제 라우트 방어선 테스트 (P1, 2026-07-18)
 * - prepare: 금액 서버강제(클라 금액 개입 불가)·자기틀 구매/중복 구매 차단
 * - confirm: 소유자·금액 대조, 멱등(이미 paid), 동시 확정 경합에서 단 1회 부여
 * - webhook: 본문 불신 — Toss 재조회 정본 상태만 반영, 부여 없음
 */

import type { NextRequest } from 'next/server'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}))
jest.mock('@/lib/payments/toss', () => {
  const actual = jest.requireActual('@/lib/payments/toss')
  return {
    ...actual,
    confirmTossPayment: jest.fn(),
    fetchTossPaymentByOrderId: jest.fn(),
    makeOrderId: jest.fn(() => 'sub_testuser_abc123'),
  }
})

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  confirmTossPayment,
  fetchTossPaymentByOrderId,
  SUBSCRIPTION_PRICE_KRW,
} from '@/lib/payments/toss'
import { POST as preparePost } from '../prepare/route'
import { POST as confirmPost } from '../confirm/route'
import { POST as webhookPost } from '../webhook/route'

const mockedCreateClient = createClient as jest.Mock
const mockedCreateAdmin = createAdminClient as jest.Mock
const mockedConfirmToss = confirmTossPayment as jest.Mock
const mockedFetchToss = fetchTossPaymentByOrderId as jest.Mock

const USER = { id: 'user-1', email: 'me@example.com' }

/** req 스텁 — 라우트는 req.json() 만 사용한다 */
function makeReq(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

function authAs(user: { id: string; email?: string } | null) {
  mockedCreateClient.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user } }) },
  })
}

/**
 * 체이너블 쿼리 스텁: 어떤 메서드 체인이든 자기 자신을 반환하고,
 * await 시점에 지정된 결과로 resolve 된다. 호출 기록은 jest.fn 으로 남는다.
 */
interface Chain {
  select: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  eq: jest.Mock
  neq: jest.Mock
  maybeSingle: jest.Mock
  single: jest.Mock
  order: jest.Mock
  then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise<unknown>
}

function chain(result: unknown): Chain {
  const c = {} as Chain
  for (const m of ['select', 'insert', 'update', 'eq', 'neq', 'maybeSingle', 'single', 'order'] as const) {
    c[m] = jest.fn(() => c)
  }
  c.then = (res, rej) => Promise.resolve(result).then(res, rej)
  return c
}

/** from() 호출 순서대로 체인을 반환하는 admin 스텁 */
function adminWith(chains: Chain[], rpcResult: unknown = { error: null }) {
  const from = jest.fn()
  for (const c of chains) from.mockReturnValueOnce(c)
  const rpc = jest.fn(async () => rpcResult)
  mockedCreateAdmin.mockReturnValue({ from, rpc })
  return { from, rpc }
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================
// prepare
// ============================================================

describe('POST /api/payments/prepare', () => {
  it('비로그인 401', async () => {
    authAs(null)
    const res = await preparePost(makeReq(null))
    expect(res.status).toBe(401)
  })

  it('구독: 금액은 서버 정가로 강제된다 (클라 입력 무시)', async () => {
    authAs(USER)
    const insertChain = chain({ error: null })
    adminWith([insertChain])

    // 클라가 amount 를 보내도 무시된다
    const res = await preparePost(makeReq({ amount: 1 }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.amount).toBe(SUBSCRIPTION_PRICE_KRW)
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ amount: SUBSCRIPTION_PRICE_KRW, status: 'pending', tier: 'premium' })
    )
  })

  it('단건구매: 금액은 templates.price 서버 기록으로 강제된다', async () => {
    authAs(USER)
    const templateChain = chain({
      data: { id: 't-1', title: '커플 틀', price: 1500, pricing_type: 'paid', is_public: true, creator_id: 'creator-9' },
    })
    const dupChain = chain({ data: null })
    const insertChain = chain({ error: null })
    adminWith([templateChain, dupChain, insertChain])

    const res = await preparePost(makeReq({ templateId: 't-1', amount: 1 }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.amount).toBe(1500)
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1500, template_id: 't-1', status: 'pending', grant_days: 0 })
    )
  })

  it('본인 틀 구매 400', async () => {
    authAs(USER)
    const templateChain = chain({
      data: { id: 't-1', title: '내 틀', price: 1500, pricing_type: 'paid', is_public: true, creator_id: USER.id },
    })
    adminWith([templateChain])

    const res = await preparePost(makeReq({ templateId: 't-1' }))
    expect(res.status).toBe(400)
  })

  it('이미 구매한 틀 409', async () => {
    authAs(USER)
    const templateChain = chain({
      data: { id: 't-1', title: '틀', price: 1500, pricing_type: 'paid', is_public: true, creator_id: 'creator-9' },
    })
    const dupChain = chain({ data: { id: 'p-1' } })
    adminWith([templateChain, dupChain])

    const res = await preparePost(makeReq({ templateId: 't-1' }))
    expect(res.status).toBe(409)
  })

  it('무료/비공개 틀은 결제 준비 거부', async () => {
    authAs(USER)
    const freeChain = chain({
      data: { id: 't-1', title: '무료 틀', price: 0, pricing_type: 'free', is_public: true, creator_id: 'creator-9' },
    })
    adminWith([freeChain])
    expect((await preparePost(makeReq({ templateId: 't-1' }))).status).toBe(400)

    const hiddenChain = chain({
      data: { id: 't-2', title: '비공개', price: 1500, pricing_type: 'paid', is_public: false, creator_id: 'creator-9' },
    })
    adminWith([hiddenChain])
    expect((await preparePost(makeReq({ templateId: 't-2' }))).status).toBe(404)
  })
})

// ============================================================
// confirm
// ============================================================

const PENDING_SUB_PAYMENT = {
  id: 'pay-1',
  user_id: USER.id,
  amount: SUBSCRIPTION_PRICE_KRW,
  status: 'pending',
  grant_days: 30,
  template_id: null,
}

describe('POST /api/payments/confirm', () => {
  it('금액 위조: 클라 amount 가 서버 기록과 다르면 400, Toss 호출 없음', async () => {
    authAs(USER)
    adminWith([chain({ data: PENDING_SUB_PAYMENT })])

    const res = await confirmPost(
      makeReq({ paymentKey: 'pk', orderId: 'o-1', amount: 100 })
    )

    expect(res.status).toBe(400)
    expect(mockedConfirmToss).not.toHaveBeenCalled()
  })

  it('타인 주문 확정 시도 403', async () => {
    authAs(USER)
    adminWith([chain({ data: { ...PENDING_SUB_PAYMENT, user_id: 'other-user' } })])

    const res = await confirmPost(
      makeReq({ paymentKey: 'pk', orderId: 'o-1', amount: SUBSCRIPTION_PRICE_KRW })
    )
    expect(res.status).toBe(403)
  })

  it('멱등: 이미 paid 주문은 재부여 없이 성공 반환', async () => {
    authAs(USER)
    const { rpc } = adminWith([chain({ data: { ...PENDING_SUB_PAYMENT, status: 'paid' } })])

    const res = await confirmPost(
      makeReq({ paymentKey: 'pk', orderId: 'o-1', amount: SUBSCRIPTION_PRICE_KRW })
    )
    const json = await res.json()

    expect(json.alreadyProcessed).toBe(true)
    expect(mockedConfirmToss).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('정상 구독 확정: Toss 는 서버 기록 금액으로 승인, grant_subscription 1회', async () => {
    authAs(USER)
    mockedConfirmToss.mockResolvedValue({ ok: true, status: 'DONE' })
    const selectChain = chain({ data: PENDING_SUB_PAYMENT })
    const markChain = chain({ data: [{ id: 'pay-1' }], error: null })
    const { rpc } = adminWith([selectChain, markChain])

    const res = await confirmPost(
      makeReq({ paymentKey: 'pk', orderId: 'o-1', amount: SUBSCRIPTION_PRICE_KRW })
    )
    const json = await res.json()

    expect(json).toEqual({ ok: true, kind: 'subscription' })
    expect(mockedConfirmToss).toHaveBeenCalledWith(
      expect.objectContaining({ amount: SUBSCRIPTION_PRICE_KRW, idempotencyKey: 'o-1' })
    )
    // pending→paid 조건부 전환 가드
    expect(markChain.eq).toHaveBeenCalledWith('status', 'pending')
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('grant_subscription', { p_uid: USER.id, p_days: 30 })
  })

  it('동시 확정 경합: pending→paid 0행 갱신(패배)이면 부여를 반복하지 않는다', async () => {
    authAs(USER)
    mockedConfirmToss.mockResolvedValue({ ok: true, status: 'DONE' })
    const selectChain = chain({ data: PENDING_SUB_PAYMENT })
    const lostRace = chain({ data: [], error: null }) // 다른 요청이 이미 전환함
    const { rpc } = adminWith([selectChain, lostRace])

    const res = await confirmPost(
      makeReq({ paymentKey: 'pk', orderId: 'o-1', amount: SUBSCRIPTION_PRICE_KRW })
    )
    const json = await res.json()

    expect(json.ok).toBe(true)
    expect(json.alreadyProcessed).toBe(true)
    expect(rpc).not.toHaveBeenCalled() // 이중 부여 금지
  })

  it('Toss 승인 실패: failed 마킹 + 402, 부여 없음', async () => {
    authAs(USER)
    mockedConfirmToss.mockResolvedValue({ ok: false, code: 'REJECTED', message: '거절' })
    const selectChain = chain({ data: PENDING_SUB_PAYMENT })
    const failChain = chain({ error: null })
    const { rpc } = adminWith([selectChain, failChain])

    const res = await confirmPost(
      makeReq({ paymentKey: 'pk', orderId: 'o-1', amount: SUBSCRIPTION_PRICE_KRW })
    )

    expect(res.status).toBe(402)
    expect(failChain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }))
    expect(rpc).not.toHaveBeenCalled()
  })

  it('단건구매 확정: purchases 기록, 23505(unique) 는 멱등 성공', async () => {
    authAs(USER)
    mockedConfirmToss.mockResolvedValue({ ok: true, status: 'DONE' })
    const payment = { ...PENDING_SUB_PAYMENT, grant_days: 0, template_id: 't-1', amount: 1500 }
    const selectChain = chain({ data: payment })
    const markChain = chain({ data: [{ id: 'pay-1' }], error: null })
    const purchaseChain = chain({ error: { code: '23505' } })
    const { rpc } = adminWith([selectChain, markChain, purchaseChain])

    const res = await confirmPost(makeReq({ paymentKey: 'pk', orderId: 'o-1', amount: 1500 }))
    const json = await res.json()

    expect(json).toEqual({ ok: true, kind: 'template', templateId: 't-1' })
    expect(rpc).not.toHaveBeenCalled() // 단건구매는 구독 부여 없음
  })
})

// ============================================================
// webhook
// ============================================================

describe('POST /api/payments/webhook', () => {
  it('위조 CANCELED: Toss 재조회 정본이 DONE 이면 아무것도 반영하지 않는다', async () => {
    mockedFetchToss.mockResolvedValue({ ok: true, status: 'DONE' })
    const { from } = adminWith([chain({ error: null })])

    const res = await webhookPost(
      makeReq({ data: { orderId: 'o-1', status: 'CANCELED' } })
    )
    const json = await res.json()

    expect(json.ok).toBe(true)
    expect(from).not.toHaveBeenCalled()
  })

  it('정본 CANCELED: canceled 반영하되 paid 는 뒤집지 않는다', async () => {
    mockedFetchToss.mockResolvedValue({ ok: true, status: 'CANCELED' })
    const updateChain = chain({ error: null })
    adminWith([updateChain])

    await webhookPost(makeReq({ data: { orderId: 'o-1', status: 'CANCELED' } }))

    expect(updateChain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'canceled' }))
    expect(updateChain.neq).toHaveBeenCalledWith('status', 'paid')
  })

  it('하향 아닌 상태 통지는 재조회 없이 무시 (부여 경로 아님)', async () => {
    const { from } = adminWith([])

    const res = await webhookPost(makeReq({ data: { orderId: 'o-1', status: 'DONE' } }))
    const json = await res.json()

    expect(json.ignored).toBe(true)
    expect(mockedFetchToss).not.toHaveBeenCalled()
    expect(from).not.toHaveBeenCalled()
  })

  it('재조회 실패(미존재 주문 포함) 시 반영하지 않는다', async () => {
    mockedFetchToss.mockResolvedValue({ ok: false, code: 'NOT_FOUND' })
    const { from } = adminWith([])

    const res = await webhookPost(makeReq({ data: { orderId: 'o-x', status: 'CANCELED' } }))
    const json = await res.json()

    expect(json.ignored).toBe(true)
    expect(from).not.toHaveBeenCalled()
  })
})
