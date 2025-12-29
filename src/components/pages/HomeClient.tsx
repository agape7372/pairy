'use client'

/**
 * HomeClient - 랜딩페이지 클라이언트 컴포넌트
 *
 * UX 서사: "두 사람의 이야기가 만나는 곳"
 * - 히어로: 첫 만남의 설렘, 호기심을 자극하는 부드러운 진입
 * - 기능 소개: 단계별 여정을 따라가는 내러티브
 * - 템플릿: 각 틀이 살아있는 것처럼 호버에 반응
 * - CTA: 새로운 이야기를 시작하라는 초대
 */

import Link from 'next/link'
import {
  Heart,
  Users,
  Download,
  Sparkles,
  ArrowRight,
  Palette,
  Share2,
  Zap,
  Check,
  User,
  Moon,
  Star,
  Brush,
} from 'lucide-react'
import { Button, Tag } from '@/components/ui'
import { useScrollReveal, useCountUp, useMouseFollow } from '@/hooks/useScrollReveal'

// ============================================
// 데이터
// ============================================

const sampleTemplates = [
  {
    id: '1',
    title: '커플 프로필 틀',
    creator: '딸기크림',
    likeCount: 1234,
    tags: ['커플', '2인용'],
    icon: Heart,
    iconColor: 'text-primary-400',
    bgGradient: 'from-primary-100 to-primary-200',
  },
  {
    id: '2',
    title: '친구 관계도',
    creator: '페어리',
    likeCount: 892,
    tags: ['친구', '관계도'],
    icon: Star,
    iconColor: 'text-accent-400',
    bgGradient: 'from-accent-100 to-accent-200',
  },
  {
    id: '3',
    title: 'OC 소개 카드',
    creator: '문라이트',
    likeCount: 567,
    tags: ['프로필', '1인용'],
    icon: Moon,
    iconColor: 'text-gray-600',
    bgGradient: 'from-gray-100 to-gray-200',
  },
]

const features = [
  {
    icon: Sparkles,
    title: '웹에서 바로 편집',
    description: '포토샵 없이도 예쁜 결과물을 만들 수 있어요',
    color: 'primary' as const,
  },
  {
    icon: Users,
    title: '실시간 협업',
    description: '친구와 함께 동시에 편집할 수 있어요',
    color: 'accent' as const,
  },
  {
    icon: Download,
    title: '고화질 저장',
    description: '완성된 작품을 PNG로 다운로드해요',
    color: 'primary' as const,
  },
]

const steps = [
  {
    step: '01',
    title: '틀 선택하기',
    description: '마음에 드는 페어틀을 선택해요',
    icon: Palette,
  },
  {
    step: '02',
    title: '함께 채우기',
    description: '친구를 초대하고 함께 편집해요',
    icon: Users,
  },
  {
    step: '03',
    title: '저장하고 공유',
    description: '완성된 작품을 저장하고 자랑해요',
    icon: Share2,
  },
]

const testimonials = [
  {
    text: '드디어 포토샵 없이도 페어틀을 채울 수 있어요! 친구랑 실시간으로 하니까 더 재밌어요.',
    author: '민지',
    role: '트위터 자캐러',
    icon: Sparkles,
    iconBg: 'from-primary-200 to-primary-300',
  },
  {
    text: '제가 만든 틀을 다른 분들이 사용하는 걸 보니 뿌듯해요. 수익화도 기대되고요!',
    author: '수아',
    role: '틀 크리에이터',
    icon: Brush,
    iconBg: 'from-accent-200 to-accent-300',
  },
  {
    text: '모바일에서도 잘 되고, UI도 예뻐서 계속 쓰게 돼요. 최고예요!',
    author: '하늘',
    role: 'OC 창작러',
    icon: Star,
    iconBg: 'from-primary-200 to-accent-200',
  },
]

const pricingPlans = [
  {
    name: '무료',
    price: '₩0',
    period: '',
    description: '가볍게 시작하기',
    features: ['기본 틀 이용', '월 3회 내보내기', '워터마크 포함', '2인 협업'],
    cta: '무료로 시작',
    variant: 'outline' as const,
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
      '우선 지원',
    ],
    cta: '프리미엄 시작',
    variant: 'primary' as const,
    popular: true,
  },
]

// ============================================
// 서브 컴포넌트
// ============================================

/** 통계 카운터 - 숫자가 롤업되며 등장 */
function StatCounter({ value, label }: { value: number; label: string }) {
  const { ref, count } = useCountUp(value, { duration: 2000, easing: 'easeOut' })

  return (
    <div className="text-center">
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="text-xl sm:text-3xl font-bold text-primary-400"
      >
        {count.toLocaleString()}+
      </div>
      <div className="text-xs sm:text-sm text-gray-500">{label}</div>
    </div>
  )
}

/** 템플릿 카드 - 호버 시 빛나며 떠오르는 효과 */
function TemplateCard({ template, index }: { template: typeof sampleTemplates[0]; index: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 })
  const IconComponent = template.icon

  return (
    <Link
      href={`/templates/${template.id}`}
      ref={ref as React.RefObject<HTMLAnchorElement>}
      className={`
        group block bg-white rounded-[20px] overflow-hidden border border-gray-200
        card-interactive glow-border
        ${isVisible ? 'animate-float-up' : 'opacity-0'}
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* 프리뷰 - 호버 시 아이콘이 살짝 흔들림 */}
      <div className={`aspect-[4/3] bg-gradient-to-br ${template.bgGradient} flex items-center justify-center relative overflow-hidden`}>
        {/* 배경 빛 효과 */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/30 rounded-full blur-2xl" />
        </div>

        <IconComponent
          className={`w-12 h-12 ${template.iconColor} transition-transform duration-300 group-hover:scale-110 group-hover:animate-wiggle relative z-10`}
          strokeWidth={1.5}
        />
      </div>

      {/* 콘텐츠 */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 transition-colors group-hover:text-primary-400">
          {template.title}
        </h3>
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1 transition-transform group-hover:scale-105">
            <Heart className="w-4 h-4" strokeWidth={1.5} />
            {template.likeCount.toLocaleString()}
          </span>
          <span>by {template.creator}</span>
        </div>
        <div className="flex gap-2">
          {template.tags.map((tag, idx) => (
            <Tag key={tag} variant={idx === 0 ? 'primary' : 'accent'}>
              {tag}
            </Tag>
          ))}
        </div>
      </div>
    </Link>
  )
}

/** 기능 카드 - 순차 등장 + 호버 시 아이콘 애니메이션 */
function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 })

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`
        bg-white rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 border border-gray-200
        text-center card-interactive
        ${isVisible ? 'animate-float-up' : 'opacity-0'}
      `}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div
        className={`
          w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-[16px] sm:rounded-[20px]
          flex items-center justify-center transition-transform duration-300 hover:scale-110
          ${feature.color === 'primary' ? 'bg-primary-100' : 'bg-accent-100'}
        `}
      >
        <feature.icon
          className={`w-6 sm:w-8 h-6 sm:h-8 ${
            feature.color === 'primary' ? 'text-primary-400' : 'text-accent-400'
          }`}
          strokeWidth={1.5}
        />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
        {feature.title}
      </h3>
      <p className="text-xs sm:text-sm text-gray-500">{feature.description}</p>
    </div>
  )
}

/** 스텝 카드 - 연결선과 함께 순차 등장 */
function StepCard({ step, index, isLast }: { step: typeof steps[0]; index: number; isLast: boolean }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 })

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`relative ${isVisible ? 'animate-float-up' : 'opacity-0'}`}
      style={{ animationDelay: `${index * 200}ms` }}
    >
      {/* 연결선 - 모바일 숨김, 애니메이션 적용 */}
      {!isLast && (
        <div
          className={`
            hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 overflow-hidden
            ${isVisible ? '' : 'opacity-0'}
          `}
          style={{ transitionDelay: `${index * 200 + 300}ms` }}
        >
          <div
            className={`
              h-full bg-gradient-to-r from-primary-200 to-accent-200
              ${isVisible ? 'w-full' : 'w-0'}
              transition-all duration-700 ease-out
            `}
            style={{ transitionDelay: `${index * 200 + 400}ms` }}
          />
        </div>
      )}

      <div className="bg-white rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 border border-gray-200 card-interactive">
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center transition-transform duration-300 hover:scale-105 hover:rotate-3">
            <step.icon className="w-5 sm:w-6 h-5 sm:h-6 text-gray-700" strokeWidth={1.5} />
          </div>
          <span className="text-3xl sm:text-4xl font-bold text-gray-200 transition-colors duration-300 hover:text-primary-200">
            {step.step}
          </span>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
          {step.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500">{step.description}</p>
      </div>
    </div>
  )
}

/** 후기 카드 */
function TestimonialCard({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 })
  const IconComponent = testimonial.icon

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`
        bg-white rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 border border-gray-200
        card-interactive
        ${isVisible ? 'animate-float-up' : 'opacity-0'}
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
        &ldquo;{testimonial.text}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div
          className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-to-br ${testimonial.iconBg} flex items-center justify-center transition-transform duration-300 hover:scale-110`}
        >
          <IconComponent className="w-4 sm:w-5 h-4 sm:h-5 text-gray-700" strokeWidth={1.5} />
        </div>
        <div>
          <div className="text-sm sm:text-base font-medium text-gray-900">
            {testimonial.author}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">{testimonial.role}</div>
        </div>
      </div>
    </div>
  )
}

/** 가격 카드 */
function PricingCard({ plan, index }: { plan: typeof pricingPlans[0]; index: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 })

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`
        bg-white rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 border-2 transition-all duration-300
        ${plan.popular ? 'border-primary-400 shadow-lg' : 'border-gray-200'}
        ${plan.popular ? 'hover:shadow-xl hover:border-primary-500' : 'hover:shadow-lg hover:border-gray-300'}
        ${isVisible ? 'animate-float-up' : 'opacity-0'}
      `}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {plan.popular && (
        <div className="inline-block px-3 py-1 bg-primary-400 text-white text-xs font-medium rounded-full mb-3 sm:mb-4 animate-pulse-glow">
          인기
        </div>
      )}
      <h3 className="text-lg sm:text-xl font-bold text-gray-900">{plan.name}</h3>
      <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">{plan.description}</p>
      <div className="mb-4 sm:mb-6">
        <span className="text-2xl sm:text-3xl font-bold text-gray-900">{plan.price}</span>
        <span className="text-sm sm:text-base text-gray-500">{plan.period}</span>
      </div>
      <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <Check className="w-4 h-4 text-success shrink-0" strokeWidth={1.5} />
            {feature}
          </li>
        ))}
      </ul>
      <Button
        variant={plan.variant === 'primary' ? 'primary' : 'outline'}
        className="w-full btn-press"
        asChild
      >
        <Link href="/login">{plan.cta}</Link>
      </Button>
    </div>
  )
}

// ============================================
// 히어로 섹션 - 마우스 따라가는 빛 효과
// ============================================

function HeroSection() {
  const { ref, position, isHovering } = useMouseFollow()

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative py-12 sm:py-20 px-4 overflow-hidden"
    >
      {/* 마우스 따라가는 그라데이션 배경 */}
      <div
        className="absolute inset-0 opacity-30 transition-opacity duration-500"
        style={{
          background: isHovering
            ? `radial-gradient(600px circle at ${position.x}% ${position.y}%, var(--primary-200), transparent 40%)`
            : 'none',
        }}
      />

      {/* 고정 배경 장식 - 부드러운 부유 애니메이션 */}
      <div className="absolute top-20 left-0 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary-200/30 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-10 right-0 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-accent-200/30 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '2s' }}
      />

      <div className="relative max-w-[900px] mx-auto text-center">
        {/* 뱃지 - 순차 등장 */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full text-sm text-primary-700 mb-6 animate-slide-up magic-border">
          <Zap className="w-4 h-4 animate-pulse" strokeWidth={1.5} />
          <span>자캐러를 위한 페어틀 플랫폼</span>
        </div>

        {/* 메인 헤드라인 - 순차 등장 */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-slide-up delay-100">
          함께 채우는{' '}
          <span className="text-gradient">우리만의</span>{' '}
          이야기
        </h1>

        {/* 서브 헤드라인 */}
        <p className="text-lg sm:text-xl text-gray-500 mb-8 max-w-[600px] mx-auto animate-slide-up delay-200">
          자캐 페어틀을 웹에서 바로 편집하고,
          <br className="hidden sm:block" />
          친구와 실시간으로 함께 완성해요.
        </p>

        {/* CTA 버튼들 */}
        <div className="flex flex-wrap gap-4 justify-center animate-slide-up delay-300">
          <Button size="lg" className="btn-press animate-pulse-glow" asChild>
            <Link href="/templates">
              틀 둘러보기
              <ArrowRight className="w-5 h-5 ml-2" strokeWidth={1.5} />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="btn-press" asChild>
            <Link href="/login">무료로 시작하기</Link>
          </Button>
        </div>

        {/* 히어로 비주얼 - 살아있는 에디터 목업 */}
        <div className="mt-10 sm:mt-16 relative animate-float-up delay-400">
          <div className="bg-white rounded-[16px] sm:rounded-[24px] shadow-xl border border-gray-200 overflow-hidden mx-auto max-w-[700px] glow-border">
            <div className="bg-gradient-to-br from-primary-100 to-accent-100 aspect-video flex items-center justify-center relative p-4">
              {/* 에디터 목업 */}
              <div className="flex gap-2 sm:gap-4 scale-75 sm:scale-100">
                {/* 왼쪽 카드 */}
                <div className="w-28 sm:w-40 h-40 sm:h-56 bg-white/80 backdrop-blur rounded-xl sm:rounded-2xl shadow-lg p-2 sm:p-3 transform -rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-105">
                  <div className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-full bg-gradient-to-br from-primary-200 to-primary-300 flex items-center justify-center">
                    <User className="w-4 sm:w-6 h-4 sm:h-6 text-primary-600" strokeWidth={1.5} />
                  </div>
                  <div className="h-1.5 sm:h-2 bg-gray-200 rounded mb-1 sm:mb-1.5" />
                  <div className="h-1.5 sm:h-2 bg-gray-200 rounded w-3/4 mx-auto mb-1 sm:mb-1.5" />
                  <div className="h-1.5 sm:h-2 bg-primary-200 rounded w-1/2 mx-auto" />
                </div>

                {/* 하트 아이콘 - 부드러운 호흡 애니메이션 */}
                <div className="self-center">
                  <Heart
                    className="w-8 sm:w-12 h-8 sm:h-12 text-primary-400 animate-breathe"
                    strokeWidth={1.5}
                    fill="currentColor"
                  />
                </div>

                {/* 오른쪽 카드 */}
                <div className="w-28 sm:w-40 h-40 sm:h-56 bg-white/80 backdrop-blur rounded-xl sm:rounded-2xl shadow-lg p-2 sm:p-3 transform rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-105">
                  <div className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-full bg-gradient-to-br from-accent-200 to-accent-300 flex items-center justify-center">
                    <User className="w-4 sm:w-6 h-4 sm:h-6 text-accent-600" strokeWidth={1.5} />
                  </div>
                  <div className="h-1.5 sm:h-2 bg-gray-200 rounded mb-1 sm:mb-1.5" />
                  <div className="h-1.5 sm:h-2 bg-gray-200 rounded w-3/4 mx-auto mb-1 sm:mb-1.5" />
                  <div className="h-1.5 sm:h-2 bg-accent-200 rounded w-1/2 mx-auto" />
                </div>
              </div>

              {/* 떠다니는 커서들 - 숨결 애니메이션 */}
              <div
                className="hidden sm:flex absolute top-10 right-20 items-center gap-1 animate-float"
                style={{ animationDelay: '0s' }}
              >
                <div className="w-4 h-4 bg-primary-400 rounded-full shadow-lg" />
                <span className="text-xs bg-primary-400 text-white px-1.5 py-0.5 rounded shadow-lg">
                  민지
                </span>
              </div>
              <div
                className="hidden sm:flex absolute bottom-16 left-24 items-center gap-1 animate-float"
                style={{ animationDelay: '1s' }}
              >
                <div className="w-4 h-4 bg-accent-400 rounded-full shadow-lg" />
                <span className="text-xs bg-accent-400 text-white px-1.5 py-0.5 rounded shadow-lg">
                  수아
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 통계 - 카운터 애니메이션 */}
        <div className="flex justify-center gap-6 sm:gap-16 mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-gray-200">
          <StatCounter value={1200} label="틀 템플릿" />
          <StatCounter value={8500} label="완성된 작품" />
          <StatCounter value={3200} label="크리에이터" />
        </div>
      </div>
    </section>
  )
}

// ============================================
// CTA 섹션 - 별도 컴포넌트로 분리하여 ref 접근 문제 해결
// ============================================

function CTASection() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 })

  return (
    <section className="py-12 sm:py-20 px-4">
      <div className="max-w-[700px] mx-auto">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`
            bg-gradient-to-br from-primary-200 via-primary-100 to-accent-200
            rounded-[20px] sm:rounded-[32px] p-6 sm:p-12 text-center relative overflow-hidden
            ${isVisible ? 'animate-scale-in' : 'opacity-0'}
          `}
        >
          {/* 장식 요소 - 부유 애니메이션 */}
          <div className="hidden sm:block absolute top-4 left-8 opacity-30 animate-float">
            <Sparkles className="w-10 h-10 text-gray-700" strokeWidth={1} />
          </div>
          <div className="hidden sm:block absolute bottom-8 right-12 opacity-30 animate-float" style={{ animationDelay: '1s' }}>
            <Heart className="w-14 h-14 text-gray-700" strokeWidth={1} />
          </div>
          <div className="hidden sm:block absolute top-12 right-20 opacity-30 animate-float" style={{ animationDelay: '2s' }}>
            <Star className="w-8 h-8 text-gray-700" strokeWidth={1} />
          </div>

          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 relative">
            지금 바로 시작해보세요
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 relative">
            무료로 시작하고, 친구와 함께 첫 작품을 완성해보세요.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>페어리가 여러분의 이야기를 기다리고 있어요.
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center relative">
            <Button size="lg" className="btn-press animate-pulse-glow" asChild>
              <Link href="/login">
                무료로 시작하기
                <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2" strokeWidth={1.5} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// 메인 컴포넌트
// ============================================

export default function HomeClient() {
  return (
    <div>
      {/* 히어로 섹션 */}
      <HeroSection />

      {/* 사용 방법 */}
      <section className="py-12 sm:py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              <span className="text-accent-400">3단계</span>로 완성하는 페어틀
            </h2>
            <p className="text-sm sm:text-base text-gray-500">누구나 쉽게 시작할 수 있어요</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            {steps.map((step, index) => (
              <StepCard key={step.step} step={step} index={index} isLast={index === steps.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* 인기 템플릿 */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                인기 <span className="text-accent-400">틀</span>
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">지금 가장 사랑받는 템플릿들</p>
            </div>
            <Link
              href="/templates"
              className="text-xs sm:text-sm font-medium text-primary-400 hover:text-primary-500 transition-colors flex items-center gap-1 link-underline"
            >
              모두 보기 <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sampleTemplates.map((template, index) => (
              <TemplateCard key={template.id} template={template} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="py-12 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              왜 <span className="text-primary-400">페어리</span>인가요?
            </h2>
            <p className="text-sm sm:text-base text-gray-500">자캐러를 위해 설계된 기능들</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* 사용 후기 */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              사용자들의 <span className="text-accent-400">이야기</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={testimonial.author} testimonial={testimonial} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* 요금제 */}
      <section className="py-12 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              심플한 <span className="text-primary-400">요금제</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-500">필요한 만큼만 사용하세요</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={plan.name} plan={plan} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <CTASection />

      {/* 푸터 */}
      <footer className="py-8 sm:py-12 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="col-span-2 md:col-span-1 mb-2 sm:mb-0">
              <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900 link-underline inline-block">
                <span className="text-primary-400">Pai</span>ry
              </Link>
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5 sm:mt-2 flex items-center gap-1">
                페어를 완성하는 마법
                <Sparkles className="w-3 h-3 text-primary-400" strokeWidth={1.5} />
              </p>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">서비스</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-500">
                <li>
                  <Link href="/templates" className="hover:text-primary-400 transition-colors link-underline">
                    틀 둘러보기
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-primary-400 transition-colors link-underline">
                    시작하기
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-primary-400 transition-colors link-underline">
                    요금제
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">지원</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-500">
                <li>
                  <Link href="/help" className="hover:text-primary-400 transition-colors link-underline">
                    도움말
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary-400 transition-colors link-underline">
                    문의하기
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-primary-400 transition-colors link-underline">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">법적 고지</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-500">
                <li>
                  <Link href="/terms" className="hover:text-primary-400 transition-colors link-underline">
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary-400 transition-colors link-underline">
                    개인정보처리방침
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 sm:pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-gray-400">© 2025 Pairy. All rights reserved.</p>
            <div className="flex gap-4">
              <a
                href="https://twitter.com/pairy_app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400 transition-colors transition-transform hover:scale-110"
              >
                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
