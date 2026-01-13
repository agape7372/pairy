/**
 * 커스텀 템플릿 localStorage 저장소
 *
 * @description
 * 데모 모드에서 사용자가 만든 PSD 기반 템플릿을
 * localStorage에 저장하고 불러오는 유틸리티입니다.
 */

import type { TemplateConfig, ImageSlot, TextField } from '@/types/template'

// ============================================
// 타입 정의
// ============================================

/** 저장되는 커스텀 템플릿 */
export interface CustomTemplate {
  id: string
  title: string
  description: string
  emoji: string
  tags: string[]
  /** 캔버스 크기 */
  canvasSize: { width: number; height: number }
  /** PSD 합성 이미지 (data URL) */
  compositeImage?: string
  /** 슬롯 데이터 */
  slots: Array<{
    id: string
    label: string
    x: number
    y: number
    width: number
    height: number
  }>
  /** 필드 데이터 */
  fields: Array<{
    id: string
    slotId: string
    label: string
    type: 'text' | 'image'
  }>
  /** 레이어 이미지 데이터 */
  layers?: Array<{
    id: string
    name: string
    imageUrl?: string
    x: number
    y: number
    width: number
    height: number
    visible: boolean
  }>
  createdAt: string
  updatedAt: string
}

/** 저장소 데이터 */
interface StorageData {
  templates: CustomTemplate[]
  version: number
}

// ============================================
// 상수
// ============================================

const STORAGE_KEY = 'pairy-custom-templates'
const STORAGE_VERSION = 1

// ============================================
// 유틸리티 함수
// ============================================

function generateTemplateId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function getStorageData(): StorageData {
  if (typeof window === 'undefined') {
    return { templates: [], version: STORAGE_VERSION }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { templates: [], version: STORAGE_VERSION }
    }

    const data = JSON.parse(raw) as StorageData
    return data
  } catch (err) {
    console.warn('Failed to read custom templates:', err)
    return { templates: [], version: STORAGE_VERSION }
  }
}

function saveStorageData(data: StorageData): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (err) {
    console.error('Failed to save custom templates:', err)
    return false
  }
}

// ============================================
// 공개 API
// ============================================

/**
 * 모든 커스텀 템플릿 가져오기
 */
export function getCustomTemplates(): CustomTemplate[] {
  return getStorageData().templates
}

/**
 * ID로 커스텀 템플릿 가져오기
 */
export function getCustomTemplateById(id: string): CustomTemplate | null {
  const templates = getStorageData().templates
  return templates.find((t) => t.id === id) || null
}

/**
 * 커스텀 템플릿 저장
 */
export function saveCustomTemplate(
  template: Omit<CustomTemplate, 'id' | 'createdAt' | 'updatedAt'>
): { success: boolean; templateId?: string; error?: string } {
  try {
    const data = getStorageData()
    const now = new Date().toISOString()

    const newTemplate: CustomTemplate = {
      ...template,
      id: generateTemplateId(),
      createdAt: now,
      updatedAt: now,
    }

    data.templates.push(newTemplate)

    if (saveStorageData(data)) {
      return { success: true, templateId: newTemplate.id }
    } else {
      return { success: false, error: '저장에 실패했습니다.' }
    }
  } catch (err) {
    console.error('Save template error:', err)
    return { success: false, error: '저장 중 오류가 발생했습니다.' }
  }
}

/**
 * 커스텀 템플릿 업데이트
 */
export function updateCustomTemplate(
  id: string,
  updates: Partial<Omit<CustomTemplate, 'id' | 'createdAt' | 'updatedAt'>>
): boolean {
  const data = getStorageData()
  const index = data.templates.findIndex((t) => t.id === id)

  if (index === -1) {
    return false
  }

  data.templates[index] = {
    ...data.templates[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  return saveStorageData(data)
}

/**
 * 커스텀 템플릿 삭제
 */
export function deleteCustomTemplate(id: string): boolean {
  const data = getStorageData()
  const filteredTemplates = data.templates.filter((t) => t.id !== id)

  if (filteredTemplates.length === data.templates.length) {
    return false // 삭제할 템플릿 없음
  }

  data.templates = filteredTemplates
  return saveStorageData(data)
}

/**
 * 커스텀 템플릿을 에디터용 TemplateConfig로 변환
 */
export function convertToTemplateConfig(template: CustomTemplate): TemplateConfig {
  const { canvasSize, compositeImage, slots, fields, layers } = template

  // 슬롯 설정 변환
  const slotConfigs: ImageSlot[] = slots.map((slot, index) => ({
    id: slot.id,
    name: slot.label,
    dataKey: `slot_${index}_image`, // 데이터 바인딩 키
    transform: {
      x: slot.x + slot.width / 2, // 중심 좌표
      y: slot.y + slot.height / 2,
      width: slot.width,
      height: slot.height,
      rotation: 0,
    },
    imageFit: 'cover' as const,
    border: {
      width: 2,
      color: '#6366f1',
      style: 'dashed' as const,
    },
  }))

  // 텍스트 설정 변환
  const textConfigs: TextField[] = fields
    .filter((f) => f.type === 'text')
    .map((field, index) => {
      // 해당 슬롯 찾기
      const slot = slots.find((s) => s.id === field.slotId)
      const x = slot ? slot.x + slot.width / 2 : canvasSize.width / 2
      const y = slot ? slot.y + (index + 1) * 30 : canvasSize.height / 2

      return {
        id: field.id,
        dataKey: field.id,
        defaultValue: field.label,
        transform: {
          x,
          y,
          width: 200,
          height: 30,
          rotation: 0,
        },
        style: {
          fontFamily: 'Pretendard',
          fontSize: 16,
          fontWeight: 'normal' as const,
          fontStyle: 'normal' as const,
          color: '#333333',
          align: 'center' as const,
          lineHeight: 1.4,
        },
      }
    })

  // 배경 설정 (compositeImage 또는 layers)
  const backgroundConfig = compositeImage
    ? {
        type: 'image' as const,
        src: compositeImage,
      }
    : {
        type: 'solid' as const,
        color: '#ffffff',
      }

  // 입력 필드 설정
  const inputFields = [
    // 슬롯 이미지 입력
    ...slots.map((slot, index) => ({
      key: `slot_${index}_image`,
      type: 'image' as const,
      label: slot.label,
      slotId: slot.id,
    })),
    // 텍스트 입력
    ...fields
      .filter((f) => f.type === 'text')
      .map((f) => ({
        key: f.id,
        type: 'text' as const,
        label: f.label,
        placeholder: f.label,
      })),
  ]

  return {
    id: template.id,
    name: template.title,
    description: template.description,
    category: 'custom',
    tags: template.tags,
    version: '1.0.0',
    canvas: {
      width: canvasSize.width,
      height: canvasSize.height,
    },
    colors: [], // 커스텀 템플릿은 색상 설정 없음
    layers: {
      background: backgroundConfig,
      slots: slotConfigs,
      texts: textConfigs,
    },
    inputFields,
  }
}

/**
 * 커스텀 템플릿인지 확인
 */
export function isCustomTemplateId(templateId: string): boolean {
  return templateId.startsWith('custom_')
}
