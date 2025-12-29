import { Metadata } from 'next'
import AnimationDemoClient from '@/components/pages/AnimationDemoClient'

export const metadata: Metadata = {
  title: '애니메이션 데모 | Pairy',
  description: 'Doodle vs Premium 애니메이션 모드 비교 데모',
}

export default function AnimationDemoPage() {
  return <AnimationDemoClient />
}
