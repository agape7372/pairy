import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import EditorSidebar from '@/components/editor/canvas/EditorSidebar'
import { useCanvasEditorStore } from '@/stores/canvasEditorStore'
import type { TemplateConfig } from '@/types/template'
import type { CompressionResult } from '@/lib/utils/imageCompressor'

const mockProcessImageFile = jest.fn()
const mockUploadEditorImage = jest.fn()
const mockDeleteEditorImage = jest.fn()

jest.mock('@/lib/utils/imageCompressor', () => {
  const actual = jest.requireActual('@/lib/utils/imageCompressor')
  return {
    ...actual,
    processImageFile: (...args: unknown[]) => mockProcessImageFile(...args),
  }
})

jest.mock('@/lib/supabase/storage', () => ({
  uploadEditorImage: (...args: unknown[]) => mockUploadEditorImage(...args),
  deleteEditorImage: (...args: unknown[]) => mockDeleteEditorImage(...args),
}))

jest.mock('@/components/editor/canvas/CharacterSelector', () => ({
  CharacterSection: () => null,
}))
jest.mock('@/components/editor/stickers/UserStickerPanel', () => ({
  UserStickerPanel: ({
    onAddToCanvas,
  }: {
    onAddToCanvas: (sticker: {
      id: string
      imageUrl: string
      tags: string[]
      defaultSize: { width: number; height: number }
    }) => void
  }) => (
    <button
      data-testid="add-user-sticker"
      onClick={() =>
        onAddToCanvas({
          id: 'user-sticker',
          imageUrl: 'blob:user-sticker',
          tags: ['user'],
          defaultSize: { width: 40, height: 40 },
        })
      }
    >
      add user sticker
    </button>
  ),
}))
jest.mock('@/components/editor/text/TextStylePanel', () => ({
  TextStylePanel: () => null,
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function compressionResult(url: string, file: File): CompressionResult {
  return {
    blob: file,
    url,
    originalSize: file.size,
    compressedSize: file.size,
    compressionRatio: 1,
    width: 100,
    height: 100,
  }
}

function makeTemplate(id: string): TemplateConfig {
  return {
    id,
    name: id,
    description: '',
    category: 'custom',
    tags: [],
    version: '1.0.0',
    canvas: { width: 400, height: 400 },
    colors: [],
    layers: {
      background: { type: 'solid', color: '#ffffff' },
      slots: [
        {
          id: 'slot-1',
          name: 'Photo',
          dataKey: 'image-1',
          transform: {
            x: 0,
            y: 0,
            width: 200,
            height: 200,
            rotation: 0,
          },
          imageFit: 'cover',
        },
      ],
      texts: [],
    },
    inputFields: [
      {
        key: 'image-1',
        type: 'image',
        label: 'Photo',
        slotId: 'slot-1',
      },
    ],
  }
}

describe('EditorSidebar image upload ordering', () => {
  const revokeObjectURL = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockDeleteEditorImage.mockResolvedValue(true)
    localStorage.clear()
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    })
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: jest.fn(() => 'blob:fallback'),
    })

    useCanvasEditorStore.getState().reset()
    useCanvasEditorStore.getState().loadTemplate(makeTemplate('template-a'))
  })

  it('keeps the latest slot upload and revokes a stale result', async () => {
    useCanvasEditorStore.getState().setImages({ 'image-1': 'blob:existing' })
    const first = deferred<CompressionResult>()
    const second = deferred<CompressionResult>()
    mockProcessImageFile
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const { container } = render(<EditorSidebar />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const firstFile = new File(['first'], 'first.png', { type: 'image/png' })
    const secondFile = new File(['second'], 'second.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [firstFile] } })
    fireEvent.change(input, { target: { files: [secondFile] } })

    // 새 결과가 준비되기 전에는 현재 이미지 URL을 유지해야 한다.
    expect(revokeObjectURL).not.toHaveBeenCalled()
    expect(useCanvasEditorStore.getState().images['image-1']).toBe('blob:existing')

    await act(async () => {
      second.resolve(compressionResult('blob:second', secondFile))
      await second.promise
    })
    await waitFor(() => {
      expect(useCanvasEditorStore.getState().images['image-1']).toBe('blob:second')
    })
    // 기존 URL은 Undo history가 소유할 수 있으므로 업로드 경로에서 직접 해제하지 않는다.
    expect(revokeObjectURL).not.toHaveBeenCalledWith('blob:existing')

    await act(async () => {
      first.resolve(compressionResult('blob:first', firstFile))
      await first.promise
    })
    await waitFor(() => {
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:first')
    })
    expect(useCanvasEditorStore.getState().images['image-1']).toBe('blob:second')
  })

  it('ignores and revokes a result that finishes after unmount', async () => {
    const pending = deferred<CompressionResult>()
    mockProcessImageFile.mockReturnValueOnce(pending.promise)

    const { container, unmount } = render(<EditorSidebar />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    unmount()
    await act(async () => {
      pending.resolve(compressionResult('blob:after-unmount', file))
      await pending.promise
    })

    expect(useCanvasEditorStore.getState().images['image-1']).toBeUndefined()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:after-unmount')
  })

  it('ignores and revokes a result from the previous template', async () => {
    const pending = deferred<CompressionResult>()
    mockProcessImageFile.mockReturnValueOnce(pending.promise)

    const { container } = render(<EditorSidebar />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    act(() => {
      useCanvasEditorStore.getState().loadTemplate(makeTemplate('template-b'))
    })
    await act(async () => {
      pending.resolve(compressionResult('blob:previous-template', file))
      await pending.promise
    })

    expect(useCanvasEditorStore.getState().images['image-1']).toBeUndefined()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:previous-template')
  })

  it('ignores a pending result after the same template is reloaded', async () => {
    const pending = deferred<CompressionResult>()
    mockProcessImageFile.mockReturnValueOnce(pending.promise)

    const { container } = render(<EditorSidebar />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    act(() => {
      useCanvasEditorStore.getState().loadTemplate(makeTemplate('template-a'))
    })
    await act(async () => {
      pending.resolve(compressionResult('blob:previous-document', file))
      await pending.promise
    })

    expect(useCanvasEditorStore.getState().images['image-1']).toBeUndefined()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:previous-document')
  })

  it('stores only the durable HTTP URL when an asset context is active', async () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    mockProcessImageFile.mockResolvedValueOnce(
      compressionResult('blob:compressed', file)
    )
    mockUploadEditorImage.mockResolvedValueOnce({
      url: 'https://cdn.example/editor-assets/user/document/slot.png',
      path: 'user/document/slot.png',
      error: null,
    })

    const { container } = render(
      <EditorSidebar
        assetContext={{ userId: 'user-id', documentId: 'session-id' }}
      />
    )
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockUploadEditorImage).toHaveBeenCalledWith(
        'user-id',
        'session-id',
        'slot-1',
        file
      )
      expect(useCanvasEditorStore.getState().images['image-1']).toBe(
        'https://cdn.example/editor-assets/user/document/slot.png'
      )
    })
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:compressed')
  })

  it('deletes a durable object whose upload finishes after unmount', async () => {
    const pendingUpload = deferred<{
      url: string
      path: string
      error: null
    }>()
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    mockProcessImageFile.mockResolvedValueOnce(
      compressionResult('blob:pending-server', file)
    )
    mockUploadEditorImage.mockReturnValueOnce(pendingUpload.promise)

    const { container, unmount } = render(
      <EditorSidebar
        assetContext={{ userId: 'user-id', documentId: 'session-id' }}
      />
    )
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(mockUploadEditorImage).toHaveBeenCalled())

    unmount()
    await act(async () => {
      pendingUpload.resolve({
        url: 'https://cdn.example/stale.png',
        path: 'user-id/session-id/stale.png',
        error: null,
      })
      await pendingUpload.promise
    })

    await waitFor(() => {
      expect(mockDeleteEditorImage).toHaveBeenCalledWith(
        'user-id/session-id/stale.png'
      )
    })
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:pending-server')
    expect(useCanvasEditorStore.getState().images['image-1']).toBeUndefined()
  })

  it('preserves the existing image and reports an asset upload failure', async () => {
    const onAssetError = jest.fn()
    const uploadError = new Error('storage unavailable')
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    useCanvasEditorStore.getState().setImages({
      'image-1': 'https://cdn.example/existing.png',
    })
    mockProcessImageFile.mockResolvedValueOnce(
      compressionResult('blob:failed-server', file)
    )
    mockUploadEditorImage.mockResolvedValueOnce({
      url: null,
      path: null,
      error: uploadError,
    })

    const { container } = render(
      <EditorSidebar
        assetContext={{ userId: 'user-id', documentId: 'session-id' }}
        onAssetError={onAssetError}
      />
    )
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(onAssetError).toHaveBeenCalledWith(uploadError)
    })
    expect(useCanvasEditorStore.getState().images['image-1']).toBe(
      'https://cdn.example/existing.png'
    )
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:failed-server')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('promotes a local user sticker before adding it to the canvas', async () => {
    const stickerBlob = new Blob(['sticker'], { type: 'image/png' })
    const originalFetch = globalThis.fetch
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: jest.fn().mockResolvedValue({
        ok: true,
        blob: async () => stickerBlob,
      }),
    })
    mockUploadEditorImage.mockResolvedValueOnce({
      url: 'https://cdn.example/editor-assets/user/document/sticker.png',
      path: 'user/document/sticker.png',
      error: null,
    })

    try {
      render(
        <EditorSidebar
          assetContext={{ userId: 'user-id', documentId: 'session-id' }}
        />
      )
      fireEvent.click(screen.getByRole('tab', { name: '스티커' }))
      fireEvent.click(screen.getByTestId('add-user-sticker'))

      await waitFor(() => {
        expect(mockUploadEditorImage).toHaveBeenCalledWith(
          'user-id',
          'session-id',
          'sticker-user-sticker',
          expect.any(Blob)
        )
        expect(
          useCanvasEditorStore.getState().templateConfig?.layers.stickers?.[0]
            .imageUrl
        ).toBe(
          'https://cdn.example/editor-assets/user/document/sticker.png'
        )
      })
    } finally {
      if (originalFetch) {
        Object.defineProperty(globalThis, 'fetch', {
          configurable: true,
          writable: true,
          value: originalFetch,
        })
      } else {
        Reflect.deleteProperty(globalThis, 'fetch')
      }
    }
  })
})
