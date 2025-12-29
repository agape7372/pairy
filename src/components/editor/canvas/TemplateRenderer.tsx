'use client'

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { Stage, Layer, Rect, Text, Image, Group, Line, Circle, Ellipse, Path, Arc, Transformer } from 'react-konva'
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
  MaskConfig,
  ShapeMask,
  TemplateRendererRef,
} from '@/types/template'

// ============================================
// Props 타입
// ============================================

/** 슬롯 내 이미지 변환 상태 */
interface SlotImageTransform {
  x: number // -1 ~ 1 (중앙 = 0)
  y: number // -1 ~ 1 (중앙 = 0)
  scale: number // 1 = 원본
  rotation: number // 도 단위
}

interface SlotTransforms {
  [slotId: string]: SlotImageTransform
}

interface TemplateRendererProps {
  config: TemplateConfig
  formData: FormData
  images: ImageData
  colors: ColorData
  slotTransforms?: SlotTransforms
  onSlotClick?: (slotId: string) => void
  onTextClick?: (textId: string) => void
  onSlotTransformChange?: (slotId: string, transform: Partial<SlotImageTransform>) => void
  selectedSlotId?: string | null
  selectedTextId?: string | null
  editable?: boolean
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 색상 참조를 실제 색상값으로 변환
 * ColorReference 키 또는 직접 색상값 모두 지원
 */
function resolveColor(
  colorOrRef: string | ColorReference | undefined,
  colors: ColorData
): string {
  if (!colorOrRef) return '#000000'

  // ColorReference 키인지 확인
  const colorRefKeys: ColorReference[] = ['primaryColor', 'secondaryColor', 'accentColor', 'textColor']
  if (colorRefKeys.includes(colorOrRef as ColorReference)) {
    return colors[colorOrRef as ColorReference] || '#000000'
  }

  // 직접 색상값
  return colorOrRef
}

/**
 * 이미지 로드 훅 (캐싱 + 에러 처리)
 */
function useImage(src: string | null | undefined): [HTMLImageElement | null, boolean, Error | null] {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!src) {
      setImage(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const img = new window.Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      setImage(img)
      setLoading(false)
    }

    img.onerror = () => {
      setError(new Error(`Failed to load image: ${src}`))
      setImage(null)
      setLoading(false)
    }

    img.src = src

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])

  return [image, loading, error]
}

/**
 * 이미지 피팅 계산 (cover, contain, fill)
 */
function calculateImageFit(
  imgWidth: number,
  imgHeight: number,
  slotWidth: number,
  slotHeight: number,
  fit: 'cover' | 'contain' | 'fill' = 'cover',
  positionX: number = 0,
  positionY: number = 0
): { x: number; y: number; width: number; height: number } {
  if (fit === 'fill') {
    return { x: 0, y: 0, width: slotWidth, height: slotHeight }
  }

  // 버그 수정: Division by zero 방지
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

/**
 * Shape 마스크 경로 그리기
 * Canvas 2D Context에 마스크 모양을 그림
 */
function drawShapeMask(
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

/**
 * GlobalCompositeOperation을 사용한 이미지 마스킹 훅
 * Canva, Figma 스타일의 마스킹 구현
 *
 * 작동 원리:
 * 1. 오프스크린 캔버스 생성
 * 2. 사용자 이미지를 먼저 그림 (스케일/회전 적용)
 * 3. globalCompositeOperation = 'destination-in' 설정
 * 4. 마스크(shape 또는 image)를 그림
 * 5. 결과: 마스크 영역만 사용자 이미지가 보임
 */
function useMaskedImage(
  userImageSrc: string | null,
  maskConfig: MaskConfig | undefined,
  slotWidth: number,
  slotHeight: number,
  imageFit: 'cover' | 'contain' | 'fill' = 'cover',
  imagePositionX: number = 0,
  imagePositionY: number = 0,
  imageScale: number = 1,
  imageRotation: number = 0
): [HTMLCanvasElement | null, boolean] {
  const [maskedCanvas, setMaskedCanvas] = useState<HTMLCanvasElement | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [userImage] = useImage(userImageSrc)
  const [maskImage] = useImage(
    maskConfig?.type === 'image' ? maskConfig.imageUrl : null
  )

  useEffect(() => {
    if (!userImage) {
      setMaskedCanvas(null)
      return
    }

    setIsProcessing(true)

    // 오프스크린 캔버스 생성
    const canvas = document.createElement('canvas')
    canvas.width = slotWidth
    canvas.height = slotHeight
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      setIsProcessing(false)
      return
    }

    // 이미지 피팅 계산
    const dims = calculateImageFit(
      userImage.width,
      userImage.height,
      slotWidth,
      slotHeight,
      imageFit,
      imagePositionX,
      imagePositionY
    )

    // Step 1: 사용자 이미지 그리기 (스케일/회전 적용)
    ctx.save()
    // 중앙 기준 변환
    ctx.translate(slotWidth / 2, slotHeight / 2)
    ctx.rotate((imageRotation * Math.PI) / 180)
    ctx.scale(imageScale, imageScale)
    ctx.translate(-slotWidth / 2, -slotHeight / 2)
    ctx.drawImage(userImage, dims.x, dims.y, dims.width, dims.height)
    ctx.restore()

    // Step 2: 마스킹 적용 (destination-in 사용)
    if (maskConfig) {
      ctx.globalCompositeOperation = 'destination-in'

      if (maskConfig.type === 'image' && maskImage) {
        // 이미지 기반 마스킹
        ctx.drawImage(maskImage, 0, 0, slotWidth, slotHeight)

        // 반전 옵션 처리
        if (maskConfig.invert) {
          ctx.globalCompositeOperation = 'destination-out'
          ctx.drawImage(maskImage, 0, 0, slotWidth, slotHeight)
        }
      } else if (maskConfig.type === 'shape') {
        // Shape 기반 마스킹
        drawShapeMask(ctx, slotWidth, slotHeight, maskConfig)
        ctx.fill()
      }
    }

    // 컴포지션 리셋
    ctx.globalCompositeOperation = 'source-over'

    setMaskedCanvas(canvas)
    setIsProcessing(false)
  }, [
    userImage,
    maskImage,
    maskConfig,
    slotWidth,
    slotHeight,
    imageFit,
    imagePositionX,
    imagePositionY,
    imageScale,
    imageRotation,
  ])

  return [maskedCanvas, isProcessing]
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

/** 기본 슬롯 변환값 */
const defaultSlotTransform: SlotImageTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
}

/**
 * 이미지 슬롯 렌더러 (GlobalCompositeOperation 마스킹 + 드래그/변환)
 */
function ImageSlotRenderer({
  slot,
  imageSrc,
  colors,
  isSelected,
  onClick,
  slotTransform,
  onTransformChange,
  editable = true,
}: {
  slot: ImageSlot
  imageSrc: string | null
  colors: ColorData
  isSelected: boolean
  onClick?: () => void
  slotTransform?: SlotImageTransform
  onTransformChange?: (transform: Partial<SlotImageTransform>) => void
  editable?: boolean
}) {
  const [placeholderImage] = useImage(slot.placeholder)
  const { transform, mask, border, shadow, imageFit = 'cover', imagePosition } = slot
  const imageRef = useRef<Konva.Image>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  // 슬롯 변환값 적용 (드래그로 조정된 위치)
  const currentTransform = slotTransform || defaultSlotTransform
  const effectivePositionX = (imagePosition?.x ?? 0) + currentTransform.x
  const effectivePositionY = (imagePosition?.y ?? 0) + currentTransform.y

  // GlobalCompositeOperation을 사용한 마스킹
  const [maskedCanvas, isProcessing] = useMaskedImage(
    imageSrc,
    mask,
    transform.width,
    transform.height,
    imageFit,
    effectivePositionX,
    effectivePositionY,
    currentTransform.scale,
    currentTransform.rotation
  )

  // 선택 시 Transformer 연결
  useEffect(() => {
    if (isSelected && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!onTransformChange || !editable) return

      const node = e.target
      // 버그 수정: Division by zero 방지
      const halfWidth = transform.width / 2
      const halfHeight = transform.height / 2
      if (halfWidth === 0 || halfHeight === 0) {
        node.position({ x: 0, y: 0 })
        return
      }

      // 슬롯 내에서의 상대적 이동을 -1~1 범위로 변환
      const deltaX = node.x() / halfWidth
      const deltaY = node.y() / halfHeight
      onTransformChange({
        x: Math.max(-1, Math.min(1, currentTransform.x + deltaX)),
        y: Math.max(-1, Math.min(1, currentTransform.y + deltaY)),
      })
      // 노드 위치 리셋 (실제 위치는 useMaskedImage에서 처리)
      node.position({ x: 0, y: 0 })
    },
    [onTransformChange, editable, transform.width, transform.height, currentTransform.x, currentTransform.y]
  )

  // Transform 종료 핸들러 (스케일/회전)
  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      if (!onTransformChange || !editable) return
      const node = e.target
      const newScale = node.scaleX()
      const newRotation = node.rotation()

      onTransformChange({
        scale: currentTransform.scale * newScale,
        rotation: currentTransform.rotation + newRotation,
      })

      // 노드 스케일/회전 리셋 (실제 변환은 useMaskedImage에서 처리)
      node.scaleX(1)
      node.scaleY(1)
      node.rotation(0)
    },
    [onTransformChange, editable, currentTransform.scale, currentTransform.rotation]
  )

  // Konva clipFunc for shape masks (fallback and for selection indicator)
  // 버그 수정: Konva 공식 API 사용 (ctx._context 대신 getContext 사용)
  const clipFunc = useCallback(
    (ctx: Konva.Context) => {
      if (!mask || mask.type === 'image') {
        ctx.rect(0, 0, transform.width, transform.height)
        return
      }
      // Shape mask - Konva Context는 Canvas 2D Context와 호환
      const nativeCtx = ctx as unknown as CanvasRenderingContext2D
      drawShapeMask(nativeCtx, transform.width, transform.height, mask)
    },
    [transform.width, transform.height, mask]
  )

  // 그림자 props
  const shadowProps = shadow
    ? {
        shadowColor: shadow.color,
        shadowBlur: shadow.blur,
        shadowOffsetX: shadow.offsetX,
        shadowOffsetY: shadow.offsetY,
        shadowEnabled: true,
      }
    : {}

  return (
    <>
      <Group
        x={transform.x}
        y={transform.y}
        width={transform.width}
        height={transform.height}
        rotation={transform.rotation || 0}
        scaleX={transform.scaleX ?? 1}
        scaleY={transform.scaleY ?? 1}
        offsetX={(transform.originX ?? 0) * transform.width}
        offsetY={(transform.originY ?? 0) * transform.height}
        onClick={onClick}
        onTap={onClick}
        clipFunc={clipFunc}
        {...shadowProps}
      >
        {/* 마스킹된 이미지 (GlobalCompositeOperation 적용됨) - 드래그 가능 */}
        {maskedCanvas && (
          <Image
            ref={imageRef}
            image={maskedCanvas}
            width={transform.width}
            height={transform.height}
            draggable={editable && isSelected && !!imageSrc}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        )}

        {/* 이미지 없을 때 플레이스홀더 */}
        {!imageSrc && !isProcessing && (
          <>
            {placeholderImage ? (
              <Image
                image={placeholderImage}
                width={transform.width}
                height={transform.height}
              />
            ) : (
              <Rect
                width={transform.width}
                height={transform.height}
                fill="#E5E7EB"
              />
            )}
          </>
        )}

        {/* 로딩 중 표시 */}
        {isProcessing && (
          <Rect
            width={transform.width}
            height={transform.height}
            fill="#F3F4F6"
          />
        )}

        {/* 테두리 */}
        {border && (
          <Rect
            width={transform.width}
            height={transform.height}
            stroke={resolveColor(border.color, colors)}
            strokeWidth={border.width}
            dash={border.dashArray || (border.style === 'dashed' ? [8, 4] : border.style === 'dotted' ? [2, 2] : undefined)}
            listening={false}
          />
        )}

        {/* 선택 표시 */}
        {isSelected && (
          <Rect
            x={-2}
            y={-2}
            width={transform.width + 4}
            height={transform.height + 4}
            stroke="#3B82F6"
            strokeWidth={3}
            dash={[8, 4]}
            cornerRadius={mask?.type === 'shape' && mask.shape === 'roundedRect' ? (mask.cornerRadius || 0) + 2 : 4}
            listening={false}
          />
        )}
      </Group>

      {/* Transformer (선택된 이미지에 리사이즈/회전 핸들 표시) */}
      {isSelected && editable && imageSrc && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // 최소 크기 제한
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox
            }
            return newBox
          }}
          rotateEnabled={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          anchorSize={12}
          anchorCornerRadius={2}
          borderStroke="#3B82F6"
          borderStrokeWidth={2}
          anchorFill="#FFFFFF"
          anchorStroke="#3B82F6"
        />
      )}
    </>
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
    <Group onClick={onClick} onTap={onClick}>
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
          // 버그 수정: fontWeight 'bold'/'normal' 문자열 처리 및 NaN 방지
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

/**
 * 오버레이 이미지 렌더러
 */
function OverlayImageRenderer({ overlay }: { overlay: OverlayImage }) {
  const [image] = useImage(overlay.imageUrl)

  if (!image) return null

  return (
    <Image
      image={image}
      x={overlay.transform.x}
      y={overlay.transform.y}
      width={overlay.transform.width}
      height={overlay.transform.height}
      rotation={overlay.transform.rotation || 0}
      scaleX={overlay.transform.scaleX ?? 1}
      scaleY={overlay.transform.scaleY ?? 1}
      opacity={overlay.opacity ?? 1}
      globalCompositeOperation={overlay.blendMode}
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
      slotTransforms,
      onSlotClick,
      onTextClick,
      onSlotTransformChange,
      selectedSlotId,
      selectedTextId,
      editable = true,
    },
    ref
  ) {
    const stageRef = useRef<Konva.Stage>(null)
    const { canvas, layers } = config

    // 내보내기 함수 (PNG DataURL)
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

    // 내보내기 함수 (Blob)
    const exportToBlob = useCallback(
      async (
        scale: number = 2,
        format: 'png' | 'jpg' | 'webp' = 'png'
      ): Promise<Blob | null> => {
        const stage = stageRef.current
        if (!stage) return null

        return new Promise((resolve) => {
          stage.toBlob({
            pixelRatio: scale,
            mimeType: `image/${format === 'jpg' ? 'jpeg' : format}`,
            callback: (blob) => resolve(blob),
          })
        })
      },
      []
    )

    // 뷰 리셋
    const resetView = useCallback(() => {
      const stage = stageRef.current
      if (!stage) return
      stage.position({ x: 0, y: 0 })
      stage.scale({ x: 1, y: 1 })
      stage.batchDraw()
    }, [])

    // DataURL 직접 반환
    const getDataURL = useCallback((): string | null => {
      const stage = stageRef.current
      if (!stage) return null
      return stage.toDataURL()
    }, [])

    // ref를 통해 메서드 노출
    useImperativeHandle(
      ref,
      () => ({
        exportToImage,
        exportToBlob,
        getStage: () => stageRef.current,
        resetView,
        getDataURL,
      }),
      [exportToImage, exportToBlob, resetView, getDataURL]
    )

    return (
      <Stage
        ref={stageRef}
        width={canvas.width}
        height={canvas.height}
        style={{ backgroundColor: canvas.backgroundColor }}
      >
        {/* Layer 1: Background */}
        <Layer name="background">
          <BackgroundRenderer
            config={layers.background}
            canvasWidth={canvas.width}
            canvasHeight={canvas.height}
            colors={colors}
          />
        </Layer>

        {/* Layer 2: Image Slots */}
        <Layer name="slots">
          {layers.slots.map((slot) => (
            <ImageSlotRenderer
              key={slot.id}
              slot={slot}
              imageSrc={images[slot.dataKey] || null}
              colors={colors}
              isSelected={selectedSlotId === slot.id}
              onClick={editable && slot.clickable !== false ? () => onSlotClick?.(slot.id) : undefined}
              slotTransform={slotTransforms?.[slot.id]}
              onTransformChange={
                onSlotTransformChange
                  ? (transform) => onSlotTransformChange(slot.id, transform)
                  : undefined
              }
              editable={editable}
            />
          ))}
        </Layer>

        {/* Layer 3: Dynamic Shapes */}
        {layers.dynamicShapes && layers.dynamicShapes.length > 0 && (
          <Layer name="shapes">
            {layers.dynamicShapes.map((shape) => (
              <DynamicShapeRenderer key={shape.id} shape={shape} colors={colors} />
            ))}
          </Layer>
        )}

        {/* Layer 4: Text Fields */}
        <Layer name="texts">
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
          <Layer name="overlays">
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
export { useImage, resolveColor, calculateImageFit, drawShapeMask, useMaskedImage }
