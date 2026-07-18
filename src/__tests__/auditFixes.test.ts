/**
 * 2026-07-18 구조 감사 수정 검증 테스트
 * - C1: 내보내기 게이팅 정책 (exportPolicy)
 * - C2: undo/redo 히스토리 확장 (텍스트 스타일·스티커·레이어·캐릭터)
 * - C3: blob URL 지연 revoke (히스토리 참조 보존)
 * - C8: persist 템플릿 스코핑
 * - A1: /editor/[id] 분류기
 * - C7: randomId (nanoid 대체)
 */

import { useCanvasEditorStore } from '@/stores/canvasEditorStore'
import { getExportPolicy } from '@/lib/utils/exportPolicy'
import { classifyEditorId } from '@/components/pages/EditorRedirectClient'
import { randomId } from '@/lib/utils/editorUtils'
import type { TemplateConfig, StickerLayer } from '@/types/template'
import type { Character } from '@/types/database.types'

const mockTemplateConfig: TemplateConfig = {
  id: 'audit-template',
  name: 'Audit Template',
  category: 'pair',
  version: '1.0.0',
  canvas: { width: 800, height: 600 },
  colors: [
    { key: 'primaryColor', label: 'Primary', defaultValue: '#FFD9D9' },
  ],
  layers: {
    background: { type: 'solid', color: '#FFFFFF' },
    slots: [
      {
        id: 'slot-1',
        name: 'Slot 1',
        dataKey: 'image1',
        transform: { x: 0, y: 0, width: 200, height: 200 },
      },
    ],
    texts: [
      {
        id: 'text-1',
        dataKey: 'title',
        transform: { x: 100, y: 50, width: 200, height: 50 },
        style: { fontFamily: 'sans-serif', fontSize: 24, color: '#000000' },
      },
    ],
  },
  inputFields: [
    { key: 'image1', type: 'image', label: 'Image 1' },
    { key: 'title', type: 'text', label: 'Title' },
  ],
}

const mockSticker: StickerLayer = {
  id: 'sticker-1',
  stickerId: 'pack-heart',
  imageUrl: 'data:image/png;base64,xyz',
  transform: { x: 10, y: 10, width: 50, height: 50 },
}

const mockCharacter = {
  id: 'char-1',
  user_id: 'user-1',
  name: '딸기',
  color: '#FF6B6B',
  metadata: { hairColor: '#4A3728', eyeColor: '#3498DB', mainColor: '#FF6B6B' },
} as unknown as Character

describe('C1: getExportPolicy 티어 게이팅', () => {
  it('무료 티어는 스케일 1로 클램프되고 워터마크가 강제된다', () => {
    const policy = getExportPolicy('free', 3)
    expect(policy.scale).toBe(1)
    expect(policy.canExportHighRes).toBe(false)
    expect(policy.hasWatermark).toBe(true)
    expect(policy.watermark?.text).toContain('페어리에서 만듦')
    expect(policy.watermark?.position).toBe('bottom-right')
  })

  it('프리미엄 티어는 요청 스케일 그대로, 워터마크 없음', () => {
    const policy = getExportPolicy('premium', 3)
    expect(policy.scale).toBe(3)
    expect(policy.canExportHighRes).toBe(true)
    expect(policy.watermark).toBeUndefined()
  })

  it('duo/creator 티어도 고해상도·워터마크 프리', () => {
    for (const tier of ['duo', 'creator'] as const) {
      const policy = getExportPolicy(tier, 2)
      expect(policy.scale).toBe(2)
      expect(policy.watermark).toBeUndefined()
    }
  })
})

describe('C2: undo/redo 히스토리 확장', () => {
  beforeEach(() => {
    useCanvasEditorStore.getState().reset()
    useCanvasEditorStore.getState().loadTemplate(mockTemplateConfig)
  })

  it('스티커 추가가 undo 로 사라지고 redo 로 복원된다', () => {
    const store = useCanvasEditorStore.getState()
    store.addSticker(mockSticker)

    expect(useCanvasEditorStore.getState().templateConfig?.layers.stickers).toHaveLength(1)

    useCanvasEditorStore.getState().undo()
    expect(useCanvasEditorStore.getState().templateConfig?.layers.stickers ?? []).toHaveLength(0)

    useCanvasEditorStore.getState().redo()
    expect(useCanvasEditorStore.getState().templateConfig?.layers.stickers).toHaveLength(1)
  })

  it('스티커 undo 시 삭제된 스티커의 선택 상태가 정리된다', () => {
    useCanvasEditorStore.getState().addSticker(mockSticker)
    expect(useCanvasEditorStore.getState().selectedStickerId).toBe('sticker-1')

    useCanvasEditorStore.getState().undo()
    expect(useCanvasEditorStore.getState().selectedStickerId).toBeNull()
  })

  it('텍스트 스타일 변경이 undo 로 원복된다', () => {
    useCanvasEditorStore.getState().updateTextStyle('text-1', { fontSize: 40 })
    expect(
      useCanvasEditorStore.getState().templateConfig?.layers.texts[0].style.fontSize
    ).toBe(40)

    useCanvasEditorStore.getState().undo()
    expect(
      useCanvasEditorStore.getState().templateConfig?.layers.texts[0].style.fontSize
    ).toBe(24)
  })

  it('텍스트 효과 변경이 undo 로 원복된다', () => {
    useCanvasEditorStore.getState().updateTextEffects('text-1', { stroke: { color: '#000', width: 2 } })
    expect(useCanvasEditorStore.getState().templateConfig?.layers.texts[0].effects?.stroke).toBeDefined()

    useCanvasEditorStore.getState().undo()
    expect(useCanvasEditorStore.getState().templateConfig?.layers.texts[0].effects?.stroke).toBeUndefined()
  })

  it('레이어 가시성 토글이 undo 로 원복된다', () => {
    useCanvasEditorStore.getState().toggleLayerVisible('slot-1')
    expect(useCanvasEditorStore.getState().layerStates['slot-1'].visible).toBe(false)

    useCanvasEditorStore.getState().undo()
    expect(useCanvasEditorStore.getState().layerStates['slot-1'].visible).toBe(true)
  })

  it('캐릭터 적용이 undo 로 완전히 해제된다 (selectedCharacter 포함)', () => {
    useCanvasEditorStore.getState().applyCharacter(mockCharacter)
    expect(useCanvasEditorStore.getState().selectedCharacter?.id).toBe('char-1')
    expect(useCanvasEditorStore.getState().characterColors).not.toBeNull()

    useCanvasEditorStore.getState().undo()
    expect(useCanvasEditorStore.getState().selectedCharacter).toBeNull()
    expect(useCanvasEditorStore.getState().characterColors).toBeNull()
  })

  it('무관한 변경(색상)과 스티커 변경이 히스토리에서 독립적으로 되돌아간다', () => {
    useCanvasEditorStore.getState().updateColor('primaryColor', '#123456')
    useCanvasEditorStore.getState().addSticker(mockSticker)

    // 1차 undo: 스티커만 사라짐, 색상 유지
    useCanvasEditorStore.getState().undo()
    let state = useCanvasEditorStore.getState()
    expect(state.templateConfig?.layers.stickers ?? []).toHaveLength(0)
    expect(state.colors.primaryColor).toBe('#123456')

    // 2차 undo: 색상 원복
    useCanvasEditorStore.getState().undo()
    state = useCanvasEditorStore.getState()
    expect(state.colors.primaryColor).toBe('#FFD9D9')
  })
})

describe('C3: blob URL 지연 revoke', () => {
  const revokeSpy = jest.fn()
  const origRevoke = URL.revokeObjectURL

  beforeEach(() => {
    revokeSpy.mockClear()
    URL.revokeObjectURL = revokeSpy
    useCanvasEditorStore.getState().reset()
    revokeSpy.mockClear() // reset 자체의 정리 호출 무시
    useCanvasEditorStore.getState().loadTemplate(mockTemplateConfig)
  })

  afterAll(() => {
    URL.revokeObjectURL = origRevoke
  })

  it('이미지 교체 시 이전 blob URL 을 즉시 revoke 하지 않는다 (히스토리 보존)', () => {
    useCanvasEditorStore.getState().updateImage('image1', 'blob:http://x/aaa')
    useCanvasEditorStore.getState().updateImage('image1', 'blob:http://x/bbb')

    expect(revokeSpy).not.toHaveBeenCalledWith('blob:http://x/aaa')

    // undo 로 이전 이미지가 살아서 돌아온다
    useCanvasEditorStore.getState().undo()
    expect(useCanvasEditorStore.getState().images.image1).toBe('blob:http://x/aaa')
  })

  it('redo 가지 절단으로 스냅샷이 탈락하면 고아 blob 만 revoke 된다', () => {
    useCanvasEditorStore.getState().updateImage('image1', 'blob:http://x/aaa')
    useCanvasEditorStore.getState().updateImage('image1', 'blob:http://x/bbb')
    useCanvasEditorStore.getState().undo() // 현재 aaa, redo 가지에 bbb

    // 새 변경 → redo 가지(bbb 스냅샷) 탈락 → bbb 는 어디에도 없으므로 revoke
    useCanvasEditorStore.getState().updateColor('primaryColor', '#000000')

    expect(revokeSpy).toHaveBeenCalledWith('blob:http://x/bbb')
    expect(revokeSpy).not.toHaveBeenCalledWith('blob:http://x/aaa')
  })

  it('템플릿 전환 시 이전 세션의 모든 blob 이 정리된다', () => {
    useCanvasEditorStore.getState().updateImage('image1', 'blob:http://x/aaa')
    useCanvasEditorStore.getState().loadTemplate({ ...mockTemplateConfig, id: 'other-template' })

    expect(revokeSpy).toHaveBeenCalledWith('blob:http://x/aaa')
  })
})

describe('C8: persist 템플릿 스코핑', () => {
  beforeEach(() => {
    useCanvasEditorStore.getState().reset()
  })

  it('같은 템플릿 재로드 시 기존 사용자 데이터가 병합 승계된다', () => {
    useCanvasEditorStore.getState().loadTemplate(mockTemplateConfig)
    useCanvasEditorStore.getState().updateFormField('title', '내 제목')

    // 리하이드레이트 후 재로드 시나리오 (templateId 일치)
    useCanvasEditorStore.getState().loadTemplate(mockTemplateConfig)
    expect(useCanvasEditorStore.getState().formData.title).toBe('내 제목')
  })

  it('다른 템플릿 로드 시 이전 formData 가 누출되지 않는다', () => {
    useCanvasEditorStore.getState().loadTemplate(mockTemplateConfig)
    useCanvasEditorStore.getState().updateFormField('title', '내 제목')

    useCanvasEditorStore.getState().loadTemplate({ ...mockTemplateConfig, id: 'other-template' })
    expect(useCanvasEditorStore.getState().formData.title).toBeUndefined()
    expect(useCanvasEditorStore.getState().templateId).toBe('other-template')
  })
})

describe('A1: hydrateEditorData (서버 work 하이드레이션)', () => {
  beforeEach(() => {
    useCanvasEditorStore.getState().reset()
    useCanvasEditorStore.getState().loadTemplate(mockTemplateConfig)
  })

  it('서버 데이터를 일괄 적용하고 히스토리를 재시작한다', () => {
    useCanvasEditorStore.getState().hydrateEditorData({
      formData: { title: '서버 제목' },
      colors: {
        primaryColor: '#ABCDEF',
        secondaryColor: '#D7FAFA',
        accentColor: '#FF6B6B',
        textColor: '#3D3636',
      },
    })

    const state = useCanvasEditorStore.getState()
    expect(state.formData.title).toBe('서버 제목')
    expect(state.colors.primaryColor).toBe('#ABCDEF')
    expect(state.isDirty).toBe(false)
    expect(state.canUndo()).toBe(false)
  })

  it('세션 간 해석 불가능한 blob: URL 은 걸러낸다', () => {
    useCanvasEditorStore.getState().hydrateEditorData({
      images: { image1: 'blob:http://dead/url', image2: 'https://cdn.example.com/ok.png' },
    })

    const { images } = useCanvasEditorStore.getState()
    expect(images.image1).toBeUndefined()
    expect(images.image2).toBe('https://cdn.example.com/ok.png')
  })
})

describe('A1: classifyEditorId', () => {
  it('레거시 id 를 구분한다', () => {
    for (const id of ['new', '1', '2', '3', 'undefined']) {
      expect(classifyEditorId(id)).toBe('legacy')
    }
  })

  it('UUID 를 work 후보로 구분한다', () => {
    expect(classifyEditorId('123e4567-e89b-12d3-a456-426614174000')).toBe('uuid')
  })

  it('그 외는 템플릿 id 로 취급한다', () => {
    for (const id of ['couple-magazine', 'template-3', 'custom_abc', '999']) {
      expect(classifyEditorId(id)).toBe('template')
    }
  })
})

describe('C7: randomId', () => {
  it('요청 길이의 영숫자 id 를 만든다', () => {
    const id = randomId(12)
    expect(id).toHaveLength(12)
    expect(id).toMatch(/^[A-Za-z0-9]+$/)
    expect(randomId(8)).toHaveLength(8)
  })

  it('호출마다 다른 값을 반환한다', () => {
    const ids = new Set(Array.from({ length: 50 }, () => randomId(12)))
    expect(ids.size).toBe(50)
  })
})
