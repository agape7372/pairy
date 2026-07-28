import type { ReactNode } from 'react'

const redirectMock = jest.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`)
})

jest.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
  useSearchParams: jest.fn(),
}))
jest.mock('@/components/editor', () => ({
  EditorErrorBoundary: ({ children }: { children: ReactNode }) => children,
}))
jest.mock(
  '@/app/(editor)/canvas-editor/[templateId]/CanvasEditorClient',
  () => function MockCanvasEditorClient() {
    return null
  }
)

import CanvasEditorPage from '@/app/(editor)/canvas-editor/[templateId]/page'
import EditorPage from '@/app/(editor)/editor/[id]/page'

describe('editor document routing', () => {
  beforeEach(() => {
    redirectMock.mockClear()
    jest
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('routes a saved work ID through the work-aware canvas URL', async () => {
    const workId = '11111111-1111-4111-8111-111111111111'

    await expect(
      EditorPage({
        params: Promise.resolve({ id: workId }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow(
      `REDIRECT:/canvas-editor/couple-magazine?work=${workId}`
    )
  })

  it('honors a selected template and assigns a unique draft ID', async () => {
    const templateId = '22222222-2222-4222-8222-222222222222'

    await expect(
      EditorPage({
        params: Promise.resolve({ id: 'new' }),
        searchParams: Promise.resolve({
          template: templateId,
          title: '새 문서',
        }),
      })
    ).rejects.toThrow(
      `REDIRECT:/canvas-editor/${templateId}?title=%EC%83%88+%EB%AC%B8%EC%84%9C&draft=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`
    )
  })

  it('adds a draft ID to direct standalone canvas links', async () => {
    await expect(
      CanvasEditorPage({
        params: Promise.resolve({ templateId: 'couple-magazine' }),
        searchParams: Promise.resolve({ title: 'Direct' }),
      })
    ).rejects.toThrow(
      'REDIRECT:/canvas-editor/couple-magazine?title=Direct&draft=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    )
  })
})
