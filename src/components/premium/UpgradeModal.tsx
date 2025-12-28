'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Crown, Zap, Check, Sparkles, Heart, Users } from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import {
  useSubscriptionStore,
  PRICING,
  TIER_LIMITS,
  type SubscriptionTier,
} from '@/stores/subscriptionStore'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature?: string // 어떤 기능 때문에 업그레이드가 필요한지
  requiredTier?: SubscriptionTier
}

export function UpgradeModal({
  isOpen,
  onClose,
  feature,
  requiredTier = 'premium',
}: UpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<'premium' | 'duo' | 'creator'>(
    requiredTier === 'creator' ? 'creator' : requiredTier === 'duo' ? 'duo' : 'premium'
  )
  const { subscribe, startTrial, isDemoMode } = useSubscriptionStore()
  const toast = useToast()

  if (!isOpen) return null

  const price = PRICING[selectedTier].monthly

  const handleSubscribe = () => {
    if (isDemoMode) {
      // 데모 모드: 바로 구독 적용
      subscribe(selectedTier, 'monthly')
      const tierName = selectedTier === 'premium' ? '프리미엄' : selectedTier === 'duo' ? '듀오' : '크리에이터'
      toast.success(`${tierName} 구독이 활성화되었습니다!`)
      onClose()
    } else {
      // 실제 모드: 결제 페이지로 이동 (추후 구현)
      toast.info('결제 기능은 준비 중입니다.')
    }
  }

  const handleStartTrial = () => {
    startTrial()
    toast.success('7일 무료 체험이 시작되었습니다!')
    onClose()
  }

  const features = {
    premium: [
      '모든 프리미엄 자료 이용',
      '무제한 다운로드 & 내보내기',
      '워터마크 제거',
      '고해상도 (2x) 내보내기',
      '우선 고객 지원',
    ],
    duo: [
      '프리미엄 모든 기능',
      '2인 동시 이용',
      '공유 서재 & 폴더',
      `매월 ${PRICING.duo.bonusCredits} 보너스 크레딧`,
      '듀오 전용 배지',
    ],
    creator: [
      '프리미엄 모든 기능',
      '자료 업로드 무제한',
      '수익 배분 70%',
      '크리에이터 뱃지',
      '분석 대시보드',
      '1:1 전담 지원',
    ],
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[24px] shadow-2xl p-6 z-50 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-200 to-accent-200 mb-4">
            <Crown className="w-8 h-8 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            업그레이드하고 더 많은 기능을!
          </h2>
          {feature && (
            <p className="text-gray-500">
              <span className="font-medium text-primary-500">{feature}</span>을(를) 이용하려면
              업그레이드가 필요해요.
            </p>
          )}
        </div>

        {/* Tier Selection */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => setSelectedTier('premium')}
            className={cn(
              'p-3 rounded-xl border-2 transition-all text-left',
              selectedTier === 'premium'
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="font-semibold text-gray-900 text-sm">프리미엄</span>
            </div>
            <p className="text-xs text-gray-500">본격적으로</p>
          </button>

          <button
            onClick={() => setSelectedTier('duo')}
            className={cn(
              'p-3 rounded-xl border-2 transition-all text-left',
              selectedTier === 'duo'
                ? 'border-pink-400 bg-pink-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="font-semibold text-gray-900 text-sm">듀오</span>
            </div>
            <p className="text-xs text-gray-500">페어와 함께</p>
          </button>

          <button
            onClick={() => setSelectedTier('creator')}
            className={cn(
              'p-3 rounded-xl border-2 transition-all text-left',
              selectedTier === 'creator'
                ? 'border-amber-400 bg-amber-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-gray-900 text-sm">크리에이터</span>
            </div>
            <p className="text-xs text-gray-500">제작자용</p>
          </button>
        </div>

        {/* Price Display */}
        <div className="text-center mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-end justify-center gap-1">
            <span className="text-3xl font-bold text-gray-900">
              ₩{price.toLocaleString()}
            </span>
            <span className="text-gray-500 mb-1">/월</span>
          </div>
        </div>

        {/* Features List */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">포함된 기능</h4>
          <ul className="space-y-2">
            {features[selectedTier].map((feat) => (
              <li key={feat} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                {feat}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={handleSubscribe}
          >
            {selectedTier === 'premium' ? '프리미엄' : selectedTier === 'duo' ? '듀오' : '크리에이터'} 시작하기
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleStartTrial}
          >
            7일 무료 체험하기
          </Button>

          <p className="text-xs text-center text-gray-400">
            언제든 해지 가능 · 결제 후 7일 이내 환불 가능
          </p>
        </div>

        {/* Demo Mode Indicator */}
        {isDemoMode && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 text-center">
              🎮 데모 모드: 실제 결제 없이 기능을 체험할 수 있어요
            </p>
          </div>
        )}
      </div>
    </>
  )
}

// 업그레이드 필요 시 보여주는 작은 배너
export function UpgradeBanner({
  feature,
  onUpgrade,
}: {
  feature: string
  onUpgrade: () => void
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-100 rounded-xl">
      <div className="flex items-center gap-2">
        <Crown className="w-4 h-4 text-primary-400" />
        <span className="text-sm text-gray-700">
          <span className="font-medium">{feature}</span>은 프리미엄 기능이에요
        </span>
      </div>
      <Button size="sm" onClick={onUpgrade}>
        업그레이드
      </Button>
    </div>
  )
}

// 내보내기 제한 경고
export function ExportLimitWarning({
  remaining,
  onUpgrade,
}: {
  remaining: number
  onUpgrade: () => void
}) {
  if (remaining > 3) return null

  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-xl border',
      remaining === 0
        ? 'bg-red-50 border-red-200'
        : 'bg-amber-50 border-amber-200'
    )}>
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-sm',
          remaining === 0 ? 'text-red-700' : 'text-amber-700'
        )}>
          {remaining === 0
            ? '이번 달 내보내기 횟수를 모두 사용했어요'
            : `이번 달 내보내기 ${remaining}회 남았어요`}
        </span>
      </div>
      <Button
        size="sm"
        variant={remaining === 0 ? 'primary' : 'outline'}
        onClick={onUpgrade}
      >
        무제한 사용하기
      </Button>
    </div>
  )
}
