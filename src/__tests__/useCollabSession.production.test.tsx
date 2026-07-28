import { act, renderHook, waitFor } from '@testing-library/react'

jest.mock('@/lib/supabase/client', () => ({
  IS_DEMO_MODE: false,
  createClient: jest.fn(),
}))

jest.mock('nanoid', () => ({
  nanoid: () => 'unused-production-session-id',
}))

import { createClient } from '@/lib/supabase/client'
import { useCollabSession } from '@/hooks/useCollabSession'

interface MockParticipant {
  id: string
  name: string
  color: string
  isHost: boolean
  joinedAt: number
  isOnline: boolean
  zone: null
}

interface MockSessionRow {
  id: string
  host_id: string
  work_id: null
  template_id: null
  invite_code: string
  participants: MockParticipant[]
  max_participants: number
  status: 'waiting' | 'active' | 'completed' | 'expired'
  created_at: string
  expires_at: string
  completed_at: null
  realtime_key?: string | null
}

interface QueryResult {
  data: MockSessionRow | null
  error: { message: string } | null
}

type RealtimeUpdateHandler = (payload: { new: MockSessionRow }) => void

interface MockRealtimeChannel {
  on: jest.Mock
  subscribe: jest.Mock
}

const mockedCreateClient = createClient as jest.Mock
const mockGetUser = jest.fn()
const mockMaybeSingle = jest.fn()
const mockUpdateSingle = jest.fn()
const mockRemoveChannel = jest.fn()
const mockFrom = jest.fn()
const mockChannelFactory = jest.fn()
let mockRealtimeUpdateHandler: RealtimeUpdateHandler | null = null
let mockFetchResult: QueryResult
let mockUpdateResult: QueryResult

const readBuilder = {
  eq: jest.fn(),
  maybeSingle: mockMaybeSingle,
}
readBuilder.eq.mockReturnValue(readBuilder)

const updateBuilder = {
  eq: jest.fn(),
  select: jest.fn(),
  single: mockUpdateSingle,
}
updateBuilder.eq.mockReturnValue(updateBuilder)
updateBuilder.select.mockReturnValue(updateBuilder)

const tableBuilder = {
  select: jest.fn(() => readBuilder),
  update: jest.fn(() => updateBuilder),
}

const realtimeChannel: MockRealtimeChannel = {
  on: jest.fn((
    _event: string,
    _filter: unknown,
    callback: RealtimeUpdateHandler
  ): MockRealtimeChannel => {
    mockRealtimeUpdateHandler = callback
    return realtimeChannel
  }),
  subscribe: jest.fn(() => realtimeChannel),
}

function participant(id: string, isHost = false): MockParticipant {
  return {
    id,
    name: isHost ? 'Host' : 'Guest',
    color: isHost ? '#ff0000' : '#00ff00',
    isHost,
    joinedAt: Date.now(),
    isOnline: true,
    zone: null,
  }
}

function sessionRow(
  participants: MockParticipant[],
  overrides: Partial<MockSessionRow> = {}
): MockSessionRow {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    host_id: 'host-id',
    work_id: null,
    template_id: null,
    invite_code: 'ABC123',
    participants,
    max_participants: 3,
    status: 'active',
    created_at: new Date(Date.now() - 1_000).toISOString(),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    completed_at: null,
    realtime_key: 'key-before',
    ...overrides,
  }
}

function setAuthenticatedUser(userId: string): void {
  mockGetUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  })
}

describe('useCollabSession production membership revalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockRealtimeUpdateHandler = null
    mockFetchResult = {
      data: sessionRow([participant('host-id', true), participant('guest-id')]),
      error: null,
    }
    mockUpdateResult = {
      data: null,
      error: { message: 'not configured' },
    }
    mockMaybeSingle.mockImplementation(async () => mockFetchResult)
    mockUpdateSingle.mockImplementation(async () => mockUpdateResult)
    mockFrom.mockReturnValue(tableBuilder)
    mockChannelFactory.mockReturnValue(realtimeChannel)
    mockedCreateClient.mockReturnValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
      channel: mockChannelFactory,
      removeChannel: mockRemoveChannel,
    })
  })

  it('focus 재검증에서 현재 UID가 빠진 행이면 세션과 캐시를 지운다', async () => {
    setAuthenticatedUser('guest-id')
    const sessionId = mockFetchResult.data!.id
    const { result } = renderHook(() =>
      useCollabSession({ sessionId })
    )

    await waitFor(() => {
      expect(result.current.session?.realtimeKey).toBe('key-before')
    })

    mockFetchResult = {
      data: sessionRow([participant('host-id', true)]),
      error: null,
    }
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    await waitFor(() => {
      expect(result.current.session).toBeNull()
    })
    expect(localStorage.getItem(`pairy-collab-session:${sessionId}`)).toBeNull()
    expect(localStorage.getItem('pairy-collab-session')).toBeNull()
  })

  it('일시 조회 오류에서는 이미 검증된 세션을 유지한다', async () => {
    setAuthenticatedUser('guest-id')
    const sessionId = mockFetchResult.data!.id
    const { result } = renderHook(() =>
      useCollabSession({ sessionId })
    )

    await waitFor(() => {
      expect(result.current.session?.id).toBe(sessionId)
    })

    mockFetchResult = {
      data: null,
      error: { message: 'temporary network failure' },
    }
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    await waitFor(() => {
      expect(mockMaybeSingle).toHaveBeenCalledTimes(2)
    })
    expect(result.current.session?.id).toBe(sessionId)
    expect(localStorage.getItem(`pairy-collab-session:${sessionId}`)).not.toBeNull()
  })

  it('Realtime UPDATE에서도 추방된 UID를 즉시 정리한다', async () => {
    setAuthenticatedUser('guest-id')
    const sessionId = mockFetchResult.data!.id
    const { result } = renderHook(() =>
      useCollabSession({ sessionId })
    )

    await waitFor(() => {
      expect(mockRealtimeUpdateHandler).not.toBeNull()
    })

    act(() => {
      mockRealtimeUpdateHandler?.({
        new: sessionRow([participant('host-id', true)]),
      })
    })

    await waitFor(() => {
      expect(result.current.session).toBeNull()
    })
  })

  it('production kick은 transport를 먼저 멈추고 서버의 회전 키만 반영한다', async () => {
    setAuthenticatedUser('host-id')
    const initialRow = sessionRow([
      participant('host-id', true),
      participant('guest-id'),
    ])
    mockFetchResult = { data: initialRow, error: null }

    let resolveUpdate: ((result: QueryResult) => void) | null = null
    mockUpdateSingle.mockReturnValue(new Promise<QueryResult>((resolve) => {
      resolveUpdate = resolve
    }))

    const { result } = renderHook(() =>
      useCollabSession({ sessionId: initialRow.id })
    )
    await waitFor(() => {
      expect(result.current.isHost).toBe(true)
    })

    act(() => {
      result.current.kickParticipant('guest-id')
    })
    expect(result.current.session?.realtimeKey).toBe('')
    expect(result.current.participants.map((item) => item.userId)).toContain('guest-id')

    act(() => {
      resolveUpdate?.({
        data: sessionRow(
          [participant('host-id', true)],
          { realtime_key: 'key-rotated' }
        ),
        error: null,
      })
    })

    await waitFor(() => {
      expect(result.current.session?.realtimeKey).toBe('key-rotated')
    })
    expect(result.current.participants.map((item) => item.userId)).not.toContain('guest-id')
  })

  it('production kick 실패 시 이전 세션을 복원한다', async () => {
    setAuthenticatedUser('host-id')
    const initialRow = sessionRow([
      participant('host-id', true),
      participant('guest-id'),
    ])
    mockFetchResult = { data: initialRow, error: null }
    mockUpdateResult = {
      data: null,
      error: { message: 'update failed' },
    }
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const { result } = renderHook(() =>
      useCollabSession({ sessionId: initialRow.id })
    )
    await waitFor(() => {
      expect(result.current.isHost).toBe(true)
    })

    act(() => {
      result.current.kickParticipant('guest-id')
    })

    await waitFor(() => {
      expect(result.current.session?.realtimeKey).toBe('key-before')
    })
    expect(result.current.participants.map((item) => item.userId)).toContain('guest-id')
    warn.mockRestore()
  })
})
