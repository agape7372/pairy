import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '틀 둘러보기',
  description: '커플틀, 친구틀, OC 프로필 카드 등 다양한 페어틀을 둘러보세요. 마음에 드는 틀을 선택해 바로 편집을 시작할 수 있어요.',
  keywords: ['페어틀', '커플틀', '친구틀', '관계도', 'OC 프로필', '자캐 틀'],
  openGraph: {
    title: '틀 둘러보기 | Pairy',
    description: '커플틀, 친구틀, OC 프로필 카드 등 다양한 페어틀을 둘러보세요.',
  },
}

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
