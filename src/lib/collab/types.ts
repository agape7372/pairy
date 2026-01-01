/**
 * Sprint 32: 실시간 협업 타입 정의
 */

import type {
  FormData,
  ImageData,
  ColorData,
  SlotTransforms,
  StickerLayer,
} from '@/types/template'

/** 동기화할 상태 스냅샷 */
export interface SyncState {
  formData: FormData
  images: ImageData
  colors: ColorData
  slotTransforms: SlotTransforms
  stickers: StickerLayer[]
}

/** 사용자 정보 */
export interface CollabUser {
  id: string
  name: string
  color: string
  avatar?: string
}

/** 편집 영역 (A/B 분리) */
export type EditingZone = 'A' | 'B' | null

/** 사용자 편집 상태 */
export interface UserEditingState {
  userId: string
  zone: EditingZone
  selectedSlotId: string | null
  selectedTextId: string | null
  cursor: { x: number; y: number } | null
  lastActivity: number
}

/** 협업 상태 */
export interface CollabState {
  isConnected: boolean
  isSyncing: boolean
  sessionId: string | null
  localUser: CollabUser | null
  remoteUsers: Map<string, UserEditingState>
  editingZones: {
    A: string | null // userId
    B: string | null // userId
  }
}

/** 충돌 알림 정보 */
export interface EditConflict {
  slotId?: string
  textId?: string
  userId: string
  userName: string
  timestamp: number
}

/** Yjs 업데이트 타입 */
export type YjsUpdateOrigin = 'local' | 'remote' | 'init'
