import CreatorProfileClient from '@/components/pages/CreatorProfileClient'

export function generateStaticParams() {
  return [
    { username: 'strawberry123' },
    { username: 'fairy_art' },
    { username: 'moonlight' },
    { username: 'mintchoco' },
    { username: 'roseberry' },
    { username: 'skyblue' },
    { username: 'cherryblossom' },
    { username: 'coconut' },
  ]
}

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { username } = await params
  return <CreatorProfileClient username={username} />
}
