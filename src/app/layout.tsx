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
      <body className="min-h-screen flex flex-col antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
