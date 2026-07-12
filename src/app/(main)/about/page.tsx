import Link from 'next/link'
import { Palette, Users, Share2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'

export const metadata = {
  title: '서비스 소개 | Pairy',
  description: '자캐 페어틀을 만들고, 함께 꾸미고, 공유하는 곳 — 페어리',
}

// 실제 소개 페이지 (M6) — 기존엔 HomeClient 재렌더라 홈 복제 + 이중 푸터였음
export default function AboutPage() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-primary-50 to-white text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            자캐의 순간을 <span className="text-primary-400">페어리</span>에서
          </h1>
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
            페어리(Pairy)는 자캐(오리지널 캐릭터) 페어틀을 만들고,
            친구와 실시간으로 함께 꾸미고, 완성한 작품을 공유하는 공간이에요.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: Palette,
              title: '페어틀 에디터',
              body: '틀을 고르고 자캐 이미지와 텍스트를 채워 나만의 페어틀을 완성해요.',
            },
            {
              icon: Users,
              title: '실시간 협업',
              body: '초대 코드 하나로 친구와 같은 캔버스를 동시에 꾸밀 수 있어요.',
            },
            {
              icon: Share2,
              title: '작품 공유',
              body: '완성한 작품은 링크 한 줄로 공유 — 미리보기 카드까지 예쁘게.',
            },
            {
              icon: Sparkles,
              title: '자료 허브',
              body: '이메레스·트레틀·페어틀 자료를 올리고 나누는 창작 허브예요.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-primary-500" />
              </div>
              <h2 className="font-bold text-gray-900 mb-1">{f.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 text-center">
        <div className="max-w-md mx-auto p-8 bg-gradient-to-r from-primary-50 to-accent-50 rounded-3xl border border-primary-100">
          <h2 className="text-xl font-bold text-gray-900 mb-2">바로 시작해보세요</h2>
          <p className="text-sm text-gray-500 mb-6">
            회원가입하면 작품 저장과 협업, 자료 업로드까지 모두 쓸 수 있어요.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild>
              <Link href="/editor/new">에디터 열기</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/templates">자료 허브 구경</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
