'use client'

/**
 * 텍스트 필드 렌더러
 * 변경 이유: TemplateRenderer.tsx에서 분리하여 단일 책임 원칙 준수
 * Sprint 30: 인라인 편집 기능 추가
 * Sprint 36: 자동 맞춤 (shrink-to-fit), 그라디언트 텍스트 기능 추가
 */

import { useMemo } from 'react'
import { Group, Rect, Text, TextPath } from 'react-konva'
import { resolveColor } from '@/lib/utils/canvasUtils'
import { calculateFittedFontSize } from '@/lib/utils/textMeasure'
import { generateCurvePath } from '@/lib/utils/curvePath'
import type { TextField, ColorData, TextStyle, TextGradient } from '@/types/template'

/**
 * 그라디언트 설정에서 Konva props로 변환
 *
 * @param gradient - 그라디언트 설정
 * @param width - 텍스트 영역 너비
 * @param height - 텍스트 영역 높이
 * @returns Konva Text 컴포넌트에 적용할 그라디언트 props
 */
function computeGradientProps(
  gradient: TextGradient,
  width: number,
  height: number
): Record<string, unknown> {
  // 색상 정지점을 Konva 형식으로 변환 [offset, color, offset, color, ...]
  const colorStops: (string | number)[] = []
  gradient.stops.forEach((stop) => {
    colorStops.push(stop.offset, stop.color)
  })

  if (gradient.type === 'linear') {
    // 각도를 시작점/끝점으로 변환
    const angleRad = ((gradient.angle ?? 0) * Math.PI) / 180
    const centerX = width / 2
    const centerY = height / 2

    // 대각선 길이의 절반 (최대 거리)
    const maxDist = Math.sqrt(width * width + height * height) / 2

    // 시작점과 끝점 계산
    const startX = centerX - Math.cos(angleRad) * maxDist
    const startY = centerY - Math.sin(angleRad) * maxDist
    const endX = centerX + Math.cos(angleRad) * maxDist
    const endY = centerY + Math.sin(angleRad) * maxDist

    return {
      fillLinearGradientStartPoint: { x: startX, y: startY },
      fillLinearGradientEndPoint: { x: endX, y: endY },
      fillLinearGradientColorStops: colorStops,
    }
  } else {
    // 방사형 그라디언트
    const centerX = (gradient.centerX ?? 0.5) * width
    const centerY = (gradient.centerY ?? 0.5) * height
    const radius = (gradient.radius ?? 0.5) * Math.max(width, height)

    return {
      fillRadialGradientStartPoint: { x: centerX, y: centerY },
      fillRadialGradientEndPoint: { x: centerX, y: centerY },
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndRadius: radius,
      fillRadialGradientColorStops: colorStops,
    }
  }
}

interface TextFieldRendererProps {
  field: TextField
  value: string
  colors: ColorData
  isSelected: boolean
  onClick?: () => void
  onDoubleClick?: () => void // Sprint 30: 인라인 편집 트리거
}

export function TextFieldRenderer({
  field,
  value,
  colors,
  isSelected,
  onClick,
  onDoubleClick,
}: TextFieldRendererProps) {
  const { transform, style, effects, defaultValue, placeholder, background, autoFit, curve } = field
  const displayText = value || defaultValue || placeholder || ''
  const isPlaceholder = !value && !defaultValue

  const fillColor = resolveColor(style.color, colors)

  // 곡선 텍스트 사용 여부
  const useCurvedText = curve && curve.type !== 'none' && curve.strength > 0

  // 곡선 경로 생성
  const curvePath = useMemo(() => {
    if (!useCurvedText || !curve) return ''
    return generateCurvePath(curve, transform.width, transform.height)
  }, [useCurvedText, curve, transform.width, transform.height])

  // Sprint 36: 자동 폰트 크기 계산
  const fittedFontSize = useMemo(() => {
    // autoFit이 없거나 none 모드면 원래 크기 사용
    if (!autoFit || autoFit.mode === 'none') {
      return style.fontSize
    }

    // 텍스트가 없으면 원래 크기 사용
    if (!displayText) {
      return style.fontSize
    }

    // TextStyle 객체 생성 (calculateFittedFontSize 요구사항 충족)
    const textStyle: TextStyle = {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      color: style.color,
      align: style.align,
      verticalAlign: style.verticalAlign,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      textTransform: style.textTransform,
      textDecoration: style.textDecoration,
    }

    return calculateFittedFontSize(
      displayText,
      textStyle,
      transform.width,
      transform.height,
      {
        mode: autoFit.mode,
        minFontSize: autoFit.minFontSize,
        maxFontSize: autoFit.maxFontSize,
        wordBreak: autoFit.wordBreak,
      }
    )
  }, [displayText, style, transform.width, transform.height, autoFit])

  // 그림자 설정
  const shadowProps = effects?.shadow
    ? {
        shadowColor: effects.shadow.color,
        shadowBlur: effects.shadow.blur,
        shadowOffsetX: effects.shadow.offsetX,
        shadowOffsetY: effects.shadow.offsetY,
        shadowEnabled: true,
      }
    : {}

  // 외곽선 설정
  const strokeProps = effects?.stroke
    ? {
        stroke: resolveColor(effects.stroke.color, colors),
        strokeWidth: effects.stroke.width,
      }
    : {}

  // 글로우 효과 (그림자로 구현)
  const glowProps = effects?.glow
    ? {
        shadowColor: resolveColor(effects.glow.color, colors),
        shadowBlur: effects.glow.blur,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowEnabled: true,
      }
    : {}

  // 최종 그림자 props (glow가 shadow를 오버라이드)
  const finalShadowProps = effects?.glow ? glowProps : shadowProps

  // Sprint 36: 그라디언트 props 계산
  const gradientProps = useMemo(() => {
    if (!style.gradient || style.gradient.stops.length < 2) {
      return null
    }
    return computeGradientProps(style.gradient, transform.width, transform.height)
  }, [style.gradient, transform.width, transform.height])

  // 텍스트 변환
  let transformedText = displayText
  if (style.textTransform) {
    switch (style.textTransform) {
      case 'uppercase':
        transformedText = displayText.toUpperCase()
        break
      case 'lowercase':
        transformedText = displayText.toLowerCase()
        break
      case 'capitalize':
        transformedText = displayText.replace(/\b\w/g, (c) => c.toUpperCase())
        break
    }
  }

  return (
    <Group
      onClick={onClick}
      onTap={onClick}
      onDblClick={onDoubleClick}
      onDblTap={onDoubleClick}
    >
      {/* 배경 */}
      {background && (
        <Rect
          x={transform.x - transform.width / 2 - (background.padding || 0)}
          y={transform.y - transform.height / 2 - (background.padding || 0)}
          width={transform.width + (background.padding || 0) * 2}
          height={transform.height + (background.padding || 0) * 2}
          fill={resolveColor(background.color, colors)}
          cornerRadius={background.cornerRadius || 0}
        />
      )}

      {/* 텍스트 (일반 또는 곡선) */}
      {useCurvedText ? (
        // 곡선 텍스트 (TextPath 사용)
        <TextPath
          x={transform.x - transform.width / 2}
          y={transform.y - transform.height / 2}
          data={curvePath}
          text={transformedText}
          fontFamily={style.fontFamily}
          fontSize={fittedFontSize}
          fontStyle={
            (style.fontWeight === 'bold' ||
             (style.fontWeight && !isNaN(Number(style.fontWeight)) && Number(style.fontWeight) >= 600)
              ? 'bold ' : '') +
            (style.fontStyle === 'italic' ? 'italic' : '')
          }
          fill={gradientProps ? undefined : fillColor}
          letterSpacing={style.letterSpacing || 0}
          opacity={isPlaceholder ? 0.5 : 1}
          {...finalShadowProps}
          {...strokeProps}
          {...(gradientProps || {})}
        />
      ) : (
        // 일반 텍스트
        <Text
          x={transform.x - transform.width / 2}
          y={transform.y - transform.height / 2}
          width={transform.width}
          height={transform.height}
          rotation={transform.rotation || 0}
          text={transformedText}
          fontFamily={style.fontFamily}
          fontSize={fittedFontSize}
          fontStyle={
            // fontWeight 'bold'/'normal' 문자열 처리 및 NaN 방지
            (style.fontWeight === 'bold' ||
             (style.fontWeight && !isNaN(Number(style.fontWeight)) && Number(style.fontWeight) >= 600)
              ? 'bold ' : '') +
            (style.fontStyle === 'italic' ? 'italic' : '')
          }
          // 그라디언트가 있으면 fill 대신 그라디언트 사용
          fill={gradientProps ? undefined : fillColor}
          align={style.align || 'center'}
          verticalAlign={style.verticalAlign || 'middle'}
          lineHeight={style.lineHeight || 1.2}
          letterSpacing={style.letterSpacing || 0}
          textDecoration={style.textDecoration === 'underline' ? 'underline' : style.textDecoration === 'line-through' ? 'line-through' : undefined}
          opacity={isPlaceholder ? 0.5 : 1}
          {...finalShadowProps}
          {...strokeProps}
          {...(gradientProps || {})}
        />
      )}

      {/* 선택 표시 */}
      {isSelected && (
        <Rect
          x={transform.x - transform.width / 2 - 4}
          y={transform.y - transform.height / 2 - 4}
          width={transform.width + 8}
          height={transform.height + 8}
          stroke="#3B82F6"
          strokeWidth={2}
          dash={[4, 2]}
          listening={false}
        />
      )}
    </Group>
  )
}
