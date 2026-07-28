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

const originalRevokeObjectURL = URL.revokeObjectURL
const revokeObjectURLMock = jest.fn()

describe('canvasEditorStore', () => {
  beforeAll(() => {
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURLMock,
    })
  })

  beforeEach(() => {
    // 스토어 초기화
    useCanvasEditorStore.getState().reset()
    revokeObjectURLMock.mockClear()
  })

  afterAll(() => {
    if (originalRevokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        value: originalRevokeObjectURL,
      })
    } else {
      Reflect.deleteProperty(URL, 'revokeObjectURL')
    }
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
    const { loadTemplate, updateColor, flushHistory } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    const initialHistoryLength = useCanvasEditorStore.getState().history.length

    updateColor('primaryColor', '#FF0000')
    flushHistory()

    const state = useCanvasEditorStore.getState()
    expect(state.colors.primaryColor).toBe('#FF0000')
    expect(state.history.length).toBeGreaterThan(initialHistoryLength)
  })

  it('should coalesce continuous color input into one undo step', () => {
    jest.useFakeTimers()
    try {
      const { loadTemplate, updateColor, undo, redo } = useCanvasEditorStore.getState()
      loadTemplate(mockTemplateConfig)

      const initialHistoryLength = useCanvasEditorStore.getState().history.length
      updateColor('primaryColor', '#FFAAAA')
      updateColor('primaryColor', '#FF5555')
      updateColor('primaryColor', '#FF0000')

      expect(useCanvasEditorStore.getState().history).toHaveLength(initialHistoryLength)

      jest.advanceTimersByTime(300)
      expect(useCanvasEditorStore.getState().history).toHaveLength(initialHistoryLength + 1)

      undo()
      expect(useCanvasEditorStore.getState().colors.primaryColor).toBe('#FFD9D9')

      redo()
      expect(useCanvasEditorStore.getState().colors.primaryColor).toBe('#FF0000')
    } finally {
      useCanvasEditorStore.getState().reset()
      jest.useRealTimers()
    }
  })

  it('should include template style changes in undo and redo', () => {
    const {
      loadTemplate,
      updateTextStyle,
      flushHistory,
      undo,
      redo,
    } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    updateTextStyle('text-1', { fontSize: 40 })
    flushHistory()
    expect(
      useCanvasEditorStore.getState().templateConfig?.layers.texts[0].style.fontSize
    ).toBe(40)

    undo()
    expect(
      useCanvasEditorStore.getState().templateConfig?.layers.texts[0].style.fontSize
    ).toBe(24)

    redo()
    expect(
      useCanvasEditorStore.getState().templateConfig?.layers.texts[0].style.fontSize
    ).toBe(40)
  })

  it('should expose pending history and committed index changes reactively', () => {
    jest.useFakeTimers()
    const historyStates: Array<[boolean, number, number]> = []
    let unsubscribe = () => {}

    try {
      const { loadTemplate, updateColor, getHistoryInfo } =
        useCanvasEditorStore.getState()
      loadTemplate(mockTemplateConfig)

      unsubscribe = useCanvasEditorStore.subscribe(
        (state) =>
          [
            state.hasPendingHistory,
            state.historyIndex,
            state.history.length,
          ] as [boolean, number, number],
        (state) => historyStates.push(state)
      )

      updateColor('primaryColor', '#FF0000')

      expect(useCanvasEditorStore.getState().hasPendingHistory).toBe(true)
      expect(getHistoryInfo()).toEqual({
        current: 2,
        total: 2,
        canUndo: 1,
        canRedo: 0,
      })

      jest.advanceTimersByTime(300)

      const state = useCanvasEditorStore.getState()
      expect(state.hasPendingHistory).toBe(false)
      expect(state.historyIndex).toBe(1)
      expect(state.history).toHaveLength(2)
      expect(historyStates).toContainEqual([true, 0, 1])
      expect(historyStates).toContainEqual([false, 1, 2])
    } finally {
      unsubscribe()
      useCanvasEditorStore.getState().reset()
      jest.useRealTimers()
    }
  })

  it('should cancel a pending snapshot when continuous input returns to its baseline', () => {
    jest.useFakeTimers()
    try {
      const { loadTemplate, updateColor, canUndo } =
        useCanvasEditorStore.getState()
      loadTemplate(mockTemplateConfig)

      updateColor('primaryColor', '#FF0000')
      expect(useCanvasEditorStore.getState().hasPendingHistory).toBe(true)

      updateColor('primaryColor', '#FFD9D9')
      jest.runAllTimers()

      const state = useCanvasEditorStore.getState()
      expect(state.hasPendingHistory).toBe(false)
      expect(state.history).toHaveLength(1)
      expect(state.historyIndex).toBe(0)
      expect(canUndo()).toBe(false)
    } finally {
      useCanvasEditorStore.getState().reset()
      jest.useRealTimers()
    }
  })

  it('should cancel template history when a style returns to its baseline', () => {
    jest.useFakeTimers()
    try {
      const { loadTemplate, updateTextStyle, canUndo } =
        useCanvasEditorStore.getState()
      loadTemplate(mockTemplateConfig)

      updateTextStyle('text-1', { fontSize: 40 })
      updateTextStyle('text-1', { fontSize: 24 })
      jest.runAllTimers()

      const state = useCanvasEditorStore.getState()
      expect(state.templateConfig?.layers.texts[0].style.fontSize).toBe(24)
      expect(state.hasPendingHistory).toBe(false)
      expect(state.history).toHaveLength(1)
      expect(canUndo()).toBe(false)
    } finally {
      useCanvasEditorStore.getState().reset()
      jest.useRealTimers()
    }
  })

  it('should keep different image filter controls in separate undo steps', () => {
    const {
      loadTemplate,
      setImageFilters,
      flushHistory,
      undo,
    } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    const initialHistoryLength = useCanvasEditorStore.getState().history.length
    setImageFilters('slot-1', { brightness: 20 })
    setImageFilters('slot-1', { contrast: 30 })
    flushHistory()

    expect(useCanvasEditorStore.getState().history).toHaveLength(
      initialHistoryLength + 2
    )

    undo()
    const filters = useCanvasEditorStore.getState().slotTransforms['slot-1']?.filters
    expect(filters?.brightness).toBe(20)
    expect(filters?.contrast).toBeUndefined()
  })

  it('should keep different text style and nested effect controls in separate undo steps', () => {
    const {
      loadTemplate,
      updateTextStyle,
      updateTextEffects,
      flushHistory,
      undo,
    } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    const initialHistoryLength = useCanvasEditorStore.getState().history.length
    updateTextStyle('text-1', { fontSize: 30 })
    updateTextStyle('text-1', { align: 'left' })
    flushHistory()

    expect(useCanvasEditorStore.getState().history).toHaveLength(
      initialHistoryLength + 2
    )

    undo()
    let text = useCanvasEditorStore.getState().templateConfig?.layers.texts[0]
    expect(text?.style.fontSize).toBe(30)
    expect(text?.style.align).toBeUndefined()

    updateTextEffects('text-1', {
      shadow: { color: '#000000', blur: 4, offsetX: 2, offsetY: 2 },
    })
    flushHistory()
    const effectsHistoryLength = useCanvasEditorStore.getState().history.length

    updateTextEffects('text-1', {
      shadow: { color: '#000000', blur: 8, offsetX: 2, offsetY: 2 },
    })
    updateTextEffects('text-1', {
      shadow: { color: '#000000', blur: 8, offsetX: 6, offsetY: 2 },
    })
    flushHistory()

    expect(useCanvasEditorStore.getState().history).toHaveLength(
      effectsHistoryLength + 2
    )

    undo()
    text = useCanvasEditorStore.getState().templateConfig?.layers.texts[0]
    expect(text?.effects?.shadow?.blur).toBe(8)
    expect(text?.effects?.shadow?.offsetX).toBe(2)
  })

  it('should ignore no-op and missing template targets without creating history', () => {
    const {
      loadTemplate,
      updateTextStyle,
      updateTextEffects,
      clearTextEffects,
      updateStickerTransform,
      removeSticker,
    } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    const initialState = useCanvasEditorStore.getState()
    const initialConfig = initialState.templateConfig
    const initialHistoryLength = initialState.history.length

    updateTextStyle('text-1', { fontSize: 24 })
    updateTextStyle('missing-text', { fontSize: 40 })
    updateTextEffects('text-1', {})
    updateTextEffects('missing-text', {
      glow: { color: '#FFFFFF', blur: 8 },
    })
    clearTextEffects('text-1')
    updateStickerTransform('missing-sticker', { x: 10 })
    removeSticker('missing-sticker')

    const state = useCanvasEditorStore.getState()
    expect(state.templateConfig).toBe(initialConfig)
    expect(state.history).toHaveLength(initialHistoryLength)
    expect(state.hasPendingHistory).toBe(false)
    expect(state.isDirty).toBe(false)
  })

  it('should restore editor data atomically, cancel pending work, and discard stale redo', () => {
    jest.useFakeTimers()
    try {
      const {
        loadTemplate,
        updateFormField,
        updateColor,
        flushHistory,
        undo,
        redo,
        selectText,
        restoreEditorData,
        canRedo,
      } = useCanvasEditorStore.getState()
      loadTemplate(mockTemplateConfig)

      updateFormField('title', 'First')
      flushHistory()
      updateFormField('title', 'Second')
      flushHistory()
      undo()

      updateColor('primaryColor', '#FF0000')
      selectText('text-1')

      const beforeRestore = useCanvasEditorStore.getState()
      const undoStepsBefore =
        beforeRestore.historyIndex + (beforeRestore.hasPendingHistory ? 1 : 0)
      expect(beforeRestore.hasPendingHistory).toBe(true)

      restoreEditorData({
        templateConfig: {
          ...mockTemplateConfig,
          name: 'Restored Template',
        },
        formData: { title: 'Restored' },
        images: { image1: 'blob:restored-image' },
        colors: {
          ...beforeRestore.colors,
          primaryColor: '#00FF00',
        },
        slotTransforms: {
          'slot-1': {
            x: 0.25,
            y: 0,
            scale: 1,
            rotation: 0,
          },
        },
      })

      jest.runAllTimers()

      let state = useCanvasEditorStore.getState()
      expect(state.hasPendingHistory).toBe(false)
      expect(state.historyIndex).toBe(undoStepsBefore + 1)
      expect(state.formData.title).toBe('Restored')
      expect(state.images.image1).toBe('blob:restored-image')
      expect(state.colors.primaryColor).toBe('#00FF00')
      expect(state.templateConfig?.name).toBe('Restored Template')
      expect(state.selectedTextId).toBe('text-1')
      expect(state.isDirty).toBe(true)
      expect(canRedo()).toBe(false)
      expect(
        state.history.some((snapshot) => snapshot.formData.title === 'Second')
      ).toBe(false)

      undo()
      state = useCanvasEditorStore.getState()
      expect(state.formData.title).toBe('First')
      expect(state.colors.primaryColor).toBe('#FF0000')

      redo()
      expect(useCanvasEditorStore.getState().formData.title).toBe('Restored')
    } finally {
      useCanvasEditorStore.getState().reset()
      jest.useRealTimers()
    }
  })

  it('should load a saved editor document as a clean history baseline', () => {
    const { loadTemplate, updateFormField, loadEditorData, canUndo } =
      useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)
    updateFormField('title', 'unsaved transient value')

    loadEditorData({
      templateConfig: {
        ...mockTemplateConfig,
        name: 'Saved Template',
      },
      formData: { title: 'Saved title' },
      images: { image1: 'https://example.com/saved.png' },
      colors: {
        primaryColor: '#123456',
        secondaryColor: '#654321',
      },
      slotTransforms: {
        'slot-1': { x: 0.2, y: -0.1, scale: 1.4, rotation: 10 },
      },
    })

    const state = useCanvasEditorStore.getState()
    expect(state.formData.title).toBe('Saved title')
    expect(state.templateConfig?.name).toBe('Saved Template')
    expect(state.history).toHaveLength(1)
    expect(state.historyIndex).toBe(0)
    expect(state.hasPendingHistory).toBe(false)
    expect(state.isDirty).toBe(false)
    expect(canUndo()).toBe(false)
  })

  it('should clear selections that do not exist in restored template data', () => {
    const { loadTemplate, selectText, restoreEditorData } =
      useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)
    selectText('text-1')

    const configWithoutTargets: TemplateConfig = {
      ...mockTemplateConfig,
      layers: {
        ...mockTemplateConfig.layers,
        slots: [],
        texts: [],
        stickers: [],
      },
    }

    restoreEditorData({
      templateConfig: configWithoutTargets,
      formData: {},
      images: {},
      colors: useCanvasEditorStore.getState().colors,
      slotTransforms: {},
    })

    const state = useCanvasEditorStore.getState()
    expect(state.selectedSlotId).toBeNull()
    expect(state.selectedTextId).toBeNull()
    expect(state.selectedStickerId).toBeNull()
    expect(state.layerStates).toEqual({})
  })

  it('should keep blob URLs alive while update, remove, setImages, or Undo can reference them', () => {
    const {
      loadTemplate,
      updateImage,
      removeImage,
      setImages,
      undo,
    } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    updateImage('image1', 'blob:first')
    updateImage('image1', 'blob:second')
    expect(revokeObjectURLMock).not.toHaveBeenCalled()

    undo()
    expect(useCanvasEditorStore.getState().images.image1).toBe('blob:first')

    removeImage('image1')
    // 새 분기를 만들면서 더는 Undo/Redo로 도달할 수 없는 URL만 해제한다.
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:second')
    expect(revokeObjectURLMock).not.toHaveBeenCalledWith('blob:first')
    undo()
    expect(useCanvasEditorStore.getState().images.image1).toBe('blob:first')

    setImages({ image1: 'blob:bulk-replacement' })
    expect(revokeObjectURLMock).not.toHaveBeenCalledWith('blob:first')
    expect(revokeObjectURLMock).not.toHaveBeenCalledWith('blob:bulk-replacement')
  })

  it('should revoke blob URLs after their snapshots fall out of bounded history', () => {
    const { loadTemplate, updateImage } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    for (let index = 0; index < 51; index += 1) {
      updateImage('image1', `blob:bounded-${index}`)
    }

    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:bounded-0')
    expect(revokeObjectURLMock).not.toHaveBeenCalledWith('blob:bounded-50')
  })

  it('should revoke blob URLs when a new edit discards their redo branch', () => {
    const { loadTemplate, updateImage, undo } =
      useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)
    updateImage('image1', 'blob:first-branch')
    updateImage('image1', 'blob:discarded-redo')

    undo()
    updateImage('image1', 'blob:new-branch')

    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:discarded-redo')
    expect(revokeObjectURLMock).not.toHaveBeenCalledWith('blob:first-branch')
    expect(revokeObjectURLMock).not.toHaveBeenCalledWith('blob:new-branch')
  })

  it('should promote asset URLs across current state and undo history atomically', () => {
    const configWithSticker: TemplateConfig = {
      ...mockTemplateConfig,
      layers: {
        ...mockTemplateConfig.layers,
        stickers: [
          {
            id: 'sticker-1',
            stickerId: 'user-sticker',
            imageUrl: 'blob:sticker',
            transform: {
              x: 0,
              y: 0,
              width: 40,
              height: 40,
              rotation: 0,
            },
            opacity: 1,
            flipX: false,
            flipY: false,
          },
        ],
      },
    }
    const { loadTemplate, updateImage, replaceAssetUrls } =
      useCanvasEditorStore.getState()
    loadTemplate(configWithSticker)
    updateImage('image1', 'blob:image-old')
    updateImage('image1', 'blob:image-current')

    const before = useCanvasEditorStore.getState()
    replaceAssetUrls({
      'blob:sticker': 'https://cdn.example/sticker.png',
      'blob:image-old': 'https://cdn.example/image-old.png',
      'blob:image-current': 'https://cdn.example/image-current.png',
    })

    const state = useCanvasEditorStore.getState()
    expect(state.images.image1).toBe('https://cdn.example/image-current.png')
    expect(state.templateConfig?.layers.stickers?.[0].imageUrl).toBe(
      'https://cdn.example/sticker.png'
    )
    expect(JSON.stringify(state.history)).not.toContain('blob:')
    expect(state.history).toHaveLength(before.history.length)
    expect(state.historyIndex).toBe(before.historyIndex)
    expect(state.isDirty).toBe(before.isDirty)
    expect(revokeObjectURLMock.mock.calls.map(([url]) => url).sort()).toEqual([
      'blob:image-current',
      'blob:image-old',
      'blob:sticker',
    ])
  })

  it('should revoke each referenced blob URL once when loading a new template', () => {
    const { loadTemplate, updateImage } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)
    updateImage('image1', 'blob:first')
    updateImage('image1', 'blob:second')

    loadTemplate(mockTemplateConfig)

    expect(revokeObjectURLMock).toHaveBeenCalledTimes(2)
    expect(
      revokeObjectURLMock.mock.calls.map(([url]) => url).sort()
    ).toEqual(['blob:first', 'blob:second'])
  })

  it('should revoke current and historical blob URLs once on reset', () => {
    const { loadTemplate, updateImage, setImages, reset } =
      useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)
    updateImage('image1', 'blob:historical')
    setImages({
      image1: 'blob:current',
      image2: 'blob:current',
    })

    reset()

    expect(revokeObjectURLMock).toHaveBeenCalledTimes(2)
    expect(
      revokeObjectURLMock.mock.calls.map(([url]) => url).sort()
    ).toEqual(['blob:current', 'blob:historical'])
  })

  it('should handle undo and redo', () => {
    const {
      loadTemplate,
      updateFormField,
      flushHistory,
      undo,
      redo,
      canUndo,
      canRedo,
    } = useCanvasEditorStore.getState()
    loadTemplate(mockTemplateConfig)

    // 초기 상태에서는 undo 불가
    expect(canUndo()).toBe(false)

    // 변경 후 undo 가능
    updateFormField('title', 'First')
    flushHistory()
    updateFormField('title', 'Second')
    flushHistory()

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
