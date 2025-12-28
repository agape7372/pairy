import CollabJoinClient from '@/components/pages/CollabJoinClient'

export function generateStaticParams() {
  return [
    { code: 'DEMO' },
  ]
}

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function CollabJoinPage({ params }: PageProps) {
  const { code } = await params
  return <CollabJoinClient code={code} />
}
