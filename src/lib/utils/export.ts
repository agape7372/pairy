/**
 * 이미지 내보내기 유틸리티
 */

export type ExportFormat = 'png' | 'jpg' | 'webp'
export type ExportQuality = 'low' | 'medium' | 'high' | 'max'

interface ExportOptions {
  format?: ExportFormat
  quality?: ExportQuality
  scale?: number // 1x, 2x 등
  backgroundColor?: string
  watermark?: {
    text: string
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    opacity?: number
    fontSize?: number
    color?: string
  }
}

const qualityMap: Record<ExportQuality, number> = {
  low: 0.6,
  medium: 0.8,
  high: 0.92,
  max: 1.0,
}

/**
 * Canvas 요소를 이미지로 내보내기
 */
export async function exportCanvasToImage(
  canvas: HTMLCanvasElement,
  options: ExportOptions = {}
): Promise<Blob> {
  const {
    format = 'png',
    quality = 'high',
    scale = 1,
    backgroundColor,
    watermark,
  } = options

  // 스케일 적용을 위한 새 캔버스
  const exportCanvas = document.createElement('canvas')
  const ctx = exportCanvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  exportCanvas.width = canvas.width * scale
  exportCanvas.height = canvas.height * scale

  // 배경색 채우기 (JPG의 경우 필수)
  if (backgroundColor || format === 'jpg') {
    ctx.fillStyle = backgroundColor || '#FFFFFF'
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
  }

  // 원본 캔버스 그리기
  ctx.scale(scale, scale)
  ctx.drawImage(canvas, 0, 0)

  // 워터마크 추가
  if (watermark) {
    ctx.scale(1 / scale, 1 / scale) // 스케일 리셋
    addWatermark(ctx, exportCanvas.width, exportCanvas.height, watermark)
  }

  // Blob 생성
  return new Promise((resolve, reject) => {
    exportCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      },
      getMimeType(format),
      qualityMap[quality]
    )
  })
}

/**
 * DOM 요소를 이미지로 캡처
 */
export async function captureElementAsImage(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<Blob> {
  // html2canvas 동적 import (용량 절약)
  const html2canvas = (await import('html2canvas')).default

  const canvas = await html2canvas(element, {
    scale: options.scale || 2,
    backgroundColor: options.backgroundColor || null,
    useCORS: true,
    allowTaint: true,
  })

  return exportCanvasToImage(canvas, options)
}

/**
 * 워터마크 추가
 */
function addWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermark: NonNullable<ExportOptions['watermark']>
): void {
  const {
    text,
    position,
    opacity = 0.5,
    fontSize = 16,
    color = '#000000',
  } = watermark

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.font = `${fontSize}px sans-serif`
  ctx.fillStyle = color

  const textWidth = ctx.measureText(text).width
  const padding = 20

  let x: number
  let y: number

  switch (position) {
    case 'top-left':
      x = padding
      y = padding + fontSize
      break
    case 'top-right':
      x = width - textWidth - padding
      y = padding + fontSize
      break
    case 'bottom-left':
      x = padding
      y = height - padding
      break
    case 'bottom-right':
      x = width - textWidth - padding
      y = height - padding
      break
    case 'center':
      x = (width - textWidth) / 2
      y = (height + fontSize) / 2
      break
  }

  ctx.fillText(text, x, y)
  ctx.restore()
}

/**
 * MIME 타입 가져오기
 */
function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'jpg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    default:
      return 'image/png'
  }
}

/**
 * 이미지 다운로드
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 파일명 생성
 */
export function generateFilename(
  title: string,
  format: ExportFormat,
  scale?: number
): string {
  const sanitized = title.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim() || 'pairy'
  const timestamp = new Date().toISOString().slice(0, 10)
  const scaleStr = scale && scale > 1 ? `@${scale}x` : ''
  return `${sanitized}_${timestamp}${scaleStr}.${format}`
}

/**
 * 내보내기 훅
 */
export function useExport() {
  const exportImage = async (
    element: HTMLElement,
    title: string,
    options: ExportOptions = {}
  ): Promise<void> => {
    const blob = await captureElementAsImage(element, options)
    const filename = generateFilename(title, options.format || 'png', options.scale)
    downloadBlob(blob, filename)
  }

  return { exportImage }
}
