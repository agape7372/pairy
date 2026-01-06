/**
 * 색상 변환 유틸리티
 * HSV, RGB, HEX 간의 변환 및 색상 조작 함수
 */

// ============================================
// 타입 정의
// ============================================

export interface RGB {
  r: number // 0-255
  g: number // 0-255
  b: number // 0-255
}

export interface HSV {
  h: number // 0-360 (hue)
  s: number // 0-100 (saturation)
  v: number // 0-100 (value/brightness)
}

export interface HSL {
  h: number // 0-360
  s: number // 0-100
  l: number // 0-100
}

// ============================================
// 유효성 검증
// ============================================

/** HEX 색상 코드 유효성 검사 */
export function isValidHex(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)
}

/** RGB 값 유효성 검사 */
export function isValidRGB(rgb: RGB): boolean {
  return (
    rgb.r >= 0 && rgb.r <= 255 &&
    rgb.g >= 0 && rgb.g <= 255 &&
    rgb.b >= 0 && rgb.b <= 255
  )
}

/** HSV 값 유효성 검사 */
export function isValidHSV(hsv: HSV): boolean {
  return (
    hsv.h >= 0 && hsv.h <= 360 &&
    hsv.s >= 0 && hsv.s <= 100 &&
    hsv.v >= 0 && hsv.v <= 100
  )
}

// ============================================
// 변환 함수
// ============================================

/** HEX → RGB 변환 */
export function hexToRgb(hex: string): RGB | null {
  // 유효성 검사
  if (!isValidHex(hex)) return null

  // # 제거
  let cleanHex = hex.replace('#', '')

  // 3자리 HEX를 6자리로 확장
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((char) => char + char)
      .join('')
  }

  const num = parseInt(cleanHex, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

/** RGB → HEX 변환 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number): string => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)))
    return clamped.toString(16).padStart(2, '0')
  }

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase()
}

/** RGB → HSV 변환 */
export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  let s = 0
  const v = max * 100

  if (delta !== 0) {
    s = (delta / max) * 100

    switch (max) {
      case r:
        h = ((g - b) / delta) % 6
        break
      case g:
        h = (b - r) / delta + 2
        break
      case b:
        h = (r - g) / delta + 4
        break
    }

    h = Math.round(h * 60)
    if (h < 0) h += 360
  }

  return {
    h: Math.round(h),
    s: Math.round(s),
    v: Math.round(v),
  }
}

/** HSV → RGB 변환 */
export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 60
  const s = hsv.s / 100
  const v = hsv.v / 100

  const c = v * s
  const x = c * (1 - Math.abs((h % 2) - 1))
  const m = v - c

  let r = 0
  let g = 0
  let b = 0

  if (h >= 0 && h < 1) {
    r = c; g = x; b = 0
  } else if (h >= 1 && h < 2) {
    r = x; g = c; b = 0
  } else if (h >= 2 && h < 3) {
    r = 0; g = c; b = x
  } else if (h >= 3 && h < 4) {
    r = 0; g = x; b = c
  } else if (h >= 4 && h < 5) {
    r = x; g = 0; b = c
  } else {
    r = c; g = 0; b = x
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

/** HSV → HEX 변환 */
export function hsvToHex(hsv: HSV): string {
  return rgbToHex(hsvToRgb(hsv))
}

/** HEX → HSV 변환 */
export function hexToHsv(hex: string): HSV | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return rgbToHsv(rgb)
}

// ============================================
// 색상 조작 함수
// ============================================

/** 밝기 조절 */
export function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const adjust = (value: number): number => {
    const adjusted = value + (255 * percent) / 100
    return Math.max(0, Math.min(255, Math.round(adjusted)))
  }

  return rgbToHex({
    r: adjust(rgb.r),
    g: adjust(rgb.g),
    b: adjust(rgb.b),
  })
}

/** 채도 조절 */
export function adjustSaturation(hex: string, percent: number): string {
  const hsv = hexToHsv(hex)
  if (!hsv) return hex

  const newSaturation = Math.max(0, Math.min(100, hsv.s + percent))
  return hsvToHex({ ...hsv, s: newSaturation })
}

/** 보색 계산 */
export function getComplementary(hex: string): string {
  const hsv = hexToHsv(hex)
  if (!hsv) return hex

  const newHue = (hsv.h + 180) % 360
  return hsvToHex({ ...hsv, h: newHue })
}

/** 색상 대비 계산 (WCAG 기준) */
export function getContrastRatio(hex1: string, hex2: string): number {
  const getLuminance = (rgb: RGB): number => {
    const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map((c) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return 1

  const l1 = getLuminance(rgb1)
  const l2 = getLuminance(rgb2)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/** 텍스트 색상 추천 (배경색 기준) */
export function getTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor)
  if (!rgb) return '#000000'

  // YIQ 공식으로 밝기 계산
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  return yiq >= 128 ? '#000000' : '#FFFFFF'
}

// ============================================
// 색상 문자열 파싱
// ============================================

/** 다양한 형식의 색상 문자열을 HEX로 변환 */
export function parseColor(color: string): string | null {
  const trimmed = color.trim()

  // HEX 형식
  if (trimmed.startsWith('#')) {
    return isValidHex(trimmed) ? trimmed.toUpperCase() : null
  }

  // rgb(r, g, b) 형식
  const rgbMatch = trimmed.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10)
    const g = parseInt(rgbMatch[2], 10)
    const b = parseInt(rgbMatch[3], 10)
    if (r <= 255 && g <= 255 && b <= 255) {
      return rgbToHex({ r, g, b })
    }
  }

  // 숫자만 있는 경우 (HEX로 가정)
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`
  }

  return null
}

// ============================================
// localStorage 기반 최근 색상 관리
// ============================================

const RECENT_COLORS_KEY = 'pairy_recent_colors'
const MAX_RECENT_COLORS = 12

/** 최근 사용한 색상 가져오기 */
export function getRecentColors(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY)
    if (stored) {
      const colors = JSON.parse(stored) as string[]
      return colors.filter(isValidHex).slice(0, MAX_RECENT_COLORS)
    }
  } catch {
    // 파싱 실패 시 빈 배열 반환
  }
  return []
}

/** 최근 사용한 색상 추가 */
export function addRecentColor(color: string): void {
  if (typeof window === 'undefined') return
  if (!isValidHex(color)) return

  try {
    const current = getRecentColors()
    const normalized = color.toUpperCase()

    // 중복 제거 후 맨 앞에 추가
    const updated = [
      normalized,
      ...current.filter((c) => c !== normalized),
    ].slice(0, MAX_RECENT_COLORS)

    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated))
  } catch {
    // 저장 실패 무시
  }
}

/** 최근 사용한 색상 초기화 */
export function clearRecentColors(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(RECENT_COLORS_KEY)
}
