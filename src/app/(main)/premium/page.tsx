'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { useSubscriptionStore, PRICING } from '@/stores/subscriptionStore'
import { UpgradeModal } from '@/components/premium/UpgradeModal'

type BillingCycle = 'monthly' | 'yearly'

const getPlans = (billingCycle: BillingCycle, currentTier: string) => [
  {
    name: '무료',
    price: '₩0',
    period: '',
    monthlyEquivalent: null,
    description: '가볍게 시작하기',
    features: [
      '기본 틀 이용',
      '월 5회 내보내기',
      '워터마크 포함',
      '2인 협업',
    ],
    limitations: [
      '프리미엄 틀 이용 불가',
      '고해상도 내보내기 불가',
    ],
    cta: currentTier === 'free' ? '현재 플랜' : '무료로 전환',
    variant: 'outline' as const,
    current: currentTier === 'free',
    tier: 'free' as const,
  },
  {
    name: '프리미엄',
    price: billingCycle === 'yearly'
      ? `₩${PRICING.premium.yearly.toLocaleString()}`
      : `₩${PRICING.premium.monthly.toLocaleString()}`,
    period: billingCycle === 'yearly' ? '/년' : '/월',
    monthlyEquivalent: billingCycle === 'yearly'
      ? Math.floor(PRICING.premium.yearly / 12)
      : null,
    savings: billingCycle === 'yearly' ? PRICING.premium.yearlySavings : null,
    description: '본격적으로 즐기기',
    features: [
      '모든 틀 이용',
      '무제한 내보내기',
      '워터마크 제거',
      '고해상도 (2x)',
      '우선 고객 지원',
      '신규 틀 우선 이용',
    ],
    limitations: [],
    cta: currentTier === 'premium' ? '현재 플랜' : '프리미엄 시작',
    variant: 'primary' as const,
    popular: true,
    current: currentTier === 'premium',
    tier: 'premium' as const,
  },
  {
    name: '크리에이터',
    price: billingCycle === 'yearly'
      ? `₩${PRICING.creator.yearly.toLocaleString()}`
      : `₩${PRICING.creator.monthly.toLocaleString()}`,
    period: billingCycle === 'yearly' ? '/년' : '/월',
    monthlyEquivalent: billingCycle === 'yearly'
      ? Math.floor(PRICING.creator.yearly / 12)
      : null,
    savings: billingCycle === 'yearly' ? PRICING.creator.yearlySavings : null,
    description: '틀 제작자를 위한',
    features: [
      '프리미엄 모든 기능',
      '틀 업로드 무제한',
      '수익 배분 (70%)',
      '크리에이터 뱃지',
      '분석 대시보드',
      '1:1 전담 지원',
    ],
    limitations: [],
    cta: currentTier === 'creator' ? '현재 플랜' : '크리에이터 신청',
    variant: 'accent' as const,
    current: currentTier === 'creator',
    tier: 'creator' as const,
  },
]

const faqs = [
  {
    q: '결제는 어떻게 하나요?',
    a: '신용카드, 체크카드, 카카오페이, 네이버페이 등 다양한 결제 수단을 지원합니다. (준비 중)',
  },
  {
    q: '언제든 해지할 수 있나요?',
    a: '네, 언제든 자유롭게 구독을 해지할 수 있습니다. 해지 후에도 결제 기간까지는 프리미엄 기능을 이용할 수 있어요.',
  },
  {
    q: '환불 정책은 어떻게 되나요?',
    a: '결제 후 7일 이내에 서비스를 이용하지 않은 경우 전액 환불이 가능합니다.',
  },
  {
    q: '크리에이터 수익은 어떻게 받나요?',
    a: '매월 정산되며, 5만원 이상 시 계좌이체로 지급됩니다. (준비 중)',
  },
]

export default function PremiumPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'premium' | 'creator'>('premium')
  const { subscription, subscribe, isDemoMode } = useSubscriptionStore()

  const plans = getPlans(billingCycle, subscription.tier)

  const handleSelectPlan = (tier: 'free' | 'premium' | 'creator') => {
    if (tier === 'free' || tier === subscription.tier) return

    if (isDemoMode) {
      // 데모 모드: 바로 구독 적용
      subscribe(tier, billingCycle)
      alert(`${tier === 'premium' ? '프리미엄' : '크리에이터'} 구독이 활성화되었습니다! (데모 모드)`)
    } else {
      // 실제 모드: 모달 열기
      setSelectedTier(tier)
      setShowUpgradeModal(true)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="py-12 sm:py-20 px-4 bg-gradient-to-b from-primary-100 to-white text-center">
        <div className="max-w-[800px] mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-100 rounded-full text-sm text-accent-700 mb-6">
            <Sparkles className="w-4 h-4" />
            <span>더 많은 기능을 원하시나요?</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            <span className="text-primary-400">프리미엄</span>으로 업그레이드
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            워터마크 제거, 무제한 내보내기, 고해상도 저장까지.
            <br className="hidden sm:block" />
            더 멋진 작품을 만들어보세요.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-2 p-1 bg-gray-100 rounded-full">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all',
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              월간 결제
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all relative',
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              연간 결제
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-accent-400 text-white text-[10px] font-bold rounded-full">
                2개월 무료
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 px-4">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'bg-white rounded-[24px] p-6 border-2 transition-all',
                  plan.popular && !plan.current
                    ? 'border-primary-400 shadow-lg md:scale-105'
                    : plan.current
                    ? 'border-green-400 bg-green-50/30'
                    : plan.variant === 'accent'
                    ? 'border-accent-300'
                    : 'border-gray-200'
                )}
              >
                {plan.current && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full mb-4">
                    <Check className="w-3 h-3" />
                    현재 구독 중
                  </div>
                )}
                {plan.popular && !plan.current && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary-400 text-white text-xs font-medium rounded-full mb-4">
                    <Crown className="w-3 h-3" />
                    인기
                  </div>
                )}
                {plan.variant === 'accent' && !plan.popular && !plan.current && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-accent-400 text-white text-xs font-medium rounded-full mb-4">
                    <Zap className="w-3 h-3" />
                    크리에이터
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                {plan.monthlyEquivalent && (
                  <p className="text-sm text-accent-500 mb-4">
                    월 ₩{plan.monthlyEquivalent.toLocaleString()} · ₩{plan.savings?.toLocaleString()} 절약
                  </p>
                )}
                {!plan.monthlyEquivalent && <div className="h-6 mb-4" />}

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-center gap-2 text-sm text-gray-400 line-through">
                      {limitation}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.current ? 'ghost' : plan.variant === 'accent' ? 'secondary' : plan.variant}
                  className="w-full"
                  disabled={plan.current}
                  onClick={() => handleSelectPlan(plan.tier)}
                >
                  {plan.cta}
                  {!plan.current && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            ))}
          </div>

          {/* Demo Mode Indicator */}
          {isDemoMode && (
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-sm text-amber-700">
                🎮 <span className="font-medium">데모 모드</span>: 플랜을 선택하면 실제 결제 없이 기능을 체험할 수 있어요
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredTier={selectedTier}
      />

      {/* FAQ */}
      <section className="py-12 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            자주 묻는 질문
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="bg-white rounded-[16px] p-5 border border-gray-200"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            아직 고민되시나요?
          </h2>
          <p className="text-gray-500 mb-6">
            무료로 시작해서 충분히 체험해보세요.
            <br />
            마음에 드시면 언제든 업그레이드하실 수 있어요.
          </p>
          <Button asChild>
            <Link href="/templates">
              무료로 시작하기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
