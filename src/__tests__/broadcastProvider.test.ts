/**
 * BroadcastChannel 협업 레이어 회귀 테스트
 *
 * 커버 대상:
 * - BroadcastChannelProvider 메시지 라우팅 / self 필터 / presence 병합
 * - SupabaseYjsProvider 데모(BroadcastChannel) 모드 통합:
 *   - C1: 데모 모드에서 provider가 실제로 연결됨
 *   - C2: 원격 커서/선택이 onRemoteUserChange로 전파됨
 *   - C3: 늦게 합류한 탭이 초기 Yjs 문서 상태를 받음
 */

// 데모 모드 강제 (env 무관)
jest.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => false,
  createClient: () => null,
}))

import { BroadcastChannelProvider } from '@/lib/collab/broadcastProvider'
import { SupabaseYjsProvider } from '@/lib/collab/yjsProvider'
import type { CollabUser, UserEditingState } from '@/lib/collab/types'

// ============================================
// 결정론적 BroadcastChannel 목 (같은 이름의 다른 인스턴스에만 전달, self 제외)
// ============================================
class MockBroadcastChannel {
  static registry = new Map<string, Set<MockBroadcastChannel>>()

  name: string
  onmessage: ((event: { data: unknown }) => void) | null = null
  private closed = false

  constructor(name: string) {
    this.name = name
    if (!MockBroadcastChannel.registry.has(name)) {
      MockBroadcastChannel.registry.set(name, new Set())
    }
    MockBroadcastChannel.registry.get(name)!.add(this)
  }

  postMessage(data: unknown): void {
    const peers = MockBroadcastChannel.registry.get(this.name)
    if (!peers) return
    const cloned = JSON.parse(JSON.stringify(data))
    peers.forEach((ch) => {
      if (ch === this || ch.closed) return
      ch.onmessage?.({ data: cloned })
    })
  }

  close(): void {
    this.closed = true
    MockBroadcastChannel.registry.get(this.name)?.delete(this)
  }

  static reset(): void {
    MockBroadcastChannel.registry.clear()
  }
}

const userA: CollabUser = { id: 'a', name: 'Alice', color: '#ff0000' }
const userB: CollabUser = { id: 'b', name: 'Bob', color: '#00ff00' }

beforeEach(() => {
  MockBroadcastChannel.reset()
  ;(global as unknown as { BroadcastChannel: unknown }).BroadcastChannel = MockBroadcastChannel
})

describe('BroadcastChannelProvider', () => {
  it('다른 탭에는 전달하되 자기 자신에게는 전달하지 않는다', () => {
    const a = new BroadcastChannelProvider('s', userA)
    const b = new BroadcastChannelProvider('s', userB)
    a.connect()
    b.connect()

    const aSpy = jest.fn()
    const bSpy = jest.fn()
    a.on('chat-message', aSpy)
    b.on('chat-message', bSpy)

    a.broadcast('chat-message', { text: 'hi' })

    expect(bSpy).toHaveBeenCalledWith({ text: 'hi' })
    expect(aSpy).not.toHaveBeenCalled()

    a.disconnect()
    b.disconnect()
  })

  it('탭 간 presence를 병합한다', () => {
    const a = new BroadcastChannelProvider('s', userA)
    const b = new BroadcastChannelProvider('s', userB)
    a.connect()
    b.connect()

    expect([...a.getPresenceState().keys()].sort()).toEqual(['a', 'b'])
    expect([...b.getPresenceState().keys()].sort()).toEqual(['a', 'b'])

    a.disconnect()
    b.disconnect()
  })

  it('탭이 정상 종료하면 presence에서 제거된다', () => {
    const a = new BroadcastChannelProvider('s', userA)
    const b = new BroadcastChannelProvider('s', userB)
    a.connect()
    b.connect()

    b.disconnect()

    expect(a.getPresenceState().has('b')).toBe(false)
    a.disconnect()
  })

  it('request-state를 다른 탭으로 중계한다', () => {
    const a = new BroadcastChannelProvider('s', userA)
    const b = new BroadcastChannelProvider('s', userB)
    a.connect()
    b.connect()

    const spy = jest.fn()
    a.on('request-state', spy)
    b.broadcast('request-state', { userId: 'b' })

    expect(spy).toHaveBeenCalled()

    a.disconnect()
    b.disconnect()
  })
})

describe('SupabaseYjsProvider — 데모(BroadcastChannel) 모드', () => {
  it('C1+C2: 데모 모드에서 연결되고 원격 커서가 onRemoteUserChange로 전파된다', async () => {
    const remoteSnapshots: Array<Map<string, UserEditingState>> = []
    const provA = new SupabaseYjsProvider({ sessionId: 'sess', user: userA })
    const provB = new SupabaseYjsProvider({
      sessionId: 'sess',
      user: userB,
      onRemoteUserChange: (m) => remoteSnapshots.push(m),
    })

    await provA.connect()
    await provB.connect()

    expect(provA.isConnected).toBe(true)
    expect(provB.isConnected).toBe(true)

    provA.updateAwareness({
      userId: userA.id,
      cursor: { x: 10, y: 20 },
      lastActivity: 123,
    })

    const last = remoteSnapshots[remoteSnapshots.length - 1]
    expect(last.has('a')).toBe(true)
    expect(last.get('a')?.cursor).toEqual({ x: 10, y: 20 })

    provA.disconnect()
    provB.disconnect()
  })

  it('C3: 늦게 합류한 탭이 기존 문서 상태를 받는다', async () => {
    const provA = new SupabaseYjsProvider({ sessionId: 'sess2', user: userA })
    await provA.connect()

    // B 합류 전 A가 문서 편집
    provA.sharedFormData.set('title', 'hello')

    const provB = new SupabaseYjsProvider({ sessionId: 'sess2', user: userB })
    await provB.connect()

    // request-state 핸드셰이크로 초기 상태 수신
    expect(provB.sharedFormData.get('title')).toBe('hello')

    provA.disconnect()
    provB.disconnect()
  })

  it('C2: 원격 선택 해제가 반영된다(부분 업데이트 존중)', async () => {
    const remoteSnapshots: Array<Map<string, UserEditingState>> = []
    const provA = new SupabaseYjsProvider({ sessionId: 'sess3', user: userA })
    const provB = new SupabaseYjsProvider({
      sessionId: 'sess3',
      user: userB,
      onRemoteUserChange: (m) => remoteSnapshots.push(m),
    })
    await provA.connect()
    await provB.connect()

    provA.updateAwareness({ userId: userA.id, selectedSlotId: 'slot-1', lastActivity: 1 })
    expect(remoteSnapshots.at(-1)?.get('a')?.selectedSlotId).toBe('slot-1')

    // 커서만 갱신 → 선택은 유지되어야 함
    provA.updateAwareness({ userId: userA.id, cursor: { x: 1, y: 1 }, lastActivity: 2 })
    expect(remoteSnapshots.at(-1)?.get('a')?.selectedSlotId).toBe('slot-1')

    // 명시적 선택 해제 → null 반영
    provA.updateAwareness({ userId: userA.id, selectedSlotId: null, lastActivity: 3 })
    expect(remoteSnapshots.at(-1)?.get('a')?.selectedSlotId).toBeNull()

    provA.disconnect()
    provB.disconnect()
  })
})
