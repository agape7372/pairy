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
  Keyboard,
  Image as ImageIcon,
  AlertCircle,
  Users,
} from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { useCanvasEditorStore } from '@/stores/canvasEditorStore'
import EditorSidebar from './EditorSidebar'
import KeyboardShortcutsModal from './KeyboardShortcutsModal'
import { CollabOverlay } from './CollabOverlay'
import { ZoneSelector } from './ZoneSelector'
import { OnboardingTour, useOnboarding, DEFAULT_TOUR_STEPS } from './OnboardingTour'
import { ContextMenu, useContextMenu, createContextMenuItems } from './ContextMenu'
import { useCollabOptional } from '@/lib/collab'
import type { TemplateConfig, TemplateRendererRef } from '@/types/template'
import {
  safeGetAutoSaveData,
  safeSetAutoSaveData,
  safeRemoveAutoSaveData,
  calculateFitZoom as calculateFitZoomUtil,
  formatTimeAgo as formatTimeAgoUtil,
  sanitizeFilename as sanitizeFilenameUtil,
  createFocusTrap,
  clamp,
  getStorageErrorMessage,
  type AutoSaveData,
} from '@/lib/utils/editorUtils'

// 내보내기 포맷 타입
type ExportFormat = 'png' | 'jpg' | 'webp'

interface ExportOption {
  format: ExportFormat
  label: string
  quality?: number
}

const exportFormats: ExportOption[] = [
  { format: 'png', label: 'PNG (무손실)' },
  { format: 'jpg', label: 'JPG (고압축)', quality: 0.92 },
  { format: 'webp', label: 'WebP (최적화)', quality: 0.9 },
]

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
  sessionId?: string // Sprint 32: 협업 세션 ID
}

// ============================================
// 메인 컴포넌트
// ============================================

// basePath for GitHub Pages (static export)
const BASE_PATH = process.env.NODE_ENV === 'production' ? '/pairy' : ''

export default function CanvasEditor({
  templateId,
  initialTitle,
  sessionId,
}: CanvasEditorProps) {
  const rendererRef = useRef<TemplateRendererRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sprint 32: 협업 컨텍스트 (선택적)
  const collab = useCollabOptional()

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
    selectedStickerId, // Sprint 31
    zoom,
    isDirty,
    loadTemplate,
    setLoading,
    setError,
    selectSlot,
    selectText,
    selectSticker, // Sprint 31
    updateStickerTransform, // Sprint 31
    setZoom,
    undo,
    redo,
    canUndo,
    canRedo,
    getHistoryInfo,
    markSaved,
    updateSlotTransform,
    removeImage,
    updateImage,
    updateFormField,
  } = useCanvasEditorStore()

  // Toast
  const toast = useToast()

  // Local state
  const [title, setTitle] = useState(initialTitle || '새 작업')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [exportScale, setExportScale] = useState(2)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)

  // Sprint 30: 인라인 텍스트 편집
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const inlineInputRef = useRef<HTMLTextAreaElement>(null)

  // 핀치 줌 상태
  const lastTouchDistance = useRef<number | null>(null)
  const lastZoom = useRef(zoom)
  const autoSaveKey = `pairy-autosave-${templateId}`

  // 복구 토스트 중복 방지
  const recoveryToastShown = useRef(false)

  // Sprint 33: 온보딩 투어
  const onboarding = useOnboarding()

  // Sprint 33: 컨텍스트 메뉴
  const contextMenu = useContextMenu()

  // 자동 저장 디바운스
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Export 모달 Focus trap
  const exportModalRef = useRef<HTMLDivElement>(null)
  const focusTrapRef = useRef<ReturnType<typeof createFocusTrap> | null>(null)

  // ============================================
  // 헬퍼 함수 (useEffect보다 먼저 정의)
  // ============================================

  // 시간 포맷 헬퍼 (유틸리티 함수 래핑)
  const formatTimeAgo = useCallback((date: Date): string => {
    return formatTimeAgoUtil(date)
  }, [])

  // 파일명 sanitization 헬퍼 (유틸리티 함수 래핑)
  const sanitizeFilename = useCallback((filename: string): string => {
    return sanitizeFilenameUtil(filename)
  }, [])

  // 슬롯 클릭 핸들러 (모바일에서 사이드바 자동 열기)
  const handleSlotClick = useCallback((slotId: string | null) => {
    selectSlot(slotId)
    // 모바일에서 슬롯 선택 시 사이드바 열기
    if (slotId && window.innerWidth < 768) {
      setIsSidebarOpen(true)
    }
  }, [selectSlot])

  // 텍스트 클릭 핸들러 (모바일에서 사이드바 자동 열기)
  const handleTextClick = useCallback((textId: string | null) => {
    selectText(textId)
    // 모바일에서 텍스트 선택 시 사이드바 열기
    if (textId && window.innerWidth < 768) {
      setIsSidebarOpen(true)
    }
  }, [selectText])

  // Sprint 31: 스티커 클릭 핸들러
  const handleStickerClick = useCallback((stickerId: string | null) => {
    selectSticker(stickerId)
    // 모바일에서 스티커 선택 시 사이드바 열기
    if (stickerId && window.innerWidth < 768) {
      setIsSidebarOpen(true)
    }
  }, [selectSticker])

  // Sprint 30: 텍스트 더블클릭 핸들러 (인라인 편집)
  const handleTextDoubleClick = useCallback((textId: string) => {
    if (!templateConfig) return
    const textField = templateConfig.layers.texts.find((t) => t.id === textId)
    if (!textField) return

    // 현재 값 또는 기본값으로 편집 시작
    const currentValue = formData[textField.dataKey] || textField.defaultValue || ''
    setEditingTextId(textId)
    setEditingValue(currentValue)

    // 포커스를 위한 지연
    setTimeout(() => {
      inlineInputRef.current?.focus()
      inlineInputRef.current?.select()
    }, 10)
  }, [templateConfig, formData])

  // Sprint 30: 인라인 편집 완료 핸들러
  const handleInlineEditComplete = useCallback(() => {
    if (!editingTextId || !templateConfig) return

    const textField = templateConfig.layers.texts.find((t) => t.id === editingTextId)
    if (textField) {
      updateFormField(textField.dataKey, editingValue)
    }

    setEditingTextId(null)
    setEditingValue('')
  }, [editingTextId, editingValue, templateConfig, updateFormField])

  // Sprint 30: 인라인 편집 취소 핸들러
  const handleInlineEditCancel = useCallback(() => {
    setEditingTextId(null)
    setEditingValue('')
  }, [])

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

  // 복구 데이터 확인 (템플릿 로드 후) - 안전한 localStorage 접근
  useEffect(() => {
    if (!templateConfig) return

    // 중복 토스트 방지: 이미 표시했으면 스킵
    if (recoveryToastShown.current) return
    recoveryToastShown.current = true

    const result = safeGetAutoSaveData(autoSaveKey)

    if (!result.success) {
      // 에러 발생 시 사용자에게 알림 (단, parse_error는 무시)
      if (result.error.type !== 'parse_error') {
        console.warn('Recovery check failed:', result.error)
      }
      return
    }

    const savedData = result.data
    if (savedData) {
      const savedTime = new Date(savedData.timestamp)
      const timeDiff = Date.now() - savedTime.getTime()

      // 24시간 이내의 데이터만 복구 제안
      if (timeDiff < 24 * 60 * 60 * 1000) {
        const timeAgo = formatTimeAgo(savedTime)
        toast.info(`${timeAgo}에 저장된 작업이 있습니다`, {
          title: '이전 작업 발견',
          duration: 0, // 수동으로 닫을 때까지 유지
          action: {
            label: '복구하기',
            onClick: () => {
              handleRecoverData()
            },
          },
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateConfig])

  // 자동 저장 (30초마다, 디바운스 적용) - 안전한 localStorage 접근
  useEffect(() => {
    if (!templateConfig || !isDirty) return

    // 이전 타이머 취소
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      // 저장 시점의 최신 데이터 캡처
      const currentState = useCanvasEditorStore.getState()
      const saveData: AutoSaveData = {
        templateId,
        title,
        formData: currentState.formData,
        colors: currentState.colors,
        slotTransforms: currentState.slotTransforms,
        timestamp: new Date().toISOString(),
      }

      const result = safeSetAutoSaveData(autoSaveKey, saveData)

      if (result.success) {
        setLastAutoSave(new Date())
      } else {
        // 사용자 친화적 에러 메시지 표시
        const message = getStorageErrorMessage(result.error)
        toast.warning(message, {
          title: '자동 저장 실패',
        })
      }
    }, 30000) // 30초

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [templateConfig, isDirty, templateId, title, formData, colors, slotTransforms, autoSaveKey, toast])

  // 복구 데이터 적용 - 안전한 localStorage 접근
  const handleRecoverData = useCallback(() => {
    const result = safeGetAutoSaveData(autoSaveKey)

    if (!result.success) {
      const message = getStorageErrorMessage(result.error)
      toast.error(message, { title: '복구 실패' })
      return
    }

    const savedData = result.data
    if (!savedData) {
      toast.warning('복구할 데이터가 없습니다')
      return
    }

    try {
      if (savedData.title) setTitle(savedData.title)
      if (savedData.formData) useCanvasEditorStore.getState().setFormData(savedData.formData)
      if (savedData.colors) useCanvasEditorStore.getState().setColors(savedData.colors)
      if (savedData.slotTransforms) {
        Object.entries(savedData.slotTransforms).forEach(([slotId, transform]) => {
          updateSlotTransform(slotId, transform)
        })
      }

      toast.success('이전 작업이 복구되었습니다')
      safeRemoveAutoSaveData(autoSaveKey) // 복구 후 삭제
    } catch (e) {
      console.error('Recovery failed:', e)
      toast.error('복구 중 오류가 발생했습니다')
    }
  }, [autoSaveKey, toast, updateSlotTransform])

  // 줌 조절 (메모이제이션)
  const handleZoomIn = useCallback(() => setZoom(zoom + 0.1), [zoom, setZoom])
  const handleZoomOut = useCallback(() => setZoom(zoom - 0.1), [zoom, setZoom])
  const handleZoomReset = useCallback(() => setZoom(1), [setZoom])

  // 화면 맞춤 줌 계산 - 안전한 계산 (zero-division 방지)
  const calculateFitZoom = useCallback(() => {
    if (!containerRef.current || !templateConfig) return 1

    const container = containerRef.current

    return calculateFitZoomUtil(
      container.clientWidth,
      container.clientHeight,
      templateConfig.canvas.width,
      templateConfig.canvas.height,
      64, // 패딩 (p-8 = 32px * 2 = 64px)
      { minZoom: 0.25, maxZoom: 1.5, margin: 0.95 }
    )
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

  // 저장 (useCallback으로 메모이제이션) - 안전한 localStorage 접근
  const handleSave = useCallback(async () => {
    // TODO: 실제 Supabase 저장 로직 구현
    console.log('Saving...', { formData, images, colors })
    markSaved()
    // 자동 저장 데이터 삭제 (수동 저장 완료)
    safeRemoveAutoSaveData(autoSaveKey)
    setLastAutoSave(new Date())
    toast.success('저장되었습니다')
  }, [formData, images, colors, markSaved, autoSaveKey, toast])

  // 선택된 슬롯 이동 (화살표 키)
  const moveSelectedSlot = useCallback((dx: number, dy: number) => {
    if (!selectedSlotId || !templateConfig) return

    const slot = templateConfig.layers.slots.find(s => s.id === selectedSlotId)
    if (!slot) return

    const currentTransform = slotTransforms[selectedSlotId] || { x: 0, y: 0, scale: 1, rotation: 0 }

    // 픽셀을 정규화된 좌표로 변환 (-1 ~ 1 범위)
    const normalizedDx = dx / (slot.transform.width / 2)
    const normalizedDy = dy / (slot.transform.height / 2)

    updateSlotTransform(selectedSlotId, {
      x: Math.max(-1, Math.min(1, currentTransform.x + normalizedDx)),
      y: Math.max(-1, Math.min(1, currentTransform.y + normalizedDy)),
    })
  }, [selectedSlotId, templateConfig, slotTransforms, updateSlotTransform])

  // 키보드 단축키 (확장)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 단축키 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey

      // ? : 단축키 도움말
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setShowShortcutsModal(true)
        return
      }

      // ESC: 선택 해제 또는 모달 닫기
      if (e.key === 'Escape') {
        if (showExportModal) {
          setShowExportModal(false)
        } else if (showShortcutsModal) {
          setShowShortcutsModal(false)
        } else {
          selectSlot(null)
          selectText(null)
        }
        return
      }

      // Ctrl/Cmd + Z: Undo
      if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) {
          undo()
          toast.info('실행 취소')
        }
        return
      }

      // Ctrl/Cmd + Shift + Z 또는 Ctrl/Cmd + Y: Redo
      if ((isCtrlOrCmd && e.key === 'z' && e.shiftKey) || (isCtrlOrCmd && e.key === 'y')) {
        e.preventDefault()
        if (canRedo()) {
          redo()
          toast.info('다시 실행')
        }
        return
      }

      // Ctrl/Cmd + S: Save
      if (isCtrlOrCmd && e.key === 's') {
        e.preventDefault()
        handleSave()
        return
      }

      // Ctrl/Cmd + E: 내보내기 모달
      if (isCtrlOrCmd && e.key === 'e') {
        e.preventDefault()
        setShowExportModal(true)
        return
      }

      // Ctrl/Cmd + 0: 줌 100%
      if (isCtrlOrCmd && e.key === '0') {
        e.preventDefault()
        setZoom(1)
        return
      }

      // Ctrl/Cmd + 1: 화면에 맞춤
      if (isCtrlOrCmd && e.key === '1') {
        e.preventDefault()
        handleFitToScreen()
        return
      }

      // Ctrl/Cmd + +: 확대 (안전한 범위 제한)
      if (isCtrlOrCmd && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        setZoom(clamp(zoom + 0.1, 0.25, 2))
        return
      }

      // Ctrl/Cmd + -: 축소 (안전한 범위 제한)
      if (isCtrlOrCmd && e.key === '-') {
        e.preventDefault()
        setZoom(clamp(zoom - 0.1, 0.25, 2))
        return
      }

      // 화살표 키: 선택된 슬롯 이동
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedSlotId) {
          e.preventDefault()
          const step = e.shiftKey ? 10 : 1 // Shift: 10px, 일반: 1px
          switch (e.key) {
            case 'ArrowUp': moveSelectedSlot(0, -step); break
            case 'ArrowDown': moveSelectedSlot(0, step); break
            case 'ArrowLeft': moveSelectedSlot(-step, 0); break
            case 'ArrowRight': moveSelectedSlot(step, 0); break
          }
        }
        return
      }

      // Delete/Backspace: 선택된 이미지 삭제
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedSlotId && templateConfig) {
          const slot = templateConfig.layers.slots.find(s => s.id === selectedSlotId)
          if (slot && images[slot.dataKey]) {
            e.preventDefault()
            removeImage(slot.dataKey)
            toast.info('이미지가 삭제되었습니다')
          }
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    undo, redo, canUndo, canRedo, handleSave, handleFitToScreen,
    zoom, setZoom, selectSlot, selectText, selectedSlotId, templateConfig,
    images, removeImage, moveSelectedSlot, showExportModal, showShortcutsModal, toast
  ])

  // Sprint 29: 클립보드 붙여넣기 핸들러
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      // 선택된 슬롯이 없으면 첫 번째 슬롯 선택
      let targetSlotId = selectedSlotId
      if (!targetSlotId && templateConfig?.layers.slots.length) {
        targetSlotId = templateConfig.layers.slots[0].id
        selectSlot(targetSlotId)
      }

      if (!targetSlotId || !templateConfig) return

      // 선택된 슬롯의 dataKey 찾기
      const targetSlot = templateConfig.layers.slots.find(s => s.id === targetSlotId)
      if (!targetSlot) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            const url = URL.createObjectURL(file)
            updateImage(targetSlot.dataKey, url)
            toast.success('이미지가 붙여넣기 되었습니다')
          }
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [selectedSlotId, templateConfig, selectSlot, updateImage, toast])

  // 핀치 줌 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      lastTouchDistance.current = distance
      lastZoom.current = zoom
    }
  }, [zoom])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )

      const scale = distance / lastTouchDistance.current
      const newZoom = Math.max(0.25, Math.min(2, lastZoom.current * scale))
      setZoom(newZoom)
    }
  }, [setZoom])

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null
  }, [])

  // 이미지 내보내기 (포맷 및 스케일 지원)
  const handleExport = useCallback(async () => {
    const renderer = rendererRef.current
    if (!renderer) return

    setIsExporting(true)
    setExportProgress(0)
    setExportError(null)

    try {
      // 진행률 시뮬레이션
      setExportProgress(20)
      await new Promise(resolve => setTimeout(resolve, 100))

      setExportProgress(50)
      const dataUrl = await renderer.exportToImage(exportScale)
      if (!dataUrl) throw new Error('이미지 생성에 실패했습니다')

      setExportProgress(80)

      // 포맷 변환 (PNG가 아닌 경우)
      let finalDataUrl = dataUrl
      const formatOption = exportFormats.find(f => f.format === exportFormat)

      if (exportFormat !== 'png' && formatOption) {
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = reject
          img.src = dataUrl
        })

        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          finalDataUrl = canvas.toDataURL(`image/${exportFormat}`, formatOption.quality || 1)
        }
      }

      setExportProgress(100)

      // 다운로드
      const extension = exportFormat
      const link = document.createElement('a')
      link.download = `${sanitizeFilename(title)}_${new Date().toISOString().slice(0, 10)}${exportScale > 1 ? `@${exportScale}x` : ''}.${extension}`
      link.href = finalDataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setShowExportModal(false)
      toast.success('이미지가 저장되었습니다', {
        title: '내보내기 완료',
      })
    } catch (err) {
      console.error('Export failed:', err)
      setExportError(err instanceof Error ? err.message : '내보내기 중 오류가 발생했습니다')
      toast.error('내보내기에 실패했습니다')
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }, [title, exportFormat, exportScale, toast, sanitizeFilename])

  // Export 모달 Focus trap 관리 (접근성 개선)
  useEffect(() => {
    if (showExportModal && exportModalRef.current) {
      // Focus trap 생성 및 활성화
      focusTrapRef.current = createFocusTrap(exportModalRef.current)
      focusTrapRef.current.activate()
    }

    return () => {
      // 모달이 닫힐 때 focus trap 비활성화
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate()
        focusTrapRef.current = null
      }
    }
  }, [showExportModal])

  // 모달 닫기 핸들러
  const closeExportModal = useCallback(() => {
    if (!isExporting) {
      setShowExportModal(false)
      setExportError(null)
    }
  }, [isExporting])

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

          {isDirty ? (
            <span className="text-xs text-gray-400 hidden sm:inline">
              {lastAutoSave ? `자동 저장됨 (${formatTimeAgo(lastAutoSave)})` : '변경사항 있음'}
            </span>
          ) : lastAutoSave ? (
            <span className="text-xs text-green-500 hidden sm:inline">저장됨 ✓</span>
          ) : null}
        </div>

        {/* 우측: 액션 버튼 */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Undo/Redo with history indicator */}
          <div className="flex items-center gap-1" role="group" aria-label="실행 취소/다시 실행">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className={cn(
                'p-2 rounded-lg transition-colors relative',
                canUndo()
                  ? 'text-gray-500 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              )}
              title={`실행 취소 (Ctrl+Z) - ${getHistoryInfo().canUndo}개 취소 가능`}
              aria-label="실행 취소"
            >
              <Undo2 className="w-4 h-4" aria-hidden="true" />
            </button>
            {/* 히스토리 카운터 */}
            <span className="text-xs text-gray-400 min-w-[2.5rem] text-center hidden sm:block" title="실행취소/다시실행 가능 횟수">
              {getHistoryInfo().canUndo}/{getHistoryInfo().canRedo}
            </span>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className={cn(
                'p-2 rounded-lg transition-colors',
                canRedo()
                  ? 'text-gray-500 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              )}
              title={`다시 실행 (Ctrl+Y) - ${getHistoryInfo().canRedo}개 다시 실행 가능`}
              aria-label="다시 실행"
            >
              <Redo2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* 단축키 도움말 */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hidden sm:block"
            title="단축키 도움말 (?)"
            aria-label="단축키 도움말"
          >
            <Keyboard className="w-4 h-4" aria-hidden="true" />
          </button>

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

          {/* Sprint 32: 협업 상태 표시 */}
          {collab?.isConnected && (
            <div className="flex items-center gap-1 px-2 py-1 bg-accent-50 text-accent-700 rounded-lg">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">
                {collab.remoteUsers.size + 1}명 참여 중
              </span>
            </div>
          )}

          {/* 내보내기 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportModal(true)}
            className="px-2 sm:px-3"
            data-tour="export-btn"
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
        {/* 캔버스 영역 - 핀치 줌 지원 */}
        <main
          className="flex-1 relative overflow-auto touch-pan-x touch-pan-y"
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
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
          <div
            className="min-h-full flex items-center justify-center p-4 md:p-8"
            data-tour="canvas-area"
            onContextMenu={(e) => {
              // 캔버스 빈 영역 우클릭
              if (e.target === e.currentTarget) {
                contextMenu.open(e, 'canvas', null)
              }
            }}
          >
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
                  selectedStickerId={selectedStickerId}
                  onSlotClick={handleSlotClick}
                  onTextClick={handleTextClick}
                  onTextDoubleClick={handleTextDoubleClick}
                  onSlotTransformChange={updateSlotTransform}
                  onStickerClick={handleStickerClick}
                  onStickerTransformChange={updateStickerTransform}
                />

                {/* Sprint 32: 협업 오버레이 */}
                {collab?.isConnected && (
                  <CollabOverlay
                    canvasWidth={templateConfig.canvas.width}
                    canvasHeight={templateConfig.canvas.height}
                    slots={templateConfig.layers.slots.map((slot, index) => ({
                      id: slot.id,
                      zone: index === 0 ? 'A' : 'B',
                      transform: slot.transform,
                    }))}
                  />
                )}

                {/* Sprint 30: 인라인 텍스트 편집 오버레이 */}
                {editingTextId && templateConfig && (() => {
                  const textField = templateConfig.layers.texts.find((t) => t.id === editingTextId)
                  if (!textField) return null
                  const { transform, style } = textField
                  return (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: (transform.x - transform.width / 2) * zoom,
                        top: (transform.y - transform.height / 2) * zoom,
                        width: transform.width * zoom,
                        height: transform.height * zoom,
                      }}
                    >
                      <textarea
                        ref={inlineInputRef}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={handleInlineEditComplete}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleInlineEditComplete()
                          }
                          if (e.key === 'Escape') {
                            handleInlineEditCancel()
                          }
                        }}
                        className="w-full h-full resize-none border-2 border-blue-500 rounded pointer-events-auto bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        style={{
                          fontFamily: style.fontFamily,
                          fontSize: style.fontSize * zoom,
                          fontWeight: style.fontWeight === 'bold' ? 700 : 400,
                          fontStyle: style.fontStyle === 'italic' ? 'italic' : 'normal',
                          textAlign: style.align || 'center',
                          lineHeight: style.lineHeight || 1.2,
                          letterSpacing: style.letterSpacing ? style.letterSpacing * zoom : undefined,
                          padding: 4,
                        }}
                        placeholder="텍스트 입력..."
                      />
                    </div>
                  )
                })()}
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

      {/* 내보내기 모달 - 확장된 옵션, Focus trap 적용 */}
      {showExportModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
          aria-describedby="export-modal-desc"
          onClick={closeExportModal}
        >
          <div
            ref={exportModalRef}
            className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-100 rounded-xl">
                <ImageIcon className="w-6 h-6 text-primary-600" aria-hidden="true" />
              </div>
              <div>
                <h3 id="export-modal-title" className="text-lg font-bold text-gray-900">
                  이미지 내보내기
                </h3>
                <p id="export-modal-desc" className="text-sm text-gray-500">포맷과 해상도를 선택하세요</p>
              </div>
            </div>

            {/* 포맷 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">파일 포맷</label>
              <div className="grid grid-cols-3 gap-2">
                {exportFormats.map((format) => (
                  <button
                    key={format.format}
                    onClick={() => setExportFormat(format.format)}
                    disabled={isExporting}
                    className={cn(
                      'p-3 rounded-xl border-2 text-center transition-all',
                      exportFormat === format.format
                        ? 'border-primary-400 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    )}
                  >
                    <span className="block text-sm font-medium">{format.format.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 해상도 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">해상도</label>
              <div className="space-y-2">
                {[1, 2, 3].map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setExportScale(scale)}
                    disabled={isExporting}
                    className={cn(
                      'w-full p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between',
                      exportScale === scale
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div>
                      <span className="font-medium text-gray-900">{scale}x</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {templateConfig.canvas.width * scale} × {templateConfig.canvas.height * scale}px
                      </span>
                    </div>
                    {scale === 2 && (
                      <span className="px-2 py-0.5 bg-primary-400 text-white text-xs font-medium rounded-full">
                        추천
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 진행 표시바 */}
            {isExporting && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">내보내는 중...</span>
                  <span className="text-sm font-medium text-gray-900">{exportProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-400 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}

            {exportError && (
              <div className="flex items-center gap-2 text-red-500 mb-4 p-3 bg-red-50 rounded-lg" role="alert">
                <span className="text-sm">{exportError}</span>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={closeExportModal}
                disabled={isExporting}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    내보내기
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 단축키 도움말 모달 */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Sprint 33: 온보딩 투어 */}
      <OnboardingTour
        steps={DEFAULT_TOUR_STEPS}
        isOpen={onboarding.isOpen}
        onClose={onboarding.closeTour}
        onComplete={onboarding.completeTour}
      />

      {/* Sprint 33: 컨텍스트 메뉴 */}
      <ContextMenu
        state={contextMenu.state}
        onClose={contextMenu.close}
        items={createContextMenuItems({
          targetType: contextMenu.state.targetType,
          targetId: contextMenu.state.targetId,
          onPaste: async () => {
            try {
              const items = await navigator.clipboard.read()
              for (const item of items) {
                const imageType = item.types.find(t => t.startsWith('image/'))
                if (imageType) {
                  const blob = await item.getType(imageType)
                  const url = URL.createObjectURL(blob)
                  // 첫 번째 슬롯에 붙여넣기
                  if (templateConfig?.layers.slots[0]) {
                    updateImage(templateConfig.layers.slots[0].dataKey, url)
                    toast.success('이미지가 붙여넣기 되었습니다')
                  }
                  break
                }
              }
            } catch {
              toast.error('붙여넣기에 실패했습니다')
            }
          },
          onReset: () => {
            // 전체 초기화 (필요시 구현)
            toast.info('초기화 기능은 준비 중입니다')
          },
        })}
      />
    </div>
  )
}
