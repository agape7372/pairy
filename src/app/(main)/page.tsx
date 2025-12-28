import Link from 'next/link'
import { Heart, Users, Download, Sparkles, ArrowRight, Palette, Share2, Zap, Check, User, PenTool, Moon, Star, Brush, MessageCircle } from 'lucide-react'
import { Button, Tag } from '@/components/ui'

// 임시 샘플 데이터 - 이모지 대신 lucide 아이콘 사용
const sampleTemplates = [
  {
    id: '1',
    title: '커플 프로필 틀',
    creator: '딸기크림',
    likeCount: 1234,
    tags: ['커플', '2인용'],
    icon: Heart,
    iconColor: 'text-primary-400',
  },
  {
    id: '2',
    title: '친구 관계도',
    creator: '페어리',
    likeCount: 892,
    tags: ['친구', '관계도'],
    icon: Star,
    iconColor: 'text-accent-400',
  },
  {
    id: '3',
    title: 'OC 소개 카드',
    creator: '문라이트',
    likeCount: 567,
    tags: ['프로필', '1인용'],
    icon: Moon,
    iconColor: 'text-gray-600',
  },
]

const features = [
  {
    icon: Sparkles,
    title: '웹에서 바로 편집',
    description: '포토샵 없이도 예쁜 결과물을 만들 수 있어요',
    color: 'primary',
  },
  {
    icon: Users,
    title: '실시간 협업',
    description: '친구와 함께 동시에 편집할 수 있어요',
    color: 'accent',
  },
  {
    icon: Download,
    title: '고화질 저장',
    description: '완성된 작품을 PNG로 다운로드해요',
    color: 'primary',
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
    features: [
      '기본 틀 이용',
      '월 3회 내보내기',
      '워터마크 포함',
      '2인 협업',
    ],
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

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 px-4 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-0 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-0 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-accent-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-[900px] mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full text-sm text-primary-700 mb-6">
            <Zap className="w-4 h-4" strokeWidth={1.5} />
            <span>자캐러를 위한 페어틀 플랫폼</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            함께 채우는{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
              우리만의
            </span>{' '}
            이야기
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mb-8 max-w-[600px] mx-auto">
            자캐 페어틀을 웹에서 바로 편집하고,
            <br className="hidden sm:block" />
            친구와 실시간으로 함께 완성해요.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/templates">
                틀 둘러보기
                <ArrowRight className="w-5 h-5 ml-2" strokeWidth={1.5} />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">무료로 시작하기</Link>
            </Button>
          </div>

          {/* Hero Visual */}
          <div className="mt-10 sm:mt-16 relative">
            <div className="bg-white rounded-[16px] sm:rounded-[24px] shadow-xl border border-gray-200 overflow-hidden mx-auto max-w-[700px]">
              <div className="bg-gradient-to-br from-primary-100 to-accent-100 aspect-video flex items-center justify-center relative p-4">
                {/* Mock Editor UI */}
                <div className="flex gap-2 sm:gap-4 scale-75 sm:scale-100">
                  <div className="w-28 sm:w-40 h-40 sm:h-56 bg-white/80 backdrop-blur rounded-xl sm:rounded-2xl shadow-lg p-2 sm:p-3 transform -rotate-3">
                    <div className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-full bg-gradient-to-br from-primary-200 to-primary-300 flex items-center justify-center">
                      <User className="w-4 sm:w-6 h-4 sm:h-6 text-primary-600" strokeWidth={1.5} />
                    </div>
                    <div className="h-1.5 sm:h-2 bg-gray-200 rounded mb-1 sm:mb-1.5" />
                    <div className="h-1.5 sm:h-2 bg-gray-200 rounded w-3/4 mx-auto mb-1 sm:mb-1.5" />
                    <div className="h-1.5 sm:h-2 bg-primary-200 rounded w-1/2 mx-auto" />
                  </div>
                  <div className="self-center">
                    <Heart className="w-8 sm:w-12 h-8 sm:h-12 text-primary-400" strokeWidth={1.5} fill="currentColor" />
                  </div>
                  <div className="w-28 sm:w-40 h-40 sm:h-56 bg-white/80 backdrop-blur rounded-xl sm:rounded-2xl shadow-lg p-2 sm:p-3 transform rotate-3">
                    <div className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-full bg-gradient-to-br from-accent-200 to-accent-300 flex items-center justify-center">
                      <User className="w-4 sm:w-6 h-4 sm:h-6 text-accent-600" strokeWidth={1.5} />
                    </div>
                    <div className="h-1.5 sm:h-2 bg-gray-200 rounded mb-1 sm:mb-1.5" />
                    <div className="h-1.5 sm:h-2 bg-gray-200 rounded w-3/4 mx-auto mb-1 sm:mb-1.5" />
                    <div className="h-1.5 sm:h-2 bg-accent-200 rounded w-1/2 mx-auto" />
                  </div>
                </div>

                {/* Floating cursors - hidden on mobile */}
                <div className="hidden sm:flex absolute top-10 right-20 items-center gap-1 animate-pulse">
                  <div className="w-4 h-4 bg-primary-400 rounded-full" />
                  <span className="text-xs bg-primary-400 text-white px-1.5 py-0.5 rounded">민지</span>
                </div>
                <div className="hidden sm:flex absolute bottom-16 left-24 items-center gap-1 animate-pulse" style={{ animationDelay: '0.5s' }}>
                  <div className="w-4 h-4 bg-accent-400 rounded-full" />
                  <span className="text-xs bg-accent-400 text-white px-1.5 py-0.5 rounded">수아</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 sm:gap-16 mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xl sm:text-3xl font-bold text-primary-400">1,200+</div>
              <div className="text-xs sm:text-sm text-gray-500">틀 템플릿</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-3xl font-bold text-primary-400">8,500+</div>
              <div className="text-xs sm:text-sm text-gray-500">완성된 작품</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-3xl font-bold text-primary-400">3,200+</div>
              <div className="text-xs sm:text-sm text-gray-500">크리에이터</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
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
              <div key={step.step} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary-200 to-accent-200" />
                )}

                <div className="bg-white rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center">
                      <step.icon className="w-5 sm:w-6 h-5 sm:h-6 text-gray-700" strokeWidth={1.5} />
                    </div>
                    <span className="text-3xl sm:text-4xl font-bold text-gray-200">{step.step}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Section */}
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
              className="text-xs sm:text-sm font-medium text-primary-400 hover:text-primary-500 transition-colors flex items-center gap-1"
            >
              모두 보기 <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4" strokeWidth={1.5} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sampleTemplates.map((template) => {
              const IconComponent = template.icon
              return (
                <Link
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className="group bg-white rounded-[20px] overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  {/* Preview */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center">
                    <IconComponent className={`w-12 h-12 ${template.iconColor}`} strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-400 transition-colors">
                      {template.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
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
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              왜 <span className="text-primary-400">페어리</span>인가요?
            </h2>
            <p className="text-sm sm:text-base text-gray-500">자캐러를 위해 설계된 기능들</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow text-center"
              >
                <div className={`w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-[16px] sm:rounded-[20px] flex items-center justify-center ${
                  feature.color === 'primary' ? 'bg-primary-100' : 'bg-accent-100'
                }`}>
                  <feature.icon className={`w-6 sm:w-8 h-6 sm:h-8 ${
                    feature.color === 'primary' ? 'text-primary-400' : 'text-accent-400'
                  }`} strokeWidth={1.5} />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              사용자들의 <span className="text-accent-400">이야기</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial) => {
              const IconComponent = testimonial.icon
              return (
                <div
                  key={testimonial.author}
                  className="bg-white rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 border border-gray-200"
                >
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">&ldquo;{testimonial.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-to-br ${testimonial.iconBg} flex items-center justify-center`}>
                      <IconComponent className="w-4 sm:w-5 h-4 sm:h-5 text-gray-700" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-medium text-gray-900">{testimonial.author}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-12 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              심플한 <span className="text-primary-400">요금제</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-500">필요한 만큼만 사용하세요</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 border-2 transition-shadow ${
                  plan.popular ? 'border-primary-400 shadow-lg' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="inline-block px-3 py-1 bg-primary-400 text-white text-xs font-medium rounded-full mb-3 sm:mb-4">
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
                  className="w-full"
                  asChild
                >
                  <Link href="/login">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-[700px] mx-auto">
          <div className="bg-gradient-to-br from-primary-200 via-primary-100 to-accent-200 rounded-[20px] sm:rounded-[32px] p-6 sm:p-12 text-center relative overflow-hidden">
            {/* Decorative elements - SVG icons instead of emojis */}
            <div className="hidden sm:block absolute top-4 left-8 opacity-20">
              <Sparkles className="w-10 h-10 text-gray-700" strokeWidth={1} />
            </div>
            <div className="hidden sm:block absolute bottom-8 right-12 opacity-20">
              <Heart className="w-14 h-14 text-gray-700" strokeWidth={1} />
            </div>
            <div className="hidden sm:block absolute top-12 right-20 opacity-20">
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
              <Button size="lg" asChild>
                <Link href="/login">
                  무료로 시작하기
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2" strokeWidth={1.5} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="col-span-2 md:col-span-1 mb-2 sm:mb-0">
              <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900">
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
                <li><Link href="/templates" className="hover:text-primary-400 transition-colors">틀 둘러보기</Link></li>
                <li><Link href="/login" className="hover:text-primary-400 transition-colors">시작하기</Link></li>
                <li><Link href="/pricing" className="hover:text-primary-400 transition-colors">요금제</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">지원</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-500">
                <li><Link href="/help" className="hover:text-primary-400 transition-colors">도움말</Link></li>
                <li><Link href="/contact" className="hover:text-primary-400 transition-colors">문의하기</Link></li>
                <li><Link href="/faq" className="hover:text-primary-400 transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">법적 고지</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-500">
                <li><Link href="/terms" className="hover:text-primary-400 transition-colors">이용약관</Link></li>
                <li><Link href="/privacy" className="hover:text-primary-400 transition-colors">개인정보처리방침</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 sm:pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-gray-400">
              © 2025 Pairy. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a
                href="https://twitter.com/pairy_app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400 transition-colors"
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
