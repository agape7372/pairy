import {
  IMAGE_COMPRESSION_CONFIG,
  compressImage,
  processImageFile,
} from '@/lib/utils/imageCompressor'

describe('imageCompressor', () => {
  const close = jest.fn()
  const drawImage = jest.fn()
  const convertToBlob = jest.fn(
    async ({ type }: { type: string; quality?: number }) =>
      new Blob(['compressed'], { type })
  )
  const createImageBitmapMock = jest.fn(async () => ({
    width: 1200,
    height: 800,
    close,
  }))
  const createObjectURL = jest.fn(() => 'blob:compressed')

  beforeEach(() => {
    jest.clearAllMocks()

    Object.defineProperty(globalThis, 'createImageBitmap', {
      configurable: true,
      writable: true,
      value: createImageBitmapMock,
    })
    Object.defineProperty(globalThis, 'OffscreenCanvas', {
      configurable: true,
      writable: true,
      value: class MockOffscreenCanvas {
        constructor(
          public width: number,
          public height: number
        ) {}

        getContext() {
          return { drawImage }
        }

        convertToBlob(options: { type: string; quality?: number }) {
          return convertToBlob(options)
        }
      },
    })
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    })
  })

  it.each([
    ['image/png', 'image/png'],
    ['image/webp', 'image/webp'],
    ['image/jpeg', 'image/jpeg'],
  ])('preserves the natural output format for %s', async (inputType, outputType) => {
    const file = new File(['image'], `sample.${inputType.split('/')[1]}`, {
      type: inputType,
    })

    const result = await compressImage(file)

    expect(convertToBlob).toHaveBeenCalledWith(
      expect.objectContaining({ type: outputType })
    )
    expect(result.blob.type).toBe(outputType)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('rejects an oversized source before decoding it', async () => {
    const file = {
      name: 'too-large.png',
      type: 'image/png',
      size: IMAGE_COMPRESSION_CONFIG.maxSourceFileSize + 1,
    } as File

    await expect(processImageFile(file)).rejects.toThrow('이하여야 합니다')
    expect(createImageBitmapMock).not.toHaveBeenCalled()
  })

  it('closes the bitmap when canvas conversion fails', async () => {
    convertToBlob.mockRejectedValueOnce(new Error('conversion failed'))
    const file = new File(['image'], 'sample.png', { type: 'image/png' })

    await expect(compressImage(file)).rejects.toThrow('conversion failed')
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('closes the bitmap for an uncompressed GIF', async () => {
    const file = new File(['gif'], 'animated.gif', { type: 'image/gif' })

    const result = await processImageFile(file)

    expect(result.blob).toBe(file)
    expect(createObjectURL).toHaveBeenCalledWith(file)
    expect(close).toHaveBeenCalledTimes(1)
  })
})
