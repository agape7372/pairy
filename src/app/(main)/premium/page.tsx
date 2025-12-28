'use client'

import Link from 'next/link'
import { Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'

const plans = [
  {
    name: '무료',
    price: '₩0',
    period: '',
    description: '가볍게 시작하기',
    features: [
      '기본 틀 이용',
      '월 3회 내보내기',
      '워터마크 포함',
      '2인 협업',
    ],
    limitations: [
      '프리미엄 틀 이용 불가',
      '고해상도 내보내기 불가',
    ],
    cta: '현재 플랜',
    variant: 'outline' as const,
    current: true,
  },
  {
    name: '프리미엄',
    price: '₩3,900',
    period: '/월',
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
    cta: '프리미엄 시작',
    variant: 'primary' as const,
    popular: true,
  },
  {
    name: '크리에이터',
    price: '₩9,900',
    period: '/월',
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
    cta: '크리에이터 신청',
    variant: 'accent' as const,
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
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 px-4">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-[24px] p-6 border-2 transition-all ${
                  plan.popular
                    ? 'border-primary-400 shadow-lg scale-105'
                    : plan.variant === 'accent'
                    ? 'border-accent-300'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary-400 text-white text-xs font-medium rounded-full mb-4">
                    <Crown className="w-3 h-3" />
                    인기
                  </div>
                )}
                {plan.variant === 'accent' && !plan.popular && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-accent-400 text-white text-xs font-medium rounded-full mb-4">
                    <Zap className="w-3 h-3" />
                    크리에이터
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>

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
                  onClick={() => {
                    if (!plan.current) {
                      alert('결제 기능은 준비 중입니다.')
                    }
                  }}
                >
                  {plan.cta}
                  {!plan.current && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

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
