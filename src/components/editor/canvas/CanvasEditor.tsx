'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
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
  Users,
} from 'lucide-react'
import { Button, Modal, useToast } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { useCanvasEditorStore } from '@/stores/canvasEditorStore'
import EditorSidebar, { type EditorAssetContext } from './EditorSidebar'
import KeyboardShortcutsModal from './KeyboardShortcutsModal'
import { CollabOverlay } from './CollabOverlay'
import { OnboardingTour, useOnboarding, DEFAULT_TOUR_STEPS } from './OnboardingTour'
import { ContextMenu, useContextMenu, createContextMenuItems } from './ContextMenu'
// 협업 확장 컴포넌트
import {
  ParticipantAvatars,
  ConnectionIndicator,
  ConnectionBanner,
  InviteShareModal,
  ZoneSelector,
} from '@/components/editor/collab'
import { useCollabSession } from '@/hooks/useCollabSession'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'
import { CollabProvider, useCollabOptional } from '@/lib/collab'
import type { CollabUser } from '@/lib/collab/types'
import { useUser } from '@/hooks/useUser'
import { useReducedMotion, useAnnounce } from '@/hooks/useAccessibility'
import type { TemplateConfig, TemplateRendererRef } from '@/types/template'
import type { Json } from '@/types/database.types'
import {
  safeGetAutoSaveData,
  safeSetAutoSaveData,
  safeRemoveAutoSaveData,
  collectEditorImageSources,
  extractTemplateEdits,
  loadImage,
  makeImageDataDurable,
  makeTemplateEditsDurable,
  mergeTemplateEdits,
  parseWorkEditorData,
  calculateFitZoom as calculateFitZoomUtil,
  formatTimeAgo as formatTimeAgoUtil,
  sanitizeFilename as sanitizeFilenameUtil,
  clamp,
  getStorageErrorMessage,
  type AutoSaveData,
} from '@/lib/utils/editorUtils'
import {
  isCustomTemplateId,
  getCustomTemplateById,
  convertToTemplateConfig,
  convertDatabaseTemplateToConfig,
} from '@/lib/utils/customTemplateStorage'
import {
  IMAGE_COMPRESSION_CONFIG,
  formatFileSize,
  isSupportedImageType,
  processImageFile,
} from '@/lib/utils/imageCompressor'
import {
  deleteEditorImage,
  uploadEditorImage,
} from '@/lib/supabase/storage'

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
  workId?: string
  draftId?: string
  startCollab?: boolean
}

interface CanvasEditorContentProps extends CanvasEditorProps {
  collabUser?: CollabUser
}

// ============================================
// 메인 컴포넌트
// ============================================

// 배포 경로 프리픽스 — Vercel 이전(DL-0001)으로 기본 '' (@/lib/constants 와 동일 규칙)
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 사용자 색상 생성
function generateUserColor(userId: string): string {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
  }
  return colors[Math.abs(hash) % colors.length]
}

function waitForCanvasPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

export default function CanvasEditor({
  templateId,
  initialTitle,
  sessionId,
  workId,
  draftId,
  startCollab,
}: CanvasEditorProps) {
  // 사용자 정보 가져오기
  const { user, profile } = useUser()

  // 협업 사용자 정보 생성
  const collabUser: CollabUser | undefined = user ? {
    id: user.id,
    name: profile?.display_name || user.email?.split('@')[0] || '사용자',
    color: generateUserColor(user.id),
    avatar: profile?.avatar_url || undefined,
  } : undefined

  // 로그인 사용자는 세션 생성 전부터 같은 Provider 트리를 유지한다.
  // 협업 시작 시 전체 페이지를 다시 로드해 미저장 편집을 잃는 일을 막는다.
  if (collabUser) {
    return (
      <CollabProvider
        sessionId={sessionId}
        user={collabUser}
        autoConnect={false}
      >
        <CanvasEditorContent
          templateId={templateId}
          initialTitle={initialTitle}
          sessionId={sessionId}
          workId={workId}
          draftId={draftId}
          startCollab={startCollab}
          collabUser={collabUser}
        />
      </CollabProvider>
    )
  }

  // 일반 모드 (협업 없음)
  return (
    <CanvasEditorContent
      templateId={templateId}
      initialTitle={initialTitle}
      sessionId={sessionId}
      workId={workId}
      draftId={draftId}
      startCollab={startCollab}
      collabUser={collabUser}
    />
  )
}

// ============================================
// 에디터 컨텐츠 (CollabProvider 내부에서 사용)
// ============================================

function CanvasEditorContent({
  templateId,
  initialTitle,
  sessionId,
  workId,
  draftId,
  startCollab,
  collabUser,
}: CanvasEditorContentProps) {
  const rendererRef = useRef<TemplateRendererRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 협업 상태 (CollabProvider 내부에서만 사용 가능)
  const collab = useCollabOptional()
  const collabIsConnected = collab?.isConnected ?? false
  const connectCollab = collab?.connect
  const disconnectCollab = collab?.disconnect
  const updateCollabSelection = collab?.updateSelection
  const updateCollabCursor = collab?.updateCursor
  const collabConnectionStartedRef = useRef<string | null>(null)

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
    historyIndex,
    historyLength,
    hasPendingHistory,
    documentGeneration,
    loadTemplate,
    loadEditorData,
    setLoading,
    setError,
    selectSlot,
    selectText,
    selectSticker, // Sprint 31
    updateStickerTransform, // Sprint 31
    setZoom,
    undo,
    redo,
    markDirty,
    markSaved,
    restoreEditorData,
    updateSlotTransform,
    removeImage,
    updateImage,
    updateFormField,
    replaceAssetUrls,
  } = useCanvasEditorStore(
    useShallow((state) => ({
      templateConfig: state.templateConfig,
      isLoading: state.isLoading,
      error: state.error,
      formData: state.formData,
      images: state.images,
      colors: state.colors,
      slotTransforms: state.slotTransforms,
      selectedSlotId: state.selectedSlotId,
      selectedTextId: state.selectedTextId,
      selectedStickerId: state.selectedStickerId,
      zoom: state.zoom,
      isDirty: state.isDirty,
      historyIndex: state.historyIndex,
      historyLength: state.history.length,
      hasPendingHistory: state.hasPendingHistory,
      documentGeneration: state.documentGeneration,
      loadTemplate: state.loadTemplate,
      loadEditorData: state.loadEditorData,
      setLoading: state.setLoading,
      setError: state.setError,
      selectSlot: state.selectSlot,
      selectText: state.selectText,
      selectSticker: state.selectSticker,
      updateStickerTransform: state.updateStickerTransform,
      setZoom: state.setZoom,
      undo: state.undo,
      redo: state.redo,
      markDirty: state.markDirty,
      markSaved: state.markSaved,
      restoreEditorData: state.restoreEditorData,
      updateSlotTransform: state.updateSlotTransform,
      removeImage: state.removeImage,
      updateImage: state.updateImage,
      updateFormField: state.updateFormField,
      replaceAssetUrls: state.replaceAssetUrls,
    }))
  )

  const [activeSessionId, setActiveSessionId] = useState(sessionId)

  // Sprint 35+: 실제로 로드된 원본 템플릿과 작품을 기준으로 협업 세션을 만든다.
  const {
    session: collabSession,
    isHost,
    createSession,
  } = useCollabSession({
    templateId: templateConfig?.id || templateId,
    workId,
    sessionId: activeSessionId,
  })

  // H-2 완화: 서버 participants(join RPC 가 auth.uid() 강제 기록) 를
  // 인바운드 allowlist 로 provider 에 전달 — 목록 밖 신원의 업데이트/awareness 폐기
  const participantIds = collabSession?.participants.map((p) => p.userId)
  const participantKey = participantIds?.join(',')
  const collabRealtimeKey = collabSession?.realtimeKey
  const isActiveCollabMember = Boolean(
    collabSession &&
      (collabSession.status === 'waiting' ||
        collabSession.status === 'active') &&
      collabUser &&
      participantIds?.includes(collabUser.id) &&
      collabRealtimeKey
  )
  const collabConnectionKey =
    isActiveCollabMember && activeSessionId
      ? `${activeSessionId}:${collabRealtimeKey}:${participantKey}`
      : null
  useEffect(() => {
    // null은 provider에서 필터 해제를 뜻한다. 세션이 없거나 회수된
    // 상태에는 빈 목록을 넘겨 인바운드를 기본 거부한다.
    collab?.setAllowedUsers(participantIds ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantKey, collab])

  const undoCount = Math.max(
    0,
    historyIndex + (hasPendingHistory ? 1 : 0)
  )
  const redoCount = hasPendingHistory
    ? 0
    : Math.max(0, historyLength - 1 - historyIndex)
  const canUndoNow = undoCount > 0
  const canRedoNow = redoCount > 0

  // Toast
  const toast = useToast()

  // Sprint 34: 접근성 훅
  useReducedMotion()
  const announce = useAnnounce()

  // Local state
  const [title, setTitle] = useState(initialTitle || '새 작업')
  const [isSaving, setIsSaving] = useState(false)
  const [isStartingCollab, setIsStartingCollab] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [exportScale, setExportScale] = useState(2)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const [loadedDocumentKey, setLoadedDocumentKey] = useState<string | null>(null)
  const [autoSaveWorkId, setAutoSaveWorkId] = useState<string | null>(
    workId && UUID_RE.test(workId) ? workId : null
  )

  // Sprint 30: 인라인 텍스트 편집
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const inlineInputRef = useRef<HTMLTextAreaElement>(null)

  // 협업 확장: 초대 모달
  const [showInviteModal, setShowInviteModal] = useState(false)
  // 영역 선택 패널 — 선택/닫기 후에는 칩으로 접힘 (이전엔 닫을 방법이 없어 항상 떠 있었음)
  const [showZoneSelector, setShowZoneSelector] = useState(true)

  // 핀치 줌 상태
  const lastTouchDistance = useRef<number | null>(null)
  const lastZoom = useRef(zoom)
  const documentKey = workId
    ? `work-${workId}`
    : draftId
      ? `draft-${draftId}`
      : `template-${templateId}`
  const autoSaveDocumentKey = autoSaveWorkId
    ? `work-${autoSaveWorkId}`
    : documentKey
  const autoSaveKey = `pairy-autosave-${
    activeSessionId ? `session-${activeSessionId}` : autoSaveDocumentKey
  }`
  const editorAssetContext = useMemo<EditorAssetContext | undefined>(() => {
    if (IS_DEMO_MODE || !collabUser) return undefined
    return {
      userId: collabUser.id,
      // 작품 생성 전에도 안정적인 draft/session 범위를 사용한다.
      documentId:
        workId ||
        draftId ||
        activeSessionId ||
        templateConfig?.id ||
        templateId,
    }
  }, [
    activeSessionId,
    collabUser,
    draftId,
    templateConfig?.id,
    templateId,
    workId,
  ])
  const handleAssetError = useCallback(
    (assetError: Error) => {
      toast.error(assetError.message, { title: '이미지 저장 실패' })
    },
    [toast]
  )

  // 복구 토스트 중복 방지
  const recoveryToastShown = useRef(false)
  const initialTemplateConfigRef = useRef<TemplateConfig | null>(null)
  const initialTitleRef = useRef(initialTitle || '새 작업')
  const templateLoadGenerationRef = useRef(0)
  const documentRevisionRef = useRef(0)
  const titleRef = useRef(title)
  const saveInFlightRef = useRef(false)
  const autoSaveGenerationRef = useRef(0)
  const autoCollabStartedRef = useRef(false)
  const savedWorkIdRef = useRef<string | null>(
    workId && UUID_RE.test(workId) ? workId : null
  )
  const editorMountedRef = useRef(true)
  const pasteUploadSequenceRef = useRef(0)
  const latestPasteBySlotRef = useRef<Map<string, number>>(new Map())

  // Sprint 33: 온보딩 투어
  const onboarding = useOnboarding()

  // Sprint 33: 컨텍스트 메뉴
  const contextMenu = useContextMenu()

  // 자동 저장 디바운스
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const inlineFocusTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 터치 줌 디바운싱
  const touchZoomTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingZoomRef = useRef<number | null>(null)

  useEffect(() => {
    setActiveSessionId(sessionId)
    collabConnectionStartedRef.current = null
  }, [sessionId])

  // 템플릿과 서버 참가자 allowlist가 모두 준비된 뒤에만 연결한다.
  // 원격 초기 상태가 늦은 loadTemplate에 덮이는 race와 무허용 초기 창을 막는다.
  useEffect(() => {
    if (!collabConnectionKey) {
      if (collabConnectionStartedRef.current || collabIsConnected) {
        disconnectCollab?.()
        collabConnectionStartedRef.current = null
      }
      return
    }

    if (
      !activeSessionId ||
      !collabUser ||
      !templateConfig ||
      loadedDocumentKey !== documentKey ||
      !connectCollab ||
      collabConnectionStartedRef.current === collabConnectionKey
    ) {
      return
    }

    if (collabConnectionStartedRef.current || collabIsConnected) {
      disconnectCollab?.()
    }

    collabConnectionStartedRef.current = collabConnectionKey
    void connectCollab(
      activeSessionId,
      collabUser,
      collabRealtimeKey
    ).catch((error) => {
      console.error('[CanvasEditor] Collaboration connection failed:', error)
      if (collabConnectionStartedRef.current === collabConnectionKey) {
        collabConnectionStartedRef.current = null
      }
    })
  }, [
    activeSessionId,
    collabUser,
    templateConfig,
    loadedDocumentKey,
    documentKey,
    collabConnectionKey,
    collabRealtimeKey,
    connectCollab,
    disconnectCollab,
    collabIsConnected,
  ])

  useEffect(() => {
    return () => {
      disconnectCollab?.()
    }
  }, [disconnectCollab])

  // 저장 응답이 돌아오는 동안 문서가 바뀌었는지 판별한다.
  useEffect(() => {
    return useCanvasEditorStore.subscribe(
      (state) => ({
        templateConfig: state.templateConfig,
        formData: state.formData,
        images: state.images,
        colors: state.colors,
        slotTransforms: state.slotTransforms,
      }),
      () => {
        documentRevisionRef.current += 1
      },
      {
        equalityFn: (a, b) =>
          a.templateConfig === b.templateConfig &&
          a.formData === b.formData &&
          a.images === b.images &&
          a.colors === b.colors &&
          a.slotTransforms === b.slotTransforms,
      }
    )
  }, [])

  useEffect(() => {
    recoveryToastShown.current = false
  }, [autoSaveKey])

  useEffect(() => {
    titleRef.current = title
  }, [title])

  useEffect(() => {
    if (!isDirty && !isSaving) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, isSaving])

  useEffect(() => {
    const pasteUploads = latestPasteBySlotRef.current
    editorMountedRef.current = true
    return () => {
      editorMountedRef.current = false
      pasteUploads.clear()
      if (inlineFocusTimerRef.current) {
        clearTimeout(inlineFocusTimerRef.current)
      }
      if (touchZoomTimerRef.current) {
        clearTimeout(touchZoomTimerRef.current)
      }
    }
  }, [])

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

  const handleTitleChange = useCallback(
    (nextTitle: string) => {
      if (nextTitle === titleRef.current) return
      titleRef.current = nextTitle
      documentRevisionRef.current += 1
      setTitle(nextTitle)
      markDirty()
    },
    [markDirty]
  )

  const handleEditorExit = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isDirty && !isSaving) return
      if (window.confirm('저장하지 않은 변경사항이 있습니다. 편집기를 나갈까요?')) {
        return
      }
      event.preventDefault()
    },
    [isDirty, isSaving]
  )

  // 슬롯 클릭 핸들러 (모바일에서 사이드바 자동 열기 + 선택 공유)
  const handleSlotClick = useCallback((slotId: string | null) => {
    selectSlot(slotId)
    // 협업 상태 업데이트
    updateCollabSelection?.(slotId, null)
    // 모바일에서 슬롯 선택 시 사이드바 열기
    if (slotId && window.innerWidth < 768) {
      setIsSidebarOpen(true)
    }
  }, [selectSlot, updateCollabSelection])

  // 텍스트 클릭 핸들러 (모바일에서 사이드바 자동 열기 + 선택 공유)
  const handleTextClick = useCallback((textId: string | null) => {
    selectText(textId)
    // 협업 상태 업데이트
    updateCollabSelection?.(null, textId)
    // 모바일에서 텍스트 선택 시 사이드바 열기
    if (textId && window.innerWidth < 768) {
      setIsSidebarOpen(true)
    }
  }, [selectText, updateCollabSelection])

  // Sprint 31: 스티커 클릭 핸들러
  const handleStickerClick = useCallback((stickerId: string | null) => {
    selectSticker(stickerId)
    // 모바일에서 스티커 선택 시 사이드바 열기
    if (stickerId && window.innerWidth < 768) {
      setIsSidebarOpen(true)
    }
  }, [selectSticker])

  // 협업: 마우스 커서 위치 업데이트 (throttled)
  const lastCursorUpdate = useRef<number>(0)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!collabIsConnected || !updateCollabCursor || !containerRef.current) return

    // 50ms마다만 업데이트 (성능 최적화)
    const now = Date.now()
    if (now - lastCursorUpdate.current < 50) return
    lastCursorUpdate.current = now

    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom
    updateCollabCursor(x, y)
  }, [collabIsConnected, updateCollabCursor, zoom])

  // Sprint 30: 텍스트 더블클릭 핸들러 (인라인 편집)
  const handleTextDoubleClick = useCallback((textId: string) => {
    if (!templateConfig) return
    const textField = templateConfig.layers.texts.find((t) => t.id === textId)
    if (!textField) return

    // 현재 값 또는 기본값으로 편집 시작
    const currentValue =
      useCanvasEditorStore.getState().formData[textField.dataKey] ||
      textField.defaultValue ||
      ''
    setEditingTextId(textId)
    setEditingValue(currentValue)

    // 포커스를 위한 지연
    if (inlineFocusTimerRef.current) clearTimeout(inlineFocusTimerRef.current)
    inlineFocusTimerRef.current = setTimeout(() => {
      inlineInputRef.current?.focus()
      inlineInputRef.current?.select()
      inlineFocusTimerRef.current = null
    }, 10)
  }, [templateConfig])

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
    const generation = ++templateLoadGenerationRef.current
    const controller = new AbortController()
    setLoadedDocumentKey(null)

    const commitDocument = (
      config: TemplateConfig,
      nextTitle: string,
      editorData?: unknown,
      nextWorkId?: string
    ) => {
      const parsedDocument =
        editorData === undefined
          ? null
          : parseWorkEditorData(editorData, config, nextTitle)

      if (parsedDocument && !parsedDocument.success) {
        throw new Error(parsedDocument.error)
      }

      if (
        controller.signal.aborted ||
        generation !== templateLoadGenerationRef.current
      ) {
        return
      }

      initialTemplateConfigRef.current = config
      initialTitleRef.current = nextTitle
      titleRef.current = nextTitle

      if (parsedDocument?.data) {
        loadEditorData({
          templateConfig: mergeTemplateEdits(
            config,
            parsedDocument.data.templateEdits
          ),
          formData: parsedDocument.data.formData,
          images: parsedDocument.data.images || {},
          colors: parsedDocument.data.colors,
          slotTransforms: parsedDocument.data.slotTransforms,
        })
        const savedAt = new Date(parsedDocument.data.timestamp)
        // 초기 seed의 epoch sentinel은 실제 저장 시각처럼 노출하지 않는다.
        setLastAutoSave(savedAt.getTime() > 0 ? savedAt : null)
      } else {
        loadTemplate(config)
        setLastAutoSave(null)
      }

      if (nextWorkId) {
        savedWorkIdRef.current = nextWorkId
        setAutoSaveWorkId(nextWorkId)
      } else {
        savedWorkIdRef.current = null
        setAutoSaveWorkId(null)
      }
      setTitle(nextTitle)
      setLoadedDocumentKey(documentKey)
    }

    const fetchTemplateConfig = async (
      requestedTemplateId: string
    ): Promise<{ config: TemplateConfig; title: string }> => {
      // 데모 모드의 커스텀 템플릿은 localStorage에서 읽는다.
      if (isCustomTemplateId(requestedTemplateId)) {
        const customTemplate = getCustomTemplateById(requestedTemplateId)
        if (!customTemplate) {
          throw new Error('커스텀 템플릿을 찾을 수 없습니다')
        }
        return {
          config: convertToTemplateConfig(customTemplate),
          title: customTemplate.title,
        }
      }

      // UUID 템플릿은 Supabase templates가 정본이다.
      if (UUID_RE.test(requestedTemplateId)) {
        const supabase = createClient()
        const { data, error: templateError } = await supabase
          .from('templates')
          .select(
            'id, title, description, preview_url, editor_data, created_at, updated_at'
          )
          .eq('id', requestedTemplateId)
          .maybeSingle()

        if (templateError) throw new Error(templateError.message)
        if (!data) throw new Error('템플릿을 찾을 수 없습니다')

        return {
          config: convertDatabaseTemplateToConfig(data),
          title: data.title,
        }
      }

      // 번들 템플릿은 public/templates JSON에서 읽는다.
      const response = await fetch(
        `${BASE_PATH}/templates/${encodeURIComponent(requestedTemplateId)}.json`,
        { signal: controller.signal }
      )
      if (!response.ok) {
        throw new Error('템플릿을 찾을 수 없습니다')
      }

      return {
        config: (await response.json()) as TemplateConfig,
        title: '새 작업',
      }
    }

    const fetchDocument = async () => {
      setLoading(true)
      setError(null)

      try {
        if (workId) {
          if (!UUID_RE.test(workId)) {
            throw new Error('작업 주소가 올바르지 않습니다')
          }

          const supabase = createClient()
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser()
          if (authError) throw new Error(authError.message)
          if (!user) throw new Error('저장된 작업을 열려면 로그인이 필요합니다')

          const { data: work, error: workError } = await supabase
            .from('works')
            .select('id, template_id, title, editor_data')
            .eq('id', workId)
            .eq('user_id', user.id)
            .maybeSingle()

          if (workError) throw new Error(workError.message)
          if (!work) throw new Error('작업을 찾을 수 없거나 열 권한이 없습니다')
          if (
            controller.signal.aborted ||
            generation !== templateLoadGenerationRef.current
          ) {
            return
          }

          const source = await fetchTemplateConfig(work.template_id)
          commitDocument(source.config, work.title, work.editor_data, work.id)
          return
        }

        const source = await fetchTemplateConfig(templateId)
        commitDocument(source.config, initialTitle || source.title)
      } catch (err) {
        if (
          !controller.signal.aborted &&
          generation === templateLoadGenerationRef.current
        ) {
          setError(err instanceof Error ? err.message : '템플릿 로드 실패')
        }
      } finally {
        if (
          !controller.signal.aborted &&
          generation === templateLoadGenerationRef.current
        ) {
          setLoading(false)
        }
      }
    }

    void fetchDocument()
    return () => controller.abort()
  }, [
    templateId,
    workId,
    initialTitle,
    documentKey,
    loadTemplate,
    loadEditorData,
    setLoading,
    setError,
  ])

  const promoteTransientAssets = useCallback(
    async (
      currentState: ReturnType<typeof useCanvasEditorStore.getState>,
      expectedRevision: number
    ) => {
      const replacements: Record<string, string> = {}
      const uploadedPaths: string[] = []
      const sources = [
        ...Object.entries(currentState.images).flatMap(([dataKey, url]) =>
          url ? [{ url, assetKey: dataKey }] : []
        ),
        ...(currentState.templateConfig?.layers.stickers || []).map(
          (sticker) => ({
            url: sticker.imageUrl,
            assetKey: `sticker-${sticker.stickerId || sticker.id}`,
          })
        ),
      ].filter(
        ({ url }) => url.startsWith('blob:') || url.startsWith('data:')
      )

      if (sources.length === 0) {
        return {
          replacements,
          promotedRevision: expectedRevision,
        }
      }
      if (!editorAssetContext) {
        throw new Error('로그인 이미지 저장소가 아직 준비되지 않았습니다.')
      }

      let applied = false
      try {
        for (const source of sources) {
          if (replacements[source.url]) continue

          const response = await fetch(source.url)
          if (!response.ok) {
            throw new Error('임시 이미지를 읽을 수 없습니다.')
          }

          const uploaded = await uploadEditorImage(
            editorAssetContext.userId,
            editorAssetContext.documentId,
            source.assetKey,
            await response.blob()
          )
          if (uploaded.error || !uploaded.url || !uploaded.path) {
            if (uploaded.path) await deleteEditorImage(uploaded.path)
            throw (
              uploaded.error ||
              new Error('에디터 이미지 업로드에 실패했습니다.')
            )
          }

          replacements[source.url] = uploaded.url
          uploadedPaths.push(uploaded.path)
        }

        const activeState = useCanvasEditorStore.getState()
        if (
          !editorMountedRef.current ||
          activeState.documentGeneration !== currentState.documentGeneration
        ) {
          throw new Error('문서가 바뀌어 이미지 저장을 취소했습니다.')
        }

        const wasCurrentBeforePromotion =
          documentRevisionRef.current === expectedRevision
        replaceAssetUrls(replacements)
        applied = true

        return {
          replacements,
          promotedRevision: wasCurrentBeforePromotion
            ? documentRevisionRef.current
            : null,
        }
      } catch (assetError) {
        if (!applied) {
          await Promise.allSettled(
            uploadedPaths.map((path) => deleteEditorImage(path))
          )
        }
        throw assetError
      }
    },
    [editorAssetContext, replaceAssetUrls]
  )

  const createDurableSnapshot = useCallback(async (
    options: { requireRemoteAssets?: boolean } = {}
  ) => {
    const currentState = useCanvasEditorStore.getState()
    if (!currentState.templateConfig) {
      throw new Error('저장할 편집 문서가 없습니다')
    }

    const initialRevision = documentRevisionRef.current
    const snapshotTitle = titleRef.current
    const sourceTemplateEdits = extractTemplateEdits(currentState.templateConfig)
    let replacements: Record<string, string> = {}
    let promotedRevision: number | null = initialRevision

    if (editorAssetContext) {
      try {
        const promotion = await promoteTransientAssets(
          currentState,
          initialRevision
        )
        replacements = promotion.replacements
        promotedRevision = promotion.promotedRevision
      } catch (assetError) {
        if (options.requireRemoteAssets) throw assetError
        // 일반 저장은 영구 스토리지 장애 시에도 data URL 복구본으로 보호한다.
        console.warn(
          '[CanvasEditor] Remote asset promotion failed; using durable data URLs:',
          assetError
        )
      }
    } else if (options.requireRemoteAssets) {
      const hasTransientAsset =
        Object.values(currentState.images).some(
          (url) =>
            Boolean(url) &&
            (url!.startsWith('blob:') || url!.startsWith('data:'))
        ) ||
        sourceTemplateEdits.stickers.some(
          (sticker) =>
            sticker.imageUrl.startsWith('blob:') ||
            sticker.imageUrl.startsWith('data:')
        )
      if (hasTransientAsset) {
        throw new Error('협업 전에 이미지를 영구 저장할 수 없습니다.')
      }
    }

    const promotedImages = Object.fromEntries(
      Object.entries(currentState.images).map(([key, url]) => [
        key,
        url ? replacements[url] || url : null,
      ])
    )
    const promotedTemplateEdits = {
      ...sourceTemplateEdits,
      stickers: sourceTemplateEdits.stickers.map((sticker) => ({
        ...sticker,
        imageUrl: replacements[sticker.imageUrl] || sticker.imageUrl,
      })),
    }
    const [durableImages, durableTemplateEdits] = await Promise.all([
      makeImageDataDurable(promotedImages),
      makeTemplateEditsDurable(promotedTemplateEdits),
    ])

    const draft: AutoSaveData = {
      version: 2,
      templateId: currentState.templateConfig.id,
      title: snapshotTitle,
      formData: currentState.formData,
      images: durableImages,
      colors: currentState.colors,
      slotTransforms: currentState.slotTransforms,
      templateEdits: durableTemplateEdits,
      timestamp: new Date().toISOString(),
    }

    return {
      draft,
      revision: promotedRevision ?? initialRevision,
      snapshotTitle,
    }
  }, [editorAssetContext, promoteTransientAssets])

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

  // 자동 저장 (30초 디바운스) - blob URL까지 영속 가능한 형태로 직렬화
  useEffect(() => {
    if (!templateConfig || !isDirty) return

    const generation = ++autoSaveGenerationRef.current

    // 이전 타이머 취소
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const { draft, revision } = await createDurableSnapshot()
          if (
            generation !== autoSaveGenerationRef.current &&
            documentRevisionRef.current !== revision
          ) {
            return
          }

          const result = safeSetAutoSaveData(autoSaveKey, draft)
          if (result.success) {
            setLastAutoSave(new Date(draft.timestamp))
          } else {
            toast.warning(getStorageErrorMessage(result.error), {
              title: '자동 저장 실패',
            })
          }
        } catch (err) {
          if (generation !== autoSaveGenerationRef.current) return
          console.error('[CanvasEditor] Auto-save serialization failed:', err)
          toast.warning('임시 이미지를 저장하지 못했습니다. 저장 버튼을 다시 눌러주세요.', {
            title: '자동 저장 실패',
          })
        }
      })()
    }, 30000)

    return () => {
      autoSaveGenerationRef.current += 1
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
    }
  }, [
    templateConfig,
    isDirty,
    title,
    formData,
    images,
    colors,
    slotTransforms,
    autoSaveKey,
    createDurableSnapshot,
    toast,
  ])

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
      const currentConfig = useCanvasEditorStore.getState().templateConfig
      if (!currentConfig) throw new Error('템플릿이 준비되지 않았습니다')

      if (savedData.templateId !== currentConfig.id) {
        throw new Error('다른 템플릿의 복구 데이터입니다')
      }

      setTitle(savedData.title || initialTitleRef.current)
      documentRevisionRef.current += 1
      restoreEditorData({
        templateConfig: mergeTemplateEdits(currentConfig, savedData.templateEdits),
        formData: savedData.formData,
        images: savedData.images || {},
        colors: savedData.colors,
        slotTransforms: savedData.slotTransforms,
      })
      setLastAutoSave(new Date(savedData.timestamp))
      toast.success('이전 작업이 복구되었습니다')
    } catch (e) {
      console.error('Recovery failed:', e)
      toast.error('복구 중 오류가 발생했습니다')
    }
  }, [autoSaveKey, toast, restoreEditorData])

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

  // 저장된 작품 id (첫 서버 저장 후 이후 저장은 update).
  // collab_sessions.id와 works.id는 다른 엔티티이므로 sessionId를 작품 id로 쓰지 않는다.
  useEffect(() => {
    // 초대 참가자는 호스트 작품을 UPDATE할 수 없으므로 자신의 사본으로 저장한다.
    const nextWorkId = workId || (isHost ? collabSession?.workId : undefined)
    if (nextWorkId && UUID_RE.test(nextWorkId)) {
      savedWorkIdRef.current = nextWorkId
    }
  }, [workId, isHost, collabSession?.workId])

  // 저장 (M5 실배선) — 프로덕션: works.editor_data / 데모·로컬 틀: localStorage 유지
  const handleSave = useCallback(async () => {
    if (saveInFlightRef.current) return
    saveInFlightRef.current = true
    setIsSaving(true)
    let fallbackDraft: AutoSaveData | null = null

    try {
      const { draft, revision, snapshotTitle } = await createDurableSnapshot()
      fallbackDraft = draft
      const isServerTemplate = UUID_RE.test(draft.templateId)

      const persistLocalDraft = () => {
        const result = safeSetAutoSaveData(autoSaveKey, draft)
        if (!result.success) {
          toast.error(getStorageErrorMessage(result.error), {
            title: '저장 실패',
          })
          return false
        }

        setLastAutoSave(new Date(draft.timestamp))
        if (documentRevisionRef.current === revision) {
          markSaved()
          toast.success('브라우저에 저장되었습니다')
        } else {
          toast.info('저장 중 새 변경사항이 생겼습니다. 한 번 더 저장해주세요.')
        }
        return true
      }

      // 샘플/커스텀 템플릿은 서버 FK가 없으므로 브라우저에 즉시 실제 기록한다.
      if (IS_DEMO_MODE || !isServerTemplate) {
        persistLocalDraft()
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (persistLocalDraft()) {
          toast.warning('로그인하지 않아 브라우저에만 저장했습니다.')
        }
        return
      }

      // 작업 상태 전체 직렬화. blob URL은 createDurableSnapshot에서 data URL로 변환된다.
      const editorData = {
        version: draft.version,
        formData: draft.formData,
        images: draft.images,
        colors: draft.colors,
        slotTransforms: draft.slotTransforms,
        templateEdits: draft.templateEdits,
        savedAt: draft.timestamp,
      } as unknown as Json

      if (savedWorkIdRef.current) {
        const { data, error } = await supabase
          .from('works')
          .update({
            title: snapshotTitle,
            editor_data: editorData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', savedWorkIdRef.current)
          .eq('user_id', user.id)
          .select('id')
          .maybeSingle()
        if (error) throw new Error(error.message)
        if (!data) throw new Error('저장할 작품을 찾을 수 없습니다')
      } else {
        const { data, error } = await supabase
          .from('works')
          .insert({
            user_id: user.id,
            template_id: draft.templateId,
            title: snapshotTitle,
            editor_data: editorData,
          })
          .select('id')
          .single()
        if (error) throw new Error(error.message)
        savedWorkIdRef.current = data.id
        setAutoSaveWorkId(data.id)

        // 첫 서버 저장 뒤에도 같은 URL을 새로고침하면 방금 만든 작품을 다시 연다.
        const params = new URLSearchParams(window.location.search)
        params.set('work', data.id)
        params.delete('draft')
        window.history.replaceState(
          window.history.state,
          '',
          `${window.location.pathname}?${params.toString()}`
        )
      }

      setLastAutoSave(new Date(draft.timestamp))
      if (documentRevisionRef.current === revision) {
        markSaved()
        // 저장한 revision과 현재 문서가 같을 때만 복구본을 정리한다.
        safeRemoveAutoSaveData(autoSaveKey)
        toast.success('저장되었습니다')
      } else {
        toast.info('서버 저장 중 새 변경사항이 생겼습니다. 변경사항은 계속 보호됩니다.')
      }
    } catch (err) {
      console.error('[CanvasEditor] Save error:', err)
      const fallbackResult = fallbackDraft
        ? safeSetAutoSaveData(autoSaveKey, fallbackDraft)
        : null
      if (fallbackResult?.success) {
        setLastAutoSave(new Date(fallbackDraft!.timestamp))
        toast.error('서버 저장에 실패해 브라우저 복구본으로 보관했습니다.')
      } else {
        toast.error('저장에 실패했어요. 변경사항은 편집기에 그대로 남아 있습니다.')
      }
    } finally {
      saveInFlightRef.current = false
      setIsSaving(false)
    }
  }, [markSaved, autoSaveKey, createDurableSnapshot, toast])

  const handleStartCollaboration = useCallback(async () => {
    if (!collabUser) {
      toast.warning('협업을 시작하려면 먼저 로그인해주세요.')
      return
    }
    if (loadedDocumentKey !== documentKey || !templateConfig) {
      toast.warning('편집 문서를 불러온 뒤 다시 시도해주세요.')
      return
    }
    if (isStartingCollab) return

    setIsStartingCollab(true)
    try {
      // blob/data URL은 다른 브라우저에서 해석할 수 없고 Realtime payload도
      // 불필요하게 키운다. 세션을 만들기 전에 모든 사용자 asset을 영속화한다.
      await createDurableSnapshot({ requireRemoteAssets: true })
      const createdSession = await createSession(collabUser)
      const params = new URLSearchParams(window.location.search)
      params.set('session', createdSession.id)
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}?${params.toString()}`
      )
      collabConnectionStartedRef.current = null
      setActiveSessionId(createdSession.id)
      setIsStartingCollab(false)
    } catch (err) {
      console.error('[CanvasEditor] Collaboration session creation failed:', err)
      toast.error('협업 세션을 만들지 못했습니다. 잠시 후 다시 시도해주세요.')
      setIsStartingCollab(false)
    }
  }, [
    collabUser,
    loadedDocumentKey,
    documentKey,
    templateConfig,
    createDurableSnapshot,
    createSession,
    isStartingCollab,
    toast,
  ])

  useEffect(() => {
    if (
      !startCollab ||
      activeSessionId ||
      autoCollabStartedRef.current ||
      loadedDocumentKey !== documentKey
    ) {
      return
    }

    autoCollabStartedRef.current = true
    void handleStartCollaboration()
  }, [
    startCollab,
    activeSessionId,
    loadedDocumentKey,
    documentKey,
    handleStartCollaboration,
  ])

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
      const isCtrlOrCmd = e.ctrlKey || e.metaKey
      const hasOpenModal =
        showExportModal || showShortcutsModal || showInviteModal

      // 제목/텍스트 입력 중에도 브라우저의 "페이지 저장" 대신 문서를 저장한다.
      if (!hasOpenModal && isCtrlOrCmd && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
        return
      }

      // 폼 컨트롤/콘텐츠 편집 중에는 캔버스 단축키가 값을 침범하지 않는다.
      const target = e.target instanceof HTMLElement ? e.target : null
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], [role="textbox"]'
        )
      ) {
        return
      }

      // 열린 모달은 자체 키보드 처리를 사용한다.
      if (hasOpenModal) {
        return
      }

      // ? : 단축키 도움말
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setShowShortcutsModal(true)
        return
      }

      // ESC: 선택 해제 또는 모달 닫기
      // (내보내기 모달은 공유 Modal 프리미티브가 자체 캡처 단계 Escape 핸들러로 처리하고
      //  stopPropagation 하므로 여기까지 도달하지 않는다)
      if (e.key === 'Escape') {
        if (showShortcutsModal) {
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
        if (canUndoNow) {
          undo()
          toast.info('실행 취소')
        }
        return
      }

      // Ctrl/Cmd + Shift + Z 또는 Ctrl/Cmd + Y: Redo
      if ((isCtrlOrCmd && e.key === 'z' && e.shiftKey) || (isCtrlOrCmd && e.key === 'y')) {
        e.preventDefault()
        if (canRedoNow) {
          redo()
          toast.info('다시 실행')
        }
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
    undo, redo, canUndoNow, canRedoNow, handleSave, handleFitToScreen,
    zoom, setZoom, selectSlot, selectText, selectedSlotId, templateConfig,
    images, removeImage, moveSelectedSlot, showShortcutsModal, showExportModal,
    showInviteModal, toast
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
            if (!isSupportedImageType(file)) {
              toast.warning('지원하지 않는 이미지 형식입니다.')
              break
            }
            if (file.size > IMAGE_COMPRESSION_CONFIG.maxSourceFileSize) {
              toast.warning(
                `이미지 파일은 ${formatFileSize(
                  IMAGE_COMPRESSION_CONFIG.maxSourceFileSize
                )} 이하여야 합니다.`
              )
              break
            }

            const dataKey = targetSlot.dataKey
            const slotId = targetSlot.id
            const requestId = ++pasteUploadSequenceRef.current
            const requestGeneration = documentGeneration
            const requestAssetContext = editorAssetContext
            latestPasteBySlotRef.current.set(dataKey, requestId)
            let previewUrl: string | null = null

            try {
              const processed = await processImageFile(file)
              previewUrl = processed.url
              const isLatest = () =>
                editorMountedRef.current &&
                useCanvasEditorStore.getState().documentGeneration ===
                  requestGeneration &&
                latestPasteBySlotRef.current.get(dataKey) === requestId

              if (!isLatest()) {
                URL.revokeObjectURL(processed.url)
                break
              }

              if (requestAssetContext) {
                const uploaded = await uploadEditorImage(
                  requestAssetContext.userId,
                  requestAssetContext.documentId,
                  slotId,
                  processed.blob
                )

                if (!isLatest()) {
                  URL.revokeObjectURL(processed.url)
                  previewUrl = null
                  if (uploaded.path) await deleteEditorImage(uploaded.path)
                  break
                }

                URL.revokeObjectURL(processed.url)
                previewUrl = null
                if (uploaded.error || !uploaded.url) {
                  if (uploaded.path) await deleteEditorImage(uploaded.path)
                  throw (
                    uploaded.error ||
                    new Error('붙여넣은 이미지를 저장하지 못했습니다.')
                  )
                }
                updateImage(dataKey, uploaded.url)
              } else {
                updateImage(dataKey, processed.url)
                previewUrl = null
              }

              latestPasteBySlotRef.current.delete(dataKey)
              toast.success('이미지가 붙여넣기 되었습니다')
            } catch (pasteError) {
              if (previewUrl) URL.revokeObjectURL(previewUrl)
              if (
                latestPasteBySlotRef.current.get(dataKey) === requestId
              ) {
                latestPasteBySlotRef.current.delete(dataKey)
                handleAssetError(
                  pasteError instanceof Error
                    ? pasteError
                    : new Error('이미지 붙여넣기에 실패했습니다.')
                )
              }
            }
          }
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [
    documentGeneration,
    editorAssetContext,
    handleAssetError,
    selectedSlotId,
    selectSlot,
    templateConfig,
    toast,
    updateImage,
  ])

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

      // 디바운싱: 30ms 내 연속 호출 무시 (성능 최적화)
      pendingZoomRef.current = newZoom
      if (!touchZoomTimerRef.current) {
        touchZoomTimerRef.current = setTimeout(() => {
          if (pendingZoomRef.current !== null) {
            setZoom(pendingZoomRef.current)
          }
          touchZoomTimerRef.current = null
        }, 30)
      }
    }
  }, [setZoom])

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null
    // 남은 줌 업데이트 즉시 적용
    if (touchZoomTimerRef.current) {
      clearTimeout(touchZoomTimerRef.current)
      touchZoomTimerRef.current = null
      if (pendingZoomRef.current !== null) {
        setZoom(pendingZoomRef.current)
        pendingZoomRef.current = null
      }
    }
  }, [setZoom])


  // 이미지 내보내기 (포맷 및 스케일 지원)
  const handleExport = useCallback(async () => {
    const renderer = rendererRef.current
    if (!renderer || !templateConfig) return

    setIsExporting(true)
    setExportProgress(0)
    setExportError(null)
    const selectionBeforeExport = {
      slotId: selectedSlotId,
      textId: selectedTextId,
      stickerId: selectedStickerId,
    }
    let selectionHidden = false

    try {
      setExportProgress(20)
      const sources = collectEditorImageSources(templateConfig, images)
      await Promise.all(
        sources.map((source) => loadImage(source, { timeout: 15000 }))
      )

      // 선택선/Transformer는 편집 UI이므로 출력 직전에 렌더 트리에서 제외한다.
      selectSlot(null)
      selectionHidden = true
      await waitForCanvasPaint()

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
      // Sprint 34: 스크린 리더 알림
      announce('이미지 내보내기가 완료되었습니다')
    } catch (err) {
      console.error('Export failed:', err)
      setExportError(
        err instanceof Error
          ? err.message
          : '내보내기 중 오류가 발생했습니다'
      )
      toast.error('내보내기에 실패했습니다')
    } finally {
      if (selectionHidden) {
        if (selectionBeforeExport.stickerId) {
          selectSticker(selectionBeforeExport.stickerId)
        } else if (selectionBeforeExport.textId) {
          selectText(selectionBeforeExport.textId)
        } else {
          selectSlot(selectionBeforeExport.slotId)
        }
      }
      setIsExporting(false)
      setExportProgress(0)
    }
  }, [
    templateConfig,
    images,
    selectedSlotId,
    selectedTextId,
    selectedStickerId,
    selectSlot,
    selectText,
    selectSticker,
    title,
    exportFormat,
    exportScale,
    toast,
    announce,
    sanitizeFilename,
  ])

  // 모달 닫기 핸들러
  // (포커스 트랩/백드롭 클릭/Escape/스크롤 잠금은 공유 Modal 프리미티브가 처리한다)
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
            onClick={handleEditorExit}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            aria-label="템플릿 목록으로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>

          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            aria-label="작업 제목"
            maxLength={100}
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
              disabled={!canUndoNow}
              className={cn(
                'p-2 rounded-lg transition-colors relative',
                canUndoNow
                  ? 'text-gray-500 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              )}
              title={`실행 취소 (Ctrl+Z) - ${undoCount}개 취소 가능`}
              aria-label="실행 취소"
            >
              <Undo2 className="w-4 h-4" aria-hidden="true" />
            </button>
            {/* 히스토리 카운터 */}
            <span className="text-xs text-gray-400 min-w-[2.5rem] text-center hidden sm:block" title="실행취소/다시실행 가능 횟수">
              {undoCount}/{redoCount}
            </span>
            <button
              onClick={redo}
              disabled={!canRedoNow}
              className={cn(
                'p-2 rounded-lg transition-colors',
                canRedoNow
                  ? 'text-gray-500 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              )}
              title={`다시 실행 (Ctrl+Y) - ${redoCount}개 다시 실행 가능`}
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
            disabled={!isDirty || isSaving}
            aria-label={isSaving ? '저장 중' : '작업 저장'}
            className="px-2 sm:px-3"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="w-4 h-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline ml-1">
              {isSaving ? '저장 중...' : '저장'}
            </span>
          </Button>

          {/* Sprint 32+: 협업 버튼 */}
          {activeSessionId ? (
            // 협업 중: 연결 상태 + 초대 버튼
            <div className="flex items-center gap-2">
              <ConnectionIndicator
                sessionId={activeSessionId}
                isConnected={collab?.isConnected ?? false}
                participantCount={(collab?.remoteUsers?.size ?? 0) + 1}
                size="sm"
                showLabel
              />
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1 px-2 py-1 bg-accent-50 text-accent-700 rounded-lg hover:bg-accent-100 transition-colors"
                title="초대 공유"
              >
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">
                  {collab?.isConnected ? `${(collab?.remoteUsers?.size ?? 0) + 1}명` : '대기'}
                </span>
              </button>
            </div>
          ) : (
            // 협업 없음: 협업 시작 버튼
            <button
              onClick={handleStartCollaboration}
              disabled={isStartingCollab}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
              title="협업 시작하기"
              aria-label="협업 세션 시작"
            >
              {isStartingCollab ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Users className="w-4 h-4" aria-hidden="true" />
              )}
              <span className="text-xs font-medium hidden sm:inline">
                {isStartingCollab ? '시작 중...' : '협업'}
              </span>
            </button>
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
          onMouseMove={handleMouseMove}
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
                className="relative bg-white rounded-2xl shadow-lg overflow-hidden"
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
                        left: transform.x - transform.width / 2,
                        top: transform.y - transform.height / 2,
                        width: transform.width,
                        height: transform.height,
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
                          fontSize: style.fontSize,
                          fontWeight: style.fontWeight === 'bold' ? 700 : 400,
                          fontStyle: style.fontStyle === 'italic' ? 'italic' : 'normal',
                          textAlign: style.align || 'center',
                          lineHeight: style.lineHeight || 1.2,
                          letterSpacing: style.letterSpacing,
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
          assetContext={editorAssetContext}
          onAssetError={handleAssetError}
        />
      </div>

      {/* 내보내기 모달 - 확장된 옵션. 공유 Modal 프리미티브(포커스 트랩/Escape/백드롭/스크롤 잠금 내장) */}
      <Modal
        isOpen={showExportModal}
        onClose={closeExportModal}
        ariaLabel="이미지 내보내기"
        className="max-w-md rounded-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 rounded-xl">
            <ImageIcon className="w-6 h-6 text-primary-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              이미지 내보내기
            </h3>
            <p className="text-sm text-gray-500">포맷과 해상도를 선택하세요</p>
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
      </Modal>

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
            // 전체 초기화 — 템플릿을 다시 로드해 처음 상태로 (M6)
            const initialConfig = initialTemplateConfigRef.current
            if (!initialConfig) return
            if (window.confirm('작업 내용을 모두 지우고 처음 상태로 되돌릴까요?')) {
              loadTemplate(initialConfig)
              setTitle(initialTitleRef.current)
              titleRef.current = initialTitleRef.current
              safeRemoveAutoSaveData(autoSaveKey)
              setLastAutoSave(null)
              toast.success('처음 상태로 되돌렸어요')
            }
          },
        })}
      />

      {/* 협업 확장: 참여자 아바타 (왼쪽 하단 가로 정렬) */}
      {activeSessionId && collab && (
        <div className="fixed bottom-4 left-4 z-30">
          <ParticipantAvatars
            sessionId={activeSessionId}
            user={collab.localUser}
            remoteUsers={collab.remoteUsers}
            isHost={isHost}
            myZone={collab.myZone}
            maxVisible={6}
          />
        </div>
      )}

      {/* 협업 확장: 영역 선택 — 선택/닫기 후 칩으로 접히고, 칩 클릭으로 재오픈 */}
      {activeSessionId && collab?.isConnected && (
        <div className="fixed top-20 right-4 z-30">
          {showZoneSelector ? (
            <ZoneSelector
              onZoneSelect={() => setShowZoneSelector(false)}
              onClose={() => setShowZoneSelector(false)}
            />
          ) : (
            <button
              onClick={() => setShowZoneSelector(true)}
              aria-label={`현재 영역: ${collab.myZone ?? '자유'}. 편집 영역 선택 열기`}
              className="px-3 py-1.5 bg-white rounded-full shadow-md border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none transition-colors"
            >
              영역: {collab.myZone ?? '자유'}
            </button>
          )}
        </div>
      )}

      {/* 협업 확장: 연결 끊김 배너 */}
      <ConnectionBanner
        sessionId={activeSessionId || null}
        isConnected={collab?.isConnected ?? false}
        onReconnect={() => {
          if (activeSessionId && collab?.localUser) {
            collab.connect(activeSessionId, collab.localUser)
          }
        }}
      />

      {/* 협업 확장: 초대 공유 모달 */}
      <InviteShareModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteCode={collabSession?.inviteCode || activeSessionId?.slice(-6).toUpperCase() || 'DEMO'}
        sessionId={activeSessionId || ''}
        maxParticipants={collabSession?.maxParticipants || 2}
        currentParticipants={(collab?.remoteUsers?.size ?? 0) + 1}
      />
    </div>
  )
}
