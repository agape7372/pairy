import { Header, Footer } from '@/components/layout'

// 메인 페이지용 레이아웃 - 헤더/푸터 포함
export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
