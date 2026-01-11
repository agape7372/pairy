/**
 * PSD 파일 파싱 유틸리티
 *
 * @description
 * @webtoon/psd 라이브러리를 사용하여 PSD 파일에서 레이어 정보를 추출합니다.
 * 추출된 정보는 에디터 슬롯/필드로 변환할 수 있습니다.
 *
 * @features
 * - 파일 유효성 검증 (매직 바이트, 크기)
 * - 레이어 계층 구조 추출
 * - 이미지/텍스트 데이터 추출
 * - 레이어명 기반 슬롯 매핑 제안
 * - 메모리 관리 (Blob URL 정리)
 */

import Psd from '@webtoon/psd'
import type {
  ExtractedLayer,
  LayerBounds,
  LayerType,
  LayerVisibility,
  ParseError,
  ParseOptions,
  ParseProgress,
  PSDParseResult,
  DocumentInfo,
  LayerMappingSuggestion,
  PairTemplateCategory,
} from '@/types/psd'
import {
  MAX_FILE_SIZE,
  PSD_MAGIC_BYTES,
  DEFAULT_LAYER_MAPPING_RULES,
} from '@/types/psd'

// ============================================
// 내부 유틸리티
// ============================================

/** 고유 ID 생성 */
function generateId(): string {
  return `layer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/** 파일 크기 포맷팅 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** 에러 생성 헬퍼 */
function createError(
  code: ParseError['code'],
  message: string,
  details?: string
): ParseError {
  return { code, message, details }
}

// ============================================
// 파일 유효성 검증
// ============================================

/** PSD 매직 바이트 검증 */
async function validateMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 4).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  return bytes.every((byte, index) => byte === PSD_MAGIC_BYTES[index])
}

/** 파일 유효성 검증 */
export async function validatePSDFile(file: File): Promise<ParseError | null> {
  // 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return createError(
      'FILE_TOO_LARGE',
      `파일이 너무 큽니다. 최대 ${formatFileSize(MAX_FILE_SIZE)}까지 지원합니다.`,
      `File size: ${formatFileSize(file.size)}`
    )
  }

  // 확장자 검증
  const extension = file.name.toLowerCase().split('.').pop()
  if (extension !== 'psd') {
    return createError(
      'INVALID_FILE_TYPE',
      'PSD 파일만 지원합니다.',
      `Got extension: .${extension}`
    )
  }

  // 매직 바이트 검증
  try {
    const isValid = await validateMagicBytes(file)
    if (!isValid) {
      return createError(
        'CORRUPTED_FILE',
        '올바른 PSD 파일이 아닙니다.',
        'Magic bytes mismatch'
      )
    }
  } catch {
    return createError(
      'CORRUPTED_FILE',
      '파일을 읽을 수 없습니다.',
      'Failed to read magic bytes'
    )
  }

  // WebAssembly 지원 확인
  if (typeof WebAssembly === 'undefined') {
    return createError(
      'BROWSER_NOT_SUPPORTED',
      '이 브라우저에서는 PSD 파싱을 지원하지 않습니다.',
      'WebAssembly not supported'
    )
  }

  return null
}

// ============================================
// 레이어 타입 판별
// ============================================

/** 레이어 타입 판별 */
function determineLayerType(layer: Psd['children'][number]): LayerType {
  if (layer.type === 'Group') return 'group'

  // @webtoon/psd에서는 텍스트 레이어 정보가 제한적
  // 레이어 이름으로 추론하거나 추가 분석 필요
  const name = layer.name.toLowerCase()

  // 텍스트 힌트 키워드
  const textHints = ['text', 'txt', '텍스트', '이름', '나이', '설명']
  if (textHints.some((hint) => name.includes(hint))) {
    return 'text'
  }

  // 조정 레이어 키워드
  const adjustmentHints = ['adjustment', 'levels', 'curves', 'hue', 'saturation']
  if (adjustmentHints.some((hint) => name.includes(hint))) {
    return 'adjustment'
  }

  // 기본: 이미지 레이어
  return 'image'
}

// ============================================
// 이미지 데이터 추출
// ============================================

/** 레이어 이미지를 Data URL로 변환 */
async function extractLayerImage(
  layer: Psd['children'][number],
  maxSize: number
): Promise<string | undefined> {
  try {
    // 그룹 레이어는 이미지 없음
    if (layer.type === 'Group') return undefined

    // 레이어 크기 확인
    const width = layer.width
    const height = layer.height

    if (width <= 0 || height <= 0) return undefined

    // 컴포지트 이미지 추출
    const imageData = await layer.composite()

    // Canvas에 렌더링
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    // 리사이징 필요 여부 확인
    let targetWidth = width
    let targetHeight = height

    if (width > maxSize || height > maxSize) {
      const scale = Math.min(maxSize / width, maxSize / height)
      targetWidth = Math.round(width * scale)
      targetHeight = Math.round(height * scale)
    }

    canvas.width = targetWidth
    canvas.height = targetHeight

    // ImageData 생성 및 그리기
    const rawImageData = new ImageData(
      new Uint8ClampedArray(imageData),
      width,
      height
    )

    // 임시 캔버스에 원본 크기로 그린 후 리사이징
    if (targetWidth !== width || targetHeight !== height) {
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return undefined

      tempCtx.putImageData(rawImageData, 0, 0)
      ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight)
    } else {
      ctx.putImageData(rawImageData, 0, 0)
    }

    return canvas.toDataURL('image/png')
  } catch {
    console.warn(`Failed to extract image from layer: ${layer.name}`)
    return undefined
  }
}

// ============================================
// 레이어 추출
// ============================================

/** 레이어 순회 및 추출 */
async function extractLayers(
  layers: Psd['children'],
  options: ParseOptions,
  parentId: string | null = null,
  depth: number = 0,
  onProgress?: (current: number, total: number, name: string) => void
): Promise<ExtractedLayer[]> {
  const result: ExtractedLayer[] = []
  const total = layers.length

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i]
    onProgress?.(i + 1, total, layer.name)

    // 숨김 레이어 필터링
    const isHidden = layer.opacity === 0 // @webtoon/psd는 hidden 속성이 다름
    if (!options.includeHidden && isHidden) continue

    // 그룹 여부 확인 및 크기 정보 추출
    const isGroup = layer.type === 'Group'
    const layerWidth = isGroup ? 0 : (layer as { width: number }).width
    const layerHeight = isGroup ? 0 : (layer as { height: number }).height
    const layerLeft = isGroup ? 0 : (layer as { left: number }).left
    const layerTop = isGroup ? 0 : (layer as { top: number }).top

    // 빈 레이어 필터링 (그룹은 제외)
    const isEmpty = layerWidth <= 0 || layerHeight <= 0
    if (!options.includeEmpty && isEmpty && !isGroup) continue

    const layerId = generateId()
    const layerType = determineLayerType(layer)

    const bounds: LayerBounds = {
      x: layerLeft,
      y: layerTop,
      width: layerWidth,
      height: layerHeight,
    }

    const visibility: LayerVisibility = isHidden ? 'hidden' : 'visible'

    // 기본 레이어 정보
    const extractedLayer: ExtractedLayer = {
      id: layerId,
      name: layer.name,
      type: layerType,
      bounds,
      visibility,
      opacity: layer.opacity / 255,
      parentId,
      depth,
      order: i,
    }

    // 이미지 추출
    if (options.extractImages && layerType === 'image') {
      const imageDataUrl = await extractLayerImage(
        layer,
        options.maxImageSize ?? 1024
      )
      if (imageDataUrl) {
        (extractedLayer as { imageDataUrl: string }).imageDataUrl = imageDataUrl
      }
    }

    // 그룹 레이어: 자식 재귀 추출
    if (layer.type === 'Group' && layer.children) {
      const children = await extractLayers(
        layer.children,
        options,
        layerId,
        depth + 1,
        onProgress
      )

      ;(extractedLayer as unknown as { children: readonly string[] }).children = children.map(
        (c) => c.id
      )
      result.push(extractedLayer, ...children)
    } else {
      result.push(extractedLayer)
    }
  }

  return result
}

// ============================================
// 메인 파싱 함수
// ============================================

/** PSD 파일 파싱 */
export async function parsePSDFile(
  file: File,
  options: ParseOptions = {}
): Promise<PSDParseResult> {
  const startTime = performance.now()
  const defaultOptions: Required<ParseOptions> = {
    extractImages: true,
    extractText: true,
    includeHidden: false,
    includeEmpty: false,
    maxImageSize: 1024,
    onProgress: () => {},
  }

  const opts = { ...defaultOptions, ...options }

  // 진행 상황 업데이트 헬퍼
  const updateProgress = (progress: ParseProgress) => {
    opts.onProgress(progress)
  }

  try {
    // 1. 유효성 검증
    updateProgress({
      status: 'validating',
      percentage: 5,
      message: '파일 검증 중...',
    })

    const validationError = await validatePSDFile(file)
    if (validationError) {
      return {
        success: false,
        fileInfo: {
          name: file.name,
          size: file.size,
          format: 'psd',
        },
        error: validationError,
      }
    }

    // 2. 파일 읽기
    updateProgress({
      status: 'parsing',
      percentage: 15,
      message: 'PSD 파일 분석 중...',
    })

    const arrayBuffer = await file.arrayBuffer()

    // 3. PSD 파싱
    updateProgress({
      status: 'parsing',
      percentage: 30,
      message: '레이어 구조 분석 중...',
    })

    const psd = Psd.parse(arrayBuffer)

    // 4. 문서 정보 추출
    const document: DocumentInfo = {
      width: psd.width,
      height: psd.height,
      bitDepth: psd.depth as 8 | 16 | 32,
      colorMode: psd.colorMode === 3 ? 'RGB' : 'Other',
    }

    // 5. 레이어 추출
    updateProgress({
      status: 'extracting',
      percentage: 50,
      message: '레이어 추출 중...',
    })

    const extractionProgress = 50
    const layers = await extractLayers(
      psd.children,
      opts,
      null,
      0,
      (current, total, name) => {
        const layerProgress = (current / total) * 40
        updateProgress({
          status: 'extracting',
          percentage: Math.round(extractionProgress + layerProgress),
          message: '레이어 추출 중...',
          currentLayer: name,
        })
      }
    )

    // 6. 완료
    const parseTime = Math.round(performance.now() - startTime)

    updateProgress({
      status: 'complete',
      percentage: 100,
      message: '파싱 완료!',
    })

    return {
      success: true,
      fileInfo: {
        name: file.name,
        size: file.size,
        format: 'psd',
      },
      document,
      layers,
      parseTime,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      fileInfo: {
        name: file.name,
        size: file.size,
        format: 'psd',
      },
      error: createError(
        'PARSE_ERROR',
        'PSD 파일 파싱 중 오류가 발생했습니다.',
        errorMessage
      ),
      parseTime: Math.round(performance.now() - startTime),
    }
  }
}

// ============================================
// 레이어 매핑 제안
// ============================================

/** 레이어명 기반 카테고리 추론 */
function inferCategory(layerName: string): {
  category: PairTemplateCategory
  outputType: 'slot' | 'textField' | 'colorField'
  confidence: number
} {
  const normalizedName = layerName.trim()

  for (const rule of DEFAULT_LAYER_MAPPING_RULES) {
    const pattern = rule.pattern
    const matches =
      typeof pattern === 'string'
        ? normalizedName.toLowerCase().includes(pattern.toLowerCase())
        : pattern.test(normalizedName)

    if (matches) {
      return {
        category: rule.category,
        outputType: rule.outputType,
        confidence: 0.8,
      }
    }
  }

  return {
    category: 'unknown',
    outputType: 'textField',
    confidence: 0.3,
  }
}

/** 레이어 매핑 제안 생성 */
export function generateMappingSuggestions(
  layers: readonly ExtractedLayer[]
): LayerMappingSuggestion[] {
  return layers
    .filter((layer) => layer.type !== 'group' && layer.type !== 'adjustment')
    .map((layer) => {
      const inference = inferCategory(layer.name)

      return {
        layerId: layer.id,
        layerName: layer.name,
        suggestedCategory: inference.category,
        suggestedOutputType: inference.outputType,
        confidence: inference.confidence,
        selected: inference.confidence >= 0.5,
      }
    })
}

// ============================================
// 메모리 정리
// ============================================

/** Data URL 메모리 정리 (Blob URL인 경우) */
export function cleanupLayerImages(layers: readonly ExtractedLayer[]): void {
  layers.forEach((layer) => {
    if (layer.imageDataUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(layer.imageDataUrl)
    }
  })
}

// ============================================
// 슬롯/필드 변환
// ============================================

/** 레이어를 템플릿 슬롯 형식으로 변환 */
export interface ConvertedSlot {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  imageDataUrl?: string
}

/** 레이어를 템플릿 필드 형식으로 변환 */
export interface ConvertedField {
  id: string
  slotId: string
  label: string
  type: 'text' | 'image' | 'color'
  defaultValue?: string
}

/** 레이어 매핑을 슬롯/필드로 변환 */
export function convertToTemplateData(
  layers: readonly ExtractedLayer[],
  mappings: readonly LayerMappingSuggestion[],
  documentSize: { width: number; height: number }
): {
  slots: ConvertedSlot[]
  fields: ConvertedField[]
} {
  const slots: ConvertedSlot[] = []
  const fields: ConvertedField[] = []

  const selectedMappings = mappings.filter((m) => m.selected)

  // 캐릭터 카테고리 레이어 → 슬롯
  const characterMappings = selectedMappings.filter(
    (m) =>
      m.suggestedCategory === 'character' && m.suggestedOutputType === 'slot'
  )

  characterMappings.forEach((mapping, index) => {
    const layer = layers.find((l) => l.id === mapping.layerId)
    if (!layer) return

    const slotId = `slot_${index + 1}`

    slots.push({
      id: slotId,
      label: mapping.layerName || `슬롯 ${index + 1}`,
      x: layer.bounds.x,
      y: layer.bounds.y,
      width: layer.bounds.width,
      height: layer.bounds.height,
      imageDataUrl: layer.imageDataUrl,
    })

    // 해당 슬롯에 속하는 필드 찾기
    const relatedMappings = selectedMappings.filter(
      (m) =>
        m.suggestedCategory !== 'character' &&
        m.suggestedOutputType !== 'slot' &&
        m.layerId !== mapping.layerId
    )

    // 슬롯당 필드 분배 (간단한 로직)
    const fieldsPerSlot = Math.ceil(relatedMappings.length / (characterMappings.length || 1))
    const startIdx = index * fieldsPerSlot
    const endIdx = Math.min(startIdx + fieldsPerSlot, relatedMappings.length)

    for (let i = startIdx; i < endIdx; i++) {
      const fieldMapping = relatedMappings[i]
      if (!fieldMapping) continue

      const fieldType =
        fieldMapping.suggestedOutputType === 'colorField' ? 'color' : 'text'

      fields.push({
        id: `field_${slotId}_${i - startIdx + 1}`,
        slotId,
        label: fieldMapping.layerName,
        type: fieldType,
        defaultValue:
          layers.find((l) => l.id === fieldMapping.layerId)?.textContent,
      })
    }
  })

  // 슬롯이 없는 경우 기본 슬롯 생성
  if (slots.length === 0) {
    slots.push({
      id: 'slot_1',
      label: '슬롯 1',
      x: documentSize.width * 0.1,
      y: documentSize.height * 0.1,
      width: documentSize.width * 0.3,
      height: documentSize.height * 0.6,
    })

    // 모든 선택된 필드를 기본 슬롯에 추가
    selectedMappings
      .filter((m) => m.suggestedOutputType !== 'slot')
      .forEach((mapping, index) => {
        const fieldType =
          mapping.suggestedOutputType === 'colorField' ? 'color' : 'text'

        fields.push({
          id: `field_slot_1_${index + 1}`,
          slotId: 'slot_1',
          label: mapping.layerName,
          type: fieldType,
        })
      })
  }

  return { slots, fields }
}
