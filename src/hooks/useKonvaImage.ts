'use client'

/**
 * Konva 이미지 관련 훅
 * 변경 이유: TemplateRenderer.tsx에서 분리하여 재사용성 향상
 */

import { useReducer, useEffect, useMemo } from 'react'
import { calculateImageFit, drawShapeMask } from '@/lib/utils/canvasUtils'
import type { MaskConfig, ImageFilters } from '@/types/template'

// ============================================
// useImage - 이미지 로딩 훅
// ============================================

type UseImageReturn = [
  image: HTMLImageElement | null,
  loading: boolean,
  error: Error | null
]

interface ImageState {
  image: HTMLImageElement | null
  loading: boolean
  error: Error | null
}

type ImageAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; image: HTMLImageElement }
  | { type: 'LOAD_ERROR'; error: Error }

function imageReducer(state: ImageState, action: ImageAction): ImageState {
  switch (action.type) {
    case 'LOAD_START':
      return { image: null, loading: true, error: null }
    case 'LOAD_SUCCESS':
      return { image: action.image, loading: false, error: null }
    case 'LOAD_ERROR':
      return { image: null, loading: false, error: action.error }
    default:
      return state
  }
}

const initialImageState: ImageState = {
  image: null,
  loading: false,
  error: null,
}

/**
 * 이미지 로드 훅 (캐싱 + 에러 처리)
 * @param src - 이미지 URL 또는 Data URL
 */
export function useImage(src: string | null | undefined): UseImageReturn {
  const [state, dispatch] = useReducer(imageReducer, initialImageState)

  useEffect(() => {
    // src가 없으면 로딩하지 않음
    if (!src) return

    let isCancelled = false
    const img = new window.Image()
    img.crossOrigin = 'anonymous'

    dispatch({ type: 'LOAD_START' })

    img.onload = () => {
      if (!isCancelled) {
        dispatch({ type: 'LOAD_SUCCESS', image: img })
      }
    }

    img.onerror = () => {
      if (!isCancelled) {
        dispatch({ type: 'LOAD_ERROR', error: new Error(`Failed to load image: ${src}`) })
      }
    }

    img.src = src

    return () => {
      isCancelled = true
      img.onload = null
      img.onerror = null
    }
  }, [src])

  // 변경 이유: src가 없을 때는 null/false/null 반환
  return useMemo<UseImageReturn>(() => {
    if (!src) {
      return [null, false, null]
    }
    return [state.image, state.loading, state.error]
  }, [src, state.image, state.loading, state.error])
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
  imageRotation: number = 0,
  filters?: ImageFilters
): UseMaskedImageReturn {
  const [userImage] = useImage(userImageSrc)
  const [maskImage] = useImage(
    maskConfig?.type === 'image' ? maskConfig.imageUrl : null
  )

  // 마스킹된 캔버스 계산
  const maskedCanvas = useMemo(() => {
    if (!userImage) {
      return null
    }

    // 오프스크린 캔버스 생성
    const canvas = document.createElement('canvas')
    canvas.width = slotWidth
    canvas.height = slotHeight
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return null
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

    // Step 1: 사용자 이미지 그리기 (스케일/회전/필터 적용)
    ctx.save()

    // Sprint 29: 필터 적용
    if (filters) {
      const filterParts: string[] = []
      if (filters.brightness !== undefined && filters.brightness !== 0) {
        filterParts.push(`brightness(${100 + filters.brightness}%)`)
      }
      if (filters.contrast !== undefined && filters.contrast !== 0) {
        filterParts.push(`contrast(${100 + filters.contrast}%)`)
      }
      if (filters.saturation !== undefined && filters.saturation !== 100) {
        filterParts.push(`saturate(${filters.saturation}%)`)
      }
      if (filters.grayscale) {
        filterParts.push('grayscale(100%)')
      }
      if (filters.sepia) {
        filterParts.push('sepia(100%)')
      }
      if (filters.blur !== undefined && filters.blur > 0) {
        filterParts.push(`blur(${filters.blur}px)`)
      }
      if (filterParts.length > 0) {
        ctx.filter = filterParts.join(' ')
      }
    }

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

    return canvas
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
    filters,
  ])

  // isProcessing은 이미지 로딩 상태로 판단
  const isProcessing = userImageSrc !== null && !userImage

  return [maskedCanvas, isProcessing]
}
