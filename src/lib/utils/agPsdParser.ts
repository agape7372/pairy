/**
 * ag-psd 기반 PSD 파서
 *
 * @description
 * ag-psd 라이브러리를 사용하여 PSD 파일을 파싱하고
 * 실제 레이어 이미지를 캔버스로 렌더링합니다.
 *
 * @features
 * - 전체 PSD 합성 이미지 추출
 * - 개별 레이어 이미지 추출 (canvas)
 * - 레이어 위치/크기 정보
 * - 텍스트 레이어 내용 추출
 */

import { readPsd, type Psd, type Layer } from 'ag-psd'

// ============================================
// 타입 정의
// ============================================

/** 파싱된 레이어 정보 */
export interface ParsedLayer {
  id: string
  name: string
  type: 'image' | 'text' | 'group' | 'adjustment'
  /** 레이어 위치 (문서 기준) */
  bounds: {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
  }
  /** 레이어 이미지 (Data URL) */
  imageUrl?: string
  /** 텍스트 레이어 내용 */
  text?: {
    content: string
    fontSize?: number
    color?: string
  }
  /** 불투명도 (0-1) */
  opacity: number
  /** 가시성 */
  visible: boolean
  /** 자식 레이어 (그룹) */
  children?: ParsedLayer[]
  /** 원본 레이어 참조 */
  _original?: Layer
}

/** 파싱 결과 */
export interface ParsedPSD {
  /** 문서 크기 */
  width: number
  height: number
  /** 합성된 전체 이미지 (Data URL) */
  compositeImage?: string
  /** 모든 레이어 (평면화) */
  layers: ParsedLayer[]
  /** 레이어 트리 */
  layerTree: ParsedLayer[]
  /** 원본 PSD 객체 */
  _psd: Psd
}

/** 파싱 옵션 */
export interface AgPsdParseOptions {
  /** 레이어 이미지 추출 여부 (기본: true) */
  extractLayerImages?: boolean
  /** 합성 이미지 추출 여부 (기본: true) */
  extractComposite?: boolean
  /** 최대 이미지 크기 (리사이징) */
  maxImageSize?: number
  /** 진행 콜백 */
  onProgress?: (progress: number, message: string) => void
}

// ============================================
// 유틸리티
// ============================================

let layerIdCounter = 0

function generateLayerId(): string {
  return `layer_${Date.now()}_${++layerIdCounter}`
}

/** Canvas를 Data URL로 변환 */
function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  maxSize?: number
): string {
  if (!maxSize || (canvas.width <= maxSize && canvas.height <= maxSize)) {
    return canvas.toDataURL('image/png')
  }

  // 리사이징
  const scale = Math.min(maxSize / canvas.width, maxSize / canvas.height)
  const targetWidth = Math.round(canvas.width * scale)
  const targetHeight = Math.round(canvas.height * scale)

  const resizedCanvas = document.createElement('canvas')
  resizedCanvas.width = targetWidth
  resizedCanvas.height = targetHeight

  const ctx = resizedCanvas.getContext('2d')
  if (!ctx) return canvas.toDataURL('image/png')

  ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight)
  return resizedCanvas.toDataURL('image/png')
}

/** 레이어 타입 판별 */
function determineLayerType(layer: Layer): ParsedLayer['type'] {
  if (layer.children && layer.children.length > 0) {
    return 'group'
  }
  if (layer.text) {
    return 'text'
  }
  if (layer.adjustment) {
    return 'adjustment'
  }
  return 'image'
}

/** RGBA 색상을 hex로 변환 */
function rgbaToHex(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r)
  const g = Math.round(color.g)
  const b = Math.round(color.b)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// ============================================
// 레이어 파싱
// ============================================

function parseLayer(
  layer: Layer,
  options: AgPsdParseOptions
): ParsedLayer {
  const type = determineLayerType(layer)

  const left = layer.left ?? 0
  const top = layer.top ?? 0
  const right = layer.right ?? 0
  const bottom = layer.bottom ?? 0

  const parsed: ParsedLayer = {
    id: generateLayerId(),
    name: layer.name ?? 'Unnamed Layer',
    type,
    bounds: {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
    },
    opacity: (layer.opacity ?? 255) / 255,
    visible: !layer.hidden,
    _original: layer,
  }

  // 이미지 추출
  if (options.extractLayerImages && layer.canvas && type === 'image') {
    parsed.imageUrl = canvasToDataUrl(layer.canvas, options.maxImageSize)
  }

  // 텍스트 추출
  if (layer.text) {
    const textData = layer.text
    let color: string | undefined

    // 텍스트 스타일에서 색상 추출
    if (textData.style?.fillColor) {
      const fillColor = textData.style.fillColor as { r: number; g: number; b: number }
      if ('r' in fillColor) {
        color = rgbaToHex(fillColor)
      }
    }

    parsed.text = {
      content: textData.text,
      fontSize: textData.style?.fontSize,
      color,
    }
  }

  // 자식 레이어 (그룹)
  if (layer.children && layer.children.length > 0) {
    parsed.children = layer.children.map((child) => parseLayer(child, options))
  }

  return parsed
}

/** 레이어 트리를 평면화 */
function flattenLayers(layers: ParsedLayer[]): ParsedLayer[] {
  const result: ParsedLayer[] = []

  function traverse(layerList: ParsedLayer[]) {
    for (const layer of layerList) {
      result.push(layer)
      if (layer.children) {
        traverse(layer.children)
      }
    }
  }

  traverse(layers)
  return result
}

// ============================================
// 메인 파싱 함수
// ============================================

/**
 * PSD 파일 파싱
 */
export async function parseAgPsd(
  file: File,
  options: AgPsdParseOptions = {}
): Promise<ParsedPSD> {
  const defaultOptions: Required<AgPsdParseOptions> = {
    extractLayerImages: true,
    extractComposite: true,
    maxImageSize: 2048,
    onProgress: () => {},
  }

  const opts = { ...defaultOptions, ...options }

  opts.onProgress(10, 'PSD 파일 읽는 중...')

  // ArrayBuffer로 읽기
  const buffer = await file.arrayBuffer()

  opts.onProgress(30, 'PSD 구조 분석 중...')

  // PSD 파싱
  const psd = readPsd(buffer)

  opts.onProgress(50, '레이어 추출 중...')

  // 레이어 트리 파싱
  const layerTree: ParsedLayer[] = (psd.children ?? []).map((layer) =>
    parseLayer(layer, opts)
  )

  // 평면화된 레이어 목록
  const layers = flattenLayers(layerTree)

  opts.onProgress(80, '이미지 처리 중...')

  // 합성 이미지 추출
  let compositeImage: string | undefined
  if (opts.extractComposite && psd.canvas) {
    compositeImage = canvasToDataUrl(psd.canvas, opts.maxImageSize)
  }

  opts.onProgress(100, '완료!')

  return {
    width: psd.width,
    height: psd.height,
    compositeImage,
    layers,
    layerTree,
    _psd: psd,
  }
}

// ============================================
// 템플릿 변환
// ============================================

/** 슬롯 데이터 */
export interface TemplateSlot {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  imageUrl?: string
}

/** 필드 데이터 */
export interface TemplateField {
  id: string
  slotId: string
  label: string
  type: 'text' | 'color'
  x: number
  y: number
  width: number
  height: number
  defaultValue?: string
}

/**
 * 파싱된 PSD를 템플릿 데이터로 변환
 *
 * @param parsedPsd 파싱된 PSD
 * @param selectedLayerIds 선택된 레이어 ID 목록
 */
export function convertToTemplate(
  parsedPsd: ParsedPSD,
  selectedLayerIds: string[]
): {
  documentSize: { width: number; height: number }
  compositeImage?: string
  slots: TemplateSlot[]
  fields: TemplateField[]
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
} {
  const selectedLayers = parsedPsd.layers.filter(
    (l) => selectedLayerIds.includes(l.id) && l.visible
  )

  // 캐릭터 마커 찾기 (A, B, C 등 단일 문자)
  const characterMarkers = selectedLayers.filter(
    (l) => /^[A-Z]$/.test(l.name.trim())
  )

  const slots: TemplateSlot[] = []
  const fields: TemplateField[] = []

  const docWidth = parsedPsd.width
  const docHeight = parsedPsd.height
  const midX = docWidth / 2

  if (characterMarkers.length >= 2) {
    // 캐릭터 마커 기반 슬롯 생성
    characterMarkers.forEach((marker, index) => {
      const isLeft = marker.bounds.left < midX
      const slotId = `slot_${index + 1}`

      // 해당 영역의 레이어들로 바운딩 박스 계산
      const areaLayers = selectedLayers.filter((l) => {
        const centerX = l.bounds.left + l.bounds.width / 2
        return isLeft ? centerX < midX : centerX >= midX
      })

      let minX = docWidth, minY = docHeight, maxX = 0, maxY = 0
      areaLayers.forEach((l) => {
        minX = Math.min(minX, l.bounds.left)
        minY = Math.min(minY, l.bounds.top)
        maxX = Math.max(maxX, l.bounds.right)
        maxY = Math.max(maxY, l.bounds.bottom)
      })

      slots.push({
        id: slotId,
        label: `캐릭터 ${marker.name}`,
        x: minX,
        y: minY,
        width: Math.max(maxX - minX, 100),
        height: Math.max(maxY - minY, 100),
        imageUrl: marker.imageUrl,
      })

      // 텍스트 필드 추가
      const textLayers = areaLayers.filter(
        (l) => l.type === 'text' && l.id !== marker.id
      )
      textLayers.forEach((textLayer, fieldIndex) => {
        fields.push({
          id: `field_${slotId}_${fieldIndex + 1}`,
          slotId,
          label: textLayer.name,
          type: 'text',
          x: textLayer.bounds.left,
          y: textLayer.bounds.top,
          width: textLayer.bounds.width,
          height: textLayer.bounds.height,
          defaultValue: textLayer.text?.content,
        })
      })
    })
  } else {
    // 기본 2슬롯 생성
    slots.push({
      id: 'slot_1',
      label: '캐릭터 A',
      x: docWidth * 0.05,
      y: docHeight * 0.1,
      width: docWidth * 0.4,
      height: docHeight * 0.8,
    })
    slots.push({
      id: 'slot_2',
      label: '캐릭터 B',
      x: docWidth * 0.55,
      y: docHeight * 0.1,
      width: docWidth * 0.4,
      height: docHeight * 0.8,
    })

    // 텍스트 필드 좌우 분배
    const textLayers = selectedLayers.filter((l) => l.type === 'text')
    textLayers.forEach((textLayer, index) => {
      const isLeft = textLayer.bounds.left + textLayer.bounds.width / 2 < midX
      const slotId = isLeft ? 'slot_1' : 'slot_2'

      fields.push({
        id: `field_${index + 1}`,
        slotId,
        label: textLayer.name,
        type: 'text',
        x: textLayer.bounds.left,
        y: textLayer.bounds.top,
        width: textLayer.bounds.width,
        height: textLayer.bounds.height,
        defaultValue: textLayer.text?.content,
      })
    })
  }

  // 모든 레이어 정보 (렌더링용)
  const allLayers = parsedPsd.layers
    .filter((l) => l.type === 'image' || l.type === 'text')
    .map((l) => ({
      id: l.id,
      name: l.name,
      imageUrl: l.imageUrl,
      x: l.bounds.left,
      y: l.bounds.top,
      width: l.bounds.width,
      height: l.bounds.height,
      visible: l.visible,
    }))

  return {
    documentSize: { width: docWidth, height: docHeight },
    compositeImage: parsedPsd.compositeImage,
    slots,
    fields,
    allLayers,
  }
}
