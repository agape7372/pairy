/**
 * Sprint 32: Yjs + Supabase Realtime Provider
 *
 * CRDT 기반 실시간 동기화를 위한 커스텀 프로바이더
 */

import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { BroadcastChannelProvider } from './broadcastProvider'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { SyncState, UserEditingState, CollabUser, EditingZone } from './types'

export interface SupabaseYjsProviderOptions {
  sessionId: string
  user: CollabUser
  onSyncStateChange?: (state: SyncState) => void
  onRemoteUserChange?: (users: Map<string, UserEditingState>) => void
  onConflict?: (slotId: string | null, textId: string | null, userName: string) => void
}

export class SupabaseYjsProvider {
  doc: Y.Doc
  awareness: Awareness

  private channel: RealtimeChannel | null = null
  private broadcastProvider: BroadcastChannelProvider | null = null
  private sessionId: string
  private user: CollabUser
  isConnected = false
  private isSyncing = false

  // 원격 사용자 편집 상태(커서/선택/영역) 저장소 — presence(신원)와 별개로 유지
  private remoteEditingStates = new Map<string, UserEditingState>()
  private presentUserIds = new Set<string>()

  // 콜백
  private onSyncStateChange?: (state: SyncState) => void
  private onRemoteUserChange?: (users: Map<string, UserEditingState>) => void
  private onConflict?: (slotId: string | null, textId: string | null, userName: string) => void

  // 공유 데이터 (Y.Map / Y.Array)
  sharedFormData: Y.Map<string>
  sharedImages: Y.Map<string>
  sharedColors: Y.Map<string>
  sharedTransforms: Y.Map<unknown>
  sharedStickers: Y.Array<unknown>

  constructor(options: SupabaseYjsProviderOptions) {
    this.sessionId = options.sessionId
    this.user = options.user
    this.onSyncStateChange = options.onSyncStateChange
    this.onRemoteUserChange = options.onRemoteUserChange
    this.onConflict = options.onConflict

    // Yjs 문서 생성
    this.doc = new Y.Doc()

    // Awareness (커서, 선택 상태 등)
    this.awareness = new Awareness(this.doc)

    // 공유 데이터 구조 초기화
    this.sharedFormData = this.doc.getMap('formData')
    this.sharedImages = this.doc.getMap('images')
    this.sharedColors = this.doc.getMap('colors')
    this.sharedTransforms = this.doc.getMap('slotTransforms')
    this.sharedStickers = this.doc.getArray('stickers')

    // 변경 감지 설정
    this.setupObservers()
  }

  /** Supabase Realtime 또는 BroadcastChannel 연결 */
  async connect(): Promise<void> {
    if (!isSupabaseConfigured()) {
      // Demo 모드: BroadcastChannel 사용
      this.connectViaBroadcastChannel()
      return
    }

    try {
      const supabase = createClient()
      if (!supabase) {
        console.warn('[YjsProvider] Supabase client not available')
        return
      }

      // 채널 생성
      this.channel = supabase.channel(`collab-yjs:${this.sessionId}`, {
        config: {
          broadcast: {
            self: false, // 자신의 브로드캐스트는 수신하지 않음
          },
        },
      })

      // Yjs 업데이트 수신
      this.channel.on('broadcast', { event: 'yjs-update' }, ({ payload }) => {
        try {
          this.handleRemoteUpdate(payload)
        } catch (e) {
          console.warn('[YjsProvider] Error handling remote update:', e)
        }
      })

      // Awareness 업데이트 수신
      this.channel.on('broadcast', { event: 'awareness-update' }, ({ payload }) => {
        try {
          this.handleAwarenessUpdate(payload)
        } catch (e) {
          console.warn('[YjsProvider] Error handling awareness update:', e)
        }
      })

      // Presence 설정 (온라인 상태)
      this.channel.on('presence', { event: 'sync' }, () => {
        this.syncRemoteUsers()
      })

      this.channel.on('presence', { event: 'join' }, () => {
        this.syncRemoteUsers()
      })

      this.channel.on('presence', { event: 'leave' }, () => {
        this.syncRemoteUsers()
      })

      // 구독 시작
      await this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true

          // Presence에 자신 등록
          try {
            await this.channel?.track({
              user_id: this.user.id,
              user_name: this.user.name,
              user_color: this.user.color,
              user_avatar: this.user.avatar,
              online_at: new Date().toISOString(),
            })
          } catch (e) {
            console.warn('[YjsProvider] Error tracking presence:', e)
          }

          // 초기 상태 요청 (기존 참여자로부터)
          this.requestInitialState()
        }
      })
    } catch (error) {
      console.error('[YjsProvider] Connection failed:', error)
      throw error // 상위에서 처리하도록 다시 throw
    }
  }

  /** BroadcastChannel 모드 연결 (Demo/로컬) */
  private connectViaBroadcastChannel(): void {
    this.broadcastProvider = new BroadcastChannelProvider(this.sessionId, this.user)

    // Yjs 업데이트 수신
    this.broadcastProvider.on('yjs-update', (payload) => {
      this.handleRemoteUpdate(payload as { update: number[]; userId: string })
    })

    // Awareness 업데이트 수신
    this.broadcastProvider.on('awareness-update', (payload) => {
      this.handleAwarenessUpdate(payload as { userId: string; state: Partial<UserEditingState> })
    })

    // Presence 변경 감지
    this.broadcastProvider.on('presence-sync', () => {
      this.syncRemoteUsersFromBroadcast()
    })

    // 초기 상태 요청 수신 → 현재 문서 전체 상태를 응답
    this.broadcastProvider.on('request-state', () => {
      if (!this.broadcastProvider) return
      const fullState = Y.encodeStateAsUpdate(this.doc)
      this.broadcastProvider.broadcastYjsUpdate(Array.from(fullState), this.user.id)
    })

    this.broadcastProvider.connect()
    this.isConnected = true

    // 늦게 합류한 탭: 기존 참여자에게 문서 초기 상태 요청
    this.broadcastProvider.broadcast('request-state', { userId: this.user.id })
  }

  /** 연결 해제 (안전한 정리) */
  disconnect(): void {
    try {
      if (this.channel) {
        // 데모 모드가 아닐 때만 채널 제거
        if (isSupabaseConfigured()) {
          const supabase = createClient()
          if (supabase) {
            supabase.removeChannel(this.channel)
          }
        }
        this.channel = null
      }
      this.isConnected = false

      // Awareness와 Doc는 안전하게 정리
      try {
        this.awareness.destroy()
      } catch (e) {
        console.warn('[YjsProvider] Error destroying awareness:', e)
      }
      try {
        this.doc.destroy()
      } catch (e) {
        console.warn('[YjsProvider] Error destroying doc:', e)
      }
    } catch (error) {
      console.error('[YjsProvider] Error during disconnect:', error)
    }
    if (this.broadcastProvider) {
      this.broadcastProvider.disconnect()
      this.broadcastProvider = null
    }
    this.remoteEditingStates.clear()
    this.presentUserIds.clear()
  }

  /** 초기 상태 설정 (로컬 스토어에서) */
  initializeState(state: SyncState): void {
    this.doc.transact(() => {
      // formData
      Object.entries(state.formData).forEach(([key, value]) => {
        if (value !== undefined) {
          this.sharedFormData.set(key, value)
        }
      })

      // images
      Object.entries(state.images).forEach(([key, value]) => {
        if (value !== null) {
          this.sharedImages.set(key, value)
        }
      })

      // colors
      Object.entries(state.colors).forEach(([key, value]) => {
        if (value !== undefined) {
          this.sharedColors.set(key, value)
        }
      })

      // slotTransforms
      Object.entries(state.slotTransforms).forEach(([key, value]) => {
        this.sharedTransforms.set(key, value)
      })

      // stickers
      state.stickers.forEach((sticker) => {
        this.sharedStickers.push([sticker])
      })
    }, 'init')
  }

  /** 로컬 변경사항 브로드캐스트 */
  broadcastUpdate(update: Uint8Array): void {
    if (!this.isConnected) return

    const payload = {
      update: Array.from(update),
      userId: this.user.id,
      timestamp: Date.now(),
    }

    if (this.broadcastProvider) {
      this.broadcastProvider.broadcastYjsUpdate(payload.update, payload.userId)
    } else if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'yjs-update',
        payload,
      })
    }
  }

  /** Awareness 상태 업데이트 */
  updateAwareness(state: Partial<UserEditingState>): void {
    this.awareness.setLocalStateField('editing', state)

    if (!this.isConnected) return

    if (this.broadcastProvider) {
      this.broadcastProvider.broadcastAwareness(this.user.id, state)
    } else if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'awareness-update',
        payload: {
          userId: this.user.id,
          state,
          timestamp: Date.now(),
        },
      })
    }
  }

  /** 편집 영역 선점 */
  claimZone(zone: EditingZone): void {
    this.updateAwareness({
      userId: this.user.id,
      zone,
      lastActivity: Date.now(),
    })
  }

  /** 현재 동기화 상태 가져오기 */
  getSyncState(): SyncState {
    const formData: Record<string, string> = {}
    this.sharedFormData.forEach((value, key) => {
      formData[key] = value
    })

    const images: Record<string, string | null> = {}
    this.sharedImages.forEach((value, key) => {
      images[key] = value
    })

    const colors: Record<string, string> = {
      primaryColor: this.sharedColors.get('primaryColor') || '#FFD9D9',
      secondaryColor: this.sharedColors.get('secondaryColor') || '#D7FAFA',
    }
    this.sharedColors.forEach((value, key) => {
      colors[key] = value
    })

    const slotTransforms: Record<string, unknown> = {}
    this.sharedTransforms.forEach((value, key) => {
      slotTransforms[key] = value
    })

    const stickers = this.sharedStickers.toArray() as unknown[]

    return {
      formData,
      images,
      colors: colors as SyncState['colors'],
      slotTransforms: slotTransforms as SyncState['slotTransforms'],
      stickers: stickers as SyncState['stickers'],
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  private setupObservers(): void {
    // 문서 변경 감지
    this.doc.on('update', (update: Uint8Array, origin: unknown) => {
      // 로컬 변경만 브로드캐스트
      if (origin !== 'remote' && origin !== 'init') {
        this.broadcastUpdate(update)
      }

      // 상태 변경 콜백
      if (this.onSyncStateChange) {
        this.onSyncStateChange(this.getSyncState())
      }
    })

    // Awareness 변경 감지
    this.awareness.on('change', () => {
      this.syncRemoteUsers()
    })
  }

  private handleRemoteUpdate(payload: { update: number[]; userId: string }): void {
    const update = new Uint8Array(payload.update)
    Y.applyUpdate(this.doc, update, 'remote')
    this.isSyncing = true

    // 디바운스된 상태 업데이트
    setTimeout(() => {
      this.isSyncing = false
    }, 100)
  }

  private handleAwarenessUpdate(payload: { userId: string; state: Partial<UserEditingState> }): void {
    const { userId, state } = payload
    if (userId === this.user.id) return

    // 충돌 감지: 로컬 사용자가 이미 같은 대상을 선택 중인지
    const localEditing = (
      this.awareness.getStates().get(this.awareness.clientID) as { editing?: UserEditingState } | undefined
    )?.editing
    if (state.selectedSlotId && localEditing?.selectedSlotId === state.selectedSlotId) {
      this.onConflict?.(state.selectedSlotId, null, userId)
    }
    if (state.selectedTextId && localEditing?.selectedTextId === state.selectedTextId) {
      this.onConflict?.(null, state.selectedTextId, userId)
    }

    // 원격 편집 상태 병합(부분 업데이트 존중) 후 UI 반영
    const prev = this.remoteEditingStates.get(userId)
    this.remoteEditingStates.set(userId, {
      userId,
      zone: 'zone' in state ? (state.zone ?? null) : (prev?.zone ?? null),
      selectedSlotId: 'selectedSlotId' in state ? (state.selectedSlotId ?? null) : (prev?.selectedSlotId ?? null),
      selectedTextId: 'selectedTextId' in state ? (state.selectedTextId ?? null) : (prev?.selectedTextId ?? null),
      cursor: 'cursor' in state ? (state.cursor ?? null) : (prev?.cursor ?? null),
      lastActivity: state.lastActivity ?? Date.now(),
    })
    this.buildAndEmitRemoteUsers()
  }

  /** Supabase Presence에서 접속 사용자 집합 갱신 */
  private syncRemoteUsers(): void {
    if (!this.channel) return

    const presenceState = this.channel.presenceState()
    const present = new Set<string>()
    Object.values(presenceState).flat().forEach((presence: unknown) => {
      const p = presence as { user_id?: string }
      if (p.user_id && p.user_id !== this.user.id) present.add(p.user_id)
    })
    this.updatePresentUsers(present)
  }

  /** BroadcastChannel Presence에서 접속 사용자 집합 갱신 */
  private syncRemoteUsersFromBroadcast(): void {
    if (!this.broadcastProvider) return

    const present = new Set<string>()
    this.broadcastProvider.getPresenceState().forEach((_entry, userId) => {
      if (userId !== this.user.id) present.add(userId)
    })
    this.updatePresentUsers(present)
  }

  /** 접속 사용자 집합 갱신 + 이탈자 편집 상태 정리 후 emit */
  private updatePresentUsers(present: Set<string>): void {
    this.presentUserIds = present
    this.remoteEditingStates.forEach((_state, id) => {
      if (!present.has(id)) this.remoteEditingStates.delete(id)
    })
    this.buildAndEmitRemoteUsers()
  }

  /** presence(신원) ∪ awareness(편집 상태)를 병합해 원격 사용자 맵 방출 */
  private buildAndEmitRemoteUsers(): void {
    const ids = new Set<string>(this.presentUserIds)
    this.remoteEditingStates.forEach((_state, id) => ids.add(id))

    const users = new Map<string, UserEditingState>()
    ids.forEach((userId) => {
      if (userId === this.user.id) return
      users.set(
        userId,
        this.remoteEditingStates.get(userId) ?? {
          userId,
          zone: null,
          selectedSlotId: null,
          selectedTextId: null,
          cursor: null,
          lastActivity: Date.now(),
        }
      )
    })
    this.onRemoteUserChange?.(users)
  }

  private requestInitialState(): void {
    // 기존 참여자가 있으면 상태 요청
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'request-state',
        payload: {
          userId: this.user.id,
        },
      })
    }
  }
}
