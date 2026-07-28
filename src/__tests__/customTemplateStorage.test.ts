import {
  convertDatabaseTemplateToConfig,
  convertToTemplateConfig,
  type CustomTemplate,
} from '@/lib/utils/customTemplateStorage'
import type { Json } from '@/types/database.types'

const baseCustomTemplate: CustomTemplate = {
  id: 'custom_test',
  title: 'Custom',
  description: '',
  emoji: '🎨',
  tags: [],
  canvasSize: { width: 600, height: 400 },
  compositeImage: 'https://example.com/background.png',
  slots: [
    {
      id: 'slot-1',
      label: 'Photo',
      x: 10,
      y: 20,
      width: 200,
      height: 300,
    },
  ],
  fields: [],
  createdAt: '2026-07-28T00:00:00.000Z',
  updatedAt: '2026-07-28T00:00:00.000Z',
}

describe('customTemplateStorage conversion', () => {
  it('uses the composite image as a renderable background URL', () => {
    const config = convertToTemplateConfig(baseCustomTemplate)

    expect(config.layers.background).toEqual({
      type: 'image',
      imageUrl: 'https://example.com/background.png',
    })
  })

  it('converts a current database template after runtime validation', () => {
    const config = convertDatabaseTemplateToConfig({
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Server template',
      description: 'Description',
      preview_url: 'https://example.com/preview.png',
      editor_data: {
        emoji: '🍓',
        tags: ['pair'],
        canvasSize: { width: 800, height: 600 },
        slots: baseCustomTemplate.slots,
        fields: [
          {
            id: 'name',
            slotId: 'slot-1',
            label: 'Name',
            type: 'text',
          },
        ],
        layers: [],
      } as unknown as Json,
      created_at: '2026-07-28T00:00:00.000Z',
      updated_at: '2026-07-28T00:00:00.000Z',
    })

    expect(config.id).toBe('11111111-1111-1111-1111-111111111111')
    expect(config.canvas).toEqual({ width: 800, height: 600 })
    expect(config.layers.slots[0].dataKey).toBe('slot_0_image')
    expect(config.layers.texts[0].dataKey).toBe('name')
    expect(config.layers.background.imageUrl).toBe(
      'https://example.com/preview.png'
    )
  })

  it('derives a safe canvas size for legacy database templates', () => {
    const config = convertDatabaseTemplateToConfig({
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Legacy',
      description: null,
      preview_url: '',
      editor_data: {
        slots: [
          { id: 'A', x: 500, y: 300, width: 200, height: 250 },
        ],
      } as unknown as Json,
      created_at: '2026-07-28T00:00:00.000Z',
      updated_at: '2026-07-28T00:00:00.000Z',
    })

    expect(config.canvas).toEqual({ width: 750, height: 600 })
    expect(config.layers.background).toEqual({
      type: 'solid',
      color: '#ffffff',
    })
  })

  it('rejects malformed database slot geometry', () => {
    expect(() =>
      convertDatabaseTemplateToConfig({
        id: '33333333-3333-3333-3333-333333333333',
        title: 'Broken',
        description: null,
        preview_url: '',
        editor_data: {
          slots: [{ id: 'A', x: 0, y: 0, width: -1, height: 100 }],
        } as unknown as Json,
        created_at: '2026-07-28T00:00:00.000Z',
        updated_at: '2026-07-28T00:00:00.000Z',
      })
    ).toThrow('템플릿 슬롯 1의 형식이 올바르지 않습니다')
  })
})
