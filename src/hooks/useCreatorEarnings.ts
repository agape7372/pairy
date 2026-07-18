'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'
import {
  useMarketplaceStore,
  COMMISSION_RATE,
  PayoutRequest,
  Sale,
} from '@/stores/marketplaceStore'

export interface CreatorStats {
  totalEarnings: number
  pendingPayout: number
  thisMonthEarnings: number
  lastMonthEarnings: number
  totalSales: number
  thisMonthSales: number
  averagePrice: number
  topSellingTemplate: { id: string; title: string; sales: number } | null
}

export interface MonthlyData {
  month: string
  label: string
  sales: number
  earnings: number
}

/** 서버 purchases 행 → Sale 뷰모델 (수수료 20% 서버 원장 기준 파생) */
interface ServerPurchaseRow {
  id: string
  template_id: string | null
  buyer_id: string | null
  amount: number
  created_at: string
  templates: { title: string } | null
  buyer: { display_name: string | null } | null
}

function mapServerSale(row: ServerPurchaseRow): Sale {
  const amount = Number(row.amount)
  const commission = amount * COMMISSION_RATE
  return {
    id: row.id,
    templateId: row.template_id ?? '',
    templateTitle: row.templates?.title ?? '(삭제된 틀)',
    buyerId: row.buyer_id ?? '',
    buyerName: row.buyer?.display_name ?? '구매자',
    amount,
    commission,
    netAmount: amount - commission,
    soldAt: row.created_at,
  }
}

export function useCreatorEarnings() {
  const demoSales = useMarketplaceStore((state) => state.sales)
  const demoPayoutRequests = useMarketplaceStore((state) => state.payoutRequests)
  const demoRequestPayout = useMarketplaceStore((state) => state.requestPayout)

  // 프로덕션(C-4): 매출·정산 진실은 서버 원장 — purchases(크리에이터 SELECT 정책) + payout_requests
  const [serverSales, setServerSales] = useState<Sale[]>([])
  const [serverPayoutRequests, setServerPayoutRequests] = useState<PayoutRequest[]>([])

  useEffect(() => {
    if (IS_DEMO_MODE) return
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const [salesRes, payoutRes] = await Promise.all([
        supabase
          .from('purchases')
          .select('id, template_id, buyer_id, amount, created_at, templates!inner(title, creator_id), buyer:profiles!buyer_id(display_name)')
          .eq('templates.creator_id', user.id)
          .eq('status', 'completed')
          .gt('amount', 0)
          .order('created_at', { ascending: false }),
        supabase
          .from('payout_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])
      if (cancelled) return

      if (salesRes.data) {
        setServerSales(
          (salesRes.data as unknown as ServerPurchaseRow[]).map(mapServerSale)
        )
      }
      if (payoutRes.data) {
        setServerPayoutRequests(payoutRes.data.map((row) => ({
          id: row.id,
          amount: row.amount,
          status: row.status,
          requestedAt: row.created_at,
          processedAt: row.processed_at,
          bankInfo: {
            bankName: row.bank_name,
            accountNumber: row.account_number,
            accountHolder: row.account_holder,
          },
        })))
      }
    })()
    return () => { cancelled = true }
  }, [])

  const sales = IS_DEMO_MODE ? demoSales : serverSales
  const payoutRequests = IS_DEMO_MODE ? demoPayoutRequests : serverPayoutRequests

  /** 정산 신청 — 프로덕션은 서버 원장 insert, 데모는 localStorage. 성공 여부 반환. */
  const requestPayout = async (
    amount: number,
    bankInfo: PayoutRequest['bankInfo']
  ): Promise<boolean> => {
    if (IS_DEMO_MODE) {
      demoRequestPayout(amount, bankInfo)
      return true
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .from('payout_requests')
        .insert({
          user_id: user.id,
          amount,
          bank_name: bankInfo.bankName,
          account_number: bankInfo.accountNumber,
          account_holder: bankInfo.accountHolder,
        })
        .select()
        .single()

      if (error || !data) return false

      setServerPayoutRequests((prev) => [{
        id: data.id,
        amount: data.amount,
        status: data.status,
        requestedAt: data.created_at,
        processedAt: data.processed_at,
        bankInfo,
      }, ...prev])
      return true
    } catch {
      return false
    }
  }

  const stats: CreatorStats = useMemo(() => {
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

    const thisMonthSales = sales.filter((s) => s.soldAt.startsWith(thisMonth))
    const lastMonthSales = sales.filter((s) => s.soldAt.startsWith(lastMonth))

    const totalEarnings = sales.reduce((sum, s) => sum + s.netAmount, 0)
    const thisMonthEarnings = thisMonthSales.reduce((sum, s) => sum + s.netAmount, 0)
    const lastMonthEarnings = lastMonthSales.reduce((sum, s) => sum + s.netAmount, 0)

    // 정산된/신청중 금액 차감 (rejected 제외) — 이중 신청 방지
    const reserved = payoutRequests
      .filter((p) => p.status !== 'rejected')
      .reduce((sum, p) => sum + p.amount, 0)
    const pendingPayout = Math.max(0, totalEarnings - reserved)

    // 평균 가격
    const averagePrice = sales.length > 0 ? totalEarnings / sales.length : 0

    // 베스트셀러 찾기
    const salesByTemplate: Record<string, { title: string; count: number }> = {}
    sales.forEach((sale) => {
      if (!salesByTemplate[sale.templateId]) {
        salesByTemplate[sale.templateId] = { title: sale.templateTitle, count: 0 }
      }
      salesByTemplate[sale.templateId].count++
    })

    const topSelling = Object.entries(salesByTemplate).sort(([, a], [, b]) => b.count - a.count)[0]
    const topSellingTemplate = topSelling
      ? { id: topSelling[0], title: topSelling[1].title, sales: topSelling[1].count }
      : null

    return {
      totalEarnings,
      pendingPayout,
      thisMonthEarnings,
      lastMonthEarnings,
      totalSales: sales.length,
      thisMonthSales: thisMonthSales.length,
      averagePrice,
      topSellingTemplate,
    }
  }, [sales, payoutRequests])

  const monthlyData: MonthlyData[] = useMemo(() => {
    const now = new Date()
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
    const monthly: Record<string, { sales: number; earnings: number }> = {}

    // 최근 6개월 초기화
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthly[key] = { sales: 0, earnings: 0 }
    }

    sales.forEach((sale) => {
      const month = sale.soldAt.slice(0, 7)
      if (monthly[month]) {
        monthly[month].sales += 1
        monthly[month].earnings += sale.netAmount
      }
    })

    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const monthIndex = parseInt(month.split('-')[1], 10) - 1
        return { month, label: monthNames[monthIndex], ...data }
      })
  }, [sales])

  const recentSales = useMemo(() => {
    return sales.slice(0, 10) // 최근 10개
  }, [sales])

  return {
    stats,
    monthlyData,
    recentSales,
    payoutRequests,
    requestPayout,
  }
}

// 금액 포맷팅
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

// 퍼센트 변화 계산
export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}
