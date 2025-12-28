'use client'

import { ReactNode } from 'react'
import { ErrorBoundary } from '@/components/common'

interface ErrorBoundaryProviderProps {
  children: ReactNode
}

/**
 * Error Boundary Provider
 * - 서버 컴포넌트 레이아웃에서 클라이언트 Error Boundary를 사용하기 위한 래퍼
 */
export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 프로덕션에서는 에러 로깅 서비스로 전송 가능
        // e.g., Sentry.captureException(error)
        console.error('[ErrorBoundary] Uncaught error:', error.message)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundaryProvider
