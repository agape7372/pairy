import { act, renderHook } from '@testing-library/react'
import { useMaskedImage } from '@/hooks/useKonvaImage'

class ControlledImage {
  static instances: ControlledImage[] = []

  width = 200
  height = 100
  crossOrigin = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  private value = ''

  constructor() {
    ControlledImage.instances.push(this)
  }

  set src(value: string) {
    this.value = value
  }

  get src() {
    return this.value
  }
}

describe('useMaskedImage', () => {
  const originalImage = window.Image
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  const operations: string[] = []

  beforeAll(() => {
    Object.defineProperty(window, 'Image', {
      configurable: true,
      value: ControlledImage,
    })
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: jest.fn(() => {
        const context = {
          globalCompositeOperation: 'source-over',
          filter: '',
          save: jest.fn(),
          restore: jest.fn(),
          translate: jest.fn(),
          rotate: jest.fn(),
          scale: jest.fn(),
          drawImage: jest.fn(() => {
            operations.push(context.globalCompositeOperation)
          }),
          beginPath: jest.fn(),
          rect: jest.fn(),
          arc: jest.fn(),
          ellipse: jest.fn(),
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          closePath: jest.fn(),
          fill: jest.fn(),
        }
        return context
      }),
    })
  })

  beforeEach(() => {
    ControlledImage.instances = []
    operations.length = 0
  })

  afterAll(() => {
    Object.defineProperty(window, 'Image', {
      configurable: true,
      value: originalImage,
    })
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: originalGetContext,
    })
  })

  it('이미지 마스크가 준비되기 전에는 원본을 노출하지 않는다', () => {
    const { result } = renderHook(() =>
      useMaskedImage(
        'blob:user',
        { type: 'image', imageUrl: '/mask.png' },
        100,
        100
      )
    )

    expect(ControlledImage.instances).toHaveLength(2)
    act(() => ControlledImage.instances[0].onload?.())
    expect(result.current[0]).toBeNull()

    act(() => ControlledImage.instances[1].onload?.())
    expect(result.current[0]).toBeInstanceOf(HTMLCanvasElement)
  })

  it('반전 마스크는 동일 마스크를 두 번 적용해 결과를 지우지 않는다', () => {
    const { result } = renderHook(() =>
      useMaskedImage(
        'blob:user',
        { type: 'image', imageUrl: '/mask.png', invert: true },
        100,
        100
      )
    )

    act(() => {
      ControlledImage.instances.forEach((image) => image.onload?.())
    })

    expect(result.current[0]).toBeInstanceOf(HTMLCanvasElement)
    expect(operations).toEqual(['source-over', 'destination-out'])
  })
})
