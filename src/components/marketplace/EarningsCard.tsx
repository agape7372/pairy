'use client'

import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Award, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, calculateGrowth, type CreatorStats } from '@/hooks/useCreatorEarnings'

interface EarningsCardProps {
  stats: CreatorStats
  className?: string
}

export function EarningsCard({ stats, className }: EarningsCardProps) {
  const growth = calculateGrowth(stats.thisMonthEarnings, stats.lastMonthEarnings)
  const isPositiveGrowth = growth >= 0

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {/* 총 수익 */}
      <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-4 border border-primary-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-primary-600" />
          </div>
          <span className="text-sm text-gray-600">총 수익</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(stats.totalEarnings)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          수수료 20% 차감 후
        </p>
      </div>

      {/* 이번 달 수익 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-sm text-gray-600">이번 달</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(stats.thisMonthEarnings)}
        </p>
        <div className="flex items-center gap-1 mt-1">
          {isPositiveGrowth ? (
            <TrendingUp className="w-3 h-3 text-green-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span className={cn(
            'text-xs font-medium',
            isPositiveGrowth ? 'text-green-600' : 'text-red-600'
          )}>
            {isPositiveGrowth ? '+' : ''}{growth}% 전월 대비
          </span>
        </div>
      </div>

      {/* 정산 대기 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-sm text-gray-600">정산 대기</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(stats.pendingPayout)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          매월 15일 정산
        </p>
      </div>

      {/* 총 판매 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm text-gray-600">총 판매</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {stats.totalSales}건
        </p>
        <p className="text-xs text-gray-500 mt-1">
          이번 달 {stats.thisMonthSales}건
        </p>
      </div>
    </div>
  )
}

// 베스트셀러 카드
interface TopSellerCardProps {
  template: {
    id: string
    title: string
    sales: number
  } | null
  className?: string
}

export function TopSellerCard({ template, className }: TopSellerCardProps) {
  if (!template) {
    return (
      <div className={cn('bg-gray-50 rounded-2xl p-6 border border-gray-200 text-center', className)}>
        <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">아직 판매 내역이 없어요</p>
      </div>
    )
  }

  return (
    <div className={cn('bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200', className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
          <Award className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-amber-700 font-medium">베스트셀러</p>
          <p className="text-xs text-amber-600">가장 많이 팔린 틀</p>
        </div>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{template.title}</h3>
      <p className="text-sm text-gray-600">총 {template.sales}건 판매</p>
    </div>
  )
}

// 수익 요약 미니 카드
interface EarningsMiniCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function EarningsMiniCard({
  label,
  value,
  icon,
  trend,
  className,
}: EarningsMiniCardProps) {
  return (
    <div className={cn('bg-white rounded-xl p-4 border border-gray-200', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        {icon}
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-1">
          {trend.isPositive ? (
            <TrendingUp className="w-3 h-3 text-green-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span className={cn(
            'text-xs',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        </div>
      )}
    </div>
  )
}
