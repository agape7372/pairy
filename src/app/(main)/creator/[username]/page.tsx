import CreatorProfileClient from '@/components/pages/CreatorProfileClient'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { username } = await params
  return <CreatorProfileClient username={username} />
}
