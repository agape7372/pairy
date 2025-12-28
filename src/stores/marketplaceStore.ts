'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 가격 유형
export type PricingType = 'free' | 'credit' | 'paid'

// 구매 상태
export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'

// 구매 기록
export interface Purchase {
  id: string
  templateId: string
  templateTitle: string
  templatePreview: string
  creatorId: string
  creatorName: string
  amount: number
  pricingType: PricingType
  status: PurchaseStatus
  purchasedAt: string
}

// 판매 기록 (크리에이터용)
export interface Sale {
  id: string
  templateId: string
  templateTitle: string
  buyerId: string
  buyerName: string
  amount: number
  commission: number // 플랫폼 수수료 (20%)
  netAmount: number // 실수령액
  soldAt: string
}

// 정산 요청
export interface PayoutRequest {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  requestedAt: string
  processedAt: string | null
  bankInfo: {
    bankName: string
    accountNumber: string
    accountHolder: string
  }
}

// 크리에이터 수익 요약
export interface EarningsSummary {
  totalEarnings: number
  pendingPayout: number
  thisMonthEarnings: number
  totalSales: number
  thisMonthSales: number
}

// 스토어 상태
interface MarketplaceState {
  // 구매 내역
  purchases: Purchase[]

  // 판매 내역 (크리에이터)
  sales: Sale[]

  // 정산 요청 내역
  payoutRequests: PayoutRequest[]

  // 수익 요약
  earnings: EarningsSummary

  // 액션 - 구매
  purchaseTemplate: (template: {
    id: string
    title: string
    preview: string
    creatorId: string
    creatorName: string
    price: number
    pricingType: PricingType
  }) => Purchase
  hasPurchased: (templateId: string) => boolean
  getPurchasesByTemplate: (templateId: string) => Purchase | undefined

  // 액션 - 판매 (크리에이터)
  recordSale: (sale: Omit<Sale, 'id' | 'commission' | 'netAmount' | 'soldAt'>) => void
  getSalesByTemplate: (templateId: string) => Sale[]

  // 액션 - 정산
  requestPayout: (amount: number, bankInfo: PayoutRequest['bankInfo']) => PayoutRequest

  // 액션 - 통계
  getEarningsSummary: () => EarningsSummary
  getMonthlySalesData: () => { month: string; sales: number; earnings: number }[]

  // 초기화
  reset: () => void
}

// 플랫폼 수수료율 (20%)
const COMMISSION_RATE = 0.2

// 초기 상태
const initialState = {
  purchases: [] as Purchase[],
  sales: [] as Sale[],
  payoutRequests: [] as PayoutRequest[],
  earnings: {
    totalEarnings: 0,
    pendingPayout: 0,
    thisMonthEarnings: 0,
    totalSales: 0,
    thisMonthSales: 0,
  },
}

// 데모용 샘플 판매 데이터
const generateDemoSales = (): Sale[] => {
  const now = new Date()
  const sales: Sale[] = []

  // 최근 6개월 샘플 데이터
  for (let i = 0; i < 6; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const salesCount = Math.floor(Math.random() * 10) + 3

    for (let j = 0; j < salesCount; j++) {
      const day = Math.floor(Math.random() * 28) + 1
      const saleDate = new Date(month.getFullYear(), month.getMonth(), day)
      const amount = [500, 1000, 1500, 2000, 3000][Math.floor(Math.random() * 5)]
      const commission = amount * COMMISSION_RATE

      sales.push({
        id: `demo-sale-${i}-${j}`,
        templateId: `template-${j % 8 + 1}`,
        templateTitle: ['커플 케미 테스트', '우정 테스트', 'MBTI 궁합', '취향 저격 틀'][j % 4],
        buyerId: `buyer-${j}`,
        buyerName: ['익명', '딸기우유', '민트초코', '바닐라'][j % 4],
        amount,
        commission,
        netAmount: amount - commission,
        soldAt: saleDate.toISOString(),
      })
    }
  }

  return sales.sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime())
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      ...initialState,
      // 데모용 초기 데이터 - 빈 배열로 시작, persist 또는 onRehydrateStorage에서 설정
      sales: [],

      purchaseTemplate: (template) => {
        const purchase: Purchase = {
          id: `purchase-${Date.now()}`,
          templateId: template.id,
          templateTitle: template.title,
          templatePreview: template.preview,
          creatorId: template.creatorId,
          creatorName: template.creatorName,
          amount: template.price,
          pricingType: template.pricingType,
          status: 'completed', // 데모에서는 바로 완료
          purchasedAt: new Date().toISOString(),
        }

        set((state) => ({
          purchases: [purchase, ...state.purchases],
        }))

        return purchase
      },

      hasPurchased: (templateId) => {
        const { purchases } = get()
        return purchases.some(
          (p) => p.templateId === templateId && p.status === 'completed'
        )
      },

      getPurchasesByTemplate: (templateId) => {
        const { purchases } = get()
        return purchases.find(
          (p) => p.templateId === templateId && p.status === 'completed'
        )
      },

      recordSale: (saleData) => {
        const commission = saleData.amount * COMMISSION_RATE
        const netAmount = saleData.amount - commission

        const sale: Sale = {
          id: `sale-${Date.now()}`,
          ...saleData,
          commission,
          netAmount,
          soldAt: new Date().toISOString(),
        }

        set((state) => ({
          sales: [sale, ...state.sales],
          earnings: {
            ...state.earnings,
            totalEarnings: state.earnings.totalEarnings + netAmount,
            pendingPayout: state.earnings.pendingPayout + netAmount,
            totalSales: state.earnings.totalSales + 1,
          },
        }))
      },

      getSalesByTemplate: (templateId) => {
        const { sales } = get()
        return sales.filter((s) => s.templateId === templateId)
      },

      requestPayout: (amount, bankInfo) => {
        const request: PayoutRequest = {
          id: `payout-${Date.now()}`,
          amount,
          status: 'pending',
          requestedAt: new Date().toISOString(),
          processedAt: null,
          bankInfo,
        }

        set((state) => ({
          payoutRequests: [request, ...state.payoutRequests],
          earnings: {
            ...state.earnings,
            pendingPayout: Math.max(0, state.earnings.pendingPayout - amount),
          },
        }))

        return request
      },

      getEarningsSummary: () => {
        const { sales } = get()
        const now = new Date()
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const thisMonthSales = sales.filter((s) => s.soldAt.startsWith(thisMonth))
        const thisMonthEarnings = thisMonthSales.reduce((sum, s) => sum + s.netAmount, 0)
        const totalEarnings = sales.reduce((sum, s) => sum + s.netAmount, 0)

        return {
          totalEarnings,
          pendingPayout: totalEarnings * 0.3, // 데모: 30%가 미정산
          thisMonthEarnings,
          totalSales: sales.length,
          thisMonthSales: thisMonthSales.length,
        }
      },

      getMonthlySalesData: () => {
        const { sales } = get()
        const now = new Date()
        const monthlyData: Record<string, { sales: number; earnings: number }> = {}

        // 최근 6개월 초기화
        for (let i = 0; i < 6; i++) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          monthlyData[key] = { sales: 0, earnings: 0 }
        }

        // 판매 데이터 집계
        sales.forEach((sale) => {
          const month = sale.soldAt.slice(0, 7)
          if (monthlyData[month]) {
            monthlyData[month].sales += 1
            monthlyData[month].earnings += sale.netAmount
          }
        })

        // 배열로 변환 (오래된 순)
        return Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, data]) => ({
            month,
            ...data,
          }))
      },

      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'pairy-marketplace',
      // 보안: 민감한 계좌 정보(bankInfo)는 저장하지 않음
      partialize: (state) => ({
        purchases: state.purchases,
        sales: state.sales,
        // payoutRequests에서 bankInfo 제거하여 저장
        payoutRequests: state.payoutRequests.map(req => ({
          ...req,
          bankInfo: { bankName: '', accountNumber: '', accountHolder: '' }, // 마스킹 처리
        })),
      }),
      // 초기 로드 시 데모 데이터 설정
      onRehydrateStorage: () => (state) => {
        // persist된 sales가 비어있으면 데모 데이터 생성
        if (state && state.sales.length === 0) {
          state.sales = generateDemoSales()
        }
      },
    }
  )
)

// 편의 훅들
export function usePurchases() {
  return useMarketplaceStore((state) => state.purchases)
}

export function useHasPurchased(templateId: string) {
  return useMarketplaceStore((state) => state.hasPurchased(templateId))
}

export function useSales() {
  return useMarketplaceStore((state) => state.sales)
}

export function useEarnings() {
  return useMarketplaceStore((state) => state.getEarningsSummary())
}

export function useMonthlySales() {
  return useMarketplaceStore((state) => state.getMonthlySalesData())
}
