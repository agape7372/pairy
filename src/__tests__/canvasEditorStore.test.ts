import { useCanvasEditorStore } from '@/stores/canvasEditorStore'
import type { TemplateConfig } from '@/types/template'

// 테스트용 템플릿 설정
const mockTemplateConfig: TemplateConfig = {
  id: 'test-template',
  name: 'Test Template',
  category: 'pair',
  version: '1.0.0',
  canvas: {
    width: 800,
    height: 600,
  },
  colors: [
    { key: 'primaryColor', label: 'Primary', defaultValue: '#FFD9D9' },
    { key: 'secondaryColor', label: 'Secondary', defaultValue: '#D7FAFA' },
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

describe('canvasEditorStore', () => {
  beforeEach(() => {
    // 스토어 초기화
    useCanvasEditorStore.getState().reset()
  })

  it('should initialize with default state', () => {
    const state = useCanvasEditorStore.getState()
    expect(state.templateConfig).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.isDirty).toBe(false)
    expect(state.zoom).toBe(1)
  })

  it('should load template correctly', () => {
    const { loadTemplate } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    const state = useCanvasEditorStore.getState()
    expect(state.templateConfig).toEqual(mockTemplateConfig)
    expect(state.colors.primaryColor).toBe('#FFD9D9')
    expect(state.colors.secondaryColor).toBe('#D7FAFA')
    expect(state.selectedSlotId).toBe('slot-1')
  })

  it('should update form field and mark dirty', () => {
    const { loadTemplate, updateFormField } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    updateFormField('title', 'Test Title')

    const state = useCanvasEditorStore.getState()
    expect(state.formData.title).toBe('Test Title')
    expect(state.isDirty).toBe(true)
  })

  it('should update color and push to history', () => {
    const { loadTemplate, updateColor } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    const initialHistoryLength = useCanvasEditorStore.getState().history.length

    updateColor('primaryColor', '#FF0000')

    const state = useCanvasEditorStore.getState()
    expect(state.colors.primaryColor).toBe('#FF0000')
    expect(state.history.length).toBeGreaterThan(initialHistoryLength)
  })

  it('should handle undo and redo', () => {
    const { loadTemplate, updateFormField, undo, redo, canUndo, canRedo } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    // 초기 상태에서는 undo 불가
    expect(canUndo()).toBe(false)

    // 변경 후 undo 가능
    updateFormField('title', 'First')
    updateFormField('title', 'Second')

    expect(canUndo()).toBe(true)
    expect(useCanvasEditorStore.getState().formData.title).toBe('Second')

    // Undo
    undo()
    expect(useCanvasEditorStore.getState().formData.title).toBe('First')
    expect(canRedo()).toBe(true)

    // Redo
    redo()
    expect(useCanvasEditorStore.getState().formData.title).toBe('Second')
  })

  it('should handle zoom within limits', () => {
    const { setZoom } = useCanvasEditorStore.getState()

    setZoom(1.5)
    expect(useCanvasEditorStore.getState().zoom).toBe(1.5)

    // Max limit (2)
    setZoom(3)
    expect(useCanvasEditorStore.getState().zoom).toBe(2)

    // Min limit (0.25)
    setZoom(0.1)
    expect(useCanvasEditorStore.getState().zoom).toBe(0.25)
  })

  it('should update slot transform', () => {
    const { loadTemplate, updateSlotTransform, getSlotTransform } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    updateSlotTransform('slot-1', { x: 0.5, y: -0.3, scale: 1.2 })

    const transform = getSlotTransform('slot-1')
    expect(transform.x).toBe(0.5)
    expect(transform.y).toBe(-0.3)
    expect(transform.scale).toBe(1.2)
  })

  it('should reset slot transform', () => {
    const { loadTemplate, updateSlotTransform, resetSlotTransform, getSlotTransform } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    updateSlotTransform('slot-1', { x: 0.5, y: -0.3, scale: 1.2 })
    resetSlotTransform('slot-1')

    const transform = getSlotTransform('slot-1')
    expect(transform.x).toBe(0)
    expect(transform.y).toBe(0)
    expect(transform.scale).toBe(1)
    expect(transform.rotation).toBe(0)
  })
})
