'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'
import { useMarketplaceStore, PayoutRequest } from '@/stores/marketplaceStore'

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

export function useCreatorEarnings() {
  const sales = useMarketplaceStore((state) => state.sales)
  const demoPayoutRequests = useMarketplaceStore((state) => state.payoutRequests)
  const demoRequestPayout = useMarketplaceStore((state) => state.requestPayout)
  const getMonthlySalesData = useMarketplaceStore((state) => state.getMonthlySalesData)

  // 프로덕션: 정산 신청은 서버 원장(payout_requests, M4/C-4)
  const [serverPayoutRequests, setServerPayoutRequests] = useState<PayoutRequest[]>([])

  useEffect(() => {
    if (IS_DEMO_MODE) return
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (cancelled || !data) return
      setServerPayoutRequests(data.map((row) => ({
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
    })()
    return () => { cancelled = true }
  }, [])

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

    // H-03(2차 감사 · DL-0006 · F-25): 프로덕션 정산은 서버 매출 원장 성립 전까지 비활성.
    // stats(정산 예정 금액)가 클라 localStorage 매출(marketplaceStore.sales)로 계산돼 서버가
    // available balance·중복 pending 을 검증하지 못한다. 이 상태에서 client amount 를
    // payout_requests 에 insert 하면 허위 정산 요청이 성립하므로, 원장(F-25)이 서버 계산·잠금으로
    // 배선될 때까지 실 정산 신청을 받지 않는다. UI 는 아래 my/creator 에서 "준비 중" 으로 안내.
    return false
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

    // 정산된 금액 계산
    const paidOut = payoutRequests
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
    const pendingPayout = totalEarnings - paidOut

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
    const data = getMonthlySalesData()
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

    return data.map((d) => {
      const [, monthStr] = d.month.split('-')
      const monthIndex = parseInt(monthStr, 10) - 1
      return {
        ...d,
        label: monthNames[monthIndex],
      }
    })
  }, [getMonthlySalesData])

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
