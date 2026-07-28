const mockUpload = jest.fn()
const mockGetPublicUrl = jest.fn()
const mockRemove = jest.fn()
const mockFrom = jest.fn(() => ({
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
  remove: mockRemove,
}))

jest.mock('@/lib/supabase/client', () => ({
  IS_DEMO_MODE: false,
  createClient: () => ({
    storage: {
      from: mockFrom,
    },
  }),
}))

import {
  deleteEditorImage,
  uploadEditorImage,
} from '@/lib/supabase/storage'

describe('editor asset storage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRemove.mockResolvedValue({ error: null })
  })

  it('uploads an image under the authenticated user folder and returns its public URL', async () => {
    const userId = '11111111-1111-4111-8111-111111111111'
    const blob = new Blob(['pairy'], { type: 'image/png' })
    mockUpload.mockImplementation(async (path: string) => ({
      data: { path },
      error: null,
    }))
    mockGetPublicUrl.mockImplementation((path: string) => ({
      data: { publicUrl: `https://cdn.example/${path}` },
    }))

    const result = await uploadEditorImage(
      userId,
      'session/with unsafe chars',
      'slot:hero',
      blob
    )

    expect(mockFrom).toHaveBeenCalledWith('editor-assets')
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(
          `^${userId}/session-with-unsafe-chars/slot-hero_\\d+_.+\\.png$`
        )
      ),
      blob,
      {
        cacheControl: '31536000',
        upsert: false,
        contentType: 'image/png',
      }
    )
    expect(result.error).toBeNull()
    expect(result.path).toMatch(
      new RegExp(`^${userId}/session-with-unsafe-chars/`)
    )
    expect(result.url).toBe(`https://cdn.example/${result.path}`)
  })

  it('rejects unsupported or oversized image blobs before contacting storage', async () => {
    const unsupported = await uploadEditorImage(
      'user-id',
      'document-id',
      'slot-id',
      new Blob(['text'], { type: 'text/plain' })
    )
    const oversized = await uploadEditorImage(
      'user-id',
      'document-id',
      'slot-id',
      new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], {
        type: 'image/png',
      })
    )

    expect(unsupported.error).toBeInstanceOf(Error)
    expect(oversized.error).toBeInstanceOf(Error)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns storage errors without exposing a partial path', async () => {
    const storageError = new Error('upload denied')
    mockUpload.mockResolvedValue({
      data: null,
      error: storageError,
    })

    const result = await uploadEditorImage(
      '11111111-1111-4111-8111-111111111111',
      'document-id',
      'slot-id',
      new Blob(['pairy'], { type: 'image/webp' })
    )

    expect(result).toEqual({
      url: null,
      path: null,
      error: storageError,
    })
  })

  it('deletes a stale editor object from the same bucket', async () => {
    const path =
      '11111111-1111-4111-8111-111111111111/document-id/stale.png'

    await expect(deleteEditorImage(path)).resolves.toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('editor-assets')
    expect(mockRemove).toHaveBeenCalledWith([path])
  })
})
