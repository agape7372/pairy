/**
 * PSD 파서 유틸리티 단위 테스트
 *
 * @description
 * psdParser 모듈의 핵심 기능을 테스트합니다.
 * - 파일 유효성 검증
 * - 레이어 매핑 제안 생성
 * - 템플릿 데이터 변환
 */

import {
  formatFileSize,
  validatePSDFile,
  generateMappingSuggestions,
  convertToTemplateData,
} from '../psdParser'
import type { ExtractedLayer, LayerMappingSuggestion } from '@/types/psd'
import { MAX_FILE_SIZE } from '@/types/psd'

// ============================================
// Mock 데이터
// ============================================

function createMockFile(
  name: string,
  size: number,
  type: string = 'application/octet-stream'
): File {
  const content = new ArrayBuffer(size)
  const view = new Uint8Array(content)

  // PSD 매직 바이트 (8BPS)
  if (name.endsWith('.psd')) {
    view[0] = 0x38 // '8'
    view[1] = 0x42 // 'B'
    view[2] = 0x50 // 'P'
    view[3] = 0x53 // 'S'
  }

  return new File([content], name, { type })
}

const mockLayers: ExtractedLayer[] = [
  {
    id: 'layer_1',
    name: 'A',
    type: 'image',
    bounds: { x: 50, y: 50, width: 200, height: 300 },
    visibility: 'visible',
    opacity: 1,
    parentId: null,
    depth: 0,
    order: 0,
    imageDataUrl: 'data:image/png;base64,mock',
  },
  {
    id: 'layer_2',
    name: '이름',
    type: 'text',
    bounds: { x: 60, y: 360, width: 180, height: 30 },
    visibility: 'visible',
    opacity: 1,
    parentId: null,
    depth: 0,
    order: 1,
    textContent: '홍길동',
  },
  {
    id: 'layer_3',
    name: '나이 / 180cm / 남',
    type: 'text',
    bounds: { x: 60, y: 400, width: 180, height: 20 },
    visibility: 'visible',
    opacity: 1,
    parentId: null,
    depth: 0,
    order: 2,
  },
  {
    id: 'layer_4',
    name: '머리색',
    type: 'image',
    bounds: { x: 70, y: 100, width: 50, height: 50 },
    visibility: 'visible',
    opacity: 1,
    parentId: null,
    depth: 0,
    order: 3,
  },
  {
    id: 'layer_5',
    name: '왼쪽눈',
    type: 'image',
    bounds: { x: 80, y: 150, width: 30, height: 30 },
    visibility: 'visible',
    opacity: 1,
    parentId: null,
    depth: 0,
    order: 4,
  },
  {
    id: 'layer_6',
    name: '관계성',
    type: 'text',
    bounds: { x: 200, y: 200, width: 100, height: 50 },
    visibility: 'visible',
    opacity: 1,
    parentId: null,
    depth: 0,
    order: 5,
  },
  {
    id: 'layer_7',
    name: '레이어 그룹',
    type: 'group',
    bounds: { x: 0, y: 0, width: 500, height: 500 },
    visibility: 'visible',
    opacity: 1,
    parentId: null,
    depth: 0,
    order: 6,
    children: ['layer_8'],
  },
  {
    id: 'layer_8',
    name: '배경',
    type: 'image',
    bounds: { x: 0, y: 0, width: 500, height: 500 },
    visibility: 'visible',
    opacity: 1,
    parentId: 'layer_7',
    depth: 1,
    order: 0,
  },
]

// ============================================
// formatFileSize 테스트
// ============================================

describe('formatFileSize', () => {
  it('바이트 단위로 포맷팅', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('KB 단위로 포맷팅', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(2048)).toBe('2.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('MB 단위로 포맷팅', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB')
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
  })

  it('0 바이트 처리', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })
})

// ============================================
// validatePSDFile 테스트
// ============================================

describe('validatePSDFile', () => {
  it('올바른 PSD 파일은 null 반환', async () => {
    const file = createMockFile('test.psd', 1024)
    const error = await validatePSDFile(file)
    expect(error).toBeNull()
  })

  it('파일 크기 초과 시 FILE_TOO_LARGE 에러', async () => {
    const file = createMockFile('test.psd', MAX_FILE_SIZE + 1)
    const error = await validatePSDFile(file)
    expect(error).not.toBeNull()
    expect(error?.code).toBe('FILE_TOO_LARGE')
  })

  it('잘못된 확장자는 INVALID_FILE_TYPE 에러', async () => {
    const file = createMockFile('test.jpg', 1024)
    const error = await validatePSDFile(file)
    expect(error).not.toBeNull()
    expect(error?.code).toBe('INVALID_FILE_TYPE')
  })

  it('잘못된 매직 바이트는 CORRUPTED_FILE 에러', async () => {
    // 매직 바이트 없이 파일 생성
    const content = new ArrayBuffer(1024)
    const file = new File([content], 'test.psd', {
      type: 'application/octet-stream',
    })
    const error = await validatePSDFile(file)
    expect(error).not.toBeNull()
    expect(error?.code).toBe('CORRUPTED_FILE')
  })
})

// ============================================
// generateMappingSuggestions 테스트
// ============================================

describe('generateMappingSuggestions', () => {
  it('그룹과 조정 레이어 제외', () => {
    const suggestions = generateMappingSuggestions(mockLayers)
    const hasGroup = suggestions.some(
      (s) => mockLayers.find((l) => l.id === s.layerId)?.type === 'group'
    )
    expect(hasGroup).toBe(false)
  })

  it('캐릭터 레이어(A, B) 인식', () => {
    const suggestions = generateMappingSuggestions(mockLayers)
    const characterSuggestion = suggestions.find((s) => s.layerName === 'A')
    expect(characterSuggestion?.suggestedCategory).toBe('character')
  })

  it('정보 레이어(이름, 나이) 인식', () => {
    const suggestions = generateMappingSuggestions(mockLayers)
    const nameSuggestion = suggestions.find((s) => s.layerName === '이름')
    expect(nameSuggestion?.suggestedCategory).toBe('info')
  })

  it('외모 레이어(머리색, 눈) 인식', () => {
    const suggestions = generateMappingSuggestions(mockLayers)
    const hairSuggestion = suggestions.find((s) => s.layerName === '머리색')
    expect(hairSuggestion?.suggestedCategory).toBe('appearance')
    expect(hairSuggestion?.suggestedOutputType).toBe('colorField')

    const eyeSuggestion = suggestions.find((s) => s.layerName === '왼쪽눈')
    expect(eyeSuggestion?.suggestedCategory).toBe('appearance')
  })

  it('관계 레이어 인식', () => {
    const suggestions = generateMappingSuggestions(mockLayers)
    const relationSuggestion = suggestions.find((s) => s.layerName === '관계성')
    expect(relationSuggestion?.suggestedCategory).toBe('relationship')
  })

  it('신뢰도 0.5 이상인 매핑은 기본 선택', () => {
    const suggestions = generateMappingSuggestions(mockLayers)
    const highConfidence = suggestions.filter((s) => s.confidence >= 0.5)
    expect(highConfidence.every((s) => s.selected)).toBe(true)
  })

  it('미인식 레이어는 unknown 카테고리', () => {
    const customLayers: ExtractedLayer[] = [
      {
        id: 'unknown_1',
        name: '알수없는레이어',
        type: 'image',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        visibility: 'visible',
        opacity: 1,
        parentId: null,
        depth: 0,
        order: 0,
      },
    ]
    const suggestions = generateMappingSuggestions(customLayers)
    expect(suggestions[0].suggestedCategory).toBe('unknown')
    expect(suggestions[0].confidence).toBeLessThan(0.5)
  })
})

// ============================================
// convertToTemplateData 테스트
// ============================================

describe('convertToTemplateData', () => {
  it('선택된 매핑만 변환', () => {
    const mappings: LayerMappingSuggestion[] = [
      {
        layerId: 'layer_1',
        layerName: 'A',
        suggestedCategory: 'character',
        suggestedOutputType: 'slot',
        confidence: 0.8,
        selected: true,
      },
      {
        layerId: 'layer_2',
        layerName: '이름',
        suggestedCategory: 'info',
        suggestedOutputType: 'textField',
        confidence: 0.8,
        selected: true,
      },
      {
        layerId: 'layer_3',
        layerName: '나이',
        suggestedCategory: 'info',
        suggestedOutputType: 'textField',
        confidence: 0.8,
        selected: false, // 선택 안 됨
      },
    ]

    const result = convertToTemplateData(mockLayers, mappings, {
      width: 500,
      height: 500,
    })

    // 선택되지 않은 '나이' 필드는 제외
    const hasAge = result.fields.some((f) => f.label === '나이')
    expect(hasAge).toBe(false)
  })

  it('캐릭터 매핑은 슬롯으로 변환', () => {
    const mappings: LayerMappingSuggestion[] = [
      {
        layerId: 'layer_1',
        layerName: 'A',
        suggestedCategory: 'character',
        suggestedOutputType: 'slot',
        confidence: 0.8,
        selected: true,
      },
    ]

    const result = convertToTemplateData(mockLayers, mappings, {
      width: 500,
      height: 500,
    })

    expect(result.slots.length).toBeGreaterThan(0)
    expect(result.slots[0].label).toBe('A')
  })

  it('슬롯이 없으면 기본 슬롯 생성', () => {
    const mappings: LayerMappingSuggestion[] = [
      {
        layerId: 'layer_2',
        layerName: '이름',
        suggestedCategory: 'info',
        suggestedOutputType: 'textField',
        confidence: 0.8,
        selected: true,
      },
    ]

    const result = convertToTemplateData(mockLayers, mappings, {
      width: 500,
      height: 500,
    })

    expect(result.slots.length).toBe(1)
    expect(result.slots[0].label).toBe('슬롯 1')
  })

  it('이미지 URL 유지', () => {
    const mappings: LayerMappingSuggestion[] = [
      {
        layerId: 'layer_1',
        layerName: 'A',
        suggestedCategory: 'character',
        suggestedOutputType: 'slot',
        confidence: 0.8,
        selected: true,
      },
    ]

    const result = convertToTemplateData(mockLayers, mappings, {
      width: 500,
      height: 500,
    })

    expect(result.slots[0].imageDataUrl).toBe('data:image/png;base64,mock')
  })

  it('colorField는 color 타입 필드로 변환', () => {
    const mappings: LayerMappingSuggestion[] = [
      {
        layerId: 'layer_1',
        layerName: 'A',
        suggestedCategory: 'character',
        suggestedOutputType: 'slot',
        confidence: 0.8,
        selected: true,
      },
      {
        layerId: 'layer_4',
        layerName: '머리색',
        suggestedCategory: 'appearance',
        suggestedOutputType: 'colorField',
        confidence: 0.8,
        selected: true,
      },
    ]

    const result = convertToTemplateData(mockLayers, mappings, {
      width: 500,
      height: 500,
    })

    const hairField = result.fields.find((f) => f.label === '머리색')
    expect(hairField?.type).toBe('color')
  })
})

// ============================================
// 엣지 케이스 테스트
// ============================================

describe('Edge Cases', () => {
  it('빈 레이어 배열 처리', () => {
    const suggestions = generateMappingSuggestions([])
    expect(suggestions).toEqual([])

    const result = convertToTemplateData([], [], { width: 500, height: 500 })
    expect(result.slots.length).toBe(1) // 기본 슬롯
    expect(result.fields.length).toBe(0)
  })

  it('모든 레이어가 숨김 상태', () => {
    const hiddenLayers: ExtractedLayer[] = [
      {
        id: 'hidden_1',
        name: '숨김 레이어',
        type: 'image',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        visibility: 'hidden',
        opacity: 0,
        parentId: null,
        depth: 0,
        order: 0,
      },
    ]

    const suggestions = generateMappingSuggestions(hiddenLayers)
    // 숨김 레이어도 매핑 제안에는 포함
    expect(suggestions.length).toBe(1)
  })

  it('매우 긴 레이어 이름 처리', () => {
    const longNameLayers: ExtractedLayer[] = [
      {
        id: 'long_1',
        name: '이것은 매우 긴 레이어 이름입니다. 한글과 영어가 mixed된 레이어 name that is very long',
        type: 'text',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        visibility: 'visible',
        opacity: 1,
        parentId: null,
        depth: 0,
        order: 0,
      },
    ]

    const suggestions = generateMappingSuggestions(longNameLayers)
    expect(suggestions.length).toBe(1)
    expect(suggestions[0].layerName).toBe(longNameLayers[0].name)
  })

  it('특수 문자 레이어 이름 처리', () => {
    const specialLayers: ExtractedLayer[] = [
      {
        id: 'special_1',
        name: '이름 (캐릭터 A) - 메인',
        type: 'text',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        visibility: 'visible',
        opacity: 1,
        parentId: null,
        depth: 0,
        order: 0,
      },
      {
        id: 'special_2',
        name: '@출처',
        type: 'text',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        visibility: 'visible',
        opacity: 1,
        parentId: null,
        depth: 0,
        order: 1,
      },
    ]

    const suggestions = generateMappingSuggestions(specialLayers)
    expect(suggestions.length).toBe(2)

    // '이름' 포함으로 info 카테고리 인식
    expect(suggestions[0].suggestedCategory).toBe('info')
    // '@출처'로 meta 카테고리 인식
    expect(suggestions[1].suggestedCategory).toBe('meta')
  })

  it('깊은 중첩 그룹 처리', () => {
    const nestedLayers: ExtractedLayer[] = [
      {
        id: 'group_1',
        name: '그룹 1',
        type: 'group',
        bounds: { x: 0, y: 0, width: 500, height: 500 },
        visibility: 'visible',
        opacity: 1,
        parentId: null,
        depth: 0,
        order: 0,
        children: ['group_2'],
      },
      {
        id: 'group_2',
        name: '그룹 2',
        type: 'group',
        bounds: { x: 10, y: 10, width: 480, height: 480 },
        visibility: 'visible',
        opacity: 1,
        parentId: 'group_1',
        depth: 1,
        order: 0,
        children: ['image_1'],
      },
      {
        id: 'image_1',
        name: 'A',
        type: 'image',
        bounds: { x: 20, y: 20, width: 460, height: 460 },
        visibility: 'visible',
        opacity: 1,
        parentId: 'group_2',
        depth: 2,
        order: 0,
      },
    ]

    const suggestions = generateMappingSuggestions(nestedLayers)
    // 그룹은 제외되고 이미지 레이어만 포함
    expect(suggestions.length).toBe(1)
    expect(suggestions[0].layerName).toBe('A')
  })
})
