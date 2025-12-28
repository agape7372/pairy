import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers/Providers'

// 기본 URL (배포 환경에 맞게 설정)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pairy.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Pairy - 함께 채우는 우리만의 이야기',
    template: '%s | Pairy',
  },
  description: '자캐 페어틀을 웹에서 바로 편집하고, 친구와 실시간으로 함께 완성해요. 커플틀, 관계도, OC 프로필 카드를 무료로 만들어보세요.',
  keywords: ['페어틀', '자캐', '커플틀', '관계도', '실시간 협업', 'OC', '자작캐릭터', '프로필 카드', '친구틀', '베프틀'],
  authors: [{ name: 'Pairy Team' }],
  creator: 'Pairy',
  publisher: 'Pairy',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: 'Pairy',
    title: 'Pairy - 함께 채우는 우리만의 이야기',
    description: '자캐 페어틀을 웹에서 바로 편집하고, 친구와 실시간으로 함께 완성해요.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pairy - 함께 채우는 우리만의 이야기',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pairy - 함께 채우는 우리만의 이야기',
    description: '자캐 페어틀을 웹에서 바로 편집하고, 친구와 실시간으로 함께 완성해요.',
    images: ['/og-image.png'],
    creator: '@pairy_app',
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'technology',
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
