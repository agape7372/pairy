'use client'

/**
 * PSD 파일 업로드 컴포넌트 (v2 - ag-psd 기반)
 *
 * @description
 * ag-psd 라이브러리를 사용하여 PSD 파일을 파싱하고
 * 실제 레이어 이미지를 react-konva로 렌더링합니다.
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
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button, useToast } from '@/components/ui'
import { parseAgPsd, convertToTemplate, type ParsedPSD, type ParsedLayer } from '@/lib/utils/agPsdParser'
import { PSDPreview } from './PSDCanvas'

// ============================================
// 타입 정의
// ============================================

interface PSDUploaderProps {
  /** 변환 완료 콜백 */
  onConvert: (data: {
    documentSize: { width: number; height: number }
    compositeImage?: string
    slots: Array<{
      id: string
      label: string
      x: number
      y: number
      width: number
      height: number
    }>
    fields: Array<{
      id: string
      slotId: string
      label: string
      type: 'text' | 'color'
      x: number
      y: number
      width: number
      height: number
      defaultValue?: string
    }>
    allLayers: Array<{
      id: string
      name: string
      imageUrl?: string
      x: number
      y: number
      width: number
      height: number
      visible: boolean
    }>
  }) => void
  /** 비활성화 여부 */
  disabled?: boolean
}

type UploadState = 'idle' | 'dragging' | 'parsing' | 'preview' | 'error'

// ============================================
// 레이어 아이템 컴포넌트
// ============================================

interface LayerItemProps {
  layer: ParsedLayer
  selectedIds: Set<string>
  onToggle: (id: string) => void
  depth?: number
}

function LayerItem({ layer, selectedIds, onToggle, depth = 0 }: LayerItemProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = layer.children && layer.children.length > 0
  const isSelected = selectedIds.has(layer.id)

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

  // 그룹은 선택 불가
  const canSelect = layer.type !== 'group' && layer.type !== 'adjustment'

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors',
          'hover:bg-gray-50',
          isSelected && 'bg-primary-50'
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
        {canSelect && (
          <button
            onClick={() => onToggle(layer.id)}
            className={cn(
              'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
              isSelected
                ? 'bg-primary-400 border-primary-400'
                : 'border-gray-300 hover:border-primary-300'
            )}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </button>
        )}

        {/* 레이어 아이콘 */}
        <LayerIcon
          className={cn(
            'w-4 h-4 flex-shrink-0',
            !layer.visible ? 'text-gray-300' : 'text-gray-500'
          )}
        />

        {/* 레이어 이름 */}
        <span
          className={cn(
            'flex-1 text-sm truncate',
            !layer.visible ? 'text-gray-400' : 'text-gray-700'
          )}
        >
          {layer.name}
        </span>

        {/* 타입 배지 */}
        {layer.type === 'text' && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
            텍스트
          </span>
        )}

        {/* 가시성 표시 */}
        {!layer.visible && <EyeOff className="w-3.5 h-3.5 text-gray-300" />}
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
            {layer.children!.map((child) => (
              <LayerItem
                key={child.id}
                layer={child}
                selectedIds={selectedIds}
                onToggle={onToggle}
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
  const [progress, setProgress] = useState({ value: 0, message: '' })
  const [parsedPsd, setParsedPsd] = useState<ParsedPSD | null>(null)
  const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(new Set())
  const [errorMessage, setErrorMessage] = useState('')

  // 선택 가능한 레이어만 필터링
  const selectableLayers = useMemo(() => {
    if (!parsedPsd) return []
    return parsedPsd.layers.filter(
      (l) => l.type !== 'group' && l.type !== 'adjustment' && l.visible
    )
  }, [parsedPsd])

  // 초기 선택 (visible 레이어 자동 선택)
  useEffect(() => {
    if (parsedPsd) {
      // 비동기로 처리하여 렌더 중 setState 방지
      const timeoutId = setTimeout(() => {
        const initialSelected = new Set(selectableLayers.map((l) => l.id))
        setSelectedLayerIds(initialSelected)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [parsedPsd, selectableLayers])

  // 파일 처리
  const processFile = useCallback(async (file: File) => {
    setUploadState('parsing')
    setProgress({ value: 0, message: '파일 검증 중...' })
    setErrorMessage('')

    // 확장자 검증
    const ext = file.name.toLowerCase().split('.').pop()
    if (ext !== 'psd') {
      setErrorMessage('PSD 파일만 지원합니다.')
      setUploadState('error')
      return
    }

    // 크기 검증 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('파일이 너무 큽니다. 최대 50MB까지 지원합니다.')
      setUploadState('error')
      return
    }

    try {
      const result = await parseAgPsd(file, {
        extractLayerImages: true,
        extractComposite: true,
        maxImageSize: 2048,
        onProgress: (value, message) => {
          setProgress({ value, message })
        },
      })

      setParsedPsd(result)
      setUploadState('preview')
      toast.success(`${result.layers.length}개 레이어를 발견했습니다!`)
    } catch (err) {
      console.error('PSD parsing error:', err)
      const message = err instanceof Error ? err.message : '파싱에 실패했습니다.'
      setErrorMessage(message)
      setUploadState('error')
      toast.error(message)
    }
  }, [toast])

  // 드래그 이벤트
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

  // 파일 선택
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        processFile(files[0])
      }
      e.target.value = ''
    },
    [processFile]
  )

  // 레이어 선택 토글
  const toggleLayer = useCallback((id: string) => {
    setSelectedLayerIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // 전체 선택/해제
  const selectAll = useCallback(() => {
    setSelectedLayerIds(new Set(selectableLayers.map((l) => l.id)))
  }, [selectableLayers])

  const deselectAll = useCallback(() => {
    setSelectedLayerIds(new Set())
  }, [])

  // 변환 실행
  const handleConvert = useCallback(() => {
    if (!parsedPsd) return

    const result = convertToTemplate(parsedPsd, Array.from(selectedLayerIds))
    onConvert(result)

    // 정리
    setParsedPsd(null)
    setSelectedLayerIds(new Set())
    setUploadState('idle')
    toast.success('템플릿이 생성되었습니다!')
  }, [parsedPsd, selectedLayerIds, onConvert, toast])

  // 초기화
  const handleReset = useCallback(() => {
    setParsedPsd(null)
    setSelectedLayerIds(new Set())
    setUploadState('idle')
    setErrorMessage('')
    setProgress({ value: 0, message: '' })
  }, [])

  const selectedCount = selectedLayerIds.size

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
        포토샵(PSD) 파일을 업로드하면 레이어를 자동으로 인식해 템플릿으로 변환해드려요.
      </p>

      <AnimatePresence mode="wait">
        {/* Idle / Dragging */}
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
                animate={uploadState === 'dragging' ? { scale: 1.1, y: -5 } : {}}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <FileImage
                  className={cn(
                    'w-10 h-10 mx-auto mb-3',
                    uploadState === 'dragging' ? 'text-primary-500' : 'text-accent-400'
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

        {/* 파싱 중 */}
        {uploadState === 'parsing' && (
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

            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-400 to-accent-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress.value}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{progress.value}%</p>
          </motion.div>
        )}

        {/* 에러 */}
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
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-1" />
              다시 시도
            </Button>
          </motion.div>
        )}

        {/* 프리뷰 */}
        {uploadState === 'preview' && parsedPsd && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl overflow-hidden"
          >
            {/* PSD 이미지 프리뷰 */}
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">
                    {parsedPsd.width}×{parsedPsd.height}px
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 실제 PSD 이미지! */}
              <div className="rounded-lg overflow-hidden bg-white border border-gray-200">
                <PSDPreview
                  compositeImage={parsedPsd.compositeImage}
                  width={parsedPsd.width}
                  height={parsedPsd.height}
                  maxWidth={360}
                  className="mx-auto"
                />
              </div>
            </div>

            {/* 레이어 선택 */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500">
                  레이어 선택 ({selectedCount}/{selectableLayers.length})
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={selectAll}
                    className="px-2 py-1 text-[10px] text-primary-600 hover:bg-primary-50 rounded"
                  >
                    전체 선택
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-50 rounded"
                  >
                    전체 해제
                  </button>
                </div>
              </div>

              {/* 레이어 트리 */}
              <div className="max-h-[200px] overflow-y-auto border border-gray-100 rounded-lg">
                {parsedPsd.layerTree.map((layer) => (
                  <LayerItem
                    key={layer.id}
                    layer={layer}
                    selectedIds={selectedLayerIds}
                    onToggle={toggleLayer}
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
                템플릿 생성
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLIP 파일 지원 예정 */}
      {uploadState === 'idle' && (
        <p className="text-[10px] text-gray-400 mt-3 text-center">
          CLIP 파일 지원 예정
        </p>
      )}
    </div>
  )
}
