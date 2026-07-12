import FollowingClient from './FollowingClient'


interface PageProps {
  params: Promise<{ username: string }>
}

export default async function FollowingPage({ params }: PageProps) {
  const { username } = await params
  return <FollowingClient username={username} />
}
