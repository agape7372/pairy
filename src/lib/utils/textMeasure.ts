/**
 * Sprint 36: 텍스트 측정 및 자동 맞춤 유틸리티
 *
 * 기능:
 * - Canvas 2D API를 사용한 정확한 텍스트 측정
 * - 자동 폰트 크기 계산 (shrink-to-fit)
 * - 멀티라인 텍스트 지원
 * - 캐싱으로 성능 최적화
 *
 * 설계 원칙:
 * - 정확한 측정 (실제 렌더링과 일치)
 * - 성능 최적화 (캐싱, 바이너리 서치)
 * - 한글 지원 (줄바꿈 규칙)
 */

import type { TextStyle } from '@/types/template'

// ============================================
// 타입 정의
// ============================================

/** 텍스트 측정 결과 */
export interface TextMeasureResult {
  width: number
  height: number
  lineCount: number
  lines: string[]
}

/** 자동 맞춤 설정 */
export interface AutoFitConfig {
  mode: 'none' | 'shrink' | 'grow' | 'fit-box'
  minFontSize?: number
  maxFontSize?: number
  wordBreak?: 'normal' | 'keep-all' | 'break-all'
}

/** 폰트 스펙 */
interface FontSpec {
  family: string
  size: number
  weight: string | number
  style: 'normal' | 'italic'
}

// ============================================
// 캐시
// ============================================

interface MeasureCache {
  text: string
  fontSpec: string
  maxWidth: number
  result: TextMeasureResult
}

const measureCache: Map<string, MeasureCache> = new Map()
const MAX_CACHE_SIZE = 500

function getCacheKey(text: string, fontSpec: FontSpec, maxWidth: number): string {
  return `${text}|${fontSpec.family}|${fontSpec.size}|${fontSpec.weight}|${fontSpec.style}|${maxWidth}`
}

function clearOldCache(): void {
  if (measureCache.size > MAX_CACHE_SIZE) {
    // 가장 오래된 50% 삭제
    const keys = Array.from(measureCache.keys())
    keys.slice(0, Math.floor(keys.length / 2)).forEach((key) => {
      measureCache.delete(key)
    })
  }
}

// ============================================
// Canvas 컨텍스트
// ============================================

let measureCanvas: HTMLCanvasElement | null = null
let measureCtx: CanvasRenderingContext2D | null = null

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null

  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas')
    measureCtx = measureCanvas.getContext('2d')
  }

  return measureCtx
}

// ============================================
// 폰트 스펙 생성
// ============================================

function buildFontSpec(style: Partial<TextStyle>): FontSpec {
  return {
    family: style.fontFamily || 'sans-serif',
    size: style.fontSize || 16,
    weight: style.fontWeight || 'normal',
    style: style.fontStyle || 'normal',
  }
}

function fontSpecToCSS(spec: FontSpec): string {
  const weight = typeof spec.weight === 'number' ? spec.weight :
    spec.weight === 'bold' ? 700 : 400
  const style = spec.style === 'italic' ? 'italic' : 'normal'
  return `${style} ${weight} ${spec.size}px "${spec.family}", sans-serif`
}

// ============================================
// 줄바꿈 처리
// ============================================

/**
 * 텍스트를 줄 단위로 분리
 *
 * @param text - 원본 텍스트
 * @param maxWidth - 최대 너비
 * @param ctx - Canvas 컨텍스트
 * @param wordBreak - 줄바꿈 모드
 * @returns 분리된 줄 배열
 */
function wrapText(
  text: string,
  maxWidth: number,
  ctx: CanvasRenderingContext2D,
  wordBreak: 'normal' | 'keep-all' | 'break-all' = 'normal'
): string[] {
  if (!text) return ['']

  // 명시적 줄바꿈 처리
  const paragraphs = text.split('\n')
  const allLines: string[] = []

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      allLines.push('')
      continue
    }

    const words = wordBreak === 'break-all'
      ? paragraph.split('') // 글자 단위
      : wordBreak === 'keep-all'
        ? splitKoreanWords(paragraph) // 한글 단어 유지
        : paragraph.split(/\s+/) // 공백 기준

    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine}${wordBreak === 'break-all' ? '' : ' '}${word}` : word
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        allLines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      allLines.push(currentLine)
    }
  }

  return allLines.length > 0 ? allLines : ['']
}

/**
 * 한글 단어 분리 (조사 붙이기)
 *
 * 한글의 경우 조사가 단어에 붙어야 자연스러움
 */
function splitKoreanWords(text: string): string[] {
  // 한글 + 조사 패턴 유지
  const result: string[] = []
  let current = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === ' ') {
      if (current) {
        result.push(current)
        current = ''
      }
      continue
    }

    current += char

    // 다음 문자가 공백이거나 없으면 단어 완성
    const next = text[i + 1]
    if (!next || next === ' ') {
      continue
    }

    // 한글 조사가 아닌 경우 (간단한 휴리스틱)
    // 실제로는 더 정교한 조사 검출이 필요할 수 있음
  }

  if (current) {
    result.push(current)
  }

  return result
}

// ============================================
// 텍스트 측정
// ============================================

/**
 * 텍스트 크기 측정
 *
 * @param text - 측정할 텍스트
 * @param style - 텍스트 스타일
 * @param maxWidth - 최대 너비 (줄바꿈 기준)
 * @param wordBreak - 줄바꿈 모드
 * @returns 측정 결과
 */
export function measureText(
  text: string,
  style: Partial<TextStyle>,
  maxWidth: number = Infinity,
  wordBreak: 'normal' | 'keep-all' | 'break-all' = 'normal'
): TextMeasureResult {
  const ctx = getMeasureContext()

  // SSR 또는 Canvas 미지원 시 추정값 반환
  if (!ctx) {
    const fontSize = style.fontSize || 16
    const lineHeight = style.lineHeight || 1.2
    const estimatedWidth = text.length * fontSize * 0.6
    const lineCount = Math.max(1, Math.ceil(estimatedWidth / maxWidth))

    return {
      width: Math.min(estimatedWidth, maxWidth),
      height: lineCount * fontSize * lineHeight,
      lineCount,
      lines: [text],
    }
  }

  const fontSpec = buildFontSpec(style)
  const cacheKey = getCacheKey(text, fontSpec, maxWidth)

  // 캐시 확인
  const cached = measureCache.get(cacheKey)
  if (cached) {
    return cached.result
  }

  // 폰트 설정
  ctx.font = fontSpecToCSS(fontSpec)

  // 줄바꿈 처리
  const lines = maxWidth === Infinity
    ? text.split('\n')
    : wrapText(text, maxWidth, ctx, wordBreak)

  // 각 줄의 너비 측정
  let maxLineWidth = 0
  for (const line of lines) {
    const metrics = ctx.measureText(line)
    maxLineWidth = Math.max(maxLineWidth, metrics.width)
  }

  const lineHeight = style.lineHeight || 1.2
  const height = lines.length * fontSpec.size * lineHeight

  const result: TextMeasureResult = {
    width: maxLineWidth,
    height,
    lineCount: lines.length,
    lines,
  }

  // 캐시 저장
  clearOldCache()
  measureCache.set(cacheKey, {
    text,
    fontSpec: JSON.stringify(fontSpec),
    maxWidth,
    result,
  })

  return result
}

// ============================================
// 자동 폰트 크기 계산
// ============================================

/**
 * 박스에 맞는 최적 폰트 크기 계산
 *
 * Binary search로 효율적으로 계산
 *
 * @param text - 텍스트
 * @param style - 기본 스타일
 * @param boxWidth - 박스 너비
 * @param boxHeight - 박스 높이
 * @param config - 자동 맞춤 설정
 * @returns 계산된 폰트 크기
 */
export function calculateFittedFontSize(
  text: string,
  style: TextStyle,
  boxWidth: number,
  boxHeight: number,
  config: AutoFitConfig
): number {
  if (config.mode === 'none' || !text) {
    return style.fontSize
  }

  const minSize = config.minFontSize || 8
  const maxSize = config.maxFontSize || style.fontSize * 2
  const wordBreak = config.wordBreak || 'normal'

  // 현재 크기로 먼저 측정
  const currentMeasure = measureText(text, style, boxWidth, wordBreak)
  const currentFits = currentMeasure.width <= boxWidth && currentMeasure.height <= boxHeight

  // shrink 모드: 안 맞을 때만 축소
  if (config.mode === 'shrink') {
    if (currentFits) {
      return style.fontSize
    }
    return binarySearchFontSize(text, style, boxWidth, boxHeight, minSize, style.fontSize, wordBreak)
  }

  // grow 모드: 맞을 때 확대
  if (config.mode === 'grow') {
    if (!currentFits) {
      return style.fontSize
    }
    return binarySearchFontSize(text, style, boxWidth, boxHeight, style.fontSize, maxSize, wordBreak)
  }

  // fit-box 모드: 박스에 최적 크기
  return binarySearchFontSize(text, style, boxWidth, boxHeight, minSize, maxSize, wordBreak)
}

/**
 * Binary search로 최적 폰트 크기 찾기
 */
function binarySearchFontSize(
  text: string,
  baseStyle: TextStyle,
  boxWidth: number,
  boxHeight: number,
  minSize: number,
  maxSize: number,
  wordBreak: 'normal' | 'keep-all' | 'break-all'
): number {
  let low = minSize
  let high = maxSize
  let bestSize = minSize

  // Binary search (최대 20회 반복으로 0.5px 정밀도)
  const maxIterations = 20
  let iterations = 0

  while (high - low > 0.5 && iterations < maxIterations) {
    iterations++
    const mid = (low + high) / 2
    const testStyle = { ...baseStyle, fontSize: mid }
    const measure = measureText(text, testStyle, boxWidth, wordBreak)

    if (measure.width <= boxWidth && measure.height <= boxHeight) {
      bestSize = mid
      low = mid // 더 큰 크기 시도
    } else {
      high = mid // 더 작은 크기 시도
    }
  }

  return Math.round(bestSize * 10) / 10 // 소수점 1자리까지
}

// ============================================
// 유틸리티
// ============================================

/**
 * 텍스트가 박스에 맞는지 확인
 */
export function doesTextFit(
  text: string,
  style: TextStyle,
  boxWidth: number,
  boxHeight: number
): boolean {
  const measure = measureText(text, style, boxWidth)
  return measure.width <= boxWidth && measure.height <= boxHeight
}

/**
 * 캐시 초기화
 */
export function clearMeasureCache(): void {
  measureCache.clear()
}

/**
 * 캐시 통계
 */
export function getMeasureCacheStats(): { size: number; maxSize: number } {
  return {
    size: measureCache.size,
    maxSize: MAX_CACHE_SIZE,
  }
}
