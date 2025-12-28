'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary 컴포넌트
 * - React 렌더링 중 발생하는 에러를 잡아서 대체 UI를 표시
 * - 앱이 완전히 크래시되는 것을 방지
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 에러 발생 시 상태 업데이트
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 에러 로깅
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })

    // 커스텀 에러 핸들러 호출
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = (): void => {
    window.location.href = '/'
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            앗, 문제가 발생했어요
          </h1>

          <p className="text-gray-500 mb-6 max-w-md">
            예기치 않은 오류가 발생했습니다.
            <br />
            페이지를 새로고침하거나 홈으로 이동해 주세요.
          </p>

          {/* 개발 환경에서만 에러 상세 표시 */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-6 text-left w-full max-w-lg">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                에러 상세 보기 (개발 모드)
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs text-red-600 overflow-auto max-h-48">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={this.handleReset}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </Button>
            <Button onClick={this.handleGoHome} className="gap-2">
              <Home className="w-4 h-4" />
              홈으로 가기
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 섹션별 Error Boundary (더 작은 영역용)
 * - 전체 페이지가 아닌 특정 섹션의 에러만 처리
 */
interface SectionErrorBoundaryProps {
  children: ReactNode
  sectionName?: string
}

interface SectionErrorBoundaryState {
  hasError: boolean
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): Partial<SectionErrorBoundaryState> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`SectionErrorBoundary [${this.props.sectionName}]:`, error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-gray-50 rounded-xl text-center">
          <p className="text-gray-500 mb-3">
            {this.props.sectionName
              ? `${this.props.sectionName}을(를) 불러오는 중 문제가 발생했어요`
              : '이 섹션을 불러오는 중 문제가 발생했어요'}
          </p>
          <button
            onClick={this.handleRetry}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium"
          >
            다시 시도
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
