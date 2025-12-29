'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Share2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { useCanvasEditorStore } from '@/stores/canvasEditorStore'
import EditorSidebar from './EditorSidebar'
import type { TemplateConfig, TemplateRendererRef } from '@/types/template'

// react-konva는 SSR과 호환되지 않으므로 동적 import
const TemplateRenderer = dynamic(() => import('./TemplateRenderer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  ),
})

// ============================================
// Props
// ============================================

interface CanvasEditorProps {
  templateId: string
  workId?: string
  initialTitle?: string
}

// ============================================
// 메인 컴포넌트
// ============================================

export default function CanvasEditor({
  templateId,
  workId,
  initialTitle,
}: CanvasEditorProps) {
  const rendererRef = useRef<TemplateRendererRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Store
  const {
    templateConfig,
    isLoading,
    error,
    formData,
    images,
    colors,
    slotTransforms,
    selectedSlotId,
    selectedTextId,
    zoom,
    isDirty,
    loadTemplate,
    setLoading,
    setError,
    selectSlot,
    selectText,
    setZoom,
    undo,
    redo,
    canUndo,
    canRedo,
    markSaved,
    updateSlotTransform,
  } = useCanvasEditorStore()

  // Local state
  const [title, setTitle] = useState(initialTitle || '새 작업')
  const [isExporting, setIsExporting] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  // 템플릿 로드
  useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true)
      setError(null)

      try {
        // public/templates에서 JSON 로드
        const response = await fetch(`/templates/${templateId}.json`)
        if (!response.ok) {
          throw new Error('템플릿을 찾을 수 없습니다')
        }
        const config: TemplateConfig = await response.json()
        loadTemplate(config)
      } catch (err) {
        setError(err instanceof Error ? err.message : '템플릿 로드 실패')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [templateId, loadTemplate, setLoading, setError])

  // 줌 조절
  const handleZoomIn = () => setZoom(zoom + 0.1)
  const handleZoomOut = () => setZoom(zoom - 0.1)
  const handleZoomReset = () => setZoom(1)

  // 저장 (useCallback으로 메모이제이션)
  const handleSave = useCallback(async () => {
    // TODO: 실제 저장 로직 구현
    console.log('Saving...', { formData, images, colors })
    markSaved()
  }, [formData, images, colors, markSaved])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) undo()
      }
      // Ctrl/Cmd + Shift + Z 또는 Ctrl/Cmd + Y: Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault()
        if (canRedo()) redo()
      }
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // 버그 수정: handleSave 의존성 추가
  }, [undo, redo, canUndo, canRedo, handleSave])

  // PNG 내보내기
  const handleExport = async (scale: number = 2) => {
    const renderer = rendererRef.current
    if (!renderer) return

    setIsExporting(true)

    try {
      const dataUrl = await renderer.exportToImage(scale)
      if (!dataUrl) throw new Error('Export failed')

      // 다운로드
      const link = document.createElement('a')
      link.download = `${title}_${new Date().toISOString().slice(0, 10)}${scale > 1 ? `@${scale}x` : ''}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
      setShowExportModal(false)
    }
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-400 mx-auto mb-4" />
          <p className="text-gray-500">템플릿을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/templates">
            <Button>템플릿 목록으로</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!templateConfig) {
    return null
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 상단 툴바 */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
        {/* 좌측: 뒤로가기 + 제목 */}
        <div className="flex items-center gap-3">
          <Link
            href="/templates"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-2 py-1"
          />

          {isDirty && (
            <span className="text-xs text-gray-400">변경사항 있음</span>
          )}
        </div>

        {/* 우측: 액션 버튼 */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className={cn(
                'p-2 rounded-lg transition-colors',
                canUndo()
                  ? 'text-gray-500 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              )}
              title="실행 취소 (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className={cn(
                'p-2 rounded-lg transition-colors',
                canRedo()
                  ? 'text-gray-500 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              )}
              title="다시 실행 (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={handleSave} disabled={!isDirty}>
            <Save className="w-4 h-4 mr-1" />
            저장
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
            <Download className="w-4 h-4 mr-1" />
            내보내기
          </Button>
        </div>
      </header>

      {/* 메인 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 캔버스 영역 */}
        <main className="flex-1 relative overflow-auto" ref={containerRef}>
          {/* 줌 컨트롤 */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1 z-10">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              title="축소"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              title="확대"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomReset}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              title="100%로 리셋"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* 캔버스 */}
          <div className="min-h-full flex items-center justify-center p-8">
            <div
              className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform"
              style={{ transform: `scale(${zoom})` }}
            >
              <TemplateRenderer
                ref={rendererRef}
                config={templateConfig}
                formData={formData}
                images={images}
                colors={colors}
                slotTransforms={slotTransforms}
                selectedSlotId={selectedSlotId}
                selectedTextId={selectedTextId}
                onSlotClick={selectSlot}
                onTextClick={selectText}
                onSlotTransformChange={updateSlotTransform}
              />
            </div>
          </div>
        </main>

        {/* 사이드바 */}
        <EditorSidebar />
      </div>

      {/* 내보내기 모달 */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-gray-900 mb-4">이미지 내보내기</h3>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleExport(1)}
                disabled={isExporting}
                className="w-full p-4 border border-gray-200 rounded-xl text-left hover:border-primary-400 hover:bg-primary-50 transition-colors disabled:opacity-50"
              >
                <p className="font-medium text-gray-900">기본 화질 (1x)</p>
                <p className="text-sm text-gray-500">
                  {templateConfig.canvas.width} x {templateConfig.canvas.height}px
                </p>
              </button>

              <button
                onClick={() => handleExport(2)}
                disabled={isExporting}
                className="w-full p-4 border-2 border-primary-400 rounded-xl text-left bg-primary-50 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">고화질 (2x)</p>
                    <p className="text-sm text-gray-500">
                      {templateConfig.canvas.width * 2} x {templateConfig.canvas.height * 2}px
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-primary-400 text-white text-xs font-medium rounded-lg">
                    추천
                  </span>
                </div>
              </button>
            </div>

            {isExporting && (
              <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>이미지 생성 중...</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
