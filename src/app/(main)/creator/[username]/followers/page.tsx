import FollowersClient from './FollowersClient'


interface PageProps {
  params: Promise<{ username: string }>
}

export default async function FollowersPage({ params }: PageProps) {
  const { username } = await params
  return <FollowersClient username={username} />
}
