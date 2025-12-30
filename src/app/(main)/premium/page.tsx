'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Sparkles, Crown, ArrowRight, Users, Gift, Heart, Star, Palette, MessageCircle, Leaf, Cherry, TrendingUp } from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { useSubscriptionStore, PRICING, type SubscriptionTier } from '@/stores/subscriptionStore'
import { UpgradeModal } from '@/components/premium/UpgradeModal'

/**
 * 프라이싱 페이지 - UX 심리학 적용
 *
 * 적용된 원칙:
 * 1. 가격 앵커링: 중간 티어를 먼저 눈에 띄게 (recommended)
 * 2. 3-4 티어 제한: 선택 피로 방지
 * 3. 소셜 프루프: 실제 유저 목소리
 * 4. 손실 회피: "이용 중" 상태 강조
 * 5. 스토리텔링: 숫자보다 서사로 접근
 */

// 서포터 티어 - 과금 유도보다 커뮤니티 참여 강조
const getSupporterTiers = (currentTier: string) => [
  {
    name: '일반 유저',
    icon: Leaf,
    tagline: '환영해요',
    description: '무료로 Pairy를 체험해보세요',
    monthlyPrice: 0,
    perks: [
      '기본 자료 열람',
      '월 10회 다운로드',
      '폴더 3개까지',
    ],
    tier: 'free' as const,
    current: currentTier === 'free',
    color: 'gray',
  },
  {
    name: '서포터',
    icon: Cherry,
    tagline: '고마워요',
    description: '창작자들을 응원하는 마음으로',
    monthlyPrice: PRICING.premium.monthly,
    perks: [
      '모든 자료 무제한',
      '워터마크 제거',
      '고해상도 저장',
      '서포터 전용 배지',
    ],
    tier: 'premium' as const,
    current: currentTier === 'premium',
    popular: true,
    recommended: true, // 가격 앵커링: 추천 티어
    savings: null, // 절약 표시
    color: 'pink',
  },
  {
    name: '페어 서포터',
    icon: Heart,
    tagline: '둘이라 좋아',
    description: '소중한 사람과 함께 후원해요',
    monthlyPrice: PRICING.duo.monthly,
    perPersonPrice: PRICING.duo.perPerson,
    perks: [
      '서포터 혜택 전부',
      '2인이 함께 이용',
      '공유 서재 기능',
      '매월 보너스 크레딧',
      '페어 전용 배지',
    ],
    tier: 'duo' as const,
    current: currentTier === 'duo',
    savings: '33%', // 가격 앵커링: 절약 표시
    color: 'rose',
  },
  {
    name: '크리에이터',
    icon: Crown,
    tagline: '멋져요',
    description: '직접 자료를 만들어 공유해요',
    monthlyPrice: PRICING.creator.monthly,
    perks: [
      '서포터 혜택 전부',
      '자료 업로드 무제한',
      '수익 배분 70%',
      '분석 대시보드',
      '크리에이터 배지',
    ],
    tier: 'creator' as const,
    current: currentTier === 'creator',
    color: 'amber',
  },
]

// 커뮤니티 보이스 - 실제 유저 느낌
const communityVoices = [
  {
    name: '딸기우유',
    message: '서포터 배지 달고 다니니까 기분이 좋아요',
    tier: 'premium',
  },
  {
    name: '민트초코',
    message: '페어로 쓰는데 공유 폴더가 진짜 편해요',
    tier: 'duo',
  },
  {
    name: 'ゆき',
    message: '제가 만든 틀로 수익이 나니까 신기해요',
    tier: 'creator',
  },
]

// FAQ 더 친근하게
const faqs = [
  {
    q: '언제든 그만둘 수 있나요?',
    a: '물론이에요. 언제든 자유롭게 해지할 수 있고, 해지해도 기간이 끝날 때까지는 그대로 쓸 수 있어요.',
  },
  {
    q: '페어 서포터는 누구랑 써도 되나요?',
    a: '네. 친구, 연인, 가족... 함께 창작하는 사람이라면 누구든 좋아요.',
  },
  {
    q: '결제는 어떻게 하나요?',
    a: '카드, 카카오페이, 네이버페이 등 편한 방법으로 할 수 있어요. (준비 중)',
  },
  {
    q: '환불은 가능한가요?',
    a: '7일 이내에 아직 사용 안 하셨다면 전액 환불해드려요.',
  },
]

export default function PremiumPage() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'premium' | 'creator' | 'duo'>('premium')
  const { subscription, subscribe, isDemoMode } = useSubscriptionStore()
  const toast = useToast()

  const tiers = getSupporterTiers(subscription.tier)

  const handleSelectTier = (tier: SubscriptionTier) => {
    if (tier === 'free' || tier === subscription.tier) return

    if (isDemoMode) {
      subscribe(tier, 'monthly')
      const tierName = tier === 'premium' ? '서포터' : tier === 'duo' ? '페어 서포터' : '크리에이터'
      toast.success(`${tierName}가 되었어요!`)
    } else {
      setSelectedTier(tier as 'premium' | 'creator' | 'duo')
      setShowUpgradeModal(true)
    }
  }

  const tierColors = {
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      badge: 'bg-gray-100 text-gray-600',
      button: 'bg-gray-100 text-gray-500 cursor-default',
      icon: 'text-gray-400',
    },
    pink: {
      bg: 'bg-gradient-to-br from-pink-50 to-rose-50',
      border: 'border-pink-200',
      badge: 'bg-pink-100 text-pink-600',
      button: 'bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500',
      icon: 'text-pink-400',
    },
    rose: {
      bg: 'bg-gradient-to-br from-rose-50 to-pink-50',
      border: 'border-rose-200',
      badge: 'bg-rose-100 text-rose-600',
      button: 'bg-gradient-to-r from-rose-400 to-pink-400 text-white hover:from-rose-500 hover:to-pink-500',
      icon: 'text-rose-400',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-600',
      button: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:from-amber-500 hover:to-orange-500',
      icon: 'text-amber-400',
    },
  }

  return (
    <div className="animate-fade-in">
      {/* Hero - 부드럽고 친근한 톤 */}
      <section className="py-16 sm:py-24 px-4 text-center relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-[10%] w-24 h-24 bg-pink-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-40 right-[15%] w-32 h-32 bg-accent-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-20 left-[30%] w-20 h-20 bg-amber-100 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="max-w-[600px] mx-auto">
          {/* 아이콘 */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Pairy를 <span className="text-primary-400">응원</span>해 주세요
          </h1>

          <p className="text-gray-500 leading-relaxed">
            여러분의 작은 후원이 크리에이터들에게<br />
            큰 힘이 돼요. 감사합니다.
          </p>
        </div>
      </section>

      {/* 서포터 티어 카드 - 덜 공격적인 디자인 */}
      <section className="py-8 px-4">
        <div className="max-w-[1000px] mx-auto">
          {/* 소개 문구 */}
          <div className="text-center mb-10">
            <p className="text-sm text-gray-400">
              부담 없이, 마음 가는 대로 선택해주세요
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tiers.map((tier, index) => {
              const colors = tierColors[tier.color as keyof typeof tierColors]
              const IconComponent = tier.icon

              return (
                <div
                  key={tier.name}
                  className={cn(
                    'rounded-2xl p-5 border transition-all duration-300 relative',
                    colors.bg,
                    colors.border,
                    tier.current && 'ring-2 ring-green-400 ring-offset-2',
                    'recommended' in tier && tier.recommended && !tier.current && 'sm:-translate-y-3 shadow-lg ring-2 ring-pink-200',
                    tier.popular && !('recommended' in tier && tier.recommended) && 'sm:-translate-y-2',
                    'hover:shadow-md'
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* 현재 상태 배지 */}
                  {tier.current && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full mb-3">
                      <Check className="w-3 h-3" />
                      지금 나
                    </div>
                  )}
                  {/* 추천 배지 - 가격 앵커링 */}
                  {'recommended' in tier && tier.recommended && !tier.current && (
                    <div className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full mb-3 font-medium',
                      'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-sm'
                    )}>
                      <Sparkles className="w-3 h-3" />
                      추천
                    </div>
                  )}
                  {/* 절약 배지 */}
                  {'savings' in tier && tier.savings && !tier.current && !('recommended' in tier && tier.recommended) && (
                    <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full mb-3', colors.badge)}>
                      <TrendingUp className="w-3 h-3" />
                      {tier.savings} 절약
                    </div>
                  )}
                  {tier.popular && !tier.current && !('recommended' in tier && tier.recommended) && !('savings' in tier && tier.savings) && (
                    <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full mb-3', colors.badge)}>
                      <Star className="w-3 h-3" />
                      많이 선택해요
                    </div>
                  )}

                  {/* 아이콘 + 이름 */}
                  <div className="flex items-center gap-3 mb-1">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', tier.color === 'gray' ? 'bg-gray-100' : `bg-${tier.color}-100`)}>
                      <IconComponent className={cn('w-5 h-5', colors.icon)} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{tier.name}</h3>
                      <p className="text-xs text-gray-400">{tier.tagline}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-4 mt-2">
                    {tier.description}
                  </p>

                  {/* 가격 - 덜 강조 */}
                  <div className="mb-4">
                    {tier.monthlyPrice === 0 ? (
                      <span className="text-lg font-medium text-gray-400">무료</span>
                    ) : (
                      <div>
                        <span className="text-lg font-semibold text-gray-700">
                          ₩{tier.monthlyPrice.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-400">/월</span>
                        {tier.perPersonPrice && (
                          <p className="text-xs text-rose-400 mt-0.5">
                            1인당 ₩{tier.perPersonPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 혜택 리스트 */}
                  <ul className="space-y-2 mb-5">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-gray-300 mt-1.5">•</span>
                        {perk}
                      </li>
                    ))}
                  </ul>

                  {/* 버튼 - 덜 공격적 */}
                  {tier.tier === 'free' ? (
                    <div className={cn(
                      'w-full py-2 rounded-xl text-sm text-center',
                      colors.button
                    )}>
                      {tier.current ? '현재 이용 중' : '기본'}
                    </div>
                  ) : (
                    <button
                      className={cn(
                        'w-full py-2.5 rounded-xl text-sm font-medium transition-all',
                        tier.current ? 'bg-gray-100 text-gray-400 cursor-default' : colors.button
                      )}
                      disabled={tier.current}
                      onClick={() => handleSelectTier(tier.tier)}
                    >
                      {tier.current ? '이용 중이에요' : `${tier.name} 되기`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* 데모 모드 안내 */}
          {isDemoMode && (
            <div className="mt-8 p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
              <p className="text-sm text-amber-600">
                데모 모드예요 - 결제 없이 체험해볼 수 있어요
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 커뮤니티 보이스 - 소셜 프루프를 부드럽게 */}
      <section className="py-12 px-4">
        <div className="max-w-[700px] mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4" />
              서포터들의 이야기
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {communityVoices.map((voice) => (
              <div
                key={voice.name}
                className="p-4 bg-white rounded-2xl border border-gray-100 hover:border-pink-100 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-500">
                      {voice.name.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{voice.name}</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  &ldquo;{voice.message}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 페어 서포터 설명 */}
      <section className="py-12 px-4 bg-gradient-to-b from-rose-50/50 to-transparent">
        <div className="max-w-[600px] mx-auto text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
            <Users className="w-7 h-7 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            페어 서포터
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            소중한 사람과 함께 후원하면<br />
            혜택도 나누고, 비용도 나눠요
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-rose-100 text-sm text-gray-600">
              <Gift className="w-4 h-4 text-rose-400" />
              공유 서재
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-rose-100 text-sm text-gray-600">
              <Heart className="w-4 h-4 text-rose-400" />
              페어 배지
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-rose-100 text-sm text-gray-600">
              <Sparkles className="w-4 h-4 text-rose-400" />
              33% 할인
            </div>
          </div>
        </div>
      </section>

      {/* 크리에이터 안내 - 부드러운 초대 */}
      <section className="py-12 px-4">
        <div className="max-w-[600px] mx-auto">
          <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Palette className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">
                  직접 만들어보고 싶다면?
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  크리에이터가 되어 자신만의 자료를 공유하고,<br />
                  다른 유저들의 후원을 받을 수 있어요
                </p>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-xl text-sm font-medium text-amber-700 transition-colors"
                  onClick={() => handleSelectTier('creator')}
                >
                  <Crown className="w-4 h-4" />
                  크리에이터 알아보기
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - 대화형으로 */}
      <section className="py-12 px-4 bg-gray-50/50">
        <div className="max-w-[600px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-lg font-bold text-gray-800">
              궁금한 점이 있으신가요?
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="p-4 bg-white rounded-xl border border-gray-100"
              >
                <h3 className="font-medium text-gray-800 text-sm mb-1">{faq.q}</h3>
                <p className="text-sm text-gray-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 마무리 - 부담 없는 마무리 */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-[400px] mx-auto">
          <p className="text-gray-400 text-sm mb-4">
            괜찮아요, 천천히 생각해도 돼요
          </p>
          <Button variant="ghost" asChild>
            <Link href="/templates" className="!text-gray-500">
              일단 구경하러 가기
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredTier={selectedTier}
      />
    </div>
  )
}
