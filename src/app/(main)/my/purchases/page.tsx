'use client'

import Link from 'next/link'
import { ShoppingBag, Download, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui'
import { PricingBadge } from '@/components/marketplace'
import { usePurchases } from '@/stores/marketplaceStore'

export default function PurchasesPage() {
  const purchases = usePurchases()

  // 상대 시간 포맷
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / 86400000)

    if (days === 0) return '오늘'
    if (days === 1) return '어제'
    if (days < 7) return `${days}일 전`
    if (days < 30) return `${Math.floor(days / 7)}주 전`
    return date.toLocaleDateString('ko-KR')
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">구매 내역</h1>
              <p className="text-sm text-gray-500">
                총 {purchases.length}개의 틀을 구매했어요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {purchases.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              아직 구매한 틀이 없어요
            </h2>
            <p className="text-gray-500 mb-6">
              마음에 드는 틀을 구매하고 사용해보세요!
            </p>
            <Button asChild>
              <Link href="/templates">틀 둘러보기</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Preview */}
                <Link
                  href={`/templates/${purchase.templateId}`}
                  className="shrink-0"
                >
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center text-4xl overflow-hidden">
                    {purchase.templatePreview ? (
                      <img
                        src={purchase.templatePreview}
                        alt={purchase.templateTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      '🎨'
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      href={`/templates/${purchase.templateId}`}
                      className="font-semibold text-gray-900 hover:text-primary-500 transition-colors truncate"
                    >
                      {purchase.templateTitle}
                    </Link>
                    <PricingBadge
                      pricingType={purchase.pricingType}
                      price={purchase.amount}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {purchase.creatorName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatRelativeTime(purchase.purchasedAt)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/templates/${purchase.templateId}`}>
                        상세보기
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/editor/${purchase.templateId}`}>
                        <Download className="w-4 h-4 mr-1" />
                        사용하기
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
