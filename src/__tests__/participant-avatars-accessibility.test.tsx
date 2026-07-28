import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import { ParticipantAvatars } from '@/components/editor/collab/ParticipantAvatars'

jest.mock('@/hooks/useUserActivity', () => ({
  useUserActivity: () => ({ status: 'active' }),
  getActivityStatusColor: () => '#22C55E',
  getActivityStatusLabel: (status: string) => (
    status === 'active' ? '활동 중' : status === 'idle' ? '대기 중' : '자리비움'
  ),
}))

describe('ParticipantAvatars accessibility', () => {
  it('참여자를 목록으로 노출하고 이름, 역할, 활동 상태와 편집 영역을 텍스트로 제공한다', async () => {
    const remoteUsers = new Map([
      ['remote-id', {
        userId: 'remote-user-1234',
        zone: 'B' as const,
        selectedSlotId: null,
        selectedTextId: null,
        cursor: null,
        lastActivity: Date.now() - 10_000,
      }],
    ])

    render(
      <ParticipantAvatars
        sessionId="session-1"
        user={{ id: 'local-id', name: '나래', color: '#FF6B6B' }}
        remoteUsers={remoteUsers}
        isHost
        myZone="A"
      />
    )

    const list = screen.getByRole('list', { name: '현재 편집 참여자' })
    const participants = within(list).getAllByRole('listitem')
    expect(participants).toHaveLength(2)
    expect(participants[0]).toHaveTextContent('나래, 나, 호스트, 활동 중, A 영역 편집 중')

    await waitFor(() => {
      expect(participants[1]).toHaveTextContent('remote-u, 자리비움, B 영역 편집 중')
    })
  })

  it('숨겨진 참여자 수를 목록 항목의 텍스트로 제공한다', () => {
    const remoteUsers = new Map([
      ['remote-id', {
        userId: 'remote-user-1234',
        zone: null,
        selectedSlotId: null,
        selectedTextId: null,
        cursor: null,
        lastActivity: Date.now(),
      }],
    ])

    render(
      <ParticipantAvatars
        sessionId="session-1"
        user={{ id: 'local-id', name: '나래', color: '#FF6B6B' }}
        remoteUsers={remoteUsers}
        maxVisible={1}
      />
    )

    const list = screen.getByRole('list', { name: '현재 편집 참여자' })
    expect(within(list).getByText('추가 참여자 1명')).toHaveClass('sr-only')
  })
})
