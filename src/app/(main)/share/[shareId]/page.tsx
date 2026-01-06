import { Metadata } from 'next'
import SharePageClient from '@/components/pages/SharePageClient'

// 정적 export용 기본 경로
export function generateStaticParams() {
  return [
    { shareId: 'demo' },
  ]
}

interface PageProps {
  params: Promise<{ shareId: string }>
}

// OG 메타데이터 생성 (동적)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareId } = await params

  // 기본 메타데이터 (클라이언트에서 실제 데이터 로드)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pairy.app'

  return {
    title: '공유된 작품 | Pairy',
    description: 'Pairy에서 만든 아름다운 커플 프로필을 확인해보세요!',
    openGraph: {
      title: '공유된 작품 | Pairy',
      description: 'Pairy에서 만든 아름다운 커플 프로필을 확인해보세요!',
      type: 'website',
      url: `${baseUrl}/share/${shareId}`,
      siteName: 'Pairy',
      images: [
        {
          url: `${baseUrl}/og-default.png`,
          width: 1200,
          height: 630,
          alt: 'Pairy 공유 작품',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: '공유된 작품 | Pairy',
      description: 'Pairy에서 만든 아름다운 커플 프로필을 확인해보세요!',
      images: [`${baseUrl}/og-default.png`],
    },
  }
}

export default async function SharePage({ params }: PageProps) {
  const { shareId } = await params
  return <SharePageClient shareId={shareId} />
}
