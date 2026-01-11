'use client'

/**
 * PSD 캔버스 렌더러
 *
 * @description
 * react-konva를 사용하여 PSD 레이어를 실제 캔버스에 렌더링합니다.
 * 레이어별 이미지를 원본 위치에 정확하게 배치합니다.
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { Stage, Layer, Image, Rect, Text, Group } from 'react-konva'

// ============================================
// 타입 정의
// ============================================

interface LayerData {
  id: string
  name: string
  imageUrl?: string
  x: number
  y: number
  width: number
  height: number
  visible: boolean
}

interface SlotData {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

interface FieldData {
  id: string
  slotId: string
  label: string
  type: 'text' | 'color'
  x: number
  y: number
  width: number
  height: number
  defaultValue?: string
}

interface PSDCanvasProps {
  /** 문서 크기 */
  width: number
  height: number
  /** 합성 이미지 URL */
  compositeImage?: string
  /** 개별 레이어 데이터 */
  layers?: LayerData[]
  /** 슬롯 데이터 (편집 영역 표시) */
  slots?: SlotData[]
  /** 필드 데이터 (텍스트/색상 필드 표시) */
  fields?: FieldData[]
  /** 선택된 슬롯 ID */
  selectedSlotId?: string
  /** 슬롯 선택 콜백 */
  onSlotSelect?: (slotId: string) => void
  /** 컨테이너 최대 너비 */
  maxWidth?: number
  /** 슬롯/필드 표시 여부 */
  showOverlay?: boolean
  /** 클래스명 */
  className?: string
}

// ============================================
// 이미지 로더 훅
// ============================================

function useImage(url: string | undefined): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const urlRef = useRef(url)

  // URL 변경 시 이미지 로드
  useEffect(() => {
    urlRef.current = url

    if (!url) {
      // 비동기로 처리하여 렌더 중 setState 방지
      const timeoutId = setTimeout(() => setImage(null), 0)
      return () => clearTimeout(timeoutId)
    }

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = url

    img.onload = () => {
      // URL이 변경되지 않았을 때만 상태 업데이트
      if (urlRef.current === url) {
        setImage(img)
      }
    }

    img.onerror = () => {
      console.warn('Failed to load image:', url.substring(0, 50))
      if (urlRef.current === url) {
        setImage(null)
      }
    }

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [url])

  return image
}

// ============================================
// 레이어 이미지 컴포넌트
// ============================================

interface LayerImageProps {
  layer: LayerData
  scale: number
}

function LayerImage({ layer, scale }: LayerImageProps) {
  const image = useImage(layer.imageUrl)

  if (!image || !layer.visible) return null

  return (
    <Image
      image={image}
      x={layer.x * scale}
      y={layer.y * scale}
      width={layer.width * scale}
      height={layer.height * scale}
    />
  )
}

// ============================================
// 슬롯 오버레이 컴포넌트
// ============================================

interface SlotOverlayProps {
  slot: SlotData
  scale: number
  isSelected: boolean
  onSelect: () => void
}

function SlotOverlay({ slot, scale, isSelected, onSelect }: SlotOverlayProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Group
      x={slot.x * scale}
      y={slot.y * scale}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      onTap={onSelect}
    >
      {/* 슬롯 영역 */}
      <Rect
        width={slot.width * scale}
        height={slot.height * scale}
        stroke={isSelected ? '#6366f1' : isHovered ? '#818cf8' : '#94a3b8'}
        strokeWidth={isSelected ? 3 : 2}
        dash={isSelected ? undefined : [8, 4]}
        fill={isSelected ? 'rgba(99, 102, 241, 0.1)' : isHovered ? 'rgba(129, 140, 248, 0.05)' : 'transparent'}
        cornerRadius={4}
      />
      {/* 슬롯 라벨 */}
      <Rect
        x={0}
        y={-24 * scale}
        width={Math.min(slot.width * scale, 120)}
        height={20 * scale}
        fill={isSelected ? '#6366f1' : '#64748b'}
        cornerRadius={4}
      />
      <Text
        x={8 * scale}
        y={-20 * scale}
        text={slot.label}
        fontSize={12 * scale}
        fill="white"
        fontFamily="system-ui"
      />
    </Group>
  )
}

// ============================================
// 필드 오버레이 컴포넌트
// ============================================

interface FieldOverlayProps {
  field: FieldData
  scale: number
}

function FieldOverlay({ field, scale }: FieldOverlayProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Group
      x={field.x * scale}
      y={field.y * scale}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 필드 영역 */}
      <Rect
        width={field.width * scale}
        height={field.height * scale}
        stroke={isHovered ? '#f59e0b' : '#fbbf24'}
        strokeWidth={1}
        dash={[4, 2]}
        fill={isHovered ? 'rgba(251, 191, 36, 0.1)' : 'transparent'}
        cornerRadius={2}
      />
      {/* 필드 라벨 (hover 시) */}
      {isHovered && (
        <>
          <Rect
            x={0}
            y={-18 * scale}
            width={Math.min(field.width * scale, 100)}
            height={16 * scale}
            fill="#f59e0b"
            cornerRadius={2}
          />
          <Text
            x={4 * scale}
            y={-16 * scale}
            text={field.label}
            fontSize={10 * scale}
            fill="white"
            fontFamily="system-ui"
          />
        </>
      )}
    </Group>
  )
}

// ============================================
// 메인 컴포넌트
// ============================================

export default function PSDCanvas({
  width,
  height,
  compositeImage,
  layers = [],
  slots = [],
  fields = [],
  selectedSlotId,
  onSlotSelect,
  maxWidth = 800,
  showOverlay = true,
  className = '',
}: PSDCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(maxWidth)

  // 컨테이너 크기 감지
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerWidth(Math.min(entry.contentRect.width, maxWidth))
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [maxWidth])

  // 스케일 계산
  const scale = useMemo(() => {
    return containerWidth / width
  }, [containerWidth, width])

  const stageWidth = containerWidth
  const stageHeight = height * scale

  // 합성 이미지
  const compositeImg = useImage(compositeImage)

  return (
    <div ref={containerRef} className={className}>
      <Stage width={stageWidth} height={stageHeight}>
        <Layer>
          {/* 배경 (체크무늬) */}
          <Rect
            width={stageWidth}
            height={stageHeight}
            fill="#f8f9fa"
          />

          {/* 합성 이미지 (있으면 표시) */}
          {compositeImg && (
            <Image
              image={compositeImg}
              width={stageWidth}
              height={stageHeight}
            />
          )}

          {/* 개별 레이어 이미지 (합성 이미지가 없을 때) */}
          {!compositeImg && layers.map((layer) => (
            <LayerImage
              key={layer.id}
              layer={layer}
              scale={scale}
            />
          ))}
        </Layer>

        {/* 오버레이 레이어 */}
        {showOverlay && (
          <Layer>
            {/* 슬롯 */}
            {slots.map((slot) => (
              <SlotOverlay
                key={slot.id}
                slot={slot}
                scale={scale}
                isSelected={slot.id === selectedSlotId}
                onSelect={() => onSlotSelect?.(slot.id)}
              />
            ))}

            {/* 필드 */}
            {fields.map((field) => (
              <FieldOverlay
                key={field.id}
                field={field}
                scale={scale}
              />
            ))}
          </Layer>
        )}
      </Stage>
    </div>
  )
}

// ============================================
// 간단한 프리뷰 컴포넌트
// ============================================

interface PSDPreviewProps {
  compositeImage?: string
  width: number
  height: number
  maxWidth?: number
  className?: string
}

export function PSDPreview({
  compositeImage,
  width,
  height,
  maxWidth = 400,
  className = '',
}: PSDPreviewProps) {
  const image = useImage(compositeImage)
  const scale = Math.min(maxWidth / width, 1)
  const displayWidth = width * scale
  const displayHeight = height * scale

  return (
    <div className={className}>
      <Stage width={displayWidth} height={displayHeight}>
        <Layer>
          <Rect
            width={displayWidth}
            height={displayHeight}
            fill="#f8f9fa"
          />
          {image && (
            <Image
              image={image}
              width={displayWidth}
              height={displayHeight}
            />
          )}
        </Layer>
      </Stage>
    </div>
  )
}
