import { Metadata } from 'next'
import ButtonInteractionsClient from '@/components/pages/ButtonInteractionsClient'

export const metadata: Metadata = {
  title: '버튼 인터랙션 데모 | Pairy',
  description: '좋아요/북마크 버튼 클릭 반응 테스트',
}

export default function ButtonInteractionsPage() {
  return <ButtonInteractionsClient />
}
