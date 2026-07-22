/**
 * 자료 형식 라벨 — 형식 배열이 비어도 크래시 없이 정직한 라벨을 낸다.
 * 회귀 대상: 자료 허브(/templates)에서 `format[0].toUpperCase()` 로 전체 페이지가 죽던 버그.
 * (file_name 이 null 인 외부링크 자료, 또는 KNOWN_FORMATS 밖 확장자 zip/pdf 등)
 */

import { resourceFormatLabel, type Resource } from '@/types/resources'

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 'r1',
    title: '테스트 자료',
    description: '',
    category: 'imeres',
    tags: [],
    creator: { id: 'u1', displayName: '작성자', username: 'author', isVerified: false },
    fileInfo: { format: [], width: 0, height: 0, sizeKB: 0, hasTransparency: false },
    license: 'free',
    stats: { views: 0, downloads: 0, likes: 0, uses: 0 },
    thumbnailUrl: '',
    previewUrls: [],
    createdAt: '2026-07-23',
    updatedAt: '2026-07-23',
    isPremium: false,
    ...overrides,
  }
}

describe('resourceFormatLabel', () => {
  it('알려진 형식이면 대문자 확장자를 반환한다', () => {
    const resource = makeResource({
      fileInfo: { format: ['png'], width: 0, height: 0, sizeKB: 0, hasTransparency: true },
    })
    expect(resourceFormatLabel(resource)).toBe('PNG')
  })

  it('형식이 비어도 던지지 않는다 (허브 크래시 회귀)', () => {
    expect(() => resourceFormatLabel(makeResource())).not.toThrow()
  })

  it('형식이 비었지만 첨부 파일이 있으면 "파일"', () => {
    const resource = makeResource({ downloadUrl: 'https://example.com/a.zip' })
    expect(resourceFormatLabel(resource)).toBe('파일')
  })

  it('형식이 비고 외부 링크만 있으면 "링크"', () => {
    const resource = makeResource({ externalUrl: 'https://github.com/foo/bar' })
    expect(resourceFormatLabel(resource)).toBe('링크')
  })

  it('형식·파일·링크 모두 없으면 빈 문자열 (배지 미표시)', () => {
    expect(resourceFormatLabel(makeResource())).toBe('')
  })
})
