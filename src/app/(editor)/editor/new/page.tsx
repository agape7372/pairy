'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { EditorEntryFlow } from '@/components/editor/entry'

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">에디터 준비 중...</p>
      </div>
    </div>
  )
}

export default function NewEditorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EditorEntryFlow />
    </Suspense>
  )
}
