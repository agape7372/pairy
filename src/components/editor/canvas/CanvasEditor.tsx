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
  Maximize,
  Save,
  Loader2,
  PanelRight,
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
  initialTitle?: string
}

// ============================================
// 메인 컴포넌트
// ============================================

// basePath for GitHub Pages (static export)
const BASE_PATH = process.env.NODE_ENV === 'production' ? '/pairy' : ''

export default function CanvasEditor({
  templateId,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // 모바일용 사이드바 토글
  const [exportError, setExportError] = useState<string | null>(null) // 내보내기 에러 상태

  // 템플릿 로드
  useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true)
      setError(null)

      try {
        // public/templates에서 JSON 로드 (basePath 적용)
        const response = await fetch(`${BASE_PATH}/templates/${templateId}.json`)
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

  // 줌 조절 (메모이제이션)
  const handleZoomIn = useCallback(() => setZoom(zoom + 0.1), [zoom, setZoom])
  const handleZoomOut = useCallback(() => setZoom(zoom - 0.1), [zoom, setZoom])
  const handleZoomReset = useCallback(() => setZoom(1), [setZoom])

  // 화면 맞춤 줌 계산
  const calculateFitZoom = useCallback(() => {
    if (!containerRef.current || !templateConfig) return 1

    const container = containerRef.current
    // 패딩 고려 (p-8 = 32px * 2 = 64px 양쪽)
    const padding = 64
    const availableWidth = container.clientWidth - padding
    const availableHeight = container.clientHeight - padding

    const canvasWidth = templateConfig.canvas.width
    const canvasHeight = templateConfig.canvas.height

    // 가로/세로 비율 중 작은 값 선택 (캔버스가 컨테이너에 맞게)
    const scaleX = availableWidth / canvasWidth
    const scaleY = availableHeight / canvasHeight
    const fitZoom = Math.min(scaleX, scaleY)

    // 최소 0.25, 최대 1.5 범위로 제한 (너무 크거나 작지 않게)
    return Math.max(0.25, Math.min(1.5, fitZoom * 0.95)) // 5% 마진
  }, [templateConfig])

  // 화면 맞춤 핸들러
  const handleFitToScreen = useCallback(() => {
    const fitZoom = calculateFitZoom()
    setZoom(fitZoom)
  }, [calculateFitZoom, setZoom])

  // 템플릿 로드 후 자동 화면 맞춤 (모바일에서 특히 유용)
  useEffect(() => {
    if (templateConfig && containerRef.current) {
      // 약간의 딜레이로 DOM 렌더링 완료 후 계산
      const timer = setTimeout(() => {
        const fitZoom = calculateFitZoom()
        // 모바일 환경이거나 캔버스가 화면보다 클 때만 자동 맞춤
        if (fitZoom < 1) {
          setZoom(fitZoom)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [templateConfig, calculateFitZoom, setZoom])

  // 윈도우 리사이즈 시 자동 맞춤 (디바운스)
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout

    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (templateConfig && containerRef.current) {
          const fitZoom = calculateFitZoom()
          // 현재 줌이 화면보다 클 때만 자동 축소
          if (zoom > fitZoom) {
            setZoom(fitZoom)
          }
        }
      }, 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimer)
    }
  }, [templateConfig, calculateFitZoom, zoom, setZoom])

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

  // PNG 내보내기 (메모이제이션)
  const handleExport = useCallback(async (scale: number = 2) => {
    const renderer = rendererRef.current
    if (!renderer) return

    setIsExporting(true)
    setExportError(null)

    try {
      const dataUrl = await renderer.exportToImage(scale)
      if (!dataUrl) throw new Error('이미지 생성에 실패했습니다')

      // 다운로드
      const link = document.createElement('a')
      link.download = `${title}_${new Date().toISOString().slice(0, 10)}${scale > 1 ? `@${scale}x` : ''}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setShowExportModal(false)
    } catch (err) {
      console.error('Export failed:', err)
      setExportError(err instanceof Error ? err.message : '내보내기 중 오류가 발생했습니다')
    } finally {
      setIsExporting(false)
    }
  }, [title])

  // 모달 닫기 핸들러
  const closeExportModal = useCallback(() => {
    if (!isExporting) {
      setShowExportModal(false)
      setExportError(null)
    }
  }, [isExporting])

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showExportModal && !isExporting) {
        closeExportModal()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [showExportModal, isExporting, closeExportModal])

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
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-2 sm:px-4 shrink-0">
        {/* 좌측: 뒤로가기 + 제목 */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Link
            href="/templates"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            aria-label="템플릿 목록으로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base sm:text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-300 rounded px-1 sm:px-2 py-1 min-w-0 flex-1"
          />

          {isDirty && (
            <span className="text-xs text-gray-400 hidden sm:inline">변경사항 있음</span>
          )}
        </div>

        {/* 우측: 액션 버튼 */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1" role="group" aria-label="실행 취소/다시 실행">
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
              aria-label="실행 취소"
            >
              <Undo2 className="w-4 h-4" aria-hidden="true" />
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
              aria-label="다시 실행"
            >
              <Redo2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* 저장 - 아이콘만 모바일에서 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty}
            className="px-2 sm:px-3"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">저장</span>
          </Button>

          {/* 내보내기 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportModal(true)}
            className="px-2 sm:px-3"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">내보내기</span>
          </Button>

          {/* 모바일 사이드바 토글 */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg md:hidden"
            title="편집 패널 열기"
            aria-label="편집 패널 열기"
            aria-expanded={isSidebarOpen}
            aria-controls="editor-sidebar"
          >
            <PanelRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* 메인 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 캔버스 영역 */}
        <main className="flex-1 relative overflow-auto" ref={containerRef}>
          {/* 줌 컨트롤 */}
          <div
            className="absolute top-4 right-4 flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1 z-10"
            role="group"
            aria-label="캔버스 줌 조절"
          >
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              title="축소"
              aria-label={`축소 (현재 ${Math.round(zoom * 100)}%)`}
            >
              <ZoomOut className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="text-sm text-gray-600 min-w-[3rem] text-center" aria-live="polite">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              title="확대"
              aria-label={`확대 (현재 ${Math.round(zoom * 100)}%)`}
            >
              <ZoomIn className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={handleZoomReset}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              title="100%로 리셋"
              aria-label="줌 100%로 초기화"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
            <div className="w-px h-4 bg-gray-200" aria-hidden="true" />
            <button
              onClick={handleFitToScreen}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              title="화면에 맞춤"
              aria-label="캔버스를 화면에 맞춤"
            >
              <Maximize className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* 캔버스 */}
          <div className="min-h-full flex items-center justify-center p-4 md:p-8">
            {/* 줌된 크기를 레이아웃에 반영하는 래퍼 */}
            <div
              style={{
                width: templateConfig.canvas.width * zoom,
                height: templateConfig.canvas.height * zoom,
              }}
            >
              <div
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
                style={{
                  width: templateConfig.canvas.width,
                  height: templateConfig.canvas.height,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
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
          </div>
        </main>

        {/* 사이드바 - 데스크톱은 항상 표시, 모바일은 오버레이 토글 */}
        <EditorSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* 내보내기 모달 - z-index를 사이드바(z-50)보다 높게 설정 */}
      {showExportModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
          onClick={closeExportModal}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="export-modal-title" className="text-xl font-bold text-gray-900 mb-4">
              이미지 내보내기
            </h3>

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
              <div className="flex items-center justify-center gap-2 text-gray-500 mb-4" aria-live="polite">
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                <span>이미지 생성 중...</span>
              </div>
            )}

            {exportError && (
              <div className="flex items-center gap-2 text-red-500 mb-4 p-3 bg-red-50 rounded-lg" role="alert">
                <span className="text-sm">{exportError}</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={closeExportModal}
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
