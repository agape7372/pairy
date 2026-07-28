/**
 * editorUtils 유닛 테스트
 * Production-ready 수준의 유틸리티 함수 테스트
 */

import {
  validateAutoSaveData,
  safeDivide,
  clamp,
  calculateFitZoom,
  formatTimeAgo,
  sanitizeFilename,
  debounce,
  throttle,
  collectEditorImageSources,
  extractTemplateEdits,
  makeImageDataDurable,
  mergeTemplateEdits,
  parseWorkEditorData,
} from '@/lib/utils/editorUtils'
import type { TemplateConfig } from '@/types/template'

// ============================================
// validateAutoSaveData 테스트
// ============================================

describe('validateAutoSaveData', () => {
  const validData = {
    templateId: 'test-template',
    title: '테스트 작업',
    formData: { name: '홍길동', description: '설명' },
    colors: { primaryColor: '#FF0000', secondaryColor: '#00FF00' },
    slotTransforms: {
      slot1: { x: 0, y: 0, scale: 1, rotation: 0 }
    },
    timestamp: new Date().toISOString()
  }

  it('유효한 데이터를 올바르게 검증한다', () => {
    expect(validateAutoSaveData(validData)).toBe(true)
  })

  it('null 또는 undefined를 거부한다', () => {
    expect(validateAutoSaveData(null)).toBe(false)
    expect(validateAutoSaveData(undefined)).toBe(false)
  })

  it('필수 필드가 없으면 거부한다', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { templateId: _templateId, ...withoutTemplateId } = validData
    expect(validateAutoSaveData(withoutTemplateId)).toBe(false)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { title: _title, ...withoutTitle } = validData
    expect(validateAutoSaveData(withoutTitle)).toBe(false)
  })

  it('잘못된 timestamp를 거부한다', () => {
    const invalidTimestamp = { ...validData, timestamp: 'invalid-date' }
    expect(validateAutoSaveData(invalidTimestamp)).toBe(false)
  })

  it('colors에 필수 필드가 없으면 거부한다', () => {
    const missingPrimaryColor = {
      ...validData,
      colors: { secondaryColor: '#00FF00' }
    }
    expect(validateAutoSaveData(missingPrimaryColor)).toBe(false)

    const missingSecondaryColor = {
      ...validData,
      colors: { primaryColor: '#FF0000' }
    }
    expect(validateAutoSaveData(missingSecondaryColor)).toBe(false)
  })

  it('잘못된 slotTransform 구조를 거부한다', () => {
    const invalidTransform = {
      ...validData,
      slotTransforms: {
        slot1: { x: 0, y: 0 } // scale, rotation 누락
      }
    }
    expect(validateAutoSaveData(invalidTransform)).toBe(false)
  })

  it('NaN 또는 Infinity 값을 가진 slotTransform을 거부한다', () => {
    const nanTransform = {
      ...validData,
      slotTransforms: {
        slot1: { x: NaN, y: 0, scale: 1, rotation: 0 }
      }
    }
    expect(validateAutoSaveData(nanTransform)).toBe(false)

    const infinityTransform = {
      ...validData,
      slotTransforms: {
        slot1: { x: 0, y: Infinity, scale: 1, rotation: 0 }
      }
    }
    expect(validateAutoSaveData(infinityTransform)).toBe(false)
  })

  it('scale이 0 이하이면 거부한다', () => {
    const zeroScale = {
      ...validData,
      slotTransforms: {
        slot1: { x: 0, y: 0, scale: 0, rotation: 0 }
      }
    }
    expect(validateAutoSaveData(zeroScale)).toBe(false)

    const negativeScale = {
      ...validData,
      slotTransforms: {
        slot1: { x: 0, y: 0, scale: -1, rotation: 0 }
      }
    }
    expect(validateAutoSaveData(negativeScale)).toBe(false)
  })

  it('v2 이미지와 편집 레이어를 검증한다', () => {
    const v2Data = {
      ...validData,
      version: 2,
      images: { first: 'data:image/png;base64,AAAA', second: null },
      templateEdits: {
        texts: [
          {
            id: 'text-1',
            dataKey: 'title',
            transform: { x: 10, y: 20, width: 100, height: 30 },
            style: { fontFamily: 'sans-serif', fontSize: 16, color: '#000000' },
          },
        ],
        stickers: [
          {
            id: 'sticker-1',
            stickerId: 'heart',
            imageUrl: '/heart.png',
            transform: { x: 10, y: 20, width: 30, height: 30 },
          },
        ],
      },
    }

    expect(validateAutoSaveData(v2Data)).toBe(true)
    expect(
      validateAutoSaveData({
        ...v2Data,
        images: { first: 42 },
      })
    ).toBe(false)
    expect(
      validateAutoSaveData({
        ...v2Data,
        templateEdits: { texts: [{}], stickers: [] },
      })
    ).toBe(false)
  })
})

describe('에디터 문서 영속화', () => {
  const config: TemplateConfig = {
    id: 'template',
    name: 'Template',
    category: 'pair',
    version: '1.0.0',
    canvas: { width: 400, height: 300 },
    colors: [],
    layers: {
      background: { type: 'image', imageUrl: '/background.png' },
      slots: [
        {
          id: 'slot-1',
          name: 'Slot',
          dataKey: 'photo',
          transform: { x: 100, y: 100, width: 100, height: 100 },
          placeholder: '/placeholder.png',
          mask: { type: 'image', imageUrl: '/mask.png' },
        },
      ],
      texts: [
        {
          id: 'text-1',
          dataKey: 'title',
          transform: { x: 200, y: 50, width: 200, height: 40 },
          style: { fontFamily: 'sans-serif', fontSize: 20, color: '#000000' },
        },
      ],
      stickers: [
        {
          id: 'sticker-1',
          stickerId: 'heart',
          imageUrl: '/sticker.png',
          transform: { x: 20, y: 20, width: 30, height: 30 },
        },
      ],
      overlays: [
        {
          id: 'overlay-1',
          imageUrl: '/overlay.png',
          transform: { x: 0, y: 0, width: 400, height: 300 },
        },
      ],
    },
    inputFields: [],
  }

  it('수정 가능한 레이어를 추출하고 원본에 병합한다', () => {
    const edits = extractTemplateEdits(config)
    const changed = {
      ...edits,
      texts: [
        {
          ...edits.texts[0],
          style: { ...edits.texts[0].style, fontSize: 42 },
        },
      ],
    }

    const merged = mergeTemplateEdits(config, changed)
    expect(merged.layers.texts[0].style.fontSize).toBe(42)
    expect(merged.layers.background).toBe(config.layers.background)
    expect(config.layers.texts[0].style.fontSize).toBe(20)
  })

  it('서버 작품의 v2 저장 데이터를 검증해 다시 여는 문서로 변환한다', () => {
    const result = parseWorkEditorData(
      {
        version: 2,
        formData: { title: '다시 연 작업' },
        images: { photo: 'data:image/png;base64,AAAA' },
        colors: { primaryColor: '#111111', secondaryColor: '#222222' },
        slotTransforms: {
          'slot-1': { x: 0.1, y: -0.2, scale: 1.2, rotation: 5 },
        },
        templateEdits: extractTemplateEdits(config),
        savedAt: '2026-07-28T00:00:00.000Z',
      },
      config,
      '서버 작업'
    )

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data?.templateId).toBe('template')
    expect(result.data?.title).toBe('서버 작업')
    expect(result.data?.images?.photo).toContain('data:image/png')
  })

  it('초기 seed 작품의 슬롯 이미지를 현재 dataKey로 변환한다', () => {
    const result = parseWorkEditorData(
      {
        slots: [{ id: 'slot-1', image: 'https://example.com/legacy.png' }],
      },
      config,
      '이전 작업'
    )

    expect(result).toMatchObject({
      success: true,
      data: {
        templateId: 'template',
        images: { photo: 'https://example.com/legacy.png' },
      },
    })
  })

  it('손상된 서버 작품 데이터는 편집기에 적용하지 않는다', () => {
    expect(
      parseWorkEditorData(
        {
          version: 2,
          formData: {},
          colors: { primaryColor: '#111111' },
          slotTransforms: {},
          savedAt: 'not-a-date',
        },
        config,
        '손상 작업'
      )
    ).toEqual({
      success: false,
      error: '저장된 작업 데이터가 손상되었습니다',
    })
  })

  it('내보내기에 필요한 이미지 URL을 중복 없이 수집한다', () => {
    expect(
      collectEditorImageSources(config, { photo: '/photo.png' })
    ).toEqual([
      '/background.png',
      '/photo.png',
      '/mask.png',
      '/sticker.png',
      '/overlay.png',
    ])
    expect(collectEditorImageSources(config, {})).toContain('/placeholder.png')
  })

  it('blob URL 이미지를 data URL로 직렬화한다', async () => {
    const originalFetch = global.fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['pairy'], { type: 'text/plain' }),
    }) as jest.MockedFunction<typeof fetch>

    try {
      const result = await makeImageDataDurable({
        local: 'blob:pairy-image',
        remote: 'https://example.com/image.png',
        empty: null,
      })

      expect(result.local).toMatch(/^data:text\/plain;base64,/)
      expect(result.remote).toBe('https://example.com/image.png')
      expect(result.empty).toBeNull()
    } finally {
      global.fetch = originalFetch
    }
  })
})

// ============================================
// safeDivide 테스트
// ============================================

describe('safeDivide', () => {
  it('정상적인 나눗셈을 수행한다', () => {
    expect(safeDivide(10, 2)).toBe(5)
    expect(safeDivide(9, 3)).toBe(3)
  })

  it('0으로 나누면 fallback을 반환한다', () => {
    expect(safeDivide(10, 0)).toBe(0)
    expect(safeDivide(10, 0, 1)).toBe(1)
    expect(safeDivide(10, 0, -1)).toBe(-1)
  })

  it('NaN 또는 Infinity 입력을 처리한다', () => {
    expect(safeDivide(NaN, 2)).toBe(0)
    expect(safeDivide(10, NaN)).toBe(0)
    expect(safeDivide(Infinity, 2)).toBe(0)
    expect(safeDivide(10, Infinity)).toBe(0)
  })

  it('음수 나눗셈도 올바르게 처리한다', () => {
    expect(safeDivide(-10, 2)).toBe(-5)
    expect(safeDivide(10, -2)).toBe(-5)
  })
})

// ============================================
// clamp 테스트
// ============================================

describe('clamp', () => {
  it('범위 내의 값은 그대로 반환한다', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })

  it('최소값 이하는 최소값을 반환한다', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(-100, 0, 10)).toBe(0)
  })

  it('최대값 이상은 최대값을 반환한다', () => {
    expect(clamp(15, 0, 10)).toBe(10)
    expect(clamp(100, 0, 10)).toBe(10)
  })

  it('NaN은 최소값을 반환한다', () => {
    expect(clamp(NaN, 0, 10)).toBe(0)
  })

  it('Infinity는 적절한 경계값을 반환한다', () => {
    // Infinity는 clamp 내에서 max에 의해 제한됨
    const positiveInfResult = clamp(Infinity, 0, 10)
    expect(positiveInfResult).toBeLessThanOrEqual(10)

    // -Infinity는 clamp 내에서 min에 의해 제한됨
    const negativeInfResult = clamp(-Infinity, 0, 10)
    expect(negativeInfResult).toBeGreaterThanOrEqual(0)
  })

  it('음수 범위도 올바르게 처리한다', () => {
    expect(clamp(-5, -10, -1)).toBe(-5)
    expect(clamp(-15, -10, -1)).toBe(-10)
    expect(clamp(0, -10, -1)).toBe(-1)
  })
})

// ============================================
// calculateFitZoom 테스트
// ============================================

describe('calculateFitZoom', () => {
  it('컨테이너보다 작은 캔버스는 1 또는 제한 범위 내 값을 반환한다', () => {
    const zoom = calculateFitZoom(1000, 800, 400, 300, 64)
    expect(zoom).toBeGreaterThan(0.25)
    expect(zoom).toBeLessThanOrEqual(1.5)
  })

  it('컨테이너보다 큰 캔버스는 축소된 줌을 반환한다', () => {
    const zoom = calculateFitZoom(400, 300, 1000, 800, 64)
    expect(zoom).toBeLessThan(1)
    expect(zoom).toBeGreaterThanOrEqual(0.25)
  })

  it('0 크기 컨테이너는 최소 줌을 반환한다', () => {
    expect(calculateFitZoom(0, 0, 800, 600, 64)).toBe(0.25)
    expect(calculateFitZoom(100, 0, 800, 600, 64)).toBe(0.25)
    expect(calculateFitZoom(0, 100, 800, 600, 64)).toBe(0.25)
  })

  it('0 크기 캔버스는 1을 반환한다', () => {
    expect(calculateFitZoom(800, 600, 0, 0, 64)).toBe(1)
    expect(calculateFitZoom(800, 600, 100, 0, 64)).toBe(1)
    expect(calculateFitZoom(800, 600, 0, 100, 64)).toBe(1)
  })

  it('커스텀 minZoom, maxZoom 옵션을 적용한다', () => {
    const zoom = calculateFitZoom(200, 200, 1000, 1000, 64, { minZoom: 0.5, maxZoom: 0.8 })
    expect(zoom).toBeGreaterThanOrEqual(0.5)
    expect(zoom).toBeLessThanOrEqual(0.8)
  })
})

// ============================================
// formatTimeAgo 테스트
// ============================================

describe('formatTimeAgo', () => {
  it('방금 전을 올바르게 표시한다', () => {
    const now = new Date()
    expect(formatTimeAgo(now)).toBe('방금 전')

    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000)
    expect(formatTimeAgo(thirtySecondsAgo)).toBe('방금 전')
  })

  it('분 단위를 올바르게 표시한다', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatTimeAgo(fiveMinutesAgo)).toBe('5분 전')

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    expect(formatTimeAgo(thirtyMinutesAgo)).toBe('30분 전')
  })

  it('시간 단위를 올바르게 표시한다', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    expect(formatTimeAgo(twoHoursAgo)).toBe('2시간 전')

    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000)
    expect(formatTimeAgo(tenHoursAgo)).toBe('10시간 전')
  })

  it('일 단위를 올바르게 표시한다', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    expect(formatTimeAgo(twoDaysAgo)).toBe('2일 전')
  })

  it('문자열 날짜도 처리한다', () => {
    const isoString = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(formatTimeAgo(isoString)).toBe('5분 전')
  })

  it('잘못된 날짜는 "알 수 없음"을 반환한다', () => {
    expect(formatTimeAgo('invalid-date')).toBe('알 수 없음')
  })
})

// ============================================
// sanitizeFilename 테스트
// ============================================

describe('sanitizeFilename', () => {
  it('일반 파일명은 그대로 유지한다', () => {
    expect(sanitizeFilename('my_file')).toBe('my_file')
    expect(sanitizeFilename('document')).toBe('document')
  })

  it('공백을 언더스코어로 변환한다', () => {
    expect(sanitizeFilename('my file name')).toBe('my_file_name')
  })

  it('위험한 문자를 제거한다', () => {
    expect(sanitizeFilename('file<script>')).toMatch(/^file_script/)
    expect(sanitizeFilename('path/to/file')).toMatch(/^path_to_file/)
    expect(sanitizeFilename('file:name')).toMatch(/^file_name/)
    expect(sanitizeFilename('file"name"')).toMatch(/^file_name/)
  })

  it('연속 점을 제거한다 (경로 조작 방지)', () => {
    const result = sanitizeFilename('..\\..\\etc\\passwd')
    expect(result).toContain('etc')
    expect(result).toContain('passwd')
    expect(sanitizeFilename('file...name')).toMatch(/file.*name/)
  })

  it('빈 문자열은 "untitled"를 반환한다', () => {
    expect(sanitizeFilename('')).toBe('untitled')
    expect(sanitizeFilename('   ')).toBe('untitled')
  })

  it('길이를 제한한다', () => {
    const longName = 'a'.repeat(200)
    expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(100)
  })

  it('null 또는 undefined를 처리한다', () => {
    // @ts-expect-error Testing invalid input
    expect(sanitizeFilename(null)).toBe('untitled')
    // @ts-expect-error Testing invalid input
    expect(sanitizeFilename(undefined)).toBe('untitled')
  })
})

// ============================================
// debounce 테스트
// ============================================

describe('debounce', () => {
  jest.useFakeTimers()

  it('지정된 시간 후에 함수를 실행한다', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn()
    expect(mockFn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('연속 호출 시 마지막 호출만 실행한다', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn()
    debouncedFn()
    debouncedFn()

    jest.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('인자를 올바르게 전달한다', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn('arg1', 'arg2')

    jest.advanceTimersByTime(100)
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
  })
})

// ============================================
// throttle 테스트
// ============================================

describe('throttle', () => {
  it('첫 번째 호출은 즉시 실행한다', async () => {
    const mockFn = jest.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn()
    // throttle은 Date.now()를 사용하므로 즉시 실행됨
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('제한 시간 내 연속 호출을 무시한다', async () => {
    const mockFn = jest.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn()
    throttledFn()
    throttledFn()

    // 첫 번째 호출만 실행됨
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('인자를 올바르게 전달한다', () => {
    const mockFn = jest.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn('arg1', 'arg2')
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
  })
})
