import Link from 'next/link'
import { Heart, Users, Download, Sparkles } from 'lucide-react'
import { Button, Tag } from '@/components/ui'

// 임시 샘플 데이터
const sampleTemplates = [
  {
    id: '1',
    title: '커플 프로필 틀',
    creator: '딸기크림',
    likeCount: 1234,
    tags: ['커플', '2인용'],
    emoji: '💕',
  },
  {
    id: '2',
    title: '친구 관계도',
    creator: '페어리',
    likeCount: 892,
    tags: ['친구', '관계도'],
    emoji: '✨',
  },
  {
    id: '3',
    title: 'OC 소개 카드',
    creator: '문라이트',
    likeCount: 567,
    tags: ['프로필', '1인용'],
    emoji: '🌙',
  },
]

const features = [
  {
    icon: Sparkles,
    title: '웹에서 바로 편집',
    description: '포토샵 없이도 예쁜 결과물을 만들 수 있어요',
  },
  {
    icon: Users,
    title: '실시간 협업',
    description: '친구와 함께 동시에 편집할 수 있어요',
  },
  {
    icon: Download,
    title: '고화질 저장',
    description: '완성된 작품을 PNG로 다운로드해요',
  },
]

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            함께 채우는{' '}
            <span className="text-primary-400">우리만의</span> 이야기
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            자캐 페어틀을 웹에서 바로 편집하고, 친구와 실시간으로 함께 완성해요.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/templates">틀 둘러보기</Link>
            </Button>
            <Button variant="accent" size="lg" asChild>
              <Link href="/login">시작하기</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12 mt-16 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-400">1,200+</div>
              <div className="text-sm text-gray-500">틀 템플릿</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-400">8,500+</div>
              <div className="text-sm text-gray-500">완성된 작품</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-400">3,200+</div>
              <div className="text-sm text-gray-500">크리에이터</div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              인기 <span className="text-accent-400">틀</span>
            </h2>
            <Link
              href="/templates"
              className="text-sm font-medium text-primary-400 hover:text-primary-500 transition-colors"
            >
              모두 보기 →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleTemplates.map((template) => (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="group bg-white rounded-[20px] overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                {/* Preview */}
                <div className="aspect-[4/3] bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-5xl">
                  {template.emoji}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-400 transition-colors">
                    {template.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
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
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-[20px] bg-primary-100 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-[600px] mx-auto">
          <div className="bg-gradient-to-br from-primary-200 to-accent-200 rounded-[24px] p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              지금 바로 시작해보세요
            </h2>
            <p className="text-gray-600 mb-6">
              무료로 시작하고, 친구와 함께 첫 작품을 완성해보세요.
            </p>
            <Button size="lg" asChild>
              <Link href="/login">무료로 시작하기</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
