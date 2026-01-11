'use client'

/**
 * PSD 파일 업로드 컴포넌트
 *
 * @description
 * 포토샵(PSD) 파일을 드래그앤드롭 또는 클릭으로 업로드하고
 * 레이어를 분석하여 에디터 슬롯으로 변환합니다.
 *
 * @features
 * - 드래그앤드롭 지원 (시각적 피드백)
 * - 파일 유효성 검증
 * - 파싱 진행률 표시
 * - 레이어 프리뷰 및 선택
 * - 에러 처리 및 복구
 */

import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileImage,
  Sparkles,
  X,
  Check,
  AlertCircle,
  Loader2,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Type,
  Folder,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button, useToast } from '@/components/ui'
import type {
  ExtractedLayer,
  ParseProgress,
  PSDParseResult,
  LayerMappingSuggestion,
} from '@/types/psd'
import {
  parsePSDFile,
  formatFileSize,
  generateMappingSuggestions,
  convertToTemplateData,
  cleanupLayerImages,
} from '@/lib/utils/psdParser'

// ============================================
// 타입 정의
// ============================================

interface PSDUploaderProps {
  /** 변환 완료 콜백 */
  onConvert: (data: {
    slots: Array<{
      id: string
      label: string
      x: number
      y: number
      width: number
      height: number
      imageDataUrl?: string
    }>
    fields: Array<{
      id: string
      slotId: string
      label: string
      type: 'text' | 'image' | 'color'
      defaultValue?: string
    }>
  }) => void
  /** 비활성화 여부 */
  disabled?: boolean
}

type UploadState = 'idle' | 'dragging' | 'parsing' | 'preview' | 'error'

// ============================================
// 서브 컴포넌트: 레이어 아이템
// ============================================

interface LayerItemProps {
  layer: ExtractedLayer
  mapping?: LayerMappingSuggestion
  allLayers: readonly ExtractedLayer[]
  onToggle?: (layerId: string) => void
  depth?: number
}

function LayerItem({
  layer,
  mapping,
  allLayers,
  onToggle,
  depth = 0,
}: LayerItemProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = layer.children && layer.children.length > 0
  const childLayers = hasChildren
    ? allLayers.filter((l) => layer.children?.includes(l.id))
    : []

  const LayerIcon = useMemo(() => {
    switch (layer.type) {
      case 'group':
        return Folder
      case 'text':
        return Type
      case 'image':
      default:
        return ImageIcon
    }
  }, [layer.type])

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      character: { color: 'bg-primary-100 text-primary-700', label: '캐릭터' },
      info: { color: 'bg-blue-100 text-blue-700', label: '정보' },
      appearance: { color: 'bg-purple-100 text-purple-700', label: '외모' },
      personality: { color: 'bg-amber-100 text-amber-700', label: '성격' },
      relationship: { color: 'bg-rose-100 text-rose-700', label: '관계' },
      extra: { color: 'bg-green-100 text-green-700', label: '기타' },
      meta: { color: 'bg-gray-100 text-gray-600', label: '메타' },
      unknown: { color: 'bg-gray-100 text-gray-400', label: '미분류' },
    }
    return badges[category] || badges.unknown
  }

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors',
          'hover:bg-gray-50',
          mapping?.selected && 'bg-primary-50'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* 확장/축소 버튼 */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 text-gray-400 hover:text-gray-600"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* 선택 체크박스 */}
        {mapping && (
          <button
            onClick={() => onToggle?.(layer.id)}
            className={cn(
              'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
              mapping.selected
                ? 'bg-primary-400 border-primary-400'
                : 'border-gray-300 hover:border-primary-300'
            )}
          >
            {mapping.selected && <Check className="w-3 h-3 text-white" />}
          </button>
        )}

        {/* 레이어 아이콘 */}
        <LayerIcon
          className={cn(
            'w-4 h-4 flex-shrink-0',
            layer.visibility === 'hidden' ? 'text-gray-300' : 'text-gray-500'
          )}
        />

        {/* 레이어 이름 */}
        <span
          className={cn(
            'flex-1 text-sm truncate',
            layer.visibility === 'hidden' ? 'text-gray-400' : 'text-gray-700'
          )}
        >
          {layer.name}
        </span>

        {/* 카테고리 배지 */}
        {mapping && mapping.suggestedCategory !== 'unknown' && (
          <span
            className={cn(
              'px-1.5 py-0.5 text-[10px] font-medium rounded',
              getCategoryBadge(mapping.suggestedCategory).color
            )}
          >
            {getCategoryBadge(mapping.suggestedCategory).label}
          </span>
        )}

        {/* 가시성 표시 */}
        {layer.visibility === 'hidden' && (
          <EyeOff className="w-3.5 h-3.5 text-gray-300" />
        )}
      </div>

      {/* 자식 레이어 */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {childLayers.map((child) => (
              <LayerItem
                key={child.id}
                layer={child}
                mapping={undefined}
                allLayers={allLayers}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// 메인 컴포넌트
// ============================================

export default function PSDUploader({
  onConvert,
  disabled = false,
}: PSDUploaderProps) {
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 상태
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState<ParseProgress | null>(null)
  const [parseResult, setParseResult] = useState<PSDParseResult | null>(null)
  const [mappings, setMappings] = useState<LayerMappingSuggestion[]>([])
  const [errorMessage, setErrorMessage] = useState<string>('')

  // 메모리 정리
  useEffect(() => {
    return () => {
      if (parseResult?.layers) {
        cleanupLayerImages(parseResult.layers)
      }
    }
  }, [parseResult])

  // 파일 처리 (다른 핸들러보다 먼저 선언)
  const processFile = useCallback(async (file: File) => {
    setUploadState('parsing')
    setProgress({
      status: 'validating',
      percentage: 0,
      message: '파일 검증 중...',
    })
    setErrorMessage('')

    try {
      const result = await parsePSDFile(file, {
        extractImages: true,
        extractText: true,
        includeHidden: false,
        includeEmpty: false,
        maxImageSize: 512, // 프리뷰용으로 작게
        onProgress: setProgress,
      })

      if (result.success && result.layers) {
        setParseResult(result)
        const suggestions = generateMappingSuggestions(result.layers)
        setMappings(suggestions)
        setUploadState('preview')

        toast.success(
          `${result.layers.length}개 레이어를 발견했습니다! (${result.parseTime}ms)`
        )
      } else {
        setErrorMessage(result.error?.message || '파싱에 실패했습니다.')
        setUploadState('error')
        toast.error(result.error?.message || '파싱 실패')
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setErrorMessage(message)
      setUploadState('error')
      toast.error(message)
    }
  }, [toast])

  // 드래그 이벤트 핸들러
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled || uploadState === 'parsing') return
      setUploadState('dragging')
    },
    [disabled, uploadState]
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled || uploadState === 'parsing') return
      setUploadState('idle')
    },
    [disabled, uploadState]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled || uploadState === 'parsing') return

      const files = e.dataTransfer.files
      if (files.length > 0) {
        processFile(files[0])
      } else {
        setUploadState('idle')
      }
    },
    [disabled, uploadState, processFile]
  )

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        processFile(files[0])
      }
      // 같은 파일 다시 선택 가능하도록 초기화
      e.target.value = ''
    },
    [processFile]
  )

  // 레이어 선택 토글
  const toggleMapping = useCallback((layerId: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.layerId === layerId ? { ...m, selected: !m.selected } : m
      )
    )
  }, [])

  // 전체 선택/해제
  const toggleAllMappings = useCallback((selected: boolean) => {
    setMappings((prev) => prev.map((m) => ({ ...m, selected })))
  }, [])

  // 변환 실행
  const handleConvert = useCallback(() => {
    if (!parseResult?.layers || !parseResult.document) return

    const { slots, fields } = convertToTemplateData(
      parseResult.layers,
      mappings,
      { width: parseResult.document.width, height: parseResult.document.height }
    )

    onConvert({ slots, fields })

    // 정리
    cleanupLayerImages(parseResult.layers)
    setParseResult(null)
    setMappings([])
    setUploadState('idle')

    toast.success('슬롯이 생성되었습니다!')
  }, [parseResult, mappings, onConvert, toast])

  // 초기화
  const handleReset = useCallback(() => {
    if (parseResult?.layers) {
      cleanupLayerImages(parseResult.layers)
    }
    setParseResult(null)
    setMappings([])
    setUploadState('idle')
    setErrorMessage('')
    setProgress(null)
  }, [parseResult])

  // 선택된 매핑 수
  const selectedCount = useMemo(
    () => mappings.filter((m) => m.selected).length,
    [mappings]
  )

  // 최상위 레이어만 (그룹 자식 제외)
  const topLevelLayers = useMemo(() => {
    if (!parseResult?.layers) return []
    return parseResult.layers.filter((l) => l.parentId === null)
  }, [parseResult])

  return (
    <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-[20px] border border-accent-200 p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-accent-500" />
        <h2 className="text-sm font-semibold text-gray-900">
          디자인 파일 업로드
        </h2>
        {uploadState === 'preview' && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
            분석 완료
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4">
        포토샵(PSD) 파일을 업로드하면 레이어를 자동으로 인식해 슬롯으로
        변환해드려요.
      </p>

      <AnimatePresence mode="wait">
        {/* Idle / Dragging 상태 */}
        {(uploadState === 'idle' || uploadState === 'dragging') && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !disabled && fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer',
                uploadState === 'dragging'
                  ? 'border-primary-400 bg-primary-50 scale-[1.02]'
                  : 'border-accent-300 bg-white/50 hover:border-primary-300 hover:bg-white/80',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <motion.div
                animate={
                  uploadState === 'dragging' ? { scale: 1.1, y: -5 } : {}
                }
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <FileImage
                  className={cn(
                    'w-10 h-10 mx-auto mb-3',
                    uploadState === 'dragging'
                      ? 'text-primary-500'
                      : 'text-accent-400'
                  )}
                />
              </motion.div>
              <p className="text-sm text-gray-600 mb-1">
                {uploadState === 'dragging'
                  ? '여기에 놓으세요!'
                  : '클릭하거나 파일을 드래그하세요'}
              </p>
              <p className="text-xs text-gray-400">PSD 파일 (최대 50MB)</p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".psd"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
              />
            </div>
          </motion.div>
        )}

        {/* 파싱 중 상태 */}
        {uploadState === 'parsing' && progress && (
          <motion.div
            key="parsing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl p-6 text-center"
          >
            <Loader2 className="w-10 h-10 text-primary-400 mx-auto mb-4 animate-spin" />
            <p className="text-sm font-medium text-gray-700 mb-2">
              {progress.message}
            </p>
            {progress.currentLayer && (
              <p className="text-xs text-gray-400 mb-3 truncate">
                {progress.currentLayer}
              </p>
            )}

            {/* 진행률 바 */}
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-400 to-accent-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{progress.percentage}%</p>
          </motion.div>
        )}

        {/* 에러 상태 */}
        {uploadState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl p-6 text-center"
          >
            <AlertCircle className="w-10 h-10 text-error mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-700 mb-2">
              파일 처리 중 오류 발생
            </p>
            <p className="text-xs text-gray-500 mb-4">{errorMessage}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="mx-auto"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              다시 시도
            </Button>
          </motion.div>
        )}

        {/* 프리뷰 상태 */}
        {uploadState === 'preview' && parseResult && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl overflow-hidden"
          >
            {/* 파일 정보 */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileImage className="w-8 h-8 text-primary-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
                      {parseResult.fileInfo.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(parseResult.fileInfo.size)} •{' '}
                      {parseResult.document?.width}×{parseResult.document?.height}px
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 레이어 선택 */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500">
                  레이어 선택 ({selectedCount}/{mappings.length})
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleAllMappings(true)}
                    className="px-2 py-1 text-[10px] text-primary-600 hover:bg-primary-50 rounded"
                  >
                    전체 선택
                  </button>
                  <button
                    onClick={() => toggleAllMappings(false)}
                    className="px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-50 rounded"
                  >
                    전체 해제
                  </button>
                </div>
              </div>

              {/* 레이어 목록 */}
              <div className="max-h-[240px] overflow-y-auto border border-gray-100 rounded-lg">
                {topLevelLayers.map((layer) => (
                  <LayerItem
                    key={layer.id}
                    layer={layer}
                    mapping={mappings.find((m) => m.layerId === layer.id)}
                    allLayers={parseResult.layers || []}
                    onToggle={toggleMapping}
                  />
                ))}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleConvert}
                disabled={selectedCount === 0}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-1" />
                {selectedCount}개 슬롯 생성
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLIP 파일 지원 예정 안내 */}
      {uploadState === 'idle' && (
        <p className="text-[10px] text-gray-400 mt-3 text-center">
          CLIP 파일 지원 예정
        </p>
      )}
    </div>
  )
}
