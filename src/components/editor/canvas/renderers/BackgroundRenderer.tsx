'use client'

/**
 * 배경 레이어 렌더러
 * 변경 이유: TemplateRenderer.tsx에서 분리하여 단일 책임 원칙 준수
 */

import { Rect, Image } from 'react-konva'
import { useImage } from '@/hooks/useKonvaImage'
import { resolveColor, calculateImageFit } from '@/lib/utils/canvasUtils'
import type { BackgroundLayer, ColorData } from '@/types/template'

interface BackgroundRendererProps {
  config: BackgroundLayer
  canvasWidth: number
  canvasHeight: number
  colors: ColorData
}

export function BackgroundRenderer({
  config,
  canvasWidth,
  canvasHeight,
  colors,
}: BackgroundRendererProps) {
  const [backgroundImage] = useImage(config.type === 'image' ? config.imageUrl : null)

  if (config.type === 'image' && backgroundImage) {
    // 이미지 피팅 계산
    const fit = config.imageFit || 'cover'
    const dims = calculateImageFit(
      backgroundImage.width,
      backgroundImage.height,
      canvasWidth,
      canvasHeight,
      fit === 'tile' ? 'fill' : fit
    )

    return (
      <Image
        image={backgroundImage}
        x={dims.x}
        y={dims.y}
        width={dims.width}
        height={dims.height}
      />
    )
  }

  if (config.type === 'solid') {
    const fillColor = config.color ? resolveColor(config.color, colors) : '#FFFFFF'
    return (
      <Rect
        x={0}
        y={0}
        width={canvasWidth}
        height={canvasHeight}
        fill={fillColor}
      />
    )
  }

  if (config.type === 'gradient' && config.gradient) {
    const { gradient } = config
    const gradientColors = gradient.colors.map((c) => ({
      offset: c.offset,
      color: resolveColor(c.color, colors),
    }))

    if (gradient.type === 'linear') {
      const angle = gradient.angle || 0
      const radians = (angle * Math.PI) / 180
      const x1 = canvasWidth / 2 - (Math.cos(radians) * canvasWidth) / 2
      const y1 = canvasHeight / 2 - (Math.sin(radians) * canvasHeight) / 2
      const x2 = canvasWidth / 2 + (Math.cos(radians) * canvasWidth) / 2
      const y2 = canvasHeight / 2 + (Math.sin(radians) * canvasHeight) / 2

      return (
        <Rect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          fillLinearGradientStartPoint={{ x: x1, y: y1 }}
          fillLinearGradientEndPoint={{ x: x2, y: y2 }}
          fillLinearGradientColorStops={gradientColors.flatMap((c) => [c.offset, c.color])}
        />
      )
    }

    if (gradient.type === 'radial') {
      const centerX = (gradient.centerX ?? 0.5) * canvasWidth
      const centerY = (gradient.centerY ?? 0.5) * canvasHeight

      return (
        <Rect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          fillRadialGradientStartPoint={{ x: centerX, y: centerY }}
          fillRadialGradientEndPoint={{ x: centerX, y: centerY }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={Math.max(canvasWidth, canvasHeight) / 2}
          fillRadialGradientColorStops={gradientColors.flatMap((c) => [c.offset, c.color])}
        />
      )
    }
  }

  // 기본 흰색 배경
  return (
    <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#FFFFFF" />
  )
}
