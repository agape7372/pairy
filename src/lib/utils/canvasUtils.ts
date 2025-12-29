/**
 * 캔버스 렌더링 유틸리티 함수
 * 변경 이유: TemplateRenderer.tsx에서 분리하여 재사용성과 테스트 용이성 향상
 */

import type { ColorData, ColorReference, ShapeMask } from '@/types/template'

// ============================================
// 색상 해석
// ============================================

/** ColorReference 키 목록 */
const COLOR_REF_KEYS: ColorReference[] = [
  'primaryColor',
  'secondaryColor',
  'accentColor',
  'textColor',
]

/**
 * 색상 참조를 실제 색상값으로 변환
 * ColorReference 키 또는 직접 색상값 모두 지원
 */
export function resolveColor(
  colorOrRef: string | ColorReference | undefined,
  colors: ColorData
): string {
  if (!colorOrRef) return '#000000'

  // ColorReference 키인지 확인
  if (COLOR_REF_KEYS.includes(colorOrRef as ColorReference)) {
    return colors[colorOrRef as ColorReference] || '#000000'
  }

  // 직접 색상값
  return colorOrRef
}

// ============================================
// 이미지 피팅 계산
// ============================================

export interface ImageFitResult {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 이미지 피팅 계산 (cover, contain, fill)
 * @param imgWidth - 원본 이미지 너비
 * @param imgHeight - 원본 이미지 높이
 * @param slotWidth - 슬롯 너비
 * @param slotHeight - 슬롯 높이
 * @param fit - 피팅 모드
 * @param positionX - X 위치 조정 (-1 ~ 1, 0 = 중앙)
 * @param positionY - Y 위치 조정 (-1 ~ 1, 0 = 중앙)
 */
export function calculateImageFit(
  imgWidth: number,
  imgHeight: number,
  slotWidth: number,
  slotHeight: number,
  fit: 'cover' | 'contain' | 'fill' = 'cover',
  positionX: number = 0,
  positionY: number = 0
): ImageFitResult {
  if (fit === 'fill') {
    return { x: 0, y: 0, width: slotWidth, height: slotHeight }
  }

  // Division by zero 방지
  if (imgHeight === 0 || slotHeight === 0) {
    return { x: 0, y: 0, width: slotWidth, height: slotHeight }
  }

  const imgRatio = imgWidth / imgHeight
  const slotRatio = slotWidth / slotHeight

  let drawWidth: number
  let drawHeight: number

  if (fit === 'cover') {
    if (imgRatio > slotRatio) {
      drawHeight = slotHeight
      drawWidth = drawHeight * imgRatio
    } else {
      drawWidth = slotWidth
      drawHeight = drawWidth / imgRatio
    }
  } else {
    // contain
    if (imgRatio > slotRatio) {
      drawWidth = slotWidth
      drawHeight = drawWidth / imgRatio
    } else {
      drawHeight = slotHeight
      drawWidth = drawHeight * imgRatio
    }
  }

  // 위치 조정 (positionX/Y: -1 ~ 1, 0 = 중앙)
  const baseX = (slotWidth - drawWidth) / 2
  const baseY = (slotHeight - drawHeight) / 2
  const offsetX = positionX * (drawWidth - slotWidth) / 2
  const offsetY = positionY * (drawHeight - slotHeight) / 2

  return {
    x: baseX + offsetX,
    y: baseY + offsetY,
    width: drawWidth,
    height: drawHeight,
  }
}

// ============================================
// Shape 마스크 그리기
// ============================================

/**
 * Shape 마스크 경로 그리기
 * Canvas 2D Context에 마스크 모양을 그림
 */
export function drawShapeMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mask: ShapeMask
): void {
  const { shape, cornerRadius = 0, points: starPoints = 5, innerRadius = 0.5 } = mask

  ctx.beginPath()

  switch (shape) {
    case 'rect':
      ctx.rect(0, 0, width, height)
      break

    case 'circle': {
      const radius = Math.min(width, height) / 2
      ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2)
      break
    }

    case 'ellipse': {
      ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
      break
    }

    case 'roundedRect': {
      const r = Math.min(cornerRadius, width / 2, height / 2)
      ctx.moveTo(r, 0)
      ctx.lineTo(width - r, 0)
      ctx.arcTo(width, 0, width, r, r)
      ctx.lineTo(width, height - r)
      ctx.arcTo(width, height, width - r, height, r)
      ctx.lineTo(r, height)
      ctx.arcTo(0, height, 0, height - r, r)
      ctx.lineTo(0, r)
      ctx.arcTo(0, 0, r, 0, r)
      break
    }

    case 'heart': {
      const w = width
      const h = height
      ctx.moveTo(w / 2, h * 0.85)
      ctx.bezierCurveTo(w * 0.1, h * 0.55, 0, h * 0.25, w / 2, h * 0.15)
      ctx.bezierCurveTo(w, h * 0.25, w * 0.9, h * 0.55, w / 2, h * 0.85)
      break
    }

    case 'star': {
      const cx = width / 2
      const cy = height / 2
      const outerR = Math.min(width, height) / 2
      const innerR = outerR * innerRadius
      const numPoints = starPoints

      for (let i = 0; i < numPoints * 2; i++) {
        const angle = (i * Math.PI) / numPoints - Math.PI / 2
        const r = i % 2 === 0 ? outerR : innerR
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      break
    }

    case 'hexagon': {
      const cx = width / 2
      const cy = height / 2
      const r = Math.min(width, height) / 2
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      break
    }

    case 'diamond': {
      ctx.moveTo(width / 2, 0)
      ctx.lineTo(width, height / 2)
      ctx.lineTo(width / 2, height)
      ctx.lineTo(0, height / 2)
      break
    }

    case 'triangle': {
      ctx.moveTo(width / 2, 0)
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      break
    }

    default:
      ctx.rect(0, 0, width, height)
  }

  ctx.closePath()
}
