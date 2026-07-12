import TemplateDetailClient from '@/components/pages/TemplateDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { id } = await params
  return <TemplateDetailClient templateId={id} />
}
