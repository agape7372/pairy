import { useSubscriptionStore } from '@/stores/subscriptionStore'

// 참고: jest 환경엔 Supabase env 가 없어 IS_DEMO_MODE=true.
// 따라서 데모 경로(subscribe 동작)와 syncFromServer 의 서버-우선 동기화를 검증한다.
// 프로덕션 가드(IS_DEMO_MODE=false 시 subscribe/setDemoTier no-op)는 배포 스모크로 확인.

const reset = () =>
  useSubscriptionStore.setState({
    subscription: {
      tier: 'free',
      billingCycle: null,
      startDate: null,
      endDate: null,
      isTrialActive: false,
      trialEndDate: null,
      duoPartner: null,
      duoCredits: 0,
      duoInviteCode: null,
    },
  })

describe('subscriptionStore · 서버 동기화(C-3)', () => {
  beforeEach(reset)

  it('syncFromServer("premium") 는 tier 를 premium 으로 올리고 만료를 반영한다', () => {
    const until = '2099-01-01T00:00:00.000Z'
    useSubscriptionStore.getState().syncFromServer('premium', until)

    const sub = useSubscriptionStore.getState().subscription
    expect(sub.tier).toBe('premium')
    expect(sub.endDate).toBe(until)
    expect(useSubscriptionStore.getState().isDemoMode).toBe(false)
  })

  it('syncFromServer("free") 는 잔존 프리미엄 tier 를 free 로 강등한다(로그아웃 경로)', () => {
    useSubscriptionStore.getState().syncFromServer('premium', null)
    expect(useSubscriptionStore.getState().subscription.tier).toBe('premium')

    // 서버가 free 를 말하면(비로그인/구독만료) 반드시 강등돼야 한다
    useSubscriptionStore.getState().syncFromServer('free', null)
    expect(useSubscriptionStore.getState().subscription.tier).toBe('free')
  })

  it('데모 모드에선 subscribe() 가 동작한다(데모 UX 보존)', () => {
    // 기본 IS_DEMO_MODE=true 이므로 subscribe 가 tier 를 바꾼다
    useSubscriptionStore.getState().subscribe('premium', 'monthly')
    expect(useSubscriptionStore.getState().subscription.tier).toBe('premium')
  })
})
