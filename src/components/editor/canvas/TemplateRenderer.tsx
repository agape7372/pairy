'use client'

/**
 * 템플릿 렌더러 메인 컴포넌트
 *
 * 리팩토링 이유:
 * - 기존 1,187줄의 모놀리식 컴포넌트를 분리하여 유지보수성 향상
 * - 서브 렌더러를 /renderers/ 디렉토리로 분리
 * - 유틸리티 함수를 /lib/utils/canvasUtils.ts로 분리
 * - 이미지 훅을 /hooks/useKonvaImage.ts로 분리
 * - 타입을 /types/template.ts로 통합
 */

import {
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import type {
  TemplateConfig,
  FormData,
  ImageData,
  ColorData,
  SlotImageTransform,
  SlotTransforms,
  TemplateRendererRef,
  StickerLayer,
} from '@/types/template'

// 분리된 렌더러 임포트
import {
  BackgroundRenderer,
  ImageSlotRenderer,
  TextFieldRenderer,
  DynamicShapeRenderer,
  OverlayImageRenderer,
  StickerRenderer,
} from './renderers'

// 분리된 유틸리티 (외부 사용을 위해 re-export)
export { resolveColor, calculateImageFit, drawShapeMask } from '@/lib/utils/canvasUtils'
export { useImage, useMaskedImage } from '@/hooks/useKonvaImage'

// ============================================
// Props 타입
// ============================================

interface TemplateRendererProps {
  config: TemplateConfig
  formData: FormData
  images: ImageData
  colors: ColorData
  slotTransforms?: SlotTransforms
  onSlotClick?: (slotId: string) => void
  onTextClick?: (textId: string) => void
  onTextDoubleClick?: (textId: string) => void // Sprint 30: 인라인 편집 트리거
  onSlotTransformChange?: (slotId: string, transform: Partial<SlotImageTransform>) => void
  selectedSlotId?: string | null
  selectedTextId?: string | null
  // Sprint 31: 스티커 관련 props
  selectedStickerId?: string | null
  onStickerClick?: (stickerId: string) => void
  onStickerTransformChange?: (stickerId: string, transform: Partial<StickerLayer['transform']>) => void
  editable?: boolean
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
      onTextDoubleClick,
      onSlotTransformChange,
      selectedSlotId,
      selectedTextId,
      // Sprint 31: 스티커 관련 props
      selectedStickerId,
      onStickerClick,
      onStickerTransformChange,
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

        {/* Layer 3: Stickers (Sprint 31) */}
        {layers.stickers && layers.stickers.length > 0 && (
          <Layer name="stickers">
            {layers.stickers.map((sticker) => (
              <StickerRenderer
                key={sticker.id}
                sticker={sticker}
                isSelected={selectedStickerId === sticker.id}
                onClick={editable ? () => onStickerClick?.(sticker.id) : undefined}
                onTransformEnd={
                  onStickerTransformChange
                    ? (transform) => onStickerTransformChange(sticker.id, transform)
                    : undefined
                }
                editable={editable}
              />
            ))}
          </Layer>
        )}

        {/* Layer 4: Dynamic Shapes */}
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
              onDoubleClick={editable ? () => onTextDoubleClick?.(textField.id) : undefined}
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
