import EditorClient from '@/components/pages/EditorClient'

export function generateStaticParams() {
  return [
    { id: 'new' },
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ]
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditorPage({ params }: PageProps) {
  const { id } = await params
  return <EditorClient workId={id} />
}
