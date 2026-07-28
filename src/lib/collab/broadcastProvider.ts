/**
 * BroadcastChannel 기반 로컬 협업 프로바이더
 *
 * Supabase Realtime의 Demo 모드 대체제.
 * 같은 origin의 다른 탭 간에 BroadcastChannel API를 사용하여 통신한다.
 */

import type { CollabUser, UserEditingState } from './types'

// ============================================
// 메시지 타입
// ============================================

interface BroadcastMessage {
  type:
    | 'yjs-update'
    | 'awareness-update'
    | 'chat-message'
    | 'typing-start'
    | 'typing-stop'
    | 'system-message'
    | 'presence-join'
    | 'presence-leave'
    | 'presence-sync'
    | 'request-state'
    | 'state-response'
  payload: unknown
  senderId: string
  timestamp: number
}

// ============================================
// Presence 상태
// ============================================

interface PresenceEntry {
  user_id: string
  user_name: string
  user_color: string
  user_avatar?: string
  online_at: string
}

// ============================================
// BroadcastChannelProvider
// ============================================

export class BroadcastChannelProvider {
  private channel: BroadcastChannel | null = null
  private sessionId: string
  private user: CollabUser
  private presence = new Map<string, PresenceEntry>()
  private listeners = new Map<string, Array<(payload: unknown) => void>>()

  isConnected = false

  constructor(sessionId: string, user: CollabUser) {
    this.sessionId = sessionId
    this.user = user
  }

  /** 채널 연결 */
  connect(): void {
    if (this.channel) return

    this.channel = new BroadcastChannel(`pairy-collab:${this.sessionId}`)
    this.channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const msg = event.data
      // 자기 자신이 보낸 메시지는 무시 (self: false 시뮬레이션)
      if (msg.senderId === this.user.id) return
      this.handleMessage(msg)
    }

    this.isConnected = true

    // 자신의 Presence 등록
    this.presence.set(this.user.id, {
      user_id: this.user.id,
      user_name: this.user.name,
      user_color: this.user.color,
      user_avatar: this.user.avatar,
      online_at: new Date().toISOString(),
    })

    // 참가 알림 브로드캐스트
    this.broadcast('presence-join', {
      user_id: this.user.id,
      user_name: this.user.name,
      user_color: this.user.color,
      user_avatar: this.user.avatar,
      online_at: new Date().toISOString(),
    })

    // 기존 참여자에게 자신의 Presence 동기화 요청
    this.broadcast('presence-sync', {
      entries: Object.fromEntries(this.presence),
    })
  }

  /** 연결 해제 */
  disconnect(): void {
    if (!this.channel) return

    // 퇴장 알림
    this.broadcast('presence-leave', {
      user_id: this.user.id,
    })

    this.channel.close()
    this.channel = null
    this.isConnected = false
    this.presence.clear()
    this.listeners.clear()
  }

  /** 이벤트 리스너 등록 (Supabase channel.on 인터페이스 호환) */
  on(event: string, callback: (payload: unknown) => void): void {
    const callbacks = this.listeners.get(event) || []
    callbacks.push(callback)
    this.listeners.set(event, callbacks)
  }

  /** 이벤트 리스너 제거 */
  off(event: string, callback: (payload: unknown) => void): void {
    const callbacks = this.listeners.get(event) || []
    this.listeners.set(event, callbacks.filter(cb => cb !== callback))
  }

  /** 메시지 브로드캐스트 */
  broadcast(type: BroadcastMessage['type'], payload: unknown): void {
    if (!this.channel) return

    const msg: BroadcastMessage = {
      type,
      payload,
      senderId: this.user.id,
      timestamp: Date.now(),
    }
    this.channel.postMessage(msg)
  }

  /** Yjs 업데이트 브로드캐스트 */
  broadcastYjsUpdate(update: number[], userId: string): void {
    this.broadcast('yjs-update', { update, userId, timestamp: Date.now() })
  }

  /** Awareness 업데이트 브로드캐스트 */
  broadcastAwareness(userId: string, state: Partial<UserEditingState>): void {
    this.broadcast('awareness-update', { userId, state, timestamp: Date.now() })
  }

  /** Presence 상태 가져오기 */
  getPresenceState(): Map<string, PresenceEntry> {
    return new Map(this.presence)
  }

  // ============================================
  // Private
  // ============================================

  private handleMessage(msg: BroadcastMessage): void {
    switch (msg.type) {
      case 'presence-join': {
        const p = msg.payload as PresenceEntry
        this.presence.set(p.user_id, p)
        this.emit('presence-sync', null)
        // 응답: 자신의 Presence 정보도 전달
        this.broadcast('presence-sync', {
          entries: Object.fromEntries(this.presence),
        })
        break
      }
      case 'presence-leave': {
        const { user_id } = msg.payload as { user_id: string }
        this.presence.delete(user_id)
        this.emit('presence-sync', null)
        break
      }
      case 'presence-sync': {
        const { entries } = msg.payload as { entries: Record<string, PresenceEntry> }
        // 원격 참여자의 Presence 병합
        Object.entries(entries).forEach(([id, entry]) => {
          if (id !== this.user.id) {
            this.presence.set(id, entry)
          }
        })
        this.emit('presence-sync', null)
        break
      }
      default:
        // 일반 이벤트를 리스너에게 전달
        this.emit(msg.type, msg.payload)
        break
    }
  }

  private emit(event: string, payload: unknown): void {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach(cb => cb(payload))
  }
}
