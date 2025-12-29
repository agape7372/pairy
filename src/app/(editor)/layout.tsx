'use client'

import { ToastProvider } from '@/components/ui/toast'

// 에디터 전용 레이아웃 - 헤더/푸터 없음
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        {children}
      </div>
    </ToastProvider>
  )
}
