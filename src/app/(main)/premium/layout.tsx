import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '프리미엄',
  description: '페어리 프리미엄으로 업그레이드하세요. 워터마크 제거, 무제한 내보내기, 고해상도 저장까지. 더 멋진 작품을 만들어보세요.',
  keywords: ['페어리 프리미엄', '구독', '워터마크 제거', '고해상도'],
  openGraph: {
    title: '프리미엄 | Pairy',
    description: '페어리 프리미엄으로 업그레이드하세요. 워터마크 제거, 무제한 내보내기, 고해상도 저장까지.',
  },
}

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
