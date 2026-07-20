import { Header, Footer } from '@/components/layout'

// 메인 페이지용 레이아웃 - 헤더/푸터 포함
export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* H-12(DL-0006): 키보드 사용자용 skip link + 단일 main 랜드마크(중첩 main 은 div 로 강등) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-gray-900 focus:shadow-lg focus:ring-2 focus:ring-primary-400"
      >
        본문으로 건너뛰기
      </a>
      <Header />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
