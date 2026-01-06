'use client'

/**
 * 캐릭터 관리 훅 (Production-Ready)
 *
 * 기능:
 * - CRUD 작업 (생성, 조회, 수정, 삭제)
 * - 낙관적 업데이트 + 롤백 패턴
 * - 데모 모드 localStorage 폴백
 * - 유효성 검증
 * - 에러 바운더리
 * - 로딩/에러 상태 관리
 *
 * @example
 * const { characters, createCharacter, isLoading, error } = useCharacters()
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient, IS_DEMO_MODE } from '@/lib/supabase/client'
import { useUser } from './useUser'
import type {
  Character,
  CharacterInsert,
  CharacterUpdate,
  CharacterMetadata,
  Json,
} from '@/types/database.types'
import {
  CHARACTER_NAME_MAX_LENGTH,
  CHARACTER_DESCRIPTION_MAX_LENGTH,
  WORLD_NAME_MAX_LENGTH,
  MAX_CHARACTERS_FREE,
  MAX_CHARACTERS_PREMIUM,
} from '@/types/database.types'

// ============================================
// 상수 정의
// ============================================

const DEMO_STORAGE_KEY = 'pairy_characters'
const DEMO_STORAGE_QUOTA_MB = 5 // localStorage 할당량

/** 기본 캐릭터 색상 팔레트 */
export const CHARACTER_COLORS = [
  '#FF6B6B', // 코랄 레드
  '#4ECDC4', // 민트
  '#45B7D1', // 스카이블루
  '#96CEB4', // 세이지 그린
  '#FFEAA7', // 레몬
  '#DDA0DD', // 플럼
  '#F8B500', // 골드
  '#98D8C8', // 아쿠아마린
  '#FF85A2', // 핑크
  '#7C73E6', // 퍼플
  '#6C5CE7', // 인디고
  '#00B894', // 에메랄드
] as const

// ============================================
// 타입 정의
// ============================================

/** 작업 상태 */
type OperationState = 'idle' | 'loading' | 'success' | 'error'

/** 유효성 검증 결과 */
interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/** 훅 반환 타입 */
interface UseCharactersReturn {
  // 데이터
  characters: Character[]
  // 상태
  isLoading: boolean
  isSaving: boolean
  error: string | null
  operationState: OperationState
  // CRUD 작업
  createCharacter: (data: CreateCharacterInput) => Promise<Character | null>
  updateCharacter: (id: string, data: UpdateCharacterInput) => Promise<boolean>
  deleteCharacter: (id: string) => Promise<boolean>
  // 유틸리티
  getCharacterById: (id: string) => Character | undefined
  getCharactersByWorld: (worldName: string) => Character[]
  getWorldNames: () => string[]
  reorderCharacters: (orderedIds: string[]) => Promise<boolean>
  toggleFavorite: (id: string) => Promise<boolean>
  // 유효성 검증
  validateCharacter: (data: CreateCharacterInput) => ValidationResult
  canCreateMore: () => boolean
  // 리프레시
  refetch: () => Promise<void>
  // 에러 초기화
  clearError: () => void
}

/** 캐릭터 생성 입력 */
export interface CreateCharacterInput {
  name: string
  color?: string
  avatar_url?: string | null
  description?: string | null
  metadata?: CharacterMetadata
  world_name?: string | null
}

/** 캐릭터 수정 입력 */
export interface UpdateCharacterInput {
  name?: string
  color?: string
  avatar_url?: string | null
  description?: string | null
  metadata?: CharacterMetadata
  world_name?: string | null
  is_favorite?: boolean
}

// ============================================
// 유틸리티 함수
// ============================================

/** UUID 생성 (브라우저 호환) */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** localStorage 용량 체크 */
function checkStorageQuota(): boolean {
  try {
    const used = new Blob(Object.values(localStorage)).size
    const quotaBytes = DEMO_STORAGE_QUOTA_MB * 1024 * 1024
    return used < quotaBytes * 0.9 // 90% 이하면 OK
  } catch {
    return true
  }
}

/** 안전한 JSON 파싱 */
function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/** 랜덤 색상 선택 (기존 색상 회피) */
export function getNextColor(existingColors: string[]): string {
  const availableColors = CHARACTER_COLORS.filter(
    (color) => !existingColors.includes(color)
  )
  if (availableColors.length > 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)]
  }
  return CHARACTER_COLORS[Math.floor(Math.random() * CHARACTER_COLORS.length)]
}

// ============================================
// 데모 데이터
// ============================================

const createDemoCharacters = (): Character[] => [
  {
    id: 'demo-char-strawberry',
    user_id: 'demo-user',
    name: '딸기',
    color: '#FF6B6B',
    avatar_url: null,
    description: '상큼발랄하고 긍정적인 성격의 캐릭터입니다.',
    metadata: {
      mbti: 'ENFP',
      bloodType: 'O',
      birthday: '03-14',
      personality: ['밝음', '활발', '호기심'],
    },
    world_name: '기본 세계관',
    sort_order: 0,
    is_favorite: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-char-mint',
    user_id: 'demo-user',
    name: '민트',
    color: '#4ECDC4',
    avatar_url: null,
    description: '차분하고 지적인 성격으로, 책 읽기를 좋아합니다.',
    metadata: {
      mbti: 'INTJ',
      bloodType: 'A',
      birthday: '11-22',
      personality: ['차분', '지적', '신중'],
    },
    world_name: '기본 세계관',
    sort_order: 1,
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// ============================================
// 메인 훅
// ============================================

export function useCharacters(): UseCharactersReturn {
  const { user, isLoading: isUserLoading } = useUser()

  // 상태
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [operationState, setOperationState] = useState<OperationState>('idle')

  // 낙관적 업데이트 롤백용
  const previousCharactersRef = useRef<Character[]>([])

  // ============================================
  // 유효성 검증
  // ============================================

  const validateCharacter = useCallback(
    (data: CreateCharacterInput): ValidationResult => {
      const errors: string[] = []

      // 이름 검증
      if (!data.name || data.name.trim().length === 0) {
        errors.push('캐릭터 이름을 입력해주세요.')
      } else if (data.name.length > CHARACTER_NAME_MAX_LENGTH) {
        errors.push(`이름은 ${CHARACTER_NAME_MAX_LENGTH}자 이하로 입력해주세요.`)
      }

      // 설명 검증
      if (data.description && data.description.length > CHARACTER_DESCRIPTION_MAX_LENGTH) {
        errors.push(`설명은 ${CHARACTER_DESCRIPTION_MAX_LENGTH}자 이하로 입력해주세요.`)
      }

      // 세계관 이름 검증
      if (data.world_name && data.world_name.length > WORLD_NAME_MAX_LENGTH) {
        errors.push(`세계관 이름은 ${WORLD_NAME_MAX_LENGTH}자 이하로 입력해주세요.`)
      }

      // 색상 검증 (HEX 형식)
      if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
        errors.push('올바른 색상 코드를 입력해주세요. (예: #FF6B6B)')
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    },
    []
  )

  const canCreateMore = useCallback((): boolean => {
    // TODO: 프리미엄 상태 확인
    const maxCount = MAX_CHARACTERS_FREE
    return characters.length < maxCount
  }, [characters.length])

  // ============================================
  // 데이터 로드
  // ============================================

  /** localStorage에서 캐릭터 로드 (데모 모드 또는 폴백) */
  const loadFromLocalStorage = useCallback(() => {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY)
    if (stored) {
      const parsed = safeJsonParse<Character[]>(stored, [])
      setCharacters(parsed.sort((a, b) => a.sort_order - b.sort_order))
    } else {
      // 초기 데모 데이터 생성
      const demoData = createDemoCharacters()
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoData))
      setCharacters(demoData)
    }
  }, [])

  /** Supabase 에러가 테이블 미존재 관련인지 확인 */
  const isTableNotFoundError = (errorMessage: string): boolean => {
    return (
      errorMessage.includes('schema cache') ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('relation') ||
      errorMessage.includes('42P01') // PostgreSQL: relation does not exist
    )
  }

  // localStorage 폴백 모드 상태 (테이블이 없을 때 활성화)
  const useLocalStorageFallbackRef = useRef(false)

  const fetchCharacters = useCallback(async () => {
    // 데모 모드가 아닐 때만 user 로딩 대기
    if (!IS_DEMO_MODE && isUserLoading) return

    setIsLoading(true)
    setError(null)
    setOperationState('loading')

    try {
      // 데모 모드이거나 이전에 테이블 없음 에러 발생한 경우
      if (IS_DEMO_MODE || useLocalStorageFallbackRef.current) {
        loadFromLocalStorage()
        setOperationState('success')
      } else if (user) {
        // Supabase에서 로드 시도
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true })

        if (fetchError) {
          // 테이블이 없거나 스키마 에러인 경우 localStorage 폴백
          if (isTableNotFoundError(fetchError.message)) {
            console.warn('[useCharacters] characters 테이블이 없습니다. localStorage로 폴백합니다.')
            useLocalStorageFallbackRef.current = true
            loadFromLocalStorage()
            setOperationState('success')
            return
          }
          throw new Error(fetchError.message)
        }

        setCharacters(data || [])
        setOperationState('success')
      } else {
        // 로그인 안 됨 - localStorage 사용
        loadFromLocalStorage()
        setOperationState('success')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '캐릭터를 불러오는데 실패했습니다.'
      console.error('[useCharacters] Fetch error:', err)
      setError(message)
      setOperationState('error')
    } finally {
      setIsLoading(false)
    }
  }, [user, isUserLoading, loadFromLocalStorage])

  // 초기 로드
  useEffect(() => {
    fetchCharacters()
  }, [fetchCharacters])

  // ============================================
  // 낙관적 업데이트 헬퍼
  // ============================================

  const saveSnapshot = useCallback(() => {
    previousCharactersRef.current = [...characters]
  }, [characters])

  const rollback = useCallback(() => {
    setCharacters(previousCharactersRef.current)
  }, [])

  /** localStorage 사용 여부 확인 (데모 모드 또는 폴백 모드) */
  const shouldUseLocalStorage = useCallback((): boolean => {
    return IS_DEMO_MODE || useLocalStorageFallbackRef.current
  }, [])

  const persistToStorage = useCallback((data: Character[]) => {
    if (shouldUseLocalStorage()) {
      if (!checkStorageQuota()) {
        throw new Error('저장 공간이 부족합니다. 일부 캐릭터를 삭제해주세요.')
      }
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data))
    }
  }, [shouldUseLocalStorage])

  // ============================================
  // CRUD 작업
  // ============================================

  /** 캐릭터 생성 */
  const createCharacter = useCallback(
    async (input: CreateCharacterInput): Promise<Character | null> => {
      // 유효성 검증
      const validation = validateCharacter(input)
      if (!validation.isValid) {
        setError(validation.errors[0])
        return null
      }

      // 생성 가능 여부 확인
      if (!canCreateMore()) {
        setError(`캐릭터는 최대 ${MAX_CHARACTERS_FREE}개까지 생성할 수 있습니다.`)
        return null
      }

      setIsSaving(true)
      setError(null)
      setOperationState('loading')
      saveSnapshot()

      const existingColors = characters.map((c) => c.color)
      const newCharacter: Character = {
        id: generateId(),
        user_id: user?.id || 'demo-user',
        name: input.name.trim(),
        color: input.color || getNextColor(existingColors),
        avatar_url: input.avatar_url || null,
        description: input.description?.trim() || null,
        metadata: (input.metadata || {}) as Json,
        world_name: input.world_name?.trim() || null,
        sort_order: characters.length,
        is_favorite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      try {
        // 낙관적 업데이트
        const updatedList = [...characters, newCharacter]
        setCharacters(updatedList)

        if (shouldUseLocalStorage()) {
          // localStorage 사용 (데모 모드 또는 테이블 없음)
          persistToStorage(updatedList)
        } else if (user) {
          const supabase = createClient()
          const { data, error: insertError } = await supabase
            .from('characters')
            .insert({
              user_id: user.id,
              name: newCharacter.name,
              color: newCharacter.color,
              avatar_url: newCharacter.avatar_url,
              description: newCharacter.description,
              metadata: newCharacter.metadata,
              world_name: newCharacter.world_name,
              sort_order: newCharacter.sort_order,
              is_favorite: newCharacter.is_favorite,
            })
            .select()
            .single()

          if (insertError) {
            // 테이블이 없으면 localStorage 폴백
            if (isTableNotFoundError(insertError.message)) {
              console.warn('[useCharacters] characters 테이블이 없습니다. localStorage로 폴백합니다.')
              useLocalStorageFallbackRef.current = true
              persistToStorage(updatedList)
              setOperationState('success')
              return newCharacter
            }
            throw new Error(insertError.message)
          }

          // 서버 응답으로 업데이트 (ID 등 서버 생성 값 반영)
          setCharacters((prev) =>
            prev.map((c) => (c.id === newCharacter.id ? data : c))
          )
          setOperationState('success')
          return data
        } else {
          // 로그인 안 됨 - localStorage 사용
          persistToStorage(updatedList)
        }

        setOperationState('success')
        return newCharacter
      } catch (err) {
        console.error('[useCharacters] Create error:', err)
        rollback()
        const message = err instanceof Error ? err.message : '캐릭터 생성에 실패했습니다.'
        setError(message)
        setOperationState('error')
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [user, characters, validateCharacter, canCreateMore, saveSnapshot, rollback, persistToStorage, shouldUseLocalStorage]
  )

  /** 캐릭터 수정 */
  const updateCharacter = useCallback(
    async (id: string, input: UpdateCharacterInput): Promise<boolean> => {
      const existing = characters.find((c) => c.id === id)
      if (!existing) {
        setError('캐릭터를 찾을 수 없습니다.')
        return false
      }

      // 이름 변경 시 유효성 검증
      if (input.name !== undefined) {
        const validation = validateCharacter({ name: input.name })
        if (!validation.isValid) {
          setError(validation.errors[0])
          return false
        }
      }

      setIsSaving(true)
      setError(null)
      setOperationState('loading')
      saveSnapshot()

      const updatedCharacter: Character = {
        ...existing,
        ...input,
        name: input.name?.trim() ?? existing.name,
        description: input.description?.trim() ?? existing.description,
        world_name: input.world_name?.trim() ?? existing.world_name,
        metadata: (input.metadata ?? existing.metadata) as Json,
        updated_at: new Date().toISOString(),
      }

      try {
        // 낙관적 업데이트
        const updatedList = characters.map((c) =>
          c.id === id ? updatedCharacter : c
        )
        setCharacters(updatedList)

        if (shouldUseLocalStorage()) {
          // localStorage 사용 (데모 모드 또는 테이블 없음)
          persistToStorage(updatedList)
        } else if (user) {
          const supabase = createClient()
          const { error: updateError } = await supabase
            .from('characters')
            .update({
              name: updatedCharacter.name,
              color: updatedCharacter.color,
              avatar_url: updatedCharacter.avatar_url,
              description: updatedCharacter.description,
              metadata: updatedCharacter.metadata,
              world_name: updatedCharacter.world_name,
              is_favorite: updatedCharacter.is_favorite,
              updated_at: updatedCharacter.updated_at,
            })
            .eq('id', id)
            .eq('user_id', user.id)

          if (updateError) {
            // 테이블이 없으면 localStorage 폴백
            if (isTableNotFoundError(updateError.message)) {
              console.warn('[useCharacters] characters 테이블이 없습니다. localStorage로 폴백합니다.')
              useLocalStorageFallbackRef.current = true
              persistToStorage(updatedList)
              setOperationState('success')
              return true
            }
            throw new Error(updateError.message)
          }
        } else {
          // 로그인 안 됨 - localStorage 사용
          persistToStorage(updatedList)
        }

        setOperationState('success')
        return true
      } catch (err) {
        console.error('[useCharacters] Update error:', err)
        rollback()
        const message = err instanceof Error ? err.message : '캐릭터 수정에 실패했습니다.'
        setError(message)
        setOperationState('error')
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [user, characters, validateCharacter, saveSnapshot, rollback, persistToStorage, shouldUseLocalStorage]
  )

  /** 캐릭터 삭제 */
  const deleteCharacter = useCallback(
    async (id: string): Promise<boolean> => {
      const existing = characters.find((c) => c.id === id)
      if (!existing) {
        setError('캐릭터를 찾을 수 없습니다.')
        return false
      }

      setIsSaving(true)
      setError(null)
      setOperationState('loading')
      saveSnapshot()

      try {
        // 낙관적 업데이트
        const updatedList = characters
          .filter((c) => c.id !== id)
          .map((c, index) => ({ ...c, sort_order: index }))
        setCharacters(updatedList)

        if (shouldUseLocalStorage()) {
          // localStorage 사용 (데모 모드 또는 테이블 없음)
          persistToStorage(updatedList)
        } else if (user) {
          const supabase = createClient()
          const { error: deleteError } = await supabase
            .from('characters')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

          if (deleteError) {
            // 테이블이 없으면 localStorage 폴백
            if (isTableNotFoundError(deleteError.message)) {
              console.warn('[useCharacters] characters 테이블이 없습니다. localStorage로 폴백합니다.')
              useLocalStorageFallbackRef.current = true
              persistToStorage(updatedList)
              setOperationState('success')
              return true
            }
            throw new Error(deleteError.message)
          }
        } else {
          // 로그인 안 됨 - localStorage 사용
          persistToStorage(updatedList)
        }

        setOperationState('success')
        return true
      } catch (err) {
        console.error('[useCharacters] Delete error:', err)
        rollback()
        const message = err instanceof Error ? err.message : '캐릭터 삭제에 실패했습니다.'
        setError(message)
        setOperationState('error')
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [user, characters, saveSnapshot, rollback, persistToStorage, shouldUseLocalStorage]
  )

  // ============================================
  // 유틸리티 메서드
  // ============================================

  /** ID로 캐릭터 찾기 */
  const getCharacterById = useCallback(
    (id: string): Character | undefined => {
      return characters.find((c) => c.id === id)
    },
    [characters]
  )

  /** 세계관별 캐릭터 필터 */
  const getCharactersByWorld = useCallback(
    (worldName: string): Character[] => {
      return characters.filter((c) => c.world_name === worldName)
    },
    [characters]
  )

  /** 모든 세계관 이름 추출 */
  const getWorldNames = useCallback((): string[] => {
    const worlds = new Set<string>()
    characters.forEach((c) => {
      if (c.world_name) worlds.add(c.world_name)
    })
    return Array.from(worlds).sort()
  }, [characters])

  /** 캐릭터 순서 변경 */
  const reorderCharacters = useCallback(
    async (orderedIds: string[]): Promise<boolean> => {
      setIsSaving(true)
      setError(null)
      saveSnapshot()

      try {
        const reordered = orderedIds
          .map((id, index) => {
            const char = characters.find((c) => c.id === id)
            return char ? { ...char, sort_order: index } : null
          })
          .filter((c): c is Character => c !== null)

        setCharacters(reordered)

        if (shouldUseLocalStorage()) {
          // localStorage 사용 (데모 모드 또는 테이블 없음)
          persistToStorage(reordered)
        } else if (user) {
          const supabase = createClient()
          // 배치 업데이트
          const updates = reordered.map((c) => ({
            id: c.id,
            user_id: user.id,
            sort_order: c.sort_order,
            updated_at: new Date().toISOString(),
          }))

          for (const update of updates) {
            const { error: updateError } = await supabase
              .from('characters')
              .update({ sort_order: update.sort_order, updated_at: update.updated_at })
              .eq('id', update.id)
              .eq('user_id', user.id)

            if (updateError) {
              // 테이블이 없으면 localStorage 폴백
              if (isTableNotFoundError(updateError.message)) {
                console.warn('[useCharacters] characters 테이블이 없습니다. localStorage로 폴백합니다.')
                useLocalStorageFallbackRef.current = true
                persistToStorage(reordered)
                return true
              }
              throw new Error(updateError.message)
            }
          }
        } else {
          // 로그인 안 됨 - localStorage 사용
          persistToStorage(reordered)
        }

        return true
      } catch (err) {
        console.error('[useCharacters] Reorder error:', err)
        rollback()
        const message = err instanceof Error ? err.message : '순서 변경에 실패했습니다.'
        setError(message)
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [user, characters, saveSnapshot, rollback, persistToStorage, shouldUseLocalStorage]
  )

  /** 즐겨찾기 토글 */
  const toggleFavorite = useCallback(
    async (id: string): Promise<boolean> => {
      const existing = characters.find((c) => c.id === id)
      if (!existing) return false

      return updateCharacter(id, { is_favorite: !existing.is_favorite })
    },
    [characters, updateCharacter]
  )

  /** 에러 초기화 */
  const clearError = useCallback(() => {
    setError(null)
    setOperationState('idle')
  }, [])

  // ============================================
  // 반환
  // ============================================

  return {
    characters,
    isLoading,
    isSaving,
    error,
    operationState,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    getCharacterById,
    getCharactersByWorld,
    getWorldNames,
    reorderCharacters,
    toggleFavorite,
    validateCharacter,
    canCreateMore,
    refetch: fetchCharacters,
    clearError,
  }
}

export default useCharacters
