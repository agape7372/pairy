'use client'

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Rect, Text, Image, Group, Line, Circle, Ellipse, Path } from 'react-konva'
import type Konva from 'konva'
import type {
  TemplateConfig,
  FormData,
  ImageData,
  ColorData,
  ColorReference,
  ImageSlot,
  TextField,
  DynamicShape,
  BackgroundLayer,
  OverlayImage,
} from '@/types/template'

// ============================================
// Props 타입
// ============================================

interface TemplateRendererProps {
  config: TemplateConfig
  formData: FormData
  images: ImageData
  colors: ColorData
  onSlotClick?: (slotId: string) => void
  onTextClick?: (textId: string) => void
  selectedSlotId?: string | null
  selectedTextId?: string | null
  editable?: boolean
}

export interface TemplateRendererRef {
  exportToImage: (scale?: number) => Promise<string | null>
  getStage: () => Konva.Stage | null
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 색상 참조를 실제 색상값으로 변환
 */
function resolveColor(
  colorOrRef: string | ColorReference,
  colors: ColorData
): string {
  if (typeof colorOrRef === 'string') {
    // ColorReference 키인지 확인
    if (colorOrRef in colors) {
      return colors[colorOrRef as ColorReference] || colorOrRef
    }
    return colorOrRef
  }
  return colors[colorOrRef] || '#000000'
}

/**
 * 이미지 로드 훅
 */
function useImage(src: string | null | undefined): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!src) {
      setImage(null)
      return
    }

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = src
    img.onload = () => setImage(img)
    img.onerror = () => setImage(null)

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])

  return image
}

// ============================================
// 서브 컴포넌트
// ============================================

/**
 * 배경 레이어 렌더러
 */
function BackgroundRenderer({
  config,
  canvasWidth,
  canvasHeight,
  colors,
}: {
  config: BackgroundLayer
  canvasWidth: number
  canvasHeight: number
  colors: ColorData
}) {
  const backgroundImage = useImage(config.type === 'image' ? config.imageUrl : null)

  if (config.type === 'image' && backgroundImage) {
    return (
      <Image
        image={backgroundImage}
        width={canvasWidth}
        height={canvasHeight}
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

    // Linear gradient
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
          fillLinearGradientColorStops={
            gradientColors.flatMap((c) => [c.offset, c.color])
          }
        />
      )
    }

    // Radial gradient
    if (gradient.type === 'radial') {
      return (
        <Rect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          fillRadialGradientStartPoint={{ x: canvasWidth / 2, y: canvasHeight / 2 }}
          fillRadialGradientEndPoint={{ x: canvasWidth / 2, y: canvasHeight / 2 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={Math.max(canvasWidth, canvasHeight) / 2}
          fillRadialGradientColorStops={
            gradientColors.flatMap((c) => [c.offset, c.color])
          }
        />
      )
    }
  }

  // 기본 흰색 배경
  return (
    <Rect
      x={0}
      y={0}
      width={canvasWidth}
      height={canvasHeight}
      fill="#FFFFFF"
    />
  )
}

/**
 * 이미지 슬롯 렌더러 (마스킹 지원)
 */
function ImageSlotRenderer({
  slot,
  imageSrc,
  colors,
  isSelected,
  onClick,
}: {
  slot: ImageSlot
  imageSrc: string | null
  colors: ColorData
  isSelected: boolean
  onClick?: () => void
}) {
  const userImage = useImage(imageSrc)
  const placeholderImage = useImage(slot.placeholder)
  const groupRef = useRef<Konva.Group>(null)

  const { transform, mask, border } = slot
  const displayImage = userImage || placeholderImage

  // 마스크 클리핑 함수
  const clipFunc = useCallback(
    (ctx: Konva.Context) => {
      const { width, height } = transform

      if (!mask || mask.type === 'shape') {
        const shape = mask?.shape || 'rect'
        const cornerRadius = mask?.cornerRadius || 0

        ctx.beginPath()
        if (shape === 'circle') {
          const radius = Math.min(width, height) / 2
          ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2)
        } else if (shape === 'roundedRect' && cornerRadius > 0) {
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
        } else if (shape === 'heart') {
          // 하트 모양
          const w = width
          const h = height
          ctx.moveTo(w / 2, h * 0.85)
          ctx.bezierCurveTo(w * 0.1, h * 0.55, 0, h * 0.25, w / 2, h * 0.1)
          ctx.bezierCurveTo(w, h * 0.25, w * 0.9, h * 0.55, w / 2, h * 0.85)
        } else {
          ctx.rect(0, 0, width, height)
        }
        ctx.closePath()
      }
    },
    [transform.width, transform.height, mask]
  )

  // 이미지를 슬롯에 맞게 조정 (cover 방식)
  const getImageDimensions = useCallback(() => {
    if (!displayImage) return null

    const slotRatio = transform.width / transform.height
    const imgRatio = displayImage.width / displayImage.height

    let drawWidth: number
    let drawHeight: number
    let drawX: number
    let drawY: number

    if (imgRatio > slotRatio) {
      // 이미지가 더 넓음 - 높이 맞춤
      drawHeight = transform.height
      drawWidth = drawHeight * imgRatio
      drawX = (transform.width - drawWidth) / 2
      drawY = 0
    } else {
      // 이미지가 더 좁음 - 너비 맞춤
      drawWidth = transform.width
      drawHeight = drawWidth / imgRatio
      drawX = 0
      drawY = (transform.height - drawHeight) / 2
    }

    return { drawX, drawY, drawWidth, drawHeight }
  }, [displayImage, transform.width, transform.height])

  const imageDims = getImageDimensions()

  return (
    <Group
      ref={groupRef}
      x={transform.x}
      y={transform.y}
      width={transform.width}
      height={transform.height}
      rotation={transform.rotation || 0}
      onClick={onClick}
      onTap={onClick}
    >
      {/* 마스킹된 이미지 */}
      <Group clipFunc={clipFunc}>
        {displayImage && imageDims && (
          <Image
            image={displayImage}
            x={imageDims.drawX}
            y={imageDims.drawY}
            width={imageDims.drawWidth}
            height={imageDims.drawHeight}
          />
        )}
        {!displayImage && (
          <Rect
            width={transform.width}
            height={transform.height}
            fill="#E5E5E5"
          />
        )}
      </Group>

      {/* 테두리 */}
      {border && (
        <Rect
          width={transform.width}
          height={transform.height}
          stroke={resolveColor(border.color, colors)}
          strokeWidth={border.width}
          cornerRadius={mask?.cornerRadius || 0}
        />
      )}

      {/* 선택 표시 */}
      {isSelected && (
        <Rect
          width={transform.width}
          height={transform.height}
          stroke="#3B82F6"
          strokeWidth={3}
          dash={[8, 4]}
          cornerRadius={mask?.cornerRadius || 0}
        />
      )}
    </Group>
  )
}

/**
 * 텍스트 필드 렌더러
 */
function TextFieldRenderer({
  field,
  value,
  colors,
  isSelected,
  onClick,
}: {
  field: TextField
  value: string
  colors: ColorData
  isSelected: boolean
  onClick?: () => void
}) {
  const { transform, style, effects, defaultValue, placeholder } = field
  const displayText = value || defaultValue || placeholder || ''

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

  return (
    <Group onClick={onClick} onTap={onClick}>
      <Text
        x={transform.x - transform.width / 2}
        y={transform.y - transform.height / 2}
        width={transform.width}
        height={transform.height}
        rotation={transform.rotation || 0}
        text={displayText}
        fontFamily={style.fontFamily}
        fontSize={style.fontSize}
        fontStyle={style.fontStyle === 'italic' ? 'italic' : 'normal'}
        fontVariant="normal"
        fill={fillColor}
        align={style.align || 'center'}
        verticalAlign={style.verticalAlign || 'middle'}
        lineHeight={style.lineHeight || 1.2}
        letterSpacing={style.letterSpacing || 0}
        opacity={value ? 1 : 0.5}
        {...shadowProps}
        {...strokeProps}
      />
      {isSelected && (
        <Rect
          x={transform.x - transform.width / 2 - 2}
          y={transform.y - transform.height / 2 - 2}
          width={transform.width + 4}
          height={transform.height + 4}
          stroke="#3B82F6"
          strokeWidth={2}
          dash={[4, 2]}
        />
      )}
    </Group>
  )
}

/**
 * 동적 도형 렌더러
 */
function DynamicShapeRenderer({
  shape,
  colors,
}: {
  shape: DynamicShape
  colors: ColorData
}) {
  const { transform, fill, stroke } = shape
  const fillColor = fill ? resolveColor(fill, colors) : undefined
  const strokeColor = stroke ? resolveColor(stroke.color, colors) : undefined

  const commonProps = {
    x: transform.x,
    y: transform.y,
    rotation: transform.rotation || 0,
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth: stroke?.width,
    dash: stroke?.dashArray,
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
          scaleX={transform.width / 100}
          scaleY={transform.height / 100}
        />
      ) : null
    default:
      return null
  }
}

/**
 * 오버레이 이미지 렌더러
 */
function OverlayImageRenderer({
  overlay,
}: {
  overlay: OverlayImage
}) {
  const image = useImage(overlay.imageUrl)

  if (!image) return null

  return (
    <Image
      image={image}
      x={overlay.transform.x}
      y={overlay.transform.y}
      width={overlay.transform.width}
      height={overlay.transform.height}
      rotation={overlay.transform.rotation || 0}
      opacity={overlay.opacity ?? 1}
    />
  )
}

// ============================================
// 메인 컴포넌트
// ============================================

const TemplateRenderer = forwardRef<TemplateRendererRef, TemplateRendererProps>(
  function TemplateRenderer(
    {
      config,
      formData,
      images,
      colors,
      onSlotClick,
      onTextClick,
      selectedSlotId,
      selectedTextId,
      editable = true,
    },
    ref
  ) {
    const stageRef = useRef<Konva.Stage>(null)
    const { canvas, layers } = config

    // 내보내기 함수
    const exportToImage = useCallback(
      async (scale: number = 2): Promise<string | null> => {
        const stage = stageRef.current
        if (!stage) return null

        return stage.toDataURL({
          pixelRatio: scale,
          mimeType: 'image/png',
        })
      },
      []
    )

    // ref를 통해 메서드 노출
    useImperativeHandle(ref, () => ({
      exportToImage,
      getStage: () => stageRef.current,
    }), [exportToImage])

  return (
    <Stage
      ref={stageRef}
      width={canvas.width}
      height={canvas.height}
      style={{ backgroundColor: canvas.backgroundColor }}
    >
      {/* Layer 1: Background */}
      <Layer>
        <BackgroundRenderer
          config={layers.background}
          canvasWidth={canvas.width}
          canvasHeight={canvas.height}
          colors={colors}
        />
      </Layer>

      {/* Layer 2: Image Slots */}
      <Layer>
        {layers.slots.map((slot) => (
          <ImageSlotRenderer
            key={slot.id}
            slot={slot}
            imageSrc={images[slot.dataKey] || null}
            colors={colors}
            isSelected={selectedSlotId === slot.id}
            onClick={editable ? () => onSlotClick?.(slot.id) : undefined}
          />
        ))}
      </Layer>

      {/* Layer 3: Dynamic Shapes */}
      {layers.dynamicShapes && layers.dynamicShapes.length > 0 && (
        <Layer>
          {layers.dynamicShapes.map((shape) => (
            <DynamicShapeRenderer
              key={shape.id}
              shape={shape}
              colors={colors}
            />
          ))}
        </Layer>
      )}

      {/* Layer 4: Text Fields */}
      <Layer>
        {layers.texts.map((textField) => (
          <TextFieldRenderer
            key={textField.id}
            field={textField}
            value={formData[textField.dataKey] || ''}
            colors={colors}
            isSelected={selectedTextId === textField.id}
            onClick={editable ? () => onTextClick?.(textField.id) : undefined}
          />
        ))}
      </Layer>

      {/* Layer 5: Overlays */}
      {layers.overlays && layers.overlays.length > 0 && (
        <Layer>
          {layers.overlays.map((overlay) => (
            <OverlayImageRenderer key={overlay.id} overlay={overlay} />
          ))}
        </Layer>
      )}
    </Stage>
  )
  }
)

// Export
export default TemplateRenderer
export type { TemplateRendererProps }
export { useImage, resolveColor }
