/**
 * Yjs collaboration provider backed by Supabase Realtime.
 *
 * The local BroadcastChannel transport is kept for demo/test environments.
 * Initial document hydration and subsequent editor changes intentionally use
 * different origins so initial state is not echoed while real edits are.
 */

import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { BroadcastChannelProvider } from './broadcastProvider'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  SyncState,
  UserEditingState,
  CollabUser,
  EditingZone,
  YjsUpdateOrigin,
} from './types'

const INITIAL_STATE_WAIT_MS = 750
// Private-channel authorization may need to wake Supabase's Realtime
// authorization pool before evaluating RLS. Keep the client and channel join
// deadlines aligned so a valid member is not rejected by the SDK's shorter
// default timeout during a cold connection.
const CONNECT_TIMEOUT_MS = 30_000
const REALTIME_DISCONNECT_WAIT_MS = 1_000
const REALTIME_DISCONNECT_POLL_MS = 25
const SYNC_SETTLE_MS = 100

interface StateRequestPayload {
  userId: string
}

interface StateResponsePayload {
  userId: string
  targetUserId: string | null
  update: number[]
}

type CollabBroadcastEvent =
  | 'yjs-update'
  | 'awareness-update'
  | 'request-state'
  | 'state-response'

interface CollabBroadcastRpcClient {
  rpc(
    fn: 'broadcast_collab_message',
    args: {
      p_session_id: string
      p_realtime_key: string
      p_event: CollabBroadcastEvent
      p_payload: object
    }
  ): PromiseLike<{ error: { message: string } | null }>
}

export interface SupabaseYjsProviderOptions {
  sessionId: string
  /** Server-rotated capability used to abandon cached Realtime grants. */
  realtimeKey?: string
  user: CollabUser
  onSyncStateChange?: (state: SyncState) => void
  onRemoteUserChange?: (users: Map<string, UserEditingState>) => void
  onConflict?: (slotId: string | null, textId: string | null, userName: string) => void
  onConnectionChange?: (isConnected: boolean) => void
  onSyncingChange?: (isSyncing: boolean) => void
}

function cloneSyncState(state: SyncState): SyncState {
  return JSON.parse(JSON.stringify(state)) as SyncState
}

function emptySyncState(): SyncState {
  return {
    formData: {},
    images: {},
    colors: {
      primaryColor: '#FFD9D9',
      secondaryColor: '#D7FAFA',
    },
    slotTransforms: {},
    stickers: [],
    texts: [],
  }
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function nullableString(value: unknown, fallback: string | null): string | null {
  return value === null || typeof value === 'string' ? value : fallback
}

export class SupabaseYjsProvider {
  doc: Y.Doc
  awareness: Awareness

  private channel: RealtimeChannel | null = null
  private broadcastProvider: BroadcastChannelProvider | null = null
  private sessionId: string
  private realtimeKey: string | null
  private user: CollabUser
  isConnected = false
  private isSyncing = false
  private isBootstrapped = false
  private pendingInitialState: SyncState | null = null
  private bootstrapTimer: ReturnType<typeof setTimeout> | null = null
  private syncTimer: ReturnType<typeof setTimeout> | null = null

  // Participant allowlist supplied from the server-backed collaboration row.
  // Realtime topic authorization remains a separate server/RLS concern.
  private allowedUserIds: Set<string> | null = null

  private remoteEditingStates = new Map<string, UserEditingState>()
  private presentUserIds = new Set<string>()
  private remoteUserNames = new Map<string, string>()

  private onSyncStateChange?: (state: SyncState) => void
  private onRemoteUserChange?: (users: Map<string, UserEditingState>) => void
  private onConflict?: (slotId: string | null, textId: string | null, userName: string) => void
  private onConnectionChange?: (isConnected: boolean) => void
  private onSyncingChange?: (isSyncing: boolean) => void

  sharedFormData: Y.Map<string>
  sharedImages: Y.Map<string>
  sharedColors: Y.Map<string>
  sharedTransforms: Y.Map<unknown>
  sharedStickers: Y.Array<unknown>
  sharedTexts: Y.Array<unknown>

  constructor(options: SupabaseYjsProviderOptions) {
    this.sessionId = options.sessionId
    this.realtimeKey = options.realtimeKey ?? null
    this.user = options.user
    this.onSyncStateChange = options.onSyncStateChange
    this.onRemoteUserChange = options.onRemoteUserChange
    this.onConflict = options.onConflict
    this.onConnectionChange = options.onConnectionChange
    this.onSyncingChange = options.onSyncingChange

    this.doc = new Y.Doc()
    this.awareness = new Awareness(this.doc)
    this.sharedFormData = this.doc.getMap('formData')
    this.sharedImages = this.doc.getMap('images')
    this.sharedColors = this.doc.getMap('colors')
    this.sharedTransforms = this.doc.getMap('slotTransforms')
    this.sharedStickers = this.doc.getArray('stickers')
    this.sharedTexts = this.doc.getArray('texts')

    this.setupObservers()
  }

  /** Connect to Supabase Realtime or to the local demo transport. */
  async connect(): Promise<void> {
    if (!isSupabaseConfigured()) {
      this.connectViaBroadcastChannel()
      this.setConnected(true)
      this.beginInitialSync()
      return
    }

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }
      if (!this.realtimeKey) {
        throw new Error('Realtime key is required for private collaboration')
      }

      // Private Realtime 채널의 RLS 판정에 현재 Auth JWT를 사용한다.
      // Supabase disconnects the shared websocket when its final channel is
      // removed. A key rotation can mount the replacement provider during that
      // brief closing state; subscribe() otherwise skips connect() and the new
      // channel times out. Wait only for the SDK's bounded close transition.
      const disconnectDeadline = Date.now() + REALTIME_DISCONNECT_WAIT_MS
      while (supabase.realtime.isDisconnecting()) {
        if (Date.now() >= disconnectDeadline) {
          throw new Error('Realtime transport did not finish disconnecting')
        }
        await new Promise((resolve) => {
          setTimeout(resolve, REALTIME_DISCONNECT_POLL_MS)
        })
      }

      await supabase.realtime.setAuth()
      this.channel = supabase.channel(
        `collab-yjs:${this.sessionId}:${this.realtimeKey}`,
        {
        config: {
          private: true,
          broadcast: {
            self: false,
          },
        },
        }
      )

      this.channel.on('broadcast', { event: 'yjs-update' }, ({ payload }) => {
        try {
          this.handleRemoteUpdate(payload)
        } catch (error) {
          console.warn('[YjsProvider] Error handling remote update:', error)
        }
      })

      this.channel.on('broadcast', { event: 'awareness-update' }, ({ payload }) => {
        try {
          this.handleAwarenessUpdate(payload)
        } catch (error) {
          console.warn('[YjsProvider] Error handling awareness update:', error)
        }
      })

      this.channel.on('broadcast', { event: 'request-state' }, ({ payload }) => {
        try {
          this.handleStateRequest(payload)
        } catch (error) {
          console.warn('[YjsProvider] Error handling state request:', error)
        }
      })

      this.channel.on('broadcast', { event: 'state-response' }, ({ payload }) => {
        try {
          this.handleStateResponse(payload)
        } catch (error) {
          console.warn('[YjsProvider] Error handling state response:', error)
        }
      })

      // subscribe() returns a channel immediately. Resolve only when the
      // transport reports the real SUBSCRIBED state.
      await new Promise<void>((resolve, reject) => {
        let settled = false
        let transportSubscribed = false
        const connectTimeout = setTimeout(() => {
          if (settled) return
          settled = true
          this.setConnected(false)
          reject(new Error('Realtime connection timed out'))
        }, CONNECT_TIMEOUT_MS)

        const fail = (status: string) => {
          this.setConnected(false)
          this.clearBootstrapTimer()
          if (!settled) {
            settled = true
            clearTimeout(connectTimeout)
            reject(new Error(`Realtime connection failed: ${status}`))
          }
        }

        this.channel?.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            if (transportSubscribed) return
            transportSubscribed = true
            this.setConnected(true)

            void (async () => {
              if (!this.isConnected) return
              // Server-stamped awareness doubles as an authenticated presence
              // announcement; direct client Broadcast/Presence writes stay disabled.
              this.updateAwareness({
                zone: null,
                selectedSlotId: null,
                selectedTextId: null,
                cursor: null,
                lastActivity: Date.now(),
              })
              this.beginInitialSync()
              if (!settled) {
                settled = true
                clearTimeout(connectTimeout)
                resolve()
              }
            })()
            return
          }

          if (
            status === 'CHANNEL_ERROR' ||
            status === 'TIMED_OUT' ||
            status === 'CLOSED'
          ) {
            transportSubscribed = false
            fail(status)
          }
        }, CONNECT_TIMEOUT_MS)
      })
    } catch (error) {
      this.setConnected(false)
      console.error('[YjsProvider] Connection failed:', error)
      throw error
    }
  }

  private connectViaBroadcastChannel(): void {
    this.broadcastProvider = new BroadcastChannelProvider(this.sessionId, this.user)

    this.broadcastProvider.on('yjs-update', (payload) => {
      this.handleRemoteUpdate(payload as { update: number[]; userId: string })
    })
    this.broadcastProvider.on('awareness-update', (payload) => {
      this.handleAwarenessUpdate(
        payload as { userId: string; state: Partial<UserEditingState> }
      )
    })
    this.broadcastProvider.on('request-state', (payload) => {
      this.handleStateRequest(payload as StateRequestPayload)
    })
    this.broadcastProvider.on('state-response', (payload) => {
      this.handleStateResponse(payload as StateResponsePayload)
    })
    this.broadcastProvider.on('presence-sync', () => {
      this.syncRemoteUsersFromBroadcast()
    })

    this.broadcastProvider.connect()
  }

  /** Disconnect and release every transport, document, timer, and presence reference. */
  disconnect(): void {
    this.clearBootstrapTimer()
    this.clearSyncTimer()
    this.setSyncing(false)
    this.setConnected(false)

    if (this.broadcastProvider) {
      this.broadcastProvider.disconnect()
      this.broadcastProvider = null
    }

    if (this.channel) {
      try {
        if (isSupabaseConfigured()) {
          const supabase = createClient()
          if (supabase) {
            void supabase.removeChannel(this.channel)
          }
        }
      } catch (error) {
        console.warn('[YjsProvider] Error removing channel:', error)
      }
      this.channel = null
    }

    this.remoteEditingStates.clear()
    this.presentUserIds.clear()
    this.remoteUserNames.clear()
    this.onRemoteUserChange?.(new Map())

    try {
      this.awareness.destroy()
    } catch (error) {
      console.warn('[YjsProvider] Error destroying awareness:', error)
    }
    try {
      this.doc.destroy()
    } catch (error) {
      console.warn('[YjsProvider] Error destroying doc:', error)
    }
  }

  /**
   * Stage the editor snapshot used only if no existing peer answers the
   * initial state request. This avoids creating a second, concurrent Yjs base
   * document for a late joiner.
   */
  prepareInitialState(state: SyncState): void {
    this.pendingInitialState = cloneSyncState(state)
  }

  /**
   * Compatibility API for callers that intentionally need immediate local
   * hydration. Initial hydration never broadcasts.
   */
  initializeState(state: SyncState): void {
    this.pendingInitialState = cloneSyncState(state)
    this.replaceSharedState(state, 'init')
    this.isBootstrapped = true
  }

  /**
   * Apply a real local editor change. Before bootstrap it only refreshes the
   * fallback snapshot; after bootstrap its Yjs update is broadcast.
   */
  syncLocalState(state: SyncState): void {
    this.pendingInitialState = cloneSyncState(state)
    if (!this.isBootstrapped) return
    this.replaceSharedState(state, 'local')
  }

  private replaceSharedState(state: SyncState, origin: YjsUpdateOrigin): void {
    this.doc.transact(() => {
      this.syncStringMap(this.sharedFormData, state.formData)
      this.syncStringMap(this.sharedImages, state.images)
      this.syncStringMap(this.sharedColors, state.colors)

      const desiredTransforms = new Map(
        Object.entries(state.slotTransforms)
      )
      Array.from(this.sharedTransforms.keys()).forEach((key) => {
        if (!desiredTransforms.has(key)) {
          this.sharedTransforms.delete(key)
        }
      })
      desiredTransforms.forEach((value, key) => {
        if (!sameJson(this.sharedTransforms.get(key), value)) {
          this.sharedTransforms.set(key, value)
        }
      })

      const currentStickers = this.sharedStickers.toArray()
      if (!sameJson(currentStickers, state.stickers)) {
        if (this.sharedStickers.length > 0) {
          this.sharedStickers.delete(0, this.sharedStickers.length)
        }
        if (state.stickers.length > 0) {
          this.sharedStickers.insert(0, cloneSyncState(state).stickers)
        }
      }

      const currentTexts = this.sharedTexts.toArray()
      if (!sameJson(currentTexts, state.texts)) {
        if (this.sharedTexts.length > 0) {
          this.sharedTexts.delete(0, this.sharedTexts.length)
        }
        if (state.texts.length > 0) {
          this.sharedTexts.insert(0, cloneSyncState(state).texts)
        }
      }
    }, origin)
  }

  private syncStringMap(
    target: Y.Map<string>,
    source: Record<string, string | null | undefined>
  ): void {
    const desired = new Map(
      Object.entries(source).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string'
      )
    )

    Array.from(target.keys()).forEach((key) => {
      if (!desired.has(key)) {
        target.delete(key)
      }
    })
    desired.forEach((value, key) => {
      if (target.get(key) !== value) {
        target.set(key, value)
      }
    })
  }

  broadcastUpdate(update: Uint8Array): void {
    if (!this.isConnected) return

    const payload = {
      update: Array.from(update),
      userId: this.user.id,
      timestamp: Date.now(),
    }

    if (this.broadcastProvider) {
      this.broadcastProvider.broadcastYjsUpdate(payload.update, payload.userId)
    } else {
      this.sendRealtimeBroadcast('yjs-update', payload)
    }
  }

  updateAwareness(state: Partial<UserEditingState>): void {
    const current = (
      this.awareness.getLocalState() as { editing?: Partial<UserEditingState> } | null
    )?.editing
    const next: UserEditingState = {
      zone: current?.zone ?? null,
      selectedSlotId: current?.selectedSlotId ?? null,
      selectedTextId: current?.selectedTextId ?? null,
      cursor: current?.cursor ?? null,
      ...current,
      ...state,
      userId: this.user.id,
      lastActivity:
        typeof state.lastActivity === 'number' ? state.lastActivity : Date.now(),
    }

    this.awareness.setLocalStateField('editing', next)
    if (!this.isConnected) return

    if (this.broadcastProvider) {
      this.broadcastProvider.broadcastAwareness(this.user.id, next)
    } else {
      this.sendRealtimeBroadcast('awareness-update', {
        userId: this.user.id,
        state: next,
        timestamp: Date.now(),
      })
    }
  }

  claimZone(zone: EditingZone): void {
    this.updateAwareness({
      zone,
      lastActivity: Date.now(),
    })
  }

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

    return {
      formData,
      images,
      colors: colors as SyncState['colors'],
      slotTransforms: slotTransforms as SyncState['slotTransforms'],
      stickers: this.sharedStickers.toArray() as SyncState['stickers'],
      texts: this.sharedTexts.toArray() as SyncState['texts'],
    }
  }

  private setupObservers(): void {
    this.doc.on('update', (update: Uint8Array, origin: unknown) => {
      if (origin !== 'remote' && origin !== 'init') {
        this.broadcastUpdate(update)
      }

      // Local editor state is already the source for local changes. Feeding it
      // back into Zustand would cause an unnecessary echo render.
      if (origin === 'remote') {
        this.onSyncStateChange?.(this.getSyncState())
      }
    })
  }

  setAllowedUsers(ids: string[] | null): void {
    const nextAllowedUserIds = ids ? new Set(ids) : null
    const isUnchanged =
      (this.allowedUserIds === null && nextAllowedUserIds === null) ||
      (this.allowedUserIds !== null &&
        nextAllowedUserIds !== null &&
        this.allowedUserIds.size === nextAllowedUserIds.size &&
        Array.from(this.allowedUserIds).every((id) => nextAllowedUserIds.has(id)))

    if (isUnchanged) return
    this.allowedUserIds = nextAllowedUserIds

    Array.from(this.remoteEditingStates.keys()).forEach((userId) => {
      if (!this.isAllowedSender(userId)) this.remoteEditingStates.delete(userId)
    })
    Array.from(this.presentUserIds).forEach((userId) => {
      if (!this.isAllowedSender(userId)) this.presentUserIds.delete(userId)
    })
    this.emitRemoteUsers()

    // A participant row can arrive after the websocket. Retry bootstrap once
    // the authoritative participant list becomes available.
    if (this.isConnected && !this.isBootstrapped) {
      this.beginInitialSync()
    }
  }

  private isAllowedSender(userId: unknown): userId is string {
    if (typeof userId !== 'string' || !userId) return false
    return this.allowedUserIds === null || this.allowedUserIds.has(userId)
  }

  private setConnected(connected: boolean): void {
    if (this.isConnected === connected) return
    this.isConnected = connected
    this.onConnectionChange?.(connected)
  }

  private setSyncing(syncing: boolean): void {
    if (this.isSyncing === syncing) return
    this.isSyncing = syncing
    this.onSyncingChange?.(syncing)
  }

  private clearBootstrapTimer(): void {
    if (this.bootstrapTimer) {
      clearTimeout(this.bootstrapTimer)
      this.bootstrapTimer = null
    }
  }

  private clearSyncTimer(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }
  }

  private beginInitialSync(): void {
    if (!this.isConnected) return

    this.requestInitialState()
    if (this.isBootstrapped) {
      this.sendStateResponse(null)
      return
    }

    this.clearBootstrapTimer()
    this.bootstrapTimer = setTimeout(() => {
      this.bootstrapTimer = null
      if (this.isBootstrapped || !this.isConnected) return

      this.initializeState(this.pendingInitialState ?? emptySyncState())
      // Announce a newly seeded document so simultaneous first participants
      // converge instead of waiting for another request.
      this.sendStateResponse(null)
    }, INITIAL_STATE_WAIT_MS)
  }

  private handleStateRequest(payload: StateRequestPayload): void {
    if (
      !payload ||
      !this.isAllowedSender(payload.userId) ||
      payload.userId === this.user.id ||
      !this.isBootstrapped
    ) {
      return
    }

    this.sendStateResponse(payload.userId)
  }

  private sendStateResponse(targetUserId: string | null): void {
    if (!this.isConnected || !this.isBootstrapped) return

    const payload: StateResponsePayload = {
      userId: this.user.id,
      targetUserId,
      update: Array.from(Y.encodeStateAsUpdate(this.doc)),
    }

    if (this.broadcastProvider) {
      this.broadcastProvider.broadcast('state-response', payload)
    } else {
      this.sendRealtimeBroadcast('state-response', payload)
    }
  }

  private handleStateResponse(payload: StateResponsePayload): void {
    if (
      !payload ||
      !this.isAllowedSender(payload.userId) ||
      payload.userId === this.user.id ||
      (payload.targetUserId !== null && payload.targetUserId !== this.user.id) ||
      !Array.isArray(payload.update)
    ) {
      return
    }

    this.clearBootstrapTimer()
    this.isBootstrapped = true
    this.applyRemoteUpdate(payload.update)
  }

  private handleRemoteUpdate(payload: { update: number[]; userId: string }): void {
    if (
      !payload ||
      !this.isAllowedSender(payload.userId) ||
      !Array.isArray(payload.update)
    ) {
      return
    }
    this.applyRemoteUpdate(payload.update)
  }

  private applyRemoteUpdate(rawUpdate: number[]): void {
    this.setSyncing(true)
    Y.applyUpdate(this.doc, new Uint8Array(rawUpdate), 'remote')

    this.clearSyncTimer()
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null
      this.setSyncing(false)
    }, SYNC_SETTLE_MS)
  }

  private handleAwarenessUpdate(payload: {
    userId: string
    state: Partial<UserEditingState>
  }): void {
    if (
      !payload ||
      !this.isAllowedSender(payload.userId) ||
      payload.userId === this.user.id ||
      !payload.state ||
      typeof payload.state !== 'object'
    ) {
      return
    }

    const previous = this.remoteEditingStates.get(payload.userId)
    const cursor = payload.state.cursor
    const validCursor =
      cursor === null ||
      (typeof cursor?.x === 'number' &&
        Number.isFinite(cursor.x) &&
        typeof cursor?.y === 'number' &&
        Number.isFinite(cursor.y))

    const zone =
      payload.state.zone === 'A' ||
      payload.state.zone === 'B' ||
      payload.state.zone === null
        ? payload.state.zone
        : previous?.zone ?? null

    const next: UserEditingState = {
      userId: payload.userId,
      zone,
      selectedSlotId: nullableString(
        payload.state.selectedSlotId,
        previous?.selectedSlotId ?? null
      ),
      selectedTextId: nullableString(
        payload.state.selectedTextId,
        previous?.selectedTextId ?? null
      ),
      cursor: validCursor ? cursor ?? null : previous?.cursor ?? null,
      lastActivity:
        typeof payload.state.lastActivity === 'number' &&
        Number.isFinite(payload.state.lastActivity)
          ? payload.state.lastActivity
          : Date.now(),
    }

    this.remoteEditingStates.set(payload.userId, next)
    this.presentUserIds.add(payload.userId)

    const localEditing = (
      this.awareness.getLocalState() as { editing?: UserEditingState } | null
    )?.editing
    const remoteName = this.remoteUserNames.get(payload.userId) ?? payload.userId

    if (
      next.selectedSlotId &&
      localEditing?.selectedSlotId === next.selectedSlotId
    ) {
      this.onConflict?.(next.selectedSlotId, null, remoteName)
    }
    if (
      next.selectedTextId &&
      localEditing?.selectedTextId === next.selectedTextId
    ) {
      this.onConflict?.(null, next.selectedTextId, remoteName)
    }

    this.emitRemoteUsers()
  }

  private syncRemoteUsers(): void {
    if (!this.channel) return

    const nextIds = new Set<string>()
    const presenceState = this.channel.presenceState()
    Object.values(presenceState)
      .flat()
      .forEach((presence: unknown) => {
        const entry = presence as { user_id?: string; user_name?: string }
        if (
          entry.user_id &&
          entry.user_id !== this.user.id &&
          this.isAllowedSender(entry.user_id)
        ) {
          nextIds.add(entry.user_id)
          if (entry.user_name) {
            this.remoteUserNames.set(entry.user_id, entry.user_name)
          }
        }
      })

    this.replacePresenceUsers(nextIds)
  }

  private syncRemoteUsersFromBroadcast(): void {
    if (!this.broadcastProvider) return

    const nextIds = new Set<string>()
    this.broadcastProvider.getPresenceState().forEach((entry, userId) => {
      if (userId !== this.user.id && this.isAllowedSender(userId)) {
        nextIds.add(userId)
        this.remoteUserNames.set(userId, entry.user_name)
      }
    })

    this.replacePresenceUsers(nextIds)
  }

  private replacePresenceUsers(nextIds: Set<string>): void {
    this.presentUserIds = nextIds
    Array.from(this.remoteEditingStates.keys()).forEach((userId) => {
      if (!nextIds.has(userId)) {
        this.remoteEditingStates.delete(userId)
        this.remoteUserNames.delete(userId)
      }
    })
    this.emitRemoteUsers()
  }

  private emitRemoteUsers(): void {
    const users = new Map<string, UserEditingState>()
    this.presentUserIds.forEach((userId) => {
      if (!this.isAllowedSender(userId)) return
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
    const payload: StateRequestPayload = {
      userId: this.user.id,
    }

    if (this.broadcastProvider) {
      this.broadcastProvider.broadcast('request-state', payload)
    } else {
      this.sendRealtimeBroadcast('request-state', payload)
    }
  }

  /**
   * All production writes cross an authenticated RPC. The database validates
   * current membership for every message and overwrites `userId` with auth.uid,
   * so a cached websocket grant cannot be used to spoof another participant.
   */
  private sendRealtimeBroadcast(
    event: CollabBroadcastEvent,
    payload: object
  ): void {
    if (!this.channel || !this.realtimeKey || !this.isConnected) return

    const supabase = createClient()
    if (!supabase) return

    void (supabase as unknown as CollabBroadcastRpcClient)
      .rpc('broadcast_collab_message', {
        p_session_id: this.sessionId,
        p_realtime_key: this.realtimeKey,
        p_event: event,
        p_payload: payload,
      })
      .then(({ error }) => {
        if (error) {
          console.warn(
            `[YjsProvider] ${event} broadcast rejected:`,
            error.message
          )
        }
      })
  }
}
