'use client'

import { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui'
import { ErrorBoundary } from '@/components/common'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary
      onError={(error) => {
        // 프로덕션에서는 에러 로깅 서비스(Sentry 등)로 전송 가능
        console.error('[App Error]', error.message)
      }}
    >
      <ToastProvider>
        {children}
      </ToastProvider>
    </ErrorBoundary>
  )
}
