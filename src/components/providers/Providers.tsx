'use client'

import { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui'
import { ErrorBoundary, DemoModeBanner } from '@/components/common'
import { useThemeInitializer } from '@/stores/themeStore'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // 저장된/시스템 테마를 <html> 에 적용(다크모드 실작동). 이전엔 미호출로 초기화 안 됨(F-32).
  useThemeInitializer()

  return (
    <ErrorBoundary
      onError={(error) => {
        // 프로덕션에서는 에러 로깅 서비스(Sentry 등)로 전송 가능
        console.error('[App Error]', error.message)
      }}
    >
      <ToastProvider>
        <DemoModeBanner />
        {children}
      </ToastProvider>
    </ErrorBoundary>
  )
}
