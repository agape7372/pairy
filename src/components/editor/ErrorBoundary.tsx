'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * 에디터용 에러 바운더리
 * 에디터에서 발생하는 런타임 에러를 캐치하고 사용자 친화적인 에러 화면을 표시
 */
export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // 에러 로깅 (프로덕션에서는 Sentry 등으로 전송)
    console.error('EditorErrorBoundary caught an error:', error, errorInfo)

    // 로컬 스토리지에 에러 정보 저장 (디버깅용)
    if (typeof window !== 'undefined') {
      try {
        const errorLog = {
          timestamp: new Date().toISOString(),
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        }
        const existingLogs = JSON.parse(localStorage.getItem('pairy_error_logs') || '[]')
        existingLogs.push(errorLog)
        // 최대 10개만 유지
        if (existingLogs.length > 10) {
          existingLogs.shift()
        }
        localStorage.setItem('pairy_error_logs', JSON.stringify(existingLogs))
      } catch {
        // 로컬 스토리지 접근 실패 무시
      }
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-lg max-w-md w-full p-8 text-center">
            {/* 아이콘 */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            {/* 제목 */}
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              에디터에서 문제가 발생했어요
            </h1>

            {/* 설명 */}
            <p className="text-gray-500 mb-6">
              일시적인 오류가 발생했습니다.
              <br />
              다시 시도하거나 홈으로 돌아가주세요.
            </p>

            {/* 에러 메시지 (개발 모드에서만 표시) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-xl text-left">
                <p className="text-xs font-mono text-red-600 break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-[10px] font-mono text-gray-500 overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={this.handleRetry}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
              <Button asChild className="flex-1">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  홈으로
                </Link>
              </Button>
            </div>

            {/* 새로고침 링크 */}
            <button
              onClick={this.handleReload}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
