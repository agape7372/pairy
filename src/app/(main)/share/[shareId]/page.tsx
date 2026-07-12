import { Metadata } from 'next'
import SharePageClient from '@/components/pages/SharePageClient'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL } from '@/lib/constants'

interface PageProps {
  params: Promise<{ shareId: string }>
}

// OG 언퍼용 공개 데이터 조회 (익명 read — RLS 가 published 공개를 허용해야 실데이터가 나온다).
// 실패/미공개 시 null → 제네릭 메타데이터 폴백. 쿠키 불필요하므로 bare 클라이언트 사용.
async function fetchSharedWorkForOg(shareId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  try {
    const supabase = createClient(url, anonKey)
    const { data } = await supabase
      .from('works')
      .select('title, og_image_url, thumbnail_url, share_status')
      .eq('share_id', shareId)
      .eq('share_status', 'published')
      .maybeSingle()
    return data
  } catch {
    return null
  }
}

// OG 메타데이터 생성 (요청 시 실데이터 — Vercel 이전으로 크롤러에 실제 제목/썸네일 노출)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareId } = await params

  const work = await fetchSharedWorkForOg(shareId)

  const title = work?.title ? `${work.title} | Pairy` : '공유된 작품 | Pairy'
  const description = 'Pairy에서 만든 아름다운 커플 프로필을 확인해보세요!'
  const imageUrl = work?.og_image_url || work?.thumbnail_url || `${SITE_URL}/og-default.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/share/${shareId}`,
      siteName: 'Pairy',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: work?.title || 'Pairy 공유 작품',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function SharePage({ params }: PageProps) {
  const { shareId } = await params
  return <SharePageClient shareId={shareId} />
}
