'use client'

/**
 * Sprint 31: 스티커 렌더러
 * 이미지 스티커를 캔버스에 렌더링 (이모지 배제)
 */

import { useRef, useEffect, useCallback, memo } from 'react'
import { Group, Image, Rect, Transformer } from 'react-konva'
import { useImage } from '@/hooks/useKonvaImage'
import type { StickerLayer } from '@/types/sticker'
import type Konva from 'konva'

interface StickerRendererProps {
  sticker: StickerLayer
  isSelected: boolean
  onClick?: (stickerId: string) => void
  onTransformEnd?: (stickerId: string, transform: Partial<StickerLayer['transform']>) => void
  editable?: boolean
}

export const StickerRenderer = memo(function StickerRenderer({
  sticker,
  isSelected,
  onClick,
  onTransformEnd,
  editable = true,
}: StickerRendererProps) {
  const { transform, imageUrl, opacity = 1, flipX = false, flipY = false } = sticker
  const groupRef = useRef<Konva.Group>(null)
  const transformerRef = useRef<Konva.Transformer>(null)

  // 이미지 로드
  const [image] = useImage(imageUrl)

  // 선택 시 Transformer 연결
  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current && editable) {
      transformerRef.current.nodes([groupRef.current])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected, editable, image])

  // 변환 종료 핸들러
  const handleTransformEnd = () => {
    const node = groupRef.current
    if (!node || !onTransformEnd) return

    // flip 상태는 scale 축을 음수로 표현하므로 실제 크기에는 절댓값만 반영한다.
    const scaleX = Math.abs(node.scaleX())
    const scaleY = Math.abs(node.scaleY())

    // 스케일을 크기에 적용하고 스케일 리셋
    onTransformEnd(sticker.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, transform.width * scaleX),
      height: Math.max(20, transform.height * scaleY),
      rotation: node.rotation(),
    })

    // 스케일 리셋
    node.scaleX(flipX ? -1 : 1)
    node.scaleY(flipY ? -1 : 1)
  }

  // 드래그 종료 핸들러
  const handleDragEnd = () => {
    const node = groupRef.current
    if (!node || !onTransformEnd) return

    onTransformEnd(sticker.id, {
      x: node.x(),
      y: node.y(),
    })
  }

  const handleClick = useCallback(() => {
    onClick?.(sticker.id)
  }, [onClick, sticker.id])

  // 이미지가 로드되지 않으면 렌더링하지 않음
  if (!image) return null

  return (
    <>
      <Group
        ref={groupRef}
        x={transform.x}
        y={transform.y}
        width={transform.width}
        height={transform.height}
        rotation={transform.rotation || 0}
        scaleX={flipX ? -1 : 1}
        scaleY={flipY ? -1 : 1}
        offsetX={flipX ? transform.width : 0}
        offsetY={flipY ? transform.height : 0}
        opacity={opacity}
        draggable={editable}
        onClick={onClick ? handleClick : undefined}
        onTap={onClick ? handleClick : undefined}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      >
        <Image
          x={0}
          y={0}
          width={transform.width}
          height={transform.height}
          image={image}
        />

        {/* 선택 표시 */}
        {isSelected && (
          <Rect
            x={-4}
            y={-4}
            width={transform.width + 8}
            height={transform.height + 8}
            stroke="#3B82F6"
            strokeWidth={2}
            dash={[4, 2]}
            listening={false}
          />
        )}
      </Group>

      {/* Transformer (리사이즈/회전) */}
      {isSelected && editable && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            // 최소 크기 제한
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
    </>
  )
})
