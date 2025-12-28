'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, type MonthlyData } from '@/hooks/useCreatorEarnings'

interface SalesChartProps {
  data: MonthlyData[]
  className?: string
}

type ViewMode = 'earnings' | 'sales'

export function SalesChart({ data, className }: SalesChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('earnings')

  // 최대값 계산
  const maxValue = Math.max(
    ...data.map((d) => (viewMode === 'earnings' ? d.earnings : d.sales)),
    1
  )

  return (
    <div className={cn('bg-white rounded-2xl p-6 border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">월별 판매 추이</h3>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('earnings')}
            className={cn(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors',
              viewMode === 'earnings'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            수익
          </button>
          <button
            onClick={() => setViewMode('sales')}
            className={cn(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors',
              viewMode === 'sales'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            판매수
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-2 h-48">
        {data.map((item, index) => {
          const value = viewMode === 'earnings' ? item.earnings : item.sales
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0
          const isCurrentMonth = index === data.length - 1

          return (
            <div
              key={item.month}
              className="flex-1 flex flex-col items-center gap-2"
            >
              {/* Value Label */}
              <span className="text-xs text-gray-500 font-medium">
                {viewMode === 'earnings'
                  ? value > 0
                    ? `${Math.round(value / 1000)}K`
                    : '-'
                  : value > 0
                  ? value
                  : '-'}
              </span>

              {/* Bar */}
              <div className="w-full h-32 flex items-end">
                <div
                  className={cn(
                    'w-full rounded-t-lg transition-all duration-500',
                    isCurrentMonth
                      ? 'bg-gradient-to-t from-primary-400 to-primary-300'
                      : 'bg-gradient-to-t from-gray-200 to-gray-100'
                  )}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>

              {/* Month Label */}
              <span
                className={cn(
                  'text-xs',
                  isCurrentMonth ? 'text-primary-600 font-semibold' : 'text-gray-400'
                )}
              >
                {item.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <TrendingUp className="w-4 h-4" />
          <span>최근 6개월 추이</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">총 </span>
          <span className="font-semibold text-gray-900">
            {viewMode === 'earnings'
              ? formatCurrency(data.reduce((sum, d) => sum + d.earnings, 0))
              : `${data.reduce((sum, d) => sum + d.sales, 0)}건`}
          </span>
        </div>
      </div>
    </div>
  )
}

// 간단한 미니 차트 (대시보드 위젯용)
interface MiniChartProps {
  data: number[]
  className?: string
}

export function MiniChart({ data, className }: MiniChartProps) {
  const maxValue = Math.max(...data, 1)

  return (
    <div className={cn('flex items-end gap-1 h-8', className)}>
      {data.map((value, index) => {
        const height = (value / maxValue) * 100
        return (
          <div
            key={index}
            className="flex-1 bg-primary-300 rounded-sm"
            style={{ height: `${Math.max(height, 10)}%` }}
          />
        )
      })}
    </div>
  )
}
