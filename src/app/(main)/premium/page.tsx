'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Sparkles, Zap, Crown, ArrowRight, Users, Gift, Heart } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { useSubscriptionStore, PRICING, type SubscriptionTier } from '@/stores/subscriptionStore'
import { UpgradeModal } from '@/components/premium/UpgradeModal'

const getPlans = (currentTier: string) => [
  {
    name: '무료',
    price: '₩0',
    period: '',
    description: '가볍게 시작하기',
    features: [
      '기본 자료 이용',
      '월 10회 다운로드',
      '월 5회 내보내기',
      '폴더 3개 생성',
      '100MB 스토리지',
    ],
    limitations: [
      '프리미엄 자료 이용 불가',
      '고해상도 내보내기 불가',
    ],
    cta: currentTier === 'free' ? '현재 플랜' : '무료로 전환',
    variant: 'outline' as const,
    current: currentTier === 'free',
    tier: 'free' as const,
    icon: null,
    highlight: false,
  },
  {
    name: '프리미엄',
    price: `₩${PRICING.premium.monthly.toLocaleString()}`,
    period: '/월',
    description: '본격적으로 즐기기',
    features: [
      '모든 자료 이용',
      '무제한 다운로드',
      '무제한 내보내기',
      '워터마크 제거',
      '고해상도 (2x)',
      '폴더 20개 생성',
      '1GB 스토리지',
      '우선 고객 지원',
    ],
    limitations: [],
    cta: currentTier === 'premium' ? '현재 플랜' : '프리미엄 시작',
    variant: 'primary' as const,
    popular: true,
    current: currentTier === 'premium',
    tier: 'premium' as const,
    icon: Sparkles,
    highlight: true,
  },
  {
    name: '듀오',
    price: `₩${PRICING.duo.monthly.toLocaleString()}`,
    period: '/월 (2인)',
    pricePerPerson: `1인당 ₩${PRICING.duo.perPerson.toLocaleString()}`,
    description: '페어와 함께하기',
    features: [
      '프리미엄 모든 기능',
      '2인 동시 이용',
      '공유 서재 & 폴더',
      '2GB 공유 스토리지',
      `매월 ${PRICING.duo.bonusCredits} 보너스 크레딧`,
      '듀오 전용 배지',
      '33% 할인 혜택',
    ],
    limitations: [],
    cta: currentTier === 'duo' ? '현재 플랜' : '듀오 시작',
    variant: 'accent' as const,
    duo: true,
    current: currentTier === 'duo',
    tier: 'duo' as const,
    icon: Heart,
    highlight: false,
    badge: '커플 추천',
  },
  {
    name: '크리에이터',
    price: `₩${PRICING.creator.monthly.toLocaleString()}`,
    period: '/월',
    description: '자료 제작자를 위한',
    features: [
      '프리미엄 모든 기능',
      '자료 업로드 무제한',
      '수익 배분 (70%)',
      '크리에이터 뱃지',
      '분석 대시보드',
      '5GB 스토리지',
      '1:1 전담 지원',
    ],
    limitations: [],
    cta: currentTier === 'creator' ? '현재 플랜' : '크리에이터 신청',
    variant: 'secondary' as const,
    current: currentTier === 'creator',
    tier: 'creator' as const,
    icon: Crown,
    highlight: false,
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
    q: '듀오 플랜은 어떻게 이용하나요?',
    a: '듀오 구독 시 초대 코드가 생성됩니다. 이 코드를 파트너에게 공유하면 함께 이용할 수 있어요. 친구, 커플, 동료 누구나 가능합니다!',
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'premium' | 'creator' | 'duo'>('premium')
  const { subscription, subscribe, isDemoMode } = useSubscriptionStore()

  const plans = getPlans(subscription.tier)

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (tier === 'free' || tier === subscription.tier) return

    if (isDemoMode) {
      subscribe(tier, 'monthly')
      alert(`${tier === 'premium' ? '프리미엄' : tier === 'duo' ? '듀오' : '크리에이터'} 구독이 활성화되었습니다! (데모 모드)`)
    } else {
      setSelectedTier(tier as 'premium' | 'creator' | 'duo')
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
          <p className="text-lg text-gray-500">
            무제한 다운로드, 워터마크 제거, 고해상도 저장까지.
            <br className="hidden sm:block" />
            혼자 또는 함께, 더 멋진 작품을 만들어보세요.
          </p>
        </div>
      </section>

      {/* Duo Highlight Banner */}
      <section className="py-6 px-4 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 border-y border-pink-100">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">듀오 플랜 출시!</h3>
              <p className="text-sm text-gray-600">
                페어와 함께 구독하면 1인당 ₩{PRICING.duo.perPerson.toLocaleString()}
                <span className="text-pink-500 font-medium"> (33% 할인)</span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="!border-pink-300 !text-pink-600 hover:!bg-pink-50"
            onClick={() => handleSelectPlan('duo')}
          >
            <Users className="w-4 h-4 mr-1" />
            듀오로 시작하기
          </Button>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'bg-white rounded-[24px] p-6 border-2 transition-all relative',
                  plan.highlight
                    ? 'border-primary-400 shadow-lg lg:scale-105'
                    : plan.current
                    ? 'border-green-400 bg-green-50/30'
                    : plan.duo
                    ? 'border-pink-300 bg-pink-50/30'
                    : 'border-gray-200'
                )}
              >
                {/* Badges */}
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
                {plan.badge && !plan.current && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-pink-400 to-rose-400 text-white text-xs font-medium rounded-full mb-4">
                    <Heart className="w-3 h-3" />
                    {plan.badge}
                  </div>
                )}
                {plan.tier === 'creator' && !plan.popular && !plan.current && !plan.badge && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-400 text-white text-xs font-medium rounded-full mb-4">
                    <Zap className="w-3 h-3" />
                    크리에이터
                  </div>
                )}

                {/* Icon & Name */}
                <div className="flex items-center gap-2 mb-1">
                  {plan.icon && <plan.icon className="w-5 h-5 text-primary-400" />}
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 mb-1">{plan.period}</span>
                  </div>
                  {plan.pricePerPerson && (
                    <p className="text-sm text-pink-500 font-medium mt-1">
                      {plan.pricePerPerson}
                    </p>
                  )}
                </div>

                {/* Features */}
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

                {/* CTA */}
                <Button
                  variant={plan.current ? 'ghost' : plan.duo ? 'secondary' : plan.variant === 'accent' ? 'secondary' : plan.variant}
                  className={cn(
                    'w-full',
                    plan.duo && !plan.current && '!bg-gradient-to-r !from-pink-400 !to-rose-400 !text-white !border-none hover:!from-pink-500 hover:!to-rose-500'
                  )}
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

      {/* Duo Feature Detail */}
      <section className="py-12 px-4 bg-gradient-to-b from-pink-50 to-white">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 rounded-full text-sm text-pink-700 mb-6">
            <Users className="w-4 h-4" />
            <span>듀오 플랜 상세</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            페어와 함께하면 더 <span className="text-pink-500">특별해요</span>
          </h2>
          <p className="text-gray-500 mb-8">
            친구, 연인, 동료... 창작을 함께하는 누구든 함께 할 수 있어요
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-white rounded-2xl border border-pink-100">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center">
                <Gift className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">매월 보너스 크레딧</h3>
              <p className="text-sm text-gray-500">
                매월 {PRICING.duo.bonusCredits}개의 보너스 크레딧으로 유료 자료 할인 구매
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-pink-100">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">공유 서재</h3>
              <p className="text-sm text-gray-500">
                다운로드한 자료를 공유 폴더로 함께 관리
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-pink-100">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">듀오 배지</h3>
              <p className="text-sm text-gray-500">
                프로필에 표시되는 귀여운 듀오 전용 배지
              </p>
            </div>
          </div>
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
