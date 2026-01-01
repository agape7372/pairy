/**
 * Sprint 32: Yjs + Supabase Realtime Provider
 *
 * CRDT 기반 실시간 동기화를 위한 커스텀 프로바이더
 */

import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
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
  private sessionId: string
  private user: CollabUser
  private isConnected = false
  private isSyncing = false

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

  /** Supabase Realtime 채널 연결 */
  async connect(): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('[YjsProvider] Supabase not configured, running in offline mode')
      return
    }

    const supabase = createClient()

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
      this.handleRemoteUpdate(payload)
    })

    // Awareness 업데이트 수신
    this.channel.on('broadcast', { event: 'awareness-update' }, ({ payload }) => {
      this.handleAwarenessUpdate(payload)
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
        await this.channel?.track({
          user_id: this.user.id,
          user_name: this.user.name,
          user_color: this.user.color,
          user_avatar: this.user.avatar,
          online_at: new Date().toISOString(),
        })

        // 초기 상태 요청 (기존 참여자로부터)
        this.requestInitialState()
      }
    })
  }

  /** 연결 해제 */
  disconnect(): void {
    if (this.channel) {
      const supabase = createClient()
      supabase.removeChannel(this.channel)
      this.channel = null
    }
    this.isConnected = false
    this.awareness.destroy()
    this.doc.destroy()
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
    if (!this.channel || !this.isConnected) return

    this.channel.send({
      type: 'broadcast',
      event: 'yjs-update',
      payload: {
        update: Array.from(update),
        userId: this.user.id,
        timestamp: Date.now(),
      },
    })
  }

  /** Awareness 상태 업데이트 */
  updateAwareness(state: Partial<UserEditingState>): void {
    this.awareness.setLocalStateField('editing', state)

    // 브로드캐스트
    if (this.channel && this.isConnected) {
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
    // 원격 사용자 편집 상태 처리
    const remoteStates = this.awareness.getStates()
    const currentState = remoteStates.get(this.awareness.clientID) as { editing?: UserEditingState } | undefined

    // 충돌 감지
    if (payload.state.selectedSlotId && currentState?.editing?.selectedSlotId === payload.state.selectedSlotId) {
      this.onConflict?.(payload.state.selectedSlotId, null, payload.userId)
    }
    if (payload.state.selectedTextId && currentState?.editing?.selectedTextId === payload.state.selectedTextId) {
      this.onConflict?.(null, payload.state.selectedTextId, payload.userId)
    }
  }

  private syncRemoteUsers(): void {
    if (!this.channel) return

    const presenceState = this.channel.presenceState()
    const users = new Map<string, UserEditingState>()

    Object.values(presenceState).flat().forEach((presence: unknown) => {
      const p = presence as { user_id?: string; user_name?: string }
      if (p.user_id && p.user_id !== this.user.id) {
        users.set(p.user_id, {
          userId: p.user_id,
          zone: null,
          selectedSlotId: null,
          selectedTextId: null,
          cursor: null,
          lastActivity: Date.now(),
        })
      }
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
