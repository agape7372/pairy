'use client'

/**
 * 동적 도형 렌더러
 * 변경 이유: TemplateRenderer.tsx에서 분리하여 단일 책임 원칙 준수
 */

import { Rect, Circle, Ellipse, Line, Path, Arc } from 'react-konva'
import { resolveColor } from '@/lib/utils/canvasUtils'
import type { DynamicShape, ColorData } from '@/types/template'

interface DynamicShapeRendererProps {
  shape: DynamicShape
  colors: ColorData
}

export function DynamicShapeRenderer({
  shape,
  colors,
}: DynamicShapeRendererProps) {
  const { transform, fill, stroke, opacity = 1, shadow, blendMode } = shape
  const fillColor = fill ? resolveColor(fill, colors) : undefined
  const strokeColor = stroke ? resolveColor(stroke.color, colors) : undefined

  const commonProps = {
    x: transform.x,
    y: transform.y,
    rotation: transform.rotation || 0,
    scaleX: transform.scaleX ?? 1,
    scaleY: transform.scaleY ?? 1,
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth: stroke?.width,
    dash: stroke?.dashArray,
    lineCap: stroke?.lineCap,
    lineJoin: stroke?.lineJoin,
    opacity,
    globalCompositeOperation: blendMode,
    ...(shadow
      ? {
          shadowColor: shadow.color,
          shadowBlur: shadow.blur,
          shadowOffsetX: shadow.offsetX,
          shadowOffsetY: shadow.offsetY,
          shadowEnabled: true,
        }
      : {}),
  }

  switch (shape.type) {
    case 'rect':
      return (
        <Rect
          {...commonProps}
          width={transform.width}
          height={transform.height}
          cornerRadius={shape.cornerRadius || 0}
        />
      )
    case 'circle':
      return (
        <Circle
          {...commonProps}
          radius={Math.min(transform.width, transform.height) / 2}
        />
      )
    case 'ellipse':
      return (
        <Ellipse
          {...commonProps}
          radiusX={transform.width / 2}
          radiusY={transform.height / 2}
        />
      )
    case 'line':
      return (
        <Line
          {...commonProps}
          points={[0, 0, transform.width, transform.height]}
        />
      )
    case 'path':
      return shape.pathData ? (
        <Path
          {...commonProps}
          data={shape.pathData}
          scaleX={(transform.scaleX ?? 1) * (transform.width / 100)}
          scaleY={(transform.scaleY ?? 1) * (transform.height / 100)}
        />
      ) : null
    case 'polygon':
      return shape.points ? (
        <Line
          {...commonProps}
          points={shape.points}
          closed={true}
        />
      ) : null
    case 'arc':
      return shape.arc ? (
        <Arc
          {...commonProps}
          innerRadius={shape.arc.innerRadius}
          outerRadius={shape.arc.outerRadius}
          angle={(shape.arc.endAngle - shape.arc.startAngle)}
          rotation={(transform.rotation || 0) + shape.arc.startAngle}
          clockwise={shape.arc.clockwise ?? true}
        />
      ) : null
    default:
      return null
  }
}
