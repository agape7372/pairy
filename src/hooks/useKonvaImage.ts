'use client'

/**
 * Konva 이미지 관련 훅
 * 변경 이유: TemplateRenderer.tsx에서 분리하여 재사용성 향상
 */

import { useState, useEffect } from 'react'
import { calculateImageFit, drawShapeMask } from '@/lib/utils/canvasUtils'
import type { MaskConfig } from '@/types/template'

// ============================================
// useImage - 이미지 로딩 훅
// ============================================

type UseImageReturn = [
  image: HTMLImageElement | null,
  loading: boolean,
  error: Error | null
]

/**
 * 이미지 로드 훅 (캐싱 + 에러 처리)
 * @param src - 이미지 URL 또는 Data URL
 */
export function useImage(src: string | null | undefined): UseImageReturn {
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

// ============================================
// useMaskedImage - 마스킹된 이미지 생성 훅
// ============================================

type UseMaskedImageReturn = [
  maskedCanvas: HTMLCanvasElement | null,
  isProcessing: boolean
]

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
 *
 * @param userImageSrc - 사용자 이미지 URL
 * @param maskConfig - 마스크 설정
 * @param slotWidth - 슬롯 너비
 * @param slotHeight - 슬롯 높이
 * @param imageFit - 이미지 피팅 모드
 * @param imagePositionX - X 위치 조정 (-1 ~ 1)
 * @param imagePositionY - Y 위치 조정 (-1 ~ 1)
 * @param imageScale - 이미지 스케일
 * @param imageRotation - 이미지 회전 각도
 */
export function useMaskedImage(
  userImageSrc: string | null,
  maskConfig: MaskConfig | undefined,
  slotWidth: number,
  slotHeight: number,
  imageFit: 'cover' | 'contain' | 'fill' = 'cover',
  imagePositionX: number = 0,
  imagePositionY: number = 0,
  imageScale: number = 1,
  imageRotation: number = 0
): UseMaskedImageReturn {
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
