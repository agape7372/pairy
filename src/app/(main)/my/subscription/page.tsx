'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Crown,
  Sparkles,
  Zap,
  Check,
  Calendar,
  CreditCard,
  ArrowRight,
  AlertCircle,
  Gift,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import {
  useSubscriptionStore,
  PRICING,
  TIER_LIMITS,
  type SubscriptionTier,
} from '@/stores/subscriptionStore'
import { UpgradeModal } from '@/components/premium/UpgradeModal'

const tierInfo = {
  free: {
    name: '무료',
    icon: Sparkles,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
  },
  premium: {
    name: '프리미엄',
    icon: Crown,
    color: 'text-primary-500',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
  },
  creator: {
    name: '크리에이터',
    icon: Zap,
    color: 'text-accent-500',
    bgColor: 'bg-accent-50',
    borderColor: 'border-accent-200',
  },
}

export default function SubscriptionPage() {
  const {
    subscription,
    usage,
    isDemoMode,
    cancelSubscription,
    getRemainingExports,
    getRemainingSavedWorks,
    setDemoTier,
  } = useSubscriptionStore()

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const currentTier = tierInfo[subscription.tier]
  const TierIcon = currentTier.icon
  const limits = TIER_LIMITS[subscription.tier]
  const remainingExports = getRemainingExports()
  const remainingSavedWorks = getRemainingSavedWorks()

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleCancelSubscription = () => {
    cancelSubscription()
    setShowCancelConfirm(false)
  }

  return (
    <div className="animate-fade-in">
      {/* Current Plan */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">현재 구독</h2>

        <div className={cn(
          'p-6 rounded-[20px] border-2',
          currentTier.bgColor,
          currentTier.borderColor
        )}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                subscription.tier === 'free' ? 'bg-gray-200' :
                subscription.tier === 'premium' ? 'bg-primary-200' : 'bg-accent-200'
              )}>
                <TierIcon className={cn('w-6 h-6', currentTier.color)} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{currentTier.name}</h3>
                {subscription.isTrialActive && (
                  <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                    <Gift className="w-3 h-3" />
                    무료 체험 중
                  </span>
                )}
              </div>
            </div>

            {subscription.tier === 'free' ? (
              <Button onClick={() => setShowUpgradeModal(true)}>
                업그레이드
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(true)}
              >
                구독 해지
              </Button>
            )}
          </div>

          {/* Subscription Details */}
          {subscription.tier !== 'free' && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-1">
                {subscription.isTrialActive ? '체험 종료일' : '다음 결제일'}
              </p>
              <p className="font-medium text-gray-900">
                {formatDate(subscription.isTrialActive
                  ? subscription.trialEndDate
                  : subscription.endDate
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Usage Stats */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">이번 달 사용량</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Exports */}
          <div className="p-4 bg-white rounded-[16px] border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">내보내기</span>
              {limits.exportsPerMonth === Infinity ? (
                <span className="text-sm text-green-600 font-medium">무제한</span>
              ) : (
                <span className="text-sm text-gray-900 font-medium">
                  {usage.exportsThisMonth} / {limits.exportsPerMonth}
                </span>
              )}
            </div>
            {limits.exportsPerMonth !== Infinity && (
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    remainingExports <= 1 ? 'bg-red-400' :
                    remainingExports <= 3 ? 'bg-amber-400' : 'bg-primary-400'
                  )}
                  style={{
                    width: `${Math.min(100, (usage.exportsThisMonth / limits.exportsPerMonth) * 100)}%`
                  }}
                />
              </div>
            )}
          </div>

          {/* Saved Works */}
          <div className="p-4 bg-white rounded-[16px] border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">저장된 작업</span>
              {limits.maxSavedWorks === Infinity ? (
                <span className="text-sm text-green-600 font-medium">무제한</span>
              ) : (
                <span className="text-sm text-gray-900 font-medium">
                  {usage.savedWorks} / {limits.maxSavedWorks}
                </span>
              )}
            </div>
            {limits.maxSavedWorks !== Infinity && (
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    remainingSavedWorks === 0 ? 'bg-red-400' :
                    remainingSavedWorks === 1 ? 'bg-amber-400' : 'bg-accent-400'
                  )}
                  style={{
                    width: `${Math.min(100, (usage.savedWorks / limits.maxSavedWorks) * 100)}%`
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">사용 가능한 기능</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries({
            '워터마크 제거': !limits.hasWatermark,
            '고해상도 내보내기': limits.canExportHighRes,
            '프리미엄 틀': limits.canAccessPremiumTemplates,
            '틀 업로드': limits.canUploadTemplates,
            '무제한 내보내기': limits.exportsPerMonth === Infinity,
            '무제한 저장': limits.maxSavedWorks === Infinity,
          }).map(([feature, enabled]) => (
            <div
              key={feature}
              className={cn(
                'p-3 rounded-xl border text-sm',
                enabled
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              )}
            >
              <div className="flex items-center gap-2">
                <Check className={cn('w-4 h-4', enabled ? 'text-green-500' : 'text-gray-300')} />
                <span>{feature}</span>
              </div>
            </div>
          ))}
        </div>

        {subscription.tier === 'free' && (
          <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-100 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">더 많은 기능이 필요하신가요?</p>
                <p className="text-sm text-gray-500">프리미엄으로 업그레이드하세요!</p>
              </div>
              <Button onClick={() => setShowUpgradeModal(true)}>
                <Crown className="w-4 h-4 mr-1" />
                업그레이드
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Demo Mode Tier Switcher */}
      {isDemoMode && (
        <section className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">데모 모드</span>
          </div>
          <p className="text-sm text-amber-600 mb-3">
            구독 티어를 변경해서 각 플랜의 기능을 테스트해보세요.
          </p>
          <div className="flex gap-2">
            {(['free', 'premium', 'creator'] as SubscriptionTier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setDemoTier(tier)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  subscription.tier === tier
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-amber-700 hover:bg-amber-100'
                )}
              >
                {tierInfo[tier].name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowCancelConfirm(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[20px] p-6 z-50">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              정말 해지하시겠어요?
            </h3>
            <p className="text-gray-500 mb-6">
              해지하시면 현재 결제 기간이 끝난 후 무료 플랜으로 전환됩니다.
              프리미엄 기능을 더 이상 사용할 수 없게 됩니다.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelConfirm(false)}
              >
                취소
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleCancelSubscription}
              >
                해지하기
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  )
}
