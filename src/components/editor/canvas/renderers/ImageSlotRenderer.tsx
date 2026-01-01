'use client'

/**
 * 이미지 슬롯 렌더러 (GlobalCompositeOperation 마스킹 + 드래그/변환)
 * 변경 이유: TemplateRenderer.tsx에서 분리하여 단일 책임 원칙 준수
 */

import { useRef, useEffect, useCallback } from 'react'
import { Group, Image, Rect, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useImage, useMaskedImage } from '@/hooks/useKonvaImage'
import { resolveColor, drawShapeMask } from '@/lib/utils/canvasUtils'
import type { ImageSlot, ColorData, SlotImageTransform } from '@/types/template'
import { DEFAULT_SLOT_TRANSFORM } from '@/types/template'

interface ImageSlotRendererProps {
  slot: ImageSlot
  imageSrc: string | null
  colors: ColorData
  isSelected: boolean
  onClick?: () => void
  slotTransform?: SlotImageTransform
  onTransformChange?: (transform: Partial<SlotImageTransform>) => void
  editable?: boolean
}

export function ImageSlotRenderer({
  slot,
  imageSrc,
  colors,
  isSelected,
  onClick,
  slotTransform,
  onTransformChange,
  editable = true,
}: ImageSlotRendererProps) {
  const [placeholderImage] = useImage(slot.placeholder)
  const { transform, mask, border, shadow, imageFit = 'cover', imagePosition } = slot
  const imageRef = useRef<Konva.Image>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  // 슬롯 변환값 적용 (드래그로 조정된 위치)
  const currentTransform = slotTransform || DEFAULT_SLOT_TRANSFORM
  const effectivePositionX = (imagePosition?.x ?? 0) + currentTransform.x
  const effectivePositionY = (imagePosition?.y ?? 0) + currentTransform.y

  // GlobalCompositeOperation을 사용한 마스킹 (Sprint 29: 필터 추가)
  const [maskedCanvas, isProcessing] = useMaskedImage(
    imageSrc,
    mask,
    transform.width,
    transform.height,
    imageFit,
    effectivePositionX,
    effectivePositionY,
    currentTransform.scale,
    currentTransform.rotation,
    currentTransform.filters
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
      // Division by zero 방지
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
            // Sprint 29: 반전 및 투명도
            scaleX={currentTransform.flipX ? -1 : 1}
            scaleY={currentTransform.flipY ? -1 : 1}
            offsetX={currentTransform.flipX ? transform.width : 0}
            offsetY={currentTransform.flipY ? transform.height : 0}
            opacity={currentTransform.opacity ?? 1}
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
