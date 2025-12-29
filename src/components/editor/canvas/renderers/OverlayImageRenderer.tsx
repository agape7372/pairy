'use client'

/**
 * 오버레이 이미지 렌더러
 * 변경 이유: TemplateRenderer.tsx에서 분리하여 단일 책임 원칙 준수
 */

import { Image } from 'react-konva'
import { useImage } from '@/hooks/useKonvaImage'
import type { OverlayImage } from '@/types/template'

interface OverlayImageRendererProps {
  overlay: OverlayImage
}

export function OverlayImageRenderer({ overlay }: OverlayImageRendererProps) {
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
