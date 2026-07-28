import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { ImageSlotRenderer } from '@/components/editor/canvas/renderers/ImageSlotRenderer'
import { StickerRenderer } from '@/components/editor/canvas/renderers/StickerRenderer'
import type { ImageSlot, SlotImageTransform } from '@/types/template'
import type { StickerLayer } from '@/types/sticker'

const mockUseImage = jest.fn()
const mockUseMaskedImage = jest.fn()
const mockTransformerNodes = jest.fn()
const mockBatchDraw = jest.fn()

let mockImageScaleX = -2
let mockImageScaleY = 2
let mockImageRotation = 15
const mockImageNode = {
  scaleX: jest.fn((value?: number) => {
    if (value !== undefined) mockImageScaleX = value
    return value === undefined ? mockImageScaleX : undefined
  }),
  scaleY: jest.fn((value?: number) => {
    if (value !== undefined) mockImageScaleY = value
    return value === undefined ? mockImageScaleY : undefined
  }),
  rotation: jest.fn((value?: number) => {
    if (value !== undefined) mockImageRotation = value
    return value === undefined ? mockImageRotation : undefined
  }),
}

let mockGroupScaleX = -2
let mockGroupScaleY = 1.5
const mockGroupNode = {
  x: jest.fn(() => 30),
  y: jest.fn(() => 40),
  rotation: jest.fn(() => 25),
  scaleX: jest.fn((value?: number) => {
    if (value !== undefined) mockGroupScaleX = value
    return value === undefined ? mockGroupScaleX : undefined
  }),
  scaleY: jest.fn((value?: number) => {
    if (value !== undefined) mockGroupScaleY = value
    return value === undefined ? mockGroupScaleY : undefined
  }),
}

jest.mock('@/hooks/useKonvaImage', () => ({
  useImage: (...args: unknown[]) => mockUseImage(...args),
  useMaskedImage: (...args: unknown[]) => mockUseMaskedImage(...args),
}))

jest.mock('react-konva', () => {
  const ReactModule = jest.requireActual<typeof React>('react')

  return {
    Group: ReactModule.forwardRef(
      (
        props: {
          children?: React.ReactNode
          onTransformEnd?: (event: { target: typeof mockGroupNode }) => void
        },
        ref: React.ForwardedRef<typeof mockGroupNode>
      ) => {
        ReactModule.useImperativeHandle(ref, () => mockGroupNode)
        return (
          <div>
            {props.onTransformEnd && (
              <button
                data-testid="group-transform-end"
                onClick={() => props.onTransformEnd?.({ target: mockGroupNode })}
              />
            )}
            {props.children}
          </div>
        )
      }
    ),
    Image: ReactModule.forwardRef(
      (
        props: {
          onTransformEnd?: (event: { target: typeof mockImageNode }) => void
        },
        ref: React.ForwardedRef<typeof mockImageNode>
      ) => {
        ReactModule.useImperativeHandle(ref, () => mockImageNode)
        return (
          <button
            data-testid="image-transform-end"
            onClick={() => props.onTransformEnd?.({ target: mockImageNode })}
          />
        )
      }
    ),
    Rect: () => <div />,
    Transformer: ReactModule.forwardRef(
      (_props: unknown, ref: React.ForwardedRef<unknown>) => {
        ReactModule.useImperativeHandle(ref, () => ({
          nodes: mockTransformerNodes,
          getLayer: () => ({ batchDraw: mockBatchDraw }),
        }))
        return <div data-testid="transformer" />
      }
    ),
  }
})

const slot: ImageSlot = {
  id: 'slot-1',
  name: 'Slot 1',
  dataKey: 'image-1',
  transform: {
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    rotation: 0,
  },
  imageFit: 'cover',
}

const flippedSlotTransform: SlotImageTransform = {
  x: 0,
  y: 0,
  scale: 1.5,
  rotation: 5,
  flipX: true,
  flipY: false,
  opacity: 1,
  filters: {},
}

const flippedSticker: StickerLayer = {
  id: 'sticker-1',
  stickerId: 'heart',
  imageUrl: '/heart.png',
  transform: {
    x: 10,
    y: 20,
    width: 100,
    height: 80,
    rotation: 0,
  },
  opacity: 1,
  flipX: true,
  flipY: false,
}

describe('editor renderer transform lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockImageScaleX = -2
    mockImageScaleY = 2
    mockImageRotation = 15
    mockGroupScaleX = -2
    mockGroupScaleY = 1.5
    mockUseImage.mockReturnValue([null, false, null])
    mockUseMaskedImage.mockReturnValue([null, true])
  })

  it('reattaches an already selected slot when its image finishes loading', () => {
    const onTransformChange = jest.fn()
    const { rerender } = render(
      <ImageSlotRenderer
        slot={slot}
        imageSrc="blob:user-image"
        colors={{ primaryColor: '#000000', secondaryColor: '#ffffff' }}
        isSelected
        slotTransform={flippedSlotTransform}
        onTransformChange={onTransformChange}
      />
    )

    expect(mockTransformerNodes).not.toHaveBeenCalled()

    mockUseMaskedImage.mockReturnValue([{} as HTMLCanvasElement, false])
    rerender(
      <ImageSlotRenderer
        slot={slot}
        imageSrc="blob:user-image"
        colors={{ primaryColor: '#000000', secondaryColor: '#ffffff' }}
        isSelected
        slotTransform={flippedSlotTransform}
        onTransformChange={onTransformChange}
      />
    )

    expect(mockTransformerNodes).toHaveBeenCalledWith([mockImageNode])
    fireEvent.click(screen.getByTestId('image-transform-end'))
    expect(onTransformChange).toHaveBeenCalledWith(
      'slot-1',
      expect.objectContaining({
        scale: 3,
        rotation: 20,
      })
    )
    expect(mockImageNode.scaleX).toHaveBeenLastCalledWith(-1)
    expect(mockImageNode.scaleY).toHaveBeenLastCalledWith(1)
  })

  it('reattaches a selected sticker after load and keeps flipped sizes positive', () => {
    const onTransformEnd = jest.fn()
    const { rerender } = render(
      <StickerRenderer
        sticker={flippedSticker}
        isSelected
        onTransformEnd={onTransformEnd}
      />
    )

    expect(mockTransformerNodes).not.toHaveBeenCalled()

    mockUseImage.mockReturnValue([{} as HTMLImageElement, false, null])
    rerender(
      <StickerRenderer
        sticker={{ ...flippedSticker }}
        isSelected
        onTransformEnd={onTransformEnd}
      />
    )

    expect(mockTransformerNodes).toHaveBeenCalledWith([mockGroupNode])
    fireEvent.click(screen.getByTestId('group-transform-end'))
    expect(onTransformEnd).toHaveBeenCalledWith('sticker-1', {
      x: 30,
      y: 40,
      width: 200,
      height: 120,
      rotation: 25,
    })
    expect(mockGroupNode.scaleX).toHaveBeenLastCalledWith(-1)
    expect(mockGroupNode.scaleY).toHaveBeenLastCalledWith(1)
  })
})
