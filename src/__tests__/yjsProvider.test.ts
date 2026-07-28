import * as Y from 'yjs'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { SupabaseYjsProvider } from '@/lib/collab/yjsProvider'
import type {
  CollabUser,
  SyncState,
  UserEditingState,
} from '@/lib/collab/types'

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
  isSupabaseConfigured: jest.fn(),
}))

type RealtimeMessageHandler = (message: { payload: unknown }) => void
type RealtimeStatusHandler = (status: string) => void

interface MockRealtimeChannel {
  on: jest.Mock
  subscribe: jest.Mock
  track: jest.Mock
  send: jest.Mock
  presenceState: jest.Mock
}

interface MockRealtimeTransport {
  channel: MockRealtimeChannel
  channelFactory: jest.Mock
  handlers: Map<string, RealtimeMessageHandler>
  emitStatus: (status: string) => void
  removeChannel: jest.Mock
  setAuth: jest.Mock
  isDisconnecting: jest.Mock
  rpc: jest.Mock
}

interface ProviderInternals {
  handleRemoteUpdate: (payload: { update: number[]; userId: string }) => void
  handleAwarenessUpdate: (payload: {
    userId: string
    state: Partial<UserEditingState>
  }) => void
}

const mockedCreateClient = createClient as jest.Mock
const mockedIsSupabaseConfigured =
  isSupabaseConfigured as jest.MockedFunction<typeof isSupabaseConfigured>

const localUser: CollabUser = {
  id: 'local-user',
  name: 'Local',
  color: '#ff0000',
}

const remoteUser: CollabUser = {
  id: 'remote-user',
  name: 'Remote',
  color: '#00ff00',
}

function sticker(id: string) {
  return {
    id,
    stickerId: `asset-${id}`,
    imageUrl: `/stickers/${id}.png`,
    transform: {
      x: 10,
      y: 20,
      width: 40,
      height: 50,
      rotation: 5,
    },
  }
}

function textField(id: string, fontSize = 16) {
  return {
    id,
    dataKey: `text-${id}`,
    transform: {
      x: 10,
      y: 20,
      width: 200,
      height: 40,
    },
    style: {
      fontFamily: 'sans-serif',
      fontSize,
      color: '#111111',
    },
  }
}

function state(overrides: Partial<SyncState> = {}): SyncState {
  return {
    formData: { title: 'initial', subtitle: 'remove me' },
    images: { hero: '/initial.png', obsolete: '/obsolete.png' },
    colors: {
      primaryColor: '#111111',
      secondaryColor: '#222222',
      accentColor: '#333333',
    },
    slotTransforms: {
      hero: { x: 0, y: 0, scale: 1, rotation: 0 },
      obsolete: { x: 0.2, y: 0.1, scale: 1.2, rotation: 10 },
    },
    stickers: [sticker('one'), sticker('two')],
    texts: [textField('title')],
    ...overrides,
  }
}

function createMockRealtimeTransport(): MockRealtimeTransport {
  const handlers = new Map<string, RealtimeMessageHandler>()
  let statusHandler: RealtimeStatusHandler | null = null
  const channel = {} as MockRealtimeChannel

  channel.on = jest.fn(
    (
      type: string,
      filter: { event: string },
      handler: RealtimeMessageHandler
    ) => {
      handlers.set(`${type}:${filter.event}`, handler)
      return channel
    }
  )
  channel.subscribe = jest.fn((handler: RealtimeStatusHandler) => {
    statusHandler = handler
    return channel
  })
  channel.track = jest.fn().mockResolvedValue(undefined)
  channel.send = jest.fn().mockResolvedValue(undefined)
  channel.presenceState = jest.fn(() => ({}))

  const removeChannel = jest.fn().mockResolvedValue(undefined)
  const setAuth = jest.fn().mockResolvedValue(undefined)
  const isDisconnecting = jest.fn(() => false)
  const rpc = jest.fn().mockResolvedValue({ error: null })
  const channelFactory = jest.fn(() => channel)
  mockedCreateClient.mockReturnValue({
    channel: channelFactory,
    removeChannel,
    realtime: { setAuth, isDisconnecting },
    rpc,
  })

  return {
    channel,
    channelFactory,
    handlers,
    emitStatus: (status: string) => {
      if (!statusHandler) throw new Error('Channel has not subscribed yet')
      statusHandler(status)
    },
    removeChannel,
    setAuth,
    isDisconnecting,
    rpc,
  }
}

function initializeYDoc(syncState: SyncState): Y.Doc {
  const doc = new Y.Doc()
  const formData = doc.getMap<string>('formData')
  const images = doc.getMap<string>('images')
  const colors = doc.getMap<string>('colors')
  const transforms = doc.getMap('slotTransforms')
  const stickers = doc.getArray('stickers')
  const texts = doc.getArray('texts')

  doc.transact(() => {
    Object.entries(syncState.formData).forEach(([key, value]) => {
      if (typeof value === 'string') formData.set(key, value)
    })
    Object.entries(syncState.images).forEach(([key, value]) => {
      if (typeof value === 'string') images.set(key, value)
    })
    Object.entries(syncState.colors).forEach(([key, value]) => {
      if (typeof value === 'string') colors.set(key, value)
    })
    Object.entries(syncState.slotTransforms).forEach(([key, value]) => {
      transforms.set(key, value)
    })
    stickers.insert(0, syncState.stickers)
    texts.insert(0, syncState.texts)
  })

  return doc
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  mockedIsSupabaseConfigured.mockReturnValue(true)
})

afterEach(() => {
  jest.useRealTimers()
})

describe('SupabaseYjsProvider state synchronization', () => {
  it('does not broadcast hydration but broadcasts later local edits exactly once', () => {
    const provider = new SupabaseYjsProvider({
      sessionId: 'session-local',
      user: localUser,
    })
    const broadcast = jest.spyOn(provider, 'broadcastUpdate')
    const initial = state()

    provider.initializeState(initial)
    expect(broadcast).not.toHaveBeenCalled()

    const next = state({
      formData: { title: 'changed' },
      images: { hero: '/changed.png', obsolete: null },
      colors: {
        primaryColor: '#aaaaaa',
        secondaryColor: '#bbbbbb',
      },
      slotTransforms: {
        hero: { x: 0.5, y: -0.2, scale: 2, rotation: 90 },
      },
      stickers: [sticker('two')],
      texts: [textField('title', 32)],
    })
    provider.syncLocalState(next)

    expect(broadcast).toHaveBeenCalledTimes(1)
    expect(provider.getSyncState()).toEqual({
      ...next,
      images: { hero: '/changed.png' },
    })
    provider.disconnect()
  })

  it('applies remote updates without broadcasting an echo', () => {
    const onSyncStateChange = jest.fn()
    const provider = new SupabaseYjsProvider({
      sessionId: 'session-remote',
      user: localUser,
      onSyncStateChange,
    })
    const broadcast = jest.spyOn(provider, 'broadcastUpdate')
    const remoteState = state({
      formData: { title: 'from remote' },
      images: { hero: '/remote.png' },
      stickers: [sticker('remote')],
    })
    const remoteDoc = initializeYDoc(remoteState)

    ;(provider as unknown as ProviderInternals).handleRemoteUpdate({
      userId: remoteUser.id,
      update: Array.from(Y.encodeStateAsUpdate(remoteDoc)),
    })

    expect(broadcast).not.toHaveBeenCalled()
    expect(onSyncStateChange).toHaveBeenCalledTimes(1)
    expect(provider.getSyncState()).toEqual(remoteState)

    remoteDoc.destroy()
    provider.disconnect()
  })

  it('preserves awareness fields omitted by later partial updates', () => {
    const onRemoteUserChange = jest.fn()
    const provider = new SupabaseYjsProvider({
      sessionId: 'session-awareness',
      user: localUser,
      onRemoteUserChange,
    })
    const internals = provider as unknown as ProviderInternals
    provider.setAllowedUsers([localUser.id, remoteUser.id])

    internals.handleAwarenessUpdate({
      userId: remoteUser.id,
      state: {
        zone: 'A',
        selectedSlotId: 'slot-a',
        cursor: { x: 12, y: 34 },
        lastActivity: 1,
      },
    })
    internals.handleAwarenessUpdate({
      userId: remoteUser.id,
      state: {
        selectedTextId: 'text-b',
        lastActivity: 2,
      },
    })

    const latestUsers = onRemoteUserChange.mock.calls.at(-1)?.[0] as Map<
      string,
      UserEditingState
    >
    expect(latestUsers.get(remoteUser.id)).toEqual({
      userId: remoteUser.id,
      zone: 'A',
      selectedSlotId: 'slot-a',
      selectedTextId: 'text-b',
      cursor: { x: 12, y: 34 },
      lastActivity: 2,
    })
    provider.disconnect()
  })
})

describe('SupabaseYjsProvider realtime lifecycle', () => {
  it('tracks SUBSCRIBED, failure, and successful resubscription states', async () => {
    const transport = createMockRealtimeTransport()
    const onConnectionChange = jest.fn()
    const provider = new SupabaseYjsProvider({
      sessionId: 'session-status',
      realtimeKey: 'key-status',
      user: localUser,
      onConnectionChange,
    })

    const connectPromise = provider.connect()
    await Promise.resolve()
    transport.emitStatus('SUBSCRIBED')
    await connectPromise
    expect(provider.isConnected).toBe(true)
    expect(transport.setAuth).toHaveBeenCalledTimes(1)
    expect(transport.channelFactory).toHaveBeenCalledWith(
      'collab-yjs:session-status:key-status',
      expect.objectContaining({
        config: expect.objectContaining({ private: true }),
      })
    )
    expect(transport.channel.subscribe).toHaveBeenCalledWith(
      expect.any(Function),
      30_000
    )
    expect(transport.channel.send).not.toHaveBeenCalled()
    expect(transport.rpc).toHaveBeenCalledWith(
      'broadcast_collab_message',
      expect.objectContaining({
        p_session_id: 'session-status',
        p_realtime_key: 'key-status',
      })
    )

    transport.emitStatus('CHANNEL_ERROR')
    expect(provider.isConnected).toBe(false)

    transport.emitStatus('SUBSCRIBED')
    expect(provider.isConnected).toBe(true)
    expect(onConnectionChange.mock.calls.map(([connected]) => connected)).toEqual([
      true,
      false,
      true,
    ])

    provider.disconnect()
    expect(transport.removeChannel).toHaveBeenCalledWith(transport.channel)
  })

  it('waits for the shared Realtime socket to finish disconnecting', async () => {
    const transport = createMockRealtimeTransport()
    transport.isDisconnecting
      .mockReturnValueOnce(true)
      .mockReturnValue(false)
    const provider = new SupabaseYjsProvider({
      sessionId: 'session-rotated',
      realtimeKey: 'key-rotated',
      user: localUser,
    })

    const connectPromise = provider.connect()
    await Promise.resolve()
    expect(transport.channelFactory).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(25)
    expect(transport.channelFactory).toHaveBeenCalledTimes(1)
    transport.emitStatus('SUBSCRIBED')
    await connectPromise

    provider.disconnect()
  })

  it('answers state requests and hydrates a late joiner from a state response', async () => {
    const hostTransport = createMockRealtimeTransport()
    const hostState = state({ formData: { title: 'authoritative host state' } })
    const host = new SupabaseYjsProvider({
      sessionId: 'session-late-join',
      realtimeKey: 'key-late-join',
      user: localUser,
    })
    host.setAllowedUsers([localUser.id, remoteUser.id])
    host.initializeState(hostState)

    const hostConnectPromise = host.connect()
    await Promise.resolve()
    hostTransport.emitStatus('SUBSCRIBED')
    await hostConnectPromise
    hostTransport.rpc.mockClear()

    hostTransport.handlers.get('broadcast:request-state')?.({
      payload: { userId: remoteUser.id },
    })
    expect(hostTransport.rpc).toHaveBeenCalledWith(
      'broadcast_collab_message',
      expect.objectContaining({
        p_event: 'state-response',
        p_payload: expect.objectContaining({
          userId: localUser.id,
          targetUserId: remoteUser.id,
        }),
      })
    )

    const encodedHostState = Y.encodeStateAsUpdate(host.doc)
    host.disconnect()

    const joinerTransport = createMockRealtimeTransport()
    const onSyncStateChange = jest.fn()
    const joiner = new SupabaseYjsProvider({
      sessionId: 'session-late-join',
      realtimeKey: 'key-late-join',
      user: remoteUser,
      onSyncStateChange,
    })
    joiner.setAllowedUsers([localUser.id, remoteUser.id])
    joiner.prepareInitialState(state({ formData: { title: 'stale local state' } }))

    const joinerConnectPromise = joiner.connect()
    await Promise.resolve()
    joinerTransport.emitStatus('SUBSCRIBED')
    await joinerConnectPromise
    joinerTransport.handlers.get('broadcast:state-response')?.({
      payload: {
        userId: localUser.id,
        targetUserId: remoteUser.id,
        update: Array.from(encodedHostState),
      },
    })

    expect(onSyncStateChange).toHaveBeenCalledTimes(1)
    expect(joiner.getSyncState()).toEqual(hostState)

    jest.advanceTimersByTime(1_000)
    expect(joiner.getSyncState()).toEqual(hostState)
    joiner.disconnect()
  })
})
