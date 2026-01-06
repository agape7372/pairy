/**
 * 캐릭터 퍼스널 컬러 바인딩 유틸리티 (Sprint 33)
 *
 * 캐릭터의 퍼스널 컬러(머리색, 눈색, 테마색)를 템플릿 레이어에
 * 자동으로 바인딩하는 핵심 로직을 제공합니다.
 *
 * @see docs/master-prompt/01-functional-spec.md
 */

import type { Character, CharacterMetadata } from '@/types/database.types'
import type { ColorData, CharacterColors } from '@/types/template'

// ============================================
// 타입 정의
// ============================================

/** 캐릭터 컬러 적용 결과 */
export interface ApplyCharacterColorsResult {
  success: boolean
  appliedColors: CharacterColors
  previousColors: Partial<CharacterColors>
  error?: string
}

/** 캐릭터 컬러 적용 옵션 */
export interface ApplyCharacterColorsOptions {
  /** 기존 색상이 있어도 덮어쓸지 여부 (기본값: true) */
  overwrite?: boolean
  /** 적용할 색상 타입 필터 (기본값: 모두) */
  colorTypes?: Array<'hair' | 'eye' | 'theme'>
  /** 색상이 null일 때 사용할 기본값 */
  fallbackColors?: Partial<CharacterColors>
}

// ============================================
// 기본값
// ============================================

/** 기본 폴백 색상 (캐릭터 색상이 없을 때) */
export const DEFAULT_CHARACTER_COLORS: CharacterColors = {
  hairColor: '#4A3728', // 갈색
  eyeColor: '#4A3728', // 갈색
  themeColor: '#FF6B6B', // 코랄 핑크
}

/** ColorReference를 CharacterColors 키로 매핑 */
export const COLOR_REFERENCE_MAP: Record<string, keyof CharacterColors> = {
  characterHairColor: 'hairColor',
  characterEyeColor: 'eyeColor',
  characterThemeColor: 'themeColor',
}

/** CharacterColors 키를 ColorReference로 매핑 */
export const CHARACTER_COLOR_TO_REFERENCE: Record<keyof CharacterColors, string> = {
  hairColor: 'characterHairColor',
  eyeColor: 'characterEyeColor',
  themeColor: 'characterThemeColor',
}

// ============================================
// 핵심 함수
// ============================================

/**
 * 캐릭터에서 퍼스널 컬러를 추출합니다.
 *
 * @param character - 캐릭터 객체
 * @returns 추출된 캐릭터 컬러
 *
 * @example
 * ```typescript
 * const colors = extractCharacterColors(character)
 * // { hairColor: '#4A3728', eyeColor: '#3498DB', themeColor: '#FF6B6B' }
 * ```
 */
export function extractCharacterColors(character: Character | null): CharacterColors {
  if (!character) {
    return { ...DEFAULT_CHARACTER_COLORS }
  }

  const metadata = character.metadata as CharacterMetadata | null

  return {
    hairColor: metadata?.hairColor || character.color || DEFAULT_CHARACTER_COLORS.hairColor,
    eyeColor: metadata?.eyeColor || DEFAULT_CHARACTER_COLORS.eyeColor,
    themeColor: metadata?.mainColor || character.color || DEFAULT_CHARACTER_COLORS.themeColor,
  }
}

/**
 * 캐릭터 퍼스널 컬러를 ColorData에 적용합니다.
 *
 * 이 함수는 템플릿의 모든 레이어를 순회하며
 * characterHairColor, characterEyeColor, characterThemeColor 참조를
 * 실제 캐릭터 색상으로 변환합니다.
 *
 * @param currentColors - 현재 에디터 색상 데이터
 * @param character - 적용할 캐릭터 (null이면 기본값 사용)
 * @param options - 적용 옵션
 * @returns 적용 결과
 *
 * @example
 * ```typescript
 * const result = applyCharacterColors(
 *   currentColors,
 *   selectedCharacter,
 *   { overwrite: true }
 * )
 *
 * if (result.success) {
 *   setColors(result.appliedColors)
 * }
 * ```
 */
export function applyCharacterColors(
  currentColors: ColorData,
  character: Character | null,
  options: ApplyCharacterColorsOptions = {}
): ApplyCharacterColorsResult {
  const {
    overwrite = true,
    colorTypes = ['hair', 'eye', 'theme'],
    fallbackColors = DEFAULT_CHARACTER_COLORS,
  } = options

  try {
    // 캐릭터에서 색상 추출
    const characterColors = extractCharacterColors(character)

    // 이전 색상 저장 (되돌리기용)
    const previousColors: Partial<CharacterColors> = {
      hairColor: currentColors.characterHairColor || null,
      eyeColor: currentColors.characterEyeColor || null,
      themeColor: currentColors.characterThemeColor || null,
    }

    // 새 색상 계산
    const newColors: ColorData = { ...currentColors }

    // 머리색 적용
    if (colorTypes.includes('hair')) {
      // 폴백 체인으로 항상 문자열 보장
      const hairColor = (characterColors.hairColor || fallbackColors.hairColor || DEFAULT_CHARACTER_COLORS.hairColor) as string
      if (overwrite || !currentColors.characterHairColor) {
        newColors.characterHairColor = hairColor
      }
    }

    // 눈색 적용
    if (colorTypes.includes('eye')) {
      const eyeColor = (characterColors.eyeColor || fallbackColors.eyeColor || DEFAULT_CHARACTER_COLORS.eyeColor) as string
      if (overwrite || !currentColors.characterEyeColor) {
        newColors.characterEyeColor = eyeColor
      }
    }

    // 테마색 적용
    if (colorTypes.includes('theme')) {
      const themeColor = (characterColors.themeColor || fallbackColors.themeColor || DEFAULT_CHARACTER_COLORS.themeColor) as string
      if (overwrite || !currentColors.characterThemeColor) {
        newColors.characterThemeColor = themeColor
      }
    }

    return {
      success: true,
      appliedColors: {
        hairColor: newColors.characterHairColor || null,
        eyeColor: newColors.characterEyeColor || null,
        themeColor: newColors.characterThemeColor || null,
      },
      previousColors,
    }
  } catch (error) {
    console.error('[characterColors] Failed to apply character colors:', error)
    return {
      success: false,
      appliedColors: { ...DEFAULT_CHARACTER_COLORS },
      previousColors: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * ColorData에 캐릭터 컬러를 병합합니다.
 *
 * @param currentColors - 현재 색상 데이터
 * @param characterColors - 적용할 캐릭터 컬러
 * @returns 병합된 색상 데이터
 */
export function mergeCharacterColorsToColorData(
  currentColors: ColorData,
  characterColors: CharacterColors
): ColorData {
  return {
    ...currentColors,
    characterHairColor: characterColors.hairColor || currentColors.characterHairColor,
    characterEyeColor: characterColors.eyeColor || currentColors.characterEyeColor,
    characterThemeColor: characterColors.themeColor || currentColors.characterThemeColor,
  }
}

/**
 * ColorData에서 캐릭터 컬러를 제거합니다.
 *
 * @param currentColors - 현재 색상 데이터
 * @returns 캐릭터 컬러가 제거된 색상 데이터
 */
export function clearCharacterColors(currentColors: ColorData): ColorData {
  const { characterHairColor, characterEyeColor, characterThemeColor, ...rest } = currentColors
  return rest as ColorData
}

/**
 * 색상 참조가 캐릭터 컬러인지 확인합니다.
 *
 * @param colorRef - 색상 참조 문자열
 * @returns 캐릭터 컬러 여부
 */
export function isCharacterColorReference(colorRef: string): boolean {
  return colorRef in COLOR_REFERENCE_MAP
}

/**
 * 색상 값을 해석합니다. (동적 참조 해결)
 *
 * ColorReference가 들어오면 실제 색상값으로 변환하고,
 * 일반 색상값(#RRGGBB)이면 그대로 반환합니다.
 *
 * @param color - 색상 값 또는 ColorReference
 * @param colors - 현재 색상 데이터
 * @returns 해석된 색상 값
 */
export function resolveColor(color: string, colors: ColorData): string {
  // 동적 참조인 경우
  if (color in colors && colors[color]) {
    return colors[color] as string
  }
  // 고정 색상값
  return color
}

/**
 * 캐릭터가 퍼스널 컬러를 가지고 있는지 확인합니다.
 *
 * @param character - 확인할 캐릭터
 * @returns 퍼스널 컬러 존재 여부
 */
export function hasCharacterColors(character: Character | null): boolean {
  if (!character) return false

  const metadata = character.metadata as CharacterMetadata | null
  if (!metadata) return false

  return !!(metadata.hairColor || metadata.eyeColor || metadata.mainColor)
}

/**
 * 두 캐릭터 컬러가 동일한지 비교합니다.
 *
 * @param a - 첫 번째 캐릭터 컬러
 * @param b - 두 번째 캐릭터 컬러
 * @returns 동일 여부
 */
export function areCharacterColorsEqual(
  a: CharacterColors | null,
  b: CharacterColors | null
): boolean {
  if (a === b) return true
  if (!a || !b) return false

  return (
    a.hairColor === b.hairColor &&
    a.eyeColor === b.eyeColor &&
    a.themeColor === b.themeColor
  )
}

// ============================================
// UI 헬퍼
// ============================================

/** 캐릭터 컬러 타입 레이블 */
export const CHARACTER_COLOR_LABELS: Record<keyof CharacterColors, string> = {
  hairColor: '머리색',
  eyeColor: '눈색',
  themeColor: '테마색',
}

/** ColorReference 레이블 */
export const COLOR_REFERENCE_LABELS: Record<string, string> = {
  primaryColor: '메인 컬러',
  secondaryColor: '서브 컬러',
  accentColor: '강조 컬러',
  textColor: '텍스트 컬러',
  characterHairColor: '캐릭터 머리색',
  characterEyeColor: '캐릭터 눈색',
  characterThemeColor: '캐릭터 테마색',
}

/**
 * 색상 참조 옵션 목록을 반환합니다. (드롭다운 UI용)
 *
 * @param includeCharacterColors - 캐릭터 컬러 포함 여부
 * @returns 옵션 목록
 */
export function getColorReferenceOptions(includeCharacterColors = true): Array<{
  value: string
  label: string
  group: 'template' | 'character'
}> {
  const options: Array<{ value: string; label: string; group: 'template' | 'character' }> = [
    { value: 'primaryColor', label: '메인 컬러', group: 'template' },
    { value: 'secondaryColor', label: '서브 컬러', group: 'template' },
    { value: 'accentColor', label: '강조 컬러', group: 'template' },
    { value: 'textColor', label: '텍스트 컬러', group: 'template' },
  ]

  if (includeCharacterColors) {
    options.push(
      { value: 'characterHairColor', label: '캐릭터 머리색', group: 'character' },
      { value: 'characterEyeColor', label: '캐릭터 눈색', group: 'character' },
      { value: 'characterThemeColor', label: '캐릭터 테마색', group: 'character' }
    )
  }

  return options
}
