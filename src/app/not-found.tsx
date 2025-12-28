import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-md w-full text-center">
        {/* 이모지 */}
        <div className="text-8xl mb-6">🔍</div>

        {/* 메시지 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-gray-500 mb-8">
          요청하신 페이지가 존재하지 않거나
          <br />
          이동되었을 수 있어요.
        </p>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="primary">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              홈으로 가기
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/templates">
              <Search className="w-4 h-4 mr-2" />
              자료 허브 둘러보기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
