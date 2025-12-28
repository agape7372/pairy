'use client'

import { useMemo } from 'react'
import { useMarketplaceStore, Sale, PayoutRequest } from '@/stores/marketplaceStore'

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
  const payoutRequests = useMarketplaceStore((state) => state.payoutRequests)
  const requestPayout = useMarketplaceStore((state) => state.requestPayout)
  const getMonthlySalesData = useMarketplaceStore((state) => state.getMonthlySalesData)

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
