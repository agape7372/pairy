import { renderHook, waitFor } from '@testing-library/react'
import { useCollabSession, type CollabSession } from '@/hooks/useCollabSession'

jest.mock('@/lib/supabase/client', () => ({
  IS_DEMO_MODE: true,
  createClient: jest.fn(),
}))

jest.mock('nanoid', () => ({
  nanoid: () => 'test-session-id',
}))

function createSession(id: string): CollabSession {
  return {
    id,
    hostId: 'host',
    hostName: 'Host',
    inviteCode: 'ABC123',
    templateId: 'couple-magazine',
    maxParticipants: 2,
    participants: [],
    status: 'waiting',
    createdAt: Date.now(),
    expiresAt: Date.now() + 60_000,
    invite_code: 'ABC123',
    max_participants: 2,
  }
}

describe('useCollabSession scoped recovery', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('URL이 기대하는 세션의 scoped cache를 우선 복구한다', async () => {
    localStorage.setItem(
      'pairy-collab-session',
      JSON.stringify(createSession('session-b'))
    )
    localStorage.setItem(
      'pairy-collab-session:session-a',
      JSON.stringify(createSession('session-a'))
    )

    const { result } = renderHook(() =>
      useCollabSession({ sessionId: 'session-a' })
    )

    await waitFor(() => {
      expect(result.current.session?.id).toBe('session-a')
      expect(result.current.session?.realtimeKey).toBe('session-a')
    })
  })

  it('다른 탭의 마지막 세션을 현재 URL 세션으로 오인하지 않는다', async () => {
    localStorage.setItem(
      'pairy-collab-session',
      JSON.stringify(createSession('session-b'))
    )

    const { result } = renderHook(() =>
      useCollabSession({ sessionId: 'session-a' })
    )

    await waitFor(() => {
      expect(result.current.session).toBeNull()
    })
  })
})
