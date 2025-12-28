'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
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
import { cn } from '@/lib/utils/cn'
import { useSubscriptionStore, TIER_LIMITS } from '@/stores/subscriptionStore'

// 목업 통계 데이터
const mockStats = {
  totalEarnings: 127500,
  pendingPayout: 45000,
  thisMonthEarnings: 32500,
  lastMonthEarnings: 28000,
  totalTemplates: 8,
  totalViews: 15892,
  totalUses: 4523,
  totalLikes: 1234,
}

// 월별 수익 데이터 (목업)
const monthlyEarnings = [
  { month: '7월', earnings: 15000 },
  { month: '8월', earnings: 22000 },
  { month: '9월', earnings: 18500 },
  { month: '10월', earnings: 25000 },
  { month: '11월', earnings: 28000 },
  { month: '12월', earnings: 32500 },
]

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

// 정산 내역 (목업)
const payoutHistory = [
  { date: '2024-11-30', amount: 52000, status: 'completed' },
  { date: '2024-10-31', amount: 38000, status: 'completed' },
  { date: '2024-09-30', amount: 22500, status: 'completed' },
]

export default function CreatorDashboardPage() {
  const { subscription } = useSubscriptionStore()
  const limits = TIER_LIMITS[subscription.tier]
  const isCreator = subscription.tier === 'creator'

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

  const earningsChange = ((mockStats.thisMonthEarnings - mockStats.lastMonthEarnings) / mockStats.lastMonthEarnings * 100).toFixed(1)
  const isPositiveChange = mockStats.thisMonthEarnings >= mockStats.lastMonthEarnings

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

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[20px] p-5 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">총 수익</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ₩{mockStats.totalEarnings.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">누적 수익</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[20px] p-5 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-600">이번 달</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ₩{mockStats.thisMonthEarnings.toLocaleString()}
          </p>
          <div className={cn(
            'flex items-center gap-1 text-xs mt-1',
            isPositiveChange ? 'text-green-600' : 'text-red-600'
          )}>
            {isPositiveChange ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            <span>{earningsChange}% 전월 대비</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[20px] p-5 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">총 사용</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {mockStats.totalUses.toLocaleString()}회
          </p>
          <p className="text-xs text-gray-500 mt-1">내 틀 사용 횟수</p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-[20px] p-5 border border-pink-100">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <span className="text-sm text-gray-600">총 좋아요</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {mockStats.totalLikes.toLocaleString()}개
          </p>
          <p className="text-xs text-gray-500 mt-1">받은 좋아요</p>
        </div>
      </div>

      {/* Pending Payout */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-[20px] p-6 border border-primary-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">정산 예정 금액</p>
            <p className="text-3xl font-bold text-gray-900">
              ₩{mockStats.pendingPayout.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              다음 정산일: 2025년 1월 31일 (₩50,000 이상 시 출금 가능)
            </p>
          </div>
          <Button variant="outline" disabled={mockStats.pendingPayout < 50000}>
            <Download className="w-4 h-4 mr-2" />
            정산 신청
          </Button>
        </div>
      </div>

      {/* Monthly Earnings Chart */}
      <div className="bg-white rounded-[20px] p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-400" />
          월별 수익
        </h2>
        <div className="flex items-end gap-2 h-40">
          {monthlyEarnings.map((data, index) => {
            const maxEarnings = Math.max(...monthlyEarnings.map(d => d.earnings))
            const height = (data.earnings / maxEarnings) * 100
            const isLastMonth = index === monthlyEarnings.length - 1

            return (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-28">
                  <span className="text-xs text-gray-500 mb-1">
                    {(data.earnings / 10000).toFixed(1)}만
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-t-lg transition-all',
                      isLastMonth
                        ? 'bg-gradient-to-t from-primary-400 to-primary-300'
                        : 'bg-gray-200'
                    )}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className={cn(
                  'text-xs',
                  isLastMonth ? 'text-primary-600 font-medium' : 'text-gray-500'
                )}>
                  {data.month}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* My Templates Performance */}
      <div className="bg-white rounded-[20px] p-6 border border-gray-200">
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
                  ₩{template.earnings.toLocaleString()}
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

      {/* Payout History */}
      <div className="bg-white rounded-[20px] p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-500" />
          정산 내역
        </h2>

        <div className="space-y-3">
          {payoutHistory.map((payout, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
            >
              <div>
                <p className="font-medium text-gray-900">
                  ₩{payout.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{payout.date}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                완료
              </span>
            </div>
          ))}
        </div>

        {payoutHistory.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            아직 정산 내역이 없어요
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-accent-50 to-primary-50 rounded-[20px] p-6 border border-accent-100">
        <h3 className="font-bold text-gray-900 mb-3">💡 수익 올리는 팁</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• 시즌별/이벤트 테마 틀을 만들어보세요 (크리스마스, 발렌타인 등)</li>
          <li>• 트위터에서 틀을 홍보하면 사용자가 늘어나요</li>
          <li>• 사용자 피드백을 반영해 틀을 개선하세요</li>
          <li>• 다양한 인원수(1인/2인/단체)용 틀을 만들어보세요</li>
        </ul>
      </div>
    </div>
  )
}
