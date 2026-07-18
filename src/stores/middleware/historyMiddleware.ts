'use client'

/**
 * 히스토리 미들웨어
 * 변경 이유: canvasEditorStore에서 분리하여 단일 책임 원칙 준수 및 재사용성 향상
 */

import type {
  FormData,
  ImageData,
  ColorData,
  SlotTransforms,
  TemplateConfig,
  TextField,
  StickerLayer,
  CharacterColors,
} from '@/types/template'
import type { Character } from '@/types/database.types'
import type { LayerStates } from './layerSlice'

// ============================================
// 히스토리 스냅샷 타입
// ============================================

export interface HistorySnapshot {
  formData: FormData
  images: ImageData
  colors: ColorData
  slotTransforms: SlotTransforms
  // 텍스트 스타일/스티커는 templateConfig.layers 에 살지만 되돌리기 대상이다.
  // 스토어가 두 배열을 항상 불변 교체하므로 참조 저장만으로 구조 공유가 된다.
  texts: TextField[]
  stickers: StickerLayer[]
  layerStates: LayerStates
  selectedCharacter: Character | null
  characterColors: CharacterColors | null
}

export interface HistoryState {
  history: HistorySnapshot[]
  historyIndex: number
}

export interface HistoryActions {
  pushHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  getHistoryInfo: () => {
    current: number
    total: number
    canUndo: number
    canRedo: number
  }
}

// ============================================
// 초기 상태
// ============================================

export const initialHistoryState: HistoryState = {
  history: [],
  historyIndex: -1,
}

// ============================================
// 히스토리 유틸리티 함수
// ============================================

const MAX_HISTORY_SIZE = 50

/**
 * 객체의 얕은 비교 (1단계 깊이)
 * 성능 최적화: JSON.stringify 대신 키-값 직접 비교
 */
function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  if (a === b) return true

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    // 값이 객체인 경우 참조 비교, 아닌 경우 값 비교
    if (a[key] !== b[key]) {
      // 중첩 객체는 JSON 비교 (슬롯 변환 등)
      if (
        typeof a[key] === 'object' &&
        a[key] !== null &&
        typeof b[key] === 'object' &&
        b[key] !== null
      ) {
        if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
          return false
        }
      } else {
        return false
      }
    }
  }

  return true
}

/** 배열 비교: 참조 우선, 불일치 시 JSON 폴백 (no-op map 재생성 대비) */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * 두 스냅샷이 동일한지 비교
 * 최적화: 참조 동일성 먼저 체크 후 얕은 비교 수행
 */
export function areSnapshotsEqual(a: HistorySnapshot, b: HistorySnapshot): boolean {
  // 빠른 참조 비교
  if (a === b) return true

  return (
    shallowEqual(a.formData, b.formData) &&
    shallowEqual(a.images, b.images) &&
    shallowEqual(a.colors, b.colors) &&
    shallowEqual(a.slotTransforms, b.slotTransforms) &&
    arraysEqual(a.texts, b.texts) &&
    arraysEqual(a.stickers, b.stickers) &&
    shallowEqual(a.layerStates, b.layerStates) &&
    a.selectedCharacter === b.selectedCharacter &&
    (a.characterColors === b.characterColors ||
      JSON.stringify(a.characterColors) === JSON.stringify(b.characterColors))
  )
}

/** 스냅샷 생성에 필요한 상태 단면 */
export interface SnapshotSource {
  formData: FormData
  images: ImageData
  colors: ColorData
  slotTransforms: SlotTransforms
  templateConfig: TemplateConfig | null
  layerStates: LayerStates
  selectedCharacter: Character | null
  characterColors: CharacterColors | null
}

/**
 * 현재 상태에서 스냅샷 생성
 */
export function createSnapshot(state: SnapshotSource): HistorySnapshot {
  return {
    formData: { ...state.formData },
    images: { ...state.images },
    colors: { ...state.colors },
    slotTransforms: { ...state.slotTransforms },
    // 스토어의 모든 변이가 배열을 새로 만들므로 참조 저장으로 충분 (구조 공유)
    texts: state.templateConfig?.layers.texts ?? [],
    stickers: state.templateConfig?.layers.stickers ?? [],
    layerStates: { ...state.layerStates },
    selectedCharacter: state.selectedCharacter,
    characterColors: state.characterColors,
  }
}

// ============================================
// Blob URL 수명 관리 (C3 수정)
// 이미지 blob URL 은 히스토리 스냅샷이 참조하는 동안 revoke 하면 안 된다.
// 스냅샷이 히스토리에서 탈락하는 시점에만 고아 URL 을 정리한다.
// ============================================

function blobUrlsOf(images: ImageData): string[] {
  return Object.values(images).filter(
    (url): url is string => typeof url === 'string' && url.startsWith('blob:')
  )
}

/** 스냅샷 목록(+현재 이미지)이 참조 중인 blob URL 집합 */
export function collectBlobUrls(
  snapshots: HistorySnapshot[],
  currentImages?: ImageData
): Set<string> {
  const retained = new Set<string>()
  snapshots.forEach((s) => blobUrlsOf(s.images).forEach((u) => retained.add(u)))
  if (currentImages) blobUrlsOf(currentImages).forEach((u) => retained.add(u))
  return retained
}

/** URL 집합 전체 revoke (템플릿 전환/리셋 시 전량 정리용) */
export function revokeBlobUrls(urls: Iterable<string>): void {
  for (const url of urls) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      // 이미 해제된 URL 무시
    }
  }
}

/** 탈락한 스냅샷의 blob URL 중 어디서도 참조되지 않는 것만 revoke */
export function revokeOrphanedBlobUrls(
  dropped: HistorySnapshot[],
  retained: Set<string>
): void {
  const seen = new Set<string>()
  dropped.forEach((s) => {
    blobUrlsOf(s.images).forEach((url) => {
      if (retained.has(url) || seen.has(url)) return
      seen.add(url)
      try {
        URL.revokeObjectURL(url)
      } catch {
        // 이미 해제된 URL 무시
      }
    })
  })
}

/**
 * 히스토리에 스냅샷 추가
 * @returns 새로운 히스토리 상태
 */
export function pushSnapshot(
  currentHistory: HistorySnapshot[],
  currentIndex: number,
  snapshot: HistorySnapshot
): HistoryState {
  // 이전 스냅샷과 동일하면 추가하지 않음
  const lastSnapshot = currentHistory[currentIndex]
  if (lastSnapshot && areSnapshotsEqual(snapshot, lastSnapshot)) {
    return { history: currentHistory, historyIndex: currentIndex }
  }

  const dropped: HistorySnapshot[] = []

  // 현재 인덱스 이후의 히스토리는 삭제 (redo 가지 절단)
  dropped.push(...currentHistory.slice(currentIndex + 1))
  const newHistory = currentHistory.slice(0, currentIndex + 1)
  newHistory.push(snapshot)

  // 최대 크기 유지
  let newIndex = newHistory.length - 1
  if (newHistory.length > MAX_HISTORY_SIZE) {
    dropped.push(...newHistory.splice(0, newHistory.length - MAX_HISTORY_SIZE))
    newIndex = newHistory.length - 1
  }

  // 탈락 스냅샷만 참조하던 blob URL 정리 (C3: 살아있는 스냅샷 참조는 보존)
  if (dropped.length > 0) {
    revokeOrphanedBlobUrls(dropped, collectBlobUrls(newHistory))
  }

  return { history: newHistory, historyIndex: newIndex }
}

// ============================================
// 히스토리 액션 생성자
// ============================================

type HistoryHostState = HistoryState & SnapshotSource & {
  isDirty: boolean
  selectedStickerId: string | null
}

export function createHistoryActions<T extends HistoryHostState>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  get: () => T
): HistoryActions {
  // 스냅샷을 상태로 복원 (undo/redo 공통)
  const restoreSnapshot = (snapshot: HistorySnapshot, newIndex: number) => {
    set((state) => {
      const templateConfig = state.templateConfig
        ? {
            ...state.templateConfig,
            layers: {
              ...state.templateConfig.layers,
              texts: snapshot.texts ?? state.templateConfig.layers.texts,
              stickers: snapshot.stickers ?? state.templateConfig.layers.stickers,
            },
          }
        : null

      // 복원된 스티커 목록에 없는 선택 ID 정리
      const stickerIds = new Set((snapshot.stickers ?? []).map((s) => s.id))
      const selectedStickerId =
        state.selectedStickerId && stickerIds.has(state.selectedStickerId)
          ? state.selectedStickerId
          : null

      return {
        formData: snapshot.formData,
        images: snapshot.images,
        colors: snapshot.colors,
        slotTransforms: snapshot.slotTransforms || {},
        templateConfig,
        layerStates: snapshot.layerStates ?? state.layerStates,
        selectedCharacter: snapshot.selectedCharacter ?? null,
        characterColors: snapshot.characterColors ?? null,
        selectedStickerId,
        historyIndex: newIndex,
        isDirty: true,
      } as Partial<T>
    })
  }

  return {
    pushHistory: () => {
      const state = get()
      const snapshot = createSnapshot(state)
      const { history, historyIndex } = pushSnapshot(
        state.history,
        state.historyIndex,
        snapshot
      )
      set({ history, historyIndex } as Partial<T>)
    },

    undo: () => {
      const state = get()
      if (state.historyIndex <= 0) return
      const newIndex = state.historyIndex - 1
      restoreSnapshot(state.history[newIndex], newIndex)
    },

    redo: () => {
      const state = get()
      if (state.historyIndex >= state.history.length - 1) return
      const newIndex = state.historyIndex + 1
      restoreSnapshot(state.history[newIndex], newIndex)
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    getHistoryInfo: () => {
      const state = get()
      return {
        current: state.historyIndex + 1,
        total: state.history.length,
        canUndo: state.historyIndex,
        canRedo: state.history.length - 1 - state.historyIndex,
      }
    },
  }
}
