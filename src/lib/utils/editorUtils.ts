'use client'

import type {
  FormData as TemplateFormData,
  ImageData,
  ColorData,
  SlotTransforms,
  StickerLayer,
  TemplateConfig,
  TextField,
} from '@/types/template'

/**
 * 에디터 유틸리티 함수 모음
 * Production-ready 수준의 타입 안전성과 에러 처리
 */

// ============================================
// 타입 정의
// ============================================

/** 자동 저장 데이터 스키마 */
export interface AutoSaveData {
  /** v1 데이터에는 이 필드가 없으므로 하위 호환을 위해 optional */
  version?: 2
  templateId: string
  title: string
  formData: TemplateFormData
  images?: ImageData
  colors: ColorData
  slotTransforms: SlotTransforms
  /** 사용자가 변경할 수 있는 텍스트/스티커 레이어만 저장해 큰 원본 템플릿 중복을 피한다. */
  templateEdits?: TemplateEdits
  timestamp: string
}

/** 원본 템플릿에서 사용자가 실제로 수정할 수 있는 레이어 */
export interface TemplateEdits {
  texts: TextField[]
  stickers: StickerLayer[]
}

/** 슬롯 변환 정보 */
export interface SlotTransform {
  x: number
  y: number
  scale: number
  rotation: number
}

/** localStorage 작업 결과 */
export type StorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: StorageError }

/** 스토리지 에러 타입 */
export type StorageError =
  | { type: 'quota_exceeded'; message: string }
  | { type: 'security_error'; message: string }
  | { type: 'parse_error'; message: string }
  | { type: 'validation_error'; message: string; details?: string }
  | { type: 'unknown'; message: string }

// ============================================
// 스키마 검증
// ============================================

/**
 * AutoSaveData 스키마 검증
 * 런타임에 데이터 구조를 검증하여 타입 안전성 보장
 */
export function validateAutoSaveData(data: unknown): data is AutoSaveData {
  if (!data || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>

  // 필수 필드 검증
  if (typeof obj.templateId !== 'string') return false
  if (typeof obj.title !== 'string') return false
  if (typeof obj.timestamp !== 'string') return false
  if (obj.version !== undefined && obj.version !== 2) return false

  // formData 검증 (Record<string, string>)
  if (!obj.formData || typeof obj.formData !== 'object') return false
  if (!isStringRecord(obj.formData)) return false

  // colors 검증 (ColorData - primaryColor, secondaryColor 필수)
  if (!obj.colors || typeof obj.colors !== 'object') return false
  const colorsObj = obj.colors as Record<string, unknown>
  if (typeof colorsObj.primaryColor !== 'string') return false
  if (typeof colorsObj.secondaryColor !== 'string') return false

  // v2 이미지 데이터 검증 (v1에는 필드가 없음)
  if (obj.images !== undefined && !isNullableStringRecord(obj.images)) return false

  // slotTransforms 검증
  if (!obj.slotTransforms || typeof obj.slotTransforms !== 'object') return false
  if (!isSlotTransformsRecord(obj.slotTransforms)) return false

  // v2 편집 가능 템플릿 레이어 검증
  if (obj.templateEdits !== undefined && !isTemplateEdits(obj.templateEdits)) {
    return false
  }

  // timestamp 유효성 검증
  const date = new Date(obj.timestamp)
  if (isNaN(date.getTime())) return false

  return true
}

/** Record<string, string | undefined> 타입 검증 */
function isStringRecord(obj: unknown): obj is Record<string, string | undefined> {
  if (!obj || typeof obj !== 'object') return false

  for (const value of Object.values(obj)) {
    if (value !== undefined && typeof value !== 'string') return false
  }
  return true
}

/** Record<string, string | null> 타입 검증 */
function isNullableStringRecord(obj: unknown): obj is ImageData {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false

  for (const value of Object.values(obj)) {
    if (value !== null && typeof value !== 'string') return false
  }
  return true
}

function isFiniteTransform(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  const transform = obj as Record<string, unknown>
  return (
    typeof transform.x === 'number' &&
    isFinite(transform.x) &&
    typeof transform.y === 'number' &&
    isFinite(transform.y) &&
    typeof transform.width === 'number' &&
    isFinite(transform.width) &&
    transform.width > 0 &&
    typeof transform.height === 'number' &&
    isFinite(transform.height) &&
    transform.height > 0 &&
    (transform.rotation === undefined ||
      (typeof transform.rotation === 'number' && isFinite(transform.rotation)))
  )
}

function isTemplateEdits(value: unknown): value is TemplateEdits {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const edits = value as Record<string, unknown>
  if (!Array.isArray(edits.texts) || !Array.isArray(edits.stickers)) return false

  const validTexts = edits.texts.every((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false
    const text = item as Record<string, unknown>
    return (
      typeof text.id === 'string' &&
      typeof text.dataKey === 'string' &&
      isFiniteTransform(text.transform) &&
      !!text.style &&
      typeof text.style === 'object' &&
      !Array.isArray(text.style)
    )
  })

  const validStickers = edits.stickers.every((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false
    const sticker = item as Record<string, unknown>
    return (
      typeof sticker.id === 'string' &&
      typeof sticker.stickerId === 'string' &&
      typeof sticker.imageUrl === 'string' &&
      isFiniteTransform(sticker.transform)
    )
  })

  return validTexts && validStickers
}

/** SlotTransforms Record 타입 검증 */
function isSlotTransformsRecord(obj: unknown): obj is Record<string, SlotTransform> {
  if (!obj || typeof obj !== 'object') return false

  for (const value of Object.values(obj)) {
    if (!isSlotTransform(value)) return false
  }
  return true
}

// ============================================
// 에디터 문서 영속화
// ============================================

/** 편집 가능한 텍스트/스티커 레이어만 추출한다. */
export function extractTemplateEdits(config: TemplateConfig): TemplateEdits {
  return {
    texts: config.layers.texts,
    stickers: config.layers.stickers || [],
  }
}

/** 저장된 편집 레이어를 현재 원본 템플릿에 안전하게 병합한다. */
export function mergeTemplateEdits(
  config: TemplateConfig,
  edits?: TemplateEdits
): TemplateConfig {
  if (!edits) return config

  return {
    ...config,
    layers: {
      ...config.layers,
      texts: edits.texts,
      stickers: edits.stickers,
    },
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('이미지를 직렬화할 수 없습니다'))
      }
    }
    reader.onerror = () => reject(reader.error || new Error('이미지를 읽을 수 없습니다'))
    reader.readAsDataURL(blob)
  })
}

/** 새로고침 후 무효가 되는 blob URL을 영속 가능한 data URL로 바꾼다. */
export async function makeUrlDurable(url: string): Promise<string> {
  if (!url.startsWith('blob:')) return url

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('임시 이미지를 읽을 수 없습니다')
  }
  return blobToDataUrl(await response.blob())
}

/** 이미지 슬롯 URL을 병렬 직렬화한다. */
export async function makeImageDataDurable(images: ImageData): Promise<ImageData> {
  const entries = await Promise.all(
    Object.entries(images).map(async ([key, url]) => [
      key,
      url ? await makeUrlDurable(url) : null,
    ] as const)
  )
  return Object.fromEntries(entries)
}

/** 사용자 스티커 URL도 문서와 함께 다시 열 수 있도록 직렬화한다. */
export async function makeTemplateEditsDurable(
  edits: TemplateEdits
): Promise<TemplateEdits> {
  return {
    texts: edits.texts,
    stickers: await Promise.all(
      edits.stickers.map(async (sticker) => ({
        ...sticker,
        imageUrl: await makeUrlDurable(sticker.imageUrl),
      }))
    ),
  }
}

/** 내보내기 전에 렌더러가 필요로 하는 이미지 URL을 중복 없이 수집한다. */
export function collectEditorImageSources(
  config: TemplateConfig,
  images: ImageData
): string[] {
  const sources = new Set<string>()
  const add = (value?: string | null) => {
    if (value) sources.add(value)
  }

  if (config.layers.background.type === 'image') {
    add(config.layers.background.imageUrl)
  }
  config.layers.slots.forEach((slot) => {
    const userImage = images[slot.dataKey]
    add(userImage || slot.placeholder)
    if (slot.mask?.type === 'image') add(slot.mask.imageUrl)
  })
  config.layers.stickers?.forEach((sticker) => add(sticker.imageUrl))
  config.layers.overlays?.forEach((overlay) => add(overlay.imageUrl))

  return [...sources]
}

/** SlotTransform 타입 검증 */
function isSlotTransform(obj: unknown): obj is SlotTransform {
  if (!obj || typeof obj !== 'object') return false

  const t = obj as Record<string, unknown>
  return (
    typeof t.x === 'number' && isFinite(t.x) &&
    typeof t.y === 'number' && isFinite(t.y) &&
    typeof t.scale === 'number' && isFinite(t.scale) && t.scale > 0 &&
    typeof t.rotation === 'number' && isFinite(t.rotation)
  )
}

export type WorkEditorDataParseResult =
  | { success: true; data: AutoSaveData | null }
  | { success: false; error: string }

function getTemplateDefaultColors(config: TemplateConfig): ColorData {
  const colors: ColorData = {
    primaryColor: '#FFD9D9',
    secondaryColor: '#D7FAFA',
    accentColor: '#FF6B6B',
    textColor: '#3D3636',
  }

  config.colors.forEach((color) => {
    colors[color.key] = color.defaultValue
  })
  return colors
}

function getTemplateDefaultFormData(config: TemplateConfig): TemplateFormData {
  const formData: TemplateFormData = {}
  config.inputFields.forEach((field) => {
    if (field.defaultValue !== undefined) {
      formData[field.key] = field.defaultValue
    }
  })
  return formData
}

/**
 * works.editor_data를 현재 자동 저장 문서 스키마로 정규화한다.
 *
 * v1/v2 캔버스 저장 형식과 초기 seed의 `slots: [{ id, image }]` 형식을
 * 지원하며, 알 수 없는 JSON은 편집기 상태에 넣기 전에 거부한다.
 */
export function parseWorkEditorData(
  value: unknown,
  config: TemplateConfig,
  title: string
): WorkEditorDataParseResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { success: false, error: '저장된 작업 데이터 형식이 올바르지 않습니다' }
  }

  const record = value as Record<string, unknown>
  if (Object.keys(record).length === 0) {
    return { success: true, data: null }
  }

  const hasCanvasDocumentFields = [
    'version',
    'formData',
    'images',
    'colors',
    'slotTransforms',
    'templateEdits',
    'savedAt',
    'timestamp',
  ].some((key) => Object.prototype.hasOwnProperty.call(record, key))

  if (hasCanvasDocumentFields) {
    if (record.version !== undefined && record.version !== 2) {
      return { success: false, error: '지원하지 않는 작업 데이터 버전입니다' }
    }

    const candidate: AutoSaveData = {
      version: record.version === 2 ? 2 : undefined,
      templateId: config.id,
      title,
      formData: record.formData as TemplateFormData,
      images: record.images as ImageData | undefined,
      colors: record.colors as ColorData,
      slotTransforms: record.slotTransforms as SlotTransforms,
      templateEdits: record.templateEdits as TemplateEdits | undefined,
      timestamp:
        typeof record.savedAt === 'string'
          ? record.savedAt
          : (record.timestamp as string),
    }

    if (!validateAutoSaveData(candidate)) {
      return { success: false, error: '저장된 작업 데이터가 손상되었습니다' }
    }
    return { success: true, data: candidate }
  }

  // 초기 작품 seed는 슬롯 ID와 이미지 URL만 저장했다.
  if (Array.isArray(record.slots)) {
    const images: ImageData = {}
    for (const item of record.slots) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return { success: false, error: '저장된 슬롯 데이터가 손상되었습니다' }
      }

      const slotRecord = item as Record<string, unknown>
      if (typeof slotRecord.id !== 'string' || typeof slotRecord.image !== 'string') {
        return { success: false, error: '저장된 슬롯 데이터가 손상되었습니다' }
      }

      const slot = config.layers.slots.find(
        (candidate) => candidate.id === slotRecord.id
      )
      if (slot) images[slot.dataKey] = slotRecord.image
    }

    return {
      success: true,
      data: {
        templateId: config.id,
        title,
        formData: getTemplateDefaultFormData(config),
        images,
        colors: getTemplateDefaultColors(config),
        slotTransforms: {},
        timestamp: new Date(0).toISOString(),
      },
    }
  }

  return { success: false, error: '지원하지 않는 작업 데이터 형식입니다' }
}

// ============================================
// 안전한 localStorage 작업
// ============================================

/**
 * localStorage에서 안전하게 데이터 읽기
 * 모든 예외 상황을 처리하고 타입 안전한 결과 반환
 */
export function safeGetAutoSaveData(key: string): StorageResult<AutoSaveData | null> {
  try {
    // localStorage 접근 가능 여부 확인 (private browsing 등)
    if (typeof window === 'undefined' || !window.localStorage) {
      return { success: true, data: null }
    }

    const raw = localStorage.getItem(key)
    if (!raw) {
      return { success: true, data: null }
    }

    // JSON 파싱
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      // 손상된 데이터 삭제
      localStorage.removeItem(key)
      return {
        success: false,
        error: { type: 'parse_error', message: '저장된 데이터가 손상되었습니다' }
      }
    }

    // 스키마 검증
    if (!validateAutoSaveData(parsed)) {
      // 유효하지 않은 데이터 삭제
      localStorage.removeItem(key)
      return {
        success: false,
        error: { type: 'validation_error', message: '저장된 데이터 형식이 유효하지 않습니다' }
      }
    }

    return { success: true, data: parsed }

  } catch (e) {
    // SecurityError (private browsing) 처리
    if (e instanceof DOMException && e.name === 'SecurityError') {
      return {
        success: false,
        error: { type: 'security_error', message: '브라우저 보안 설정으로 저장소에 접근할 수 없습니다' }
      }
    }

    return {
      success: false,
      error: { type: 'unknown', message: e instanceof Error ? e.message : '알 수 없는 오류' }
    }
  }
}

/**
 * localStorage에 안전하게 데이터 저장
 * 용량 초과 및 기타 예외 상황 처리
 */
export function safeSetAutoSaveData(key: string, data: AutoSaveData): StorageResult<void> {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        success: false,
        error: { type: 'security_error', message: '저장소를 사용할 수 없습니다' }
      }
    }

    const json = JSON.stringify(data)
    localStorage.setItem(key, json)

    return { success: true, data: undefined }

  } catch (e) {
    if (e instanceof DOMException) {
      if (e.name === 'QuotaExceededError') {
        return {
          success: false,
          error: { type: 'quota_exceeded', message: '저장 공간이 부족합니다. 오래된 데이터를 정리해주세요.' }
        }
      }
      if (e.name === 'SecurityError') {
        return {
          success: false,
          error: { type: 'security_error', message: '브라우저 보안 설정으로 저장할 수 없습니다' }
        }
      }
    }

    return {
      success: false,
      error: { type: 'unknown', message: e instanceof Error ? e.message : '저장 실패' }
    }
  }
}

/**
 * localStorage에서 안전하게 데이터 삭제
 */
export function safeRemoveAutoSaveData(key: string): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key)
      return true
    }
    return false
  } catch {
    return false
  }
}

// ============================================
// 수학 유틸리티 (안전한 계산)
// ============================================

/**
 * 안전한 나눗셈 (0으로 나누기 방지)
 */
export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (denominator === 0 || !isFinite(denominator)) return fallback
  if (!isFinite(numerator)) return fallback
  return numerator / denominator
}

/**
 * 값을 범위 내로 제한 (clamp)
 */
export function clamp(value: number, min: number, max: number): number {
  if (!isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}

/**
 * 화면 맞춤 줌 계산 (안전한 버전)
 */
export function calculateFitZoom(
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 64,
  options: { minZoom?: number; maxZoom?: number; margin?: number } = {}
): number {
  const { minZoom = 0.25, maxZoom = 1.5, margin = 0.95 } = options

  // 유효성 검사
  if (containerWidth <= 0 || containerHeight <= 0) return minZoom
  if (canvasWidth <= 0 || canvasHeight <= 0) return 1

  const availableWidth = Math.max(0, containerWidth - padding)
  const availableHeight = Math.max(0, containerHeight - padding)

  if (availableWidth <= 0 || availableHeight <= 0) return minZoom

  const scaleX = safeDivide(availableWidth, canvasWidth, minZoom)
  const scaleY = safeDivide(availableHeight, canvasHeight, minZoom)
  const fitZoom = Math.min(scaleX, scaleY) * margin

  return clamp(fitZoom, minZoom, maxZoom)
}

// ============================================
// 시간 포맷팅
// ============================================

/**
 * 상대 시간 포맷 (예: "5분 전")
 */
export function formatTimeAgo(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date

  if (isNaN(targetDate.getTime())) return '알 수 없음'

  const seconds = Math.floor((Date.now() - targetDate.getTime()) / 1000)

  if (seconds < 0) return '방금 전' // 미래 시간 처리
  if (seconds < 60) return '방금 전'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}일 전`

  // 7일 이상: 날짜로 표시
  return targetDate.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric'
  })
}

// ============================================
// 파일명 처리
// ============================================

/**
 * 안전한 파일명 생성 (XSS, 경로 조작 방지)
 */
export function sanitizeFilename(filename: string, maxLength: number = 100): string {
  if (!filename || typeof filename !== 'string') return 'untitled'

  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // 파일시스템 금지 문자 제거
    .replace(/\.{2,}/g, '_') // 연속 점 제거 (경로 조작 방지)
    .replace(/^\.+|\.+$/g, '_') // 시작/끝 점 제거
    .replace(/\s+/g, '_') // 공백을 언더스코어로
    .replace(/_+/g, '_') // 연속 언더스코어 정리
    .replace(/^_+|_+$/g, '') // 시작/끝 언더스코어 제거
    .slice(0, maxLength)
    || 'untitled'
}

// ============================================
// 디바운스 / 스로틀
// ============================================

/**
 * 디바운스 함수 (타입 안전)
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), wait)
  }
}

/**
 * 스로틀 함수 (타입 안전)
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= limit) {
      lastCall = now
      func(...args)
    }
  }
}

// ============================================
// 이미지 유틸리티
// ============================================

/**
 * 이미지 로드 프로미스 (타임아웃 포함)
 */
export function loadImage(
  src: string,
  options: { timeout?: number; crossOrigin?: string } = {}
): Promise<HTMLImageElement> {
  const { timeout = 30000, crossOrigin = 'anonymous' } = options

  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = crossOrigin

    const timeoutId = setTimeout(() => {
      img.src = '' // 로드 취소
      reject(new Error('이미지 로드 시간 초과'))
    }, timeout)

    img.onload = () => {
      clearTimeout(timeoutId)
      resolve(img)
    }

    img.onerror = () => {
      clearTimeout(timeoutId)
      reject(new Error(`이미지를 불러올 수 없습니다: ${src}`))
    }

    img.src = src
  })
}

/**
 * Blob URL 생성 및 관리
 */
export function createManagedBlobUrl(blob: Blob): { url: string; revoke: () => void } {
  const url = URL.createObjectURL(blob)
  return {
    url,
    revoke: () => URL.revokeObjectURL(url)
  }
}

// ============================================
// 접근성 유틸리티
// ============================================

/**
 * Focus trap 생성 (모달용)
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void
  deactivate: () => void
} {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ')

  let previousActiveElement: Element | null = null

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    const focusableElements = Array.from(
      container.querySelectorAll(focusableSelectors)
    ) as HTMLElement[]

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }

  return {
    activate: () => {
      previousActiveElement = document.activeElement
      container.addEventListener('keydown', handleKeyDown)

      // 첫 번째 포커스 가능한 요소로 포커스 이동
      const firstFocusable = container.querySelector(focusableSelectors) as HTMLElement | null
      if (firstFocusable) {
        firstFocusable.focus()
      }
    },
    deactivate: () => {
      container.removeEventListener('keydown', handleKeyDown)

      // 이전 포커스 복원
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus()
      }
    }
  }
}

// ============================================
// 에러 메시지 매핑
// ============================================

/**
 * StorageError를 사용자 친화적 메시지로 변환
 */
export function getStorageErrorMessage(error: StorageError): string {
  switch (error.type) {
    case 'quota_exceeded':
      return '저장 공간이 부족합니다. 브라우저의 사이트 데이터를 정리하거나 다른 작업을 삭제해주세요.'
    case 'security_error':
      return '프라이빗 브라우징 모드에서는 저장 기능을 사용할 수 없습니다.'
    case 'parse_error':
      return '저장된 데이터가 손상되어 복구할 수 없습니다.'
    case 'validation_error':
      return error.details || '저장된 데이터 형식이 올바르지 않습니다.'
    case 'unknown':
    default:
      return error.message || '알 수 없는 오류가 발생했습니다.'
  }
}
