'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 에러 로깅
    console.error('Global error boundary caught:', error)
  }, [error])

  return (
    <html lang="ko">
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center px-4">
          {/* 아이콘 */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-5xl">😵</span>
          </div>

          {/* 메시지 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            심각한 오류가 발생했어요
          </h1>
          <p className="text-gray-500 mb-6">
            앱을 다시 시작해야 합니다.
            <br />
            문제가 계속되면 새로고침을 해주세요.
          </p>

          {/* 에러 정보 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-gray-100 rounded-xl text-left">
              <p className="text-xs text-gray-500 mb-1">Error:</p>
              <p className="text-sm text-red-600 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* 액션 버튼 */}
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-400 text-white font-medium rounded-xl hover:bg-primary-500 transition-colors"
          >
            다시 시도하기
          </button>
        </div>
      </body>
    </html>
  )
}
