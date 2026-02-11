'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Eye,
  Heart,
  Sparkles,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Crown,
} from 'lucide-react'
import { Button } from '@/components/ui'
import {
  EarningsCard,
  TopSellerCard,
  SalesChart,
  PayoutRequestModal,
} from '@/components/marketplace'
import { cn } from '@/lib/utils/cn'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useCreatorEarnings, formatCurrency } from '@/hooks/useCreatorEarnings'

// 내 틀 목록 (목업)
const myTemplates = [
  {
    id: '1',
    title: '커플 프로필 틀',
    emoji: '💕',
    views: 5234,
    uses: 1523,
    likes: 456,
    earnings: 15200,
    trend: 12,
  },
  {
    id: '2',
    title: '친구 관계도',
    emoji: '✨',
    views: 3892,
    uses: 1234,
    likes: 312,
    earnings: 9800,
    trend: -5,
  },
  {
    id: '3',
    title: 'OC 소개 카드',
    emoji: '🌙',
    views: 2456,
    uses: 756,
    likes: 234,
    earnings: 5600,
    trend: 8,
  },
]

export default function CreatorDashboardPage() {
  const { subscription } = useSubscriptionStore()
  const isCreator = subscription.tier === 'creator'
  const { stats, monthlyData, recentSales, payoutRequests, requestPayout } = useCreatorEarnings()
  const [showPayoutModal, setShowPayoutModal] = useState(false)

  // 크리에이터가 아닌 경우 안내
  if (!isCreator) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-200 to-primary-200 flex items-center justify-center mb-6">
          <Crown className="w-12 h-12 text-accent-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          크리에이터 전용 공간이에요
        </h1>
        <p className="text-gray-500 mb-6 max-w-md">
          틀을 만들고 수익을 얻고 싶으신가요?
          <br />
          크리에이터로 업그레이드하고 대시보드를 이용하세요!
        </p>
        <Button asChild>
          <Link href="/premium">
            <Crown className="w-4 h-4 mr-2" />
            크리에이터 되기
          </Link>
        </Button>
      </div>
    )
  }

  const handlePayoutRequest = (amount: number, bankInfo: { bankName: string; accountNumber: string; accountHolder: string }) => {
    requestPayout(amount, bankInfo)
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">크리에이터 대시보드</h1>
          <p className="text-gray-500">틀의 성과와 수익을 확인하세요</p>
        </div>
        <Button asChild>
          <Link href="/templates/new">
            <FileText className="w-4 h-4 mr-2" />
            새 틀 만들기
          </Link>
        </Button>
      </div>

      {/* Stats Overview - Using EarningsCard */}
      <EarningsCard stats={stats} />

      {/* Pending Payout & Best Seller */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Payout */}
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-6 border border-primary-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">정산 예정 금액</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.pendingPayout)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                다음 정산일: 매월 15일 (₩10,000 이상 시 출금 가능)
              </p>
            </div>
            <Button
              variant="outline"
              disabled={stats.pendingPayout < 10000}
              onClick={() => setShowPayoutModal(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              정산 신청
            </Button>
          </div>
        </div>

        {/* Best Seller */}
        <TopSellerCard template={stats.topSellingTemplate} />
      </div>

      {/* Monthly Sales Chart */}
      <SalesChart data={monthlyData} />

      {/* My Templates Performance */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent-400" />
            내 틀 성과
          </h2>
          <Link
            href="/my/works"
            className="text-sm text-primary-500 hover:underline"
          >
            전체 보기 →
          </Link>
        </div>

        <div className="space-y-4">
          {myTemplates.map((template) => (
            <div
              key={template.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-2xl">
                {template.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{template.title}</h3>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {template.views.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {template.uses.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {template.likes}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatCurrency(template.earnings)}
                </p>
                <div className={cn(
                  'flex items-center justify-end gap-1 text-xs',
                  template.trend >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {template.trend >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  <span>{Math.abs(template.trend)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          최근 판매
        </h2>

        {recentSales.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            아직 판매 내역이 없어요
          </div>
        ) : (
          <div className="space-y-3">
            {recentSales.slice(0, 5).map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-900">{sale.templateTitle}</p>
                  <p className="text-xs text-gray-500">
                    {sale.buyerName} · {new Date(sale.soldAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(sale.netAmount)}
                  </p>
                  <p className="text-xs text-gray-400">
                    수수료 -{formatCurrency(sale.commission)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          정산 내역
        </h2>

        {payoutRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            아직 정산 내역이 없어요
          </div>
        ) : (
          <div className="space-y-3">
            {payoutRequests.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(payout.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(payout.requestedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <span className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full',
                  payout.status === 'completed' && 'bg-green-100 text-green-700',
                  payout.status === 'pending' && 'bg-amber-100 text-amber-700',
                  payout.status === 'processing' && 'bg-blue-100 text-blue-700',
                  payout.status === 'rejected' && 'bg-red-100 text-red-700'
                )}>
                  {payout.status === 'completed' && '완료'}
                  {payout.status === 'pending' && '대기'}
                  {payout.status === 'processing' && '처리중'}
                  {payout.status === 'rejected' && '거절'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-accent-50 to-primary-50 rounded-2xl p-6 border border-accent-100">
        <h3 className="font-bold text-gray-900 mb-3">💡 수익 올리는 팁</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• 시즌별/이벤트 테마 틀을 만들어보세요 (크리스마스, 발렌타인 등)</li>
          <li>• 트위터에서 틀을 홍보하면 사용자가 늘어나요</li>
          <li>• 사용자 피드백을 반영해 틀을 개선하세요</li>
          <li>• 다양한 인원수(1인/2인/단체)용 틀을 만들어보세요</li>
        </ul>
      </div>

      {/* Payout Modal */}
      <PayoutRequestModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        availableAmount={stats.pendingPayout}
        onSubmit={handlePayoutRequest}
      />
    </div>
  )
}
