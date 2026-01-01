'use client'

/**
 * 텍스트 필드 렌더러
 * 변경 이유: TemplateRenderer.tsx에서 분리하여 단일 책임 원칙 준수
 * Sprint 30: 인라인 편집 기능 추가
 */

import { Group, Rect, Text } from 'react-konva'
import { resolveColor } from '@/lib/utils/canvasUtils'
import type { TextField, ColorData } from '@/types/template'

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
  const { transform, style, effects, defaultValue, placeholder, background } = field
  const displayText = value || defaultValue || placeholder || ''
  const isPlaceholder = !value && !defaultValue

  const fillColor = resolveColor(style.color, colors)

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

      {/* 텍스트 */}
      <Text
        x={transform.x - transform.width / 2}
        y={transform.y - transform.height / 2}
        width={transform.width}
        height={transform.height}
        rotation={transform.rotation || 0}
        text={transformedText}
        fontFamily={style.fontFamily}
        fontSize={style.fontSize}
        fontStyle={
          // fontWeight 'bold'/'normal' 문자열 처리 및 NaN 방지
          (style.fontWeight === 'bold' ||
           (style.fontWeight && !isNaN(Number(style.fontWeight)) && Number(style.fontWeight) >= 600)
            ? 'bold ' : '') +
          (style.fontStyle === 'italic' ? 'italic' : '')
        }
        fill={fillColor}
        align={style.align || 'center'}
        verticalAlign={style.verticalAlign || 'middle'}
        lineHeight={style.lineHeight || 1.2}
        letterSpacing={style.letterSpacing || 0}
        textDecoration={style.textDecoration === 'underline' ? 'underline' : style.textDecoration === 'line-through' ? 'line-through' : undefined}
        opacity={isPlaceholder ? 0.5 : 1}
        {...finalShadowProps}
        {...strokeProps}
      />

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
