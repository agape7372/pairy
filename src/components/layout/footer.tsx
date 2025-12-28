import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-xl font-bold">
                <span className="text-primary-400">Pair</span>
                <span className="text-accent-400">y</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs">
              함께 채우는 우리만의 이야기. 자캐 페어틀을 웹에서 바로 편집하고, 친구와 실시간으로 함께 완성해요.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">서비스</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/templates" className="text-sm text-gray-500 hover:text-primary-400 transition-colors">
                  틀 둘러보기
                </Link>
              </li>
              <li>
                <Link href="/premium" className="text-sm text-gray-500 hover:text-primary-400 transition-colors">
                  프리미엄
                </Link>
              </li>
              <li>
                <Link href="/creators" className="text-sm text-gray-500 hover:text-primary-400 transition-colors">
                  크리에이터
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">지원</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-gray-500 hover:text-primary-400 transition-colors">
                  도움말
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-primary-400 transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-primary-400 transition-colors">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © 2025 Pairy. 함께 채우는 우리만의 이야기.
          </p>
        </div>
      </div>
    </footer>
  )
}
