import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Pairy - 함께 채우는 우리만의 이야기',
    template: '%s | Pairy',
  },
  description: '자캐 페어틀을 웹에서 바로 편집하고, 친구와 실시간으로 함께 완성해요.',
  keywords: ['페어틀', '자캐', '커플틀', '관계도', '실시간 협업', 'OC', '자작캐릭터'],
  authors: [{ name: 'Pairy' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Pairy',
    title: 'Pairy - 함께 채우는 우리만의 이야기',
    description: '자캐 페어틀을 웹에서 바로 편집하고, 친구와 실시간으로 함께 완성해요.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pairy - 함께 채우는 우리만의 이야기',
    description: '자캐 페어틀을 웹에서 바로 편집하고, 친구와 실시간으로 함께 완성해요.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Google Fonts - 한글 폰트 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&family=Nanum+Myeongjo:wght@400;700&family=Jua&family=Gaegu&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
