import Link from 'next/link'

export default function CreatorsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">크리에이터</h1>
      <p className="text-gray-600 mb-8">
        Pairy의 멋진 템플릿을 만드는 크리에이터들을 만나보세요.
      </p>

      <div className="bg-gray-50 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🎨</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          곧 크리에이터들을 만나볼 수 있어요!
        </h2>
        <p className="text-gray-600 mb-6">
          다양한 크리에이터들이 참여할 예정입니다.
        </p>
        <Link
          href="/templates"
          className="inline-block px-6 py-3 bg-primary-400 text-white rounded-full font-medium hover:bg-primary-500 transition-colors"
        >
          템플릿 둘러보기
        </Link>
      </div>
    </div>
  )
}
