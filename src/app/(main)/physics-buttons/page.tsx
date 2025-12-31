import { Metadata } from 'next'
import PhysicsButtonsClient from '@/components/pages/PhysicsButtonsClient'

export const metadata: Metadata = {
  title: 'Physics-Based Buttons | Pairy',
  description: 'Skeuomorphism 2.0 - 실제 기계처럼 작동하는 물리 기반 버튼 인터랙션',
}

export default function PhysicsButtonsPage() {
  return <PhysicsButtonsClient />
}
