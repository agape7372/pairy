import CollabJoinClient from '@/components/pages/CollabJoinClient'

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function CollabJoinPage({ params }: PageProps) {
  const { code } = await params
  return <CollabJoinClient code={code} />
}
