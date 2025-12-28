'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 구독 티어
export type SubscriptionTier = 'free' | 'premium' | 'creator'

// 구독 주기
export type BillingCycle = 'monthly' | 'yearly'

// 구독 상태
export interface Subscription {
  tier: SubscriptionTier
  billingCycle: BillingCycle | null
  startDate: string | null
  endDate: string | null
  isTrialActive: boolean
  trialEndDate: string | null
}

// 사용량 추적
export interface Usage {
  exportsThisMonth: number
  savedWorks: number
  lastResetDate: string
}

// 기능 제한 설정
export const TIER_LIMITS = {
  free: {
    exportsPerMonth: 5,
    maxSavedWorks: 3,
    maxCollaborators: 2,
    hasWatermark: true,
    canExportHighRes: false,
    canUploadTemplates: false,
    canAccessPremiumTemplates: false,
    canRemoveWatermark: false,
  },
  premium: {
    exportsPerMonth: Infinity,
    maxSavedWorks: Infinity,
    maxCollaborators: 10,
    hasWatermark: false,
    canExportHighRes: true,
    canUploadTemplates: false,
    canAccessPremiumTemplates: true,
    canRemoveWatermark: true,
  },
  creator: {
    exportsPerMonth: Infinity,
    maxSavedWorks: Infinity,
    maxCollaborators: Infinity,
    hasWatermark: false,
    canExportHighRes: true,
    canUploadTemplates: true,
    canAccessPremiumTemplates: true,
    canRemoveWatermark: true,
  },
} as const

// 가격 정보 (월간 구독만)
export const PRICING = {
  premium: {
    monthly: 3900,
  },
  creator: {
    monthly: 9900,
  },
} as const

// 스토어 상태
interface SubscriptionState {
  subscription: Subscription
  usage: Usage

  // 데모 모드 (개발/테스트용)
  isDemoMode: boolean

  // 액션
  setTier: (tier: SubscriptionTier) => void
  subscribe: (tier: SubscriptionTier, cycle: BillingCycle) => void
  cancelSubscription: () => void
  startTrial: () => void

  // 사용량 추적
  incrementExports: () => boolean // 성공 여부 반환
  addSavedWork: () => boolean
  removeSavedWork: () => void
  resetMonthlyUsage: () => void

  // 유틸리티
  canUseFeature: (feature: keyof typeof TIER_LIMITS.free) => boolean
  getRemainingExports: () => number
  getRemainingSavedWorks: () => number
  isSubscriptionActive: () => boolean

  // 데모 모드 토글
  toggleDemoMode: () => void
  setDemoTier: (tier: SubscriptionTier) => void
}

// 초기 상태
const initialSubscription: Subscription = {
  tier: 'free',
  billingCycle: null,
  startDate: null,
  endDate: null,
  isTrialActive: false,
  trialEndDate: null,
}

const initialUsage: Usage = {
  exportsThisMonth: 0,
  savedWorks: 0,
  lastResetDate: new Date().toISOString().slice(0, 7), // YYYY-MM
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: initialSubscription,
      usage: initialUsage,
      isDemoMode: true, // 기본적으로 데모 모드

      setTier: (tier) => {
        set((state) => ({
          subscription: { ...state.subscription, tier },
        }))
      },

      subscribe: (tier, cycle) => {
        const now = new Date()
        const endDate = new Date(now)
        if (cycle === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1)
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1)
        }

        set({
          subscription: {
            tier,
            billingCycle: cycle,
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            isTrialActive: false,
            trialEndDate: null,
          },
        })
      },

      cancelSubscription: () => {
        set({ subscription: initialSubscription })
      },

      startTrial: () => {
        const now = new Date()
        const trialEnd = new Date(now)
        trialEnd.setDate(trialEnd.getDate() + 7) // 7일 무료 체험

        set({
          subscription: {
            tier: 'premium',
            billingCycle: null,
            startDate: now.toISOString(),
            endDate: null,
            isTrialActive: true,
            trialEndDate: trialEnd.toISOString(),
          },
        })
      },

      incrementExports: () => {
        const { subscription, usage } = get()
        const limits = TIER_LIMITS[subscription.tier]

        // 월간 초기화 확인
        const currentMonth = new Date().toISOString().slice(0, 7)
        if (usage.lastResetDate !== currentMonth) {
          get().resetMonthlyUsage()
        }

        if (usage.exportsThisMonth >= limits.exportsPerMonth) {
          return false // 제한 초과
        }

        set((state) => ({
          usage: {
            ...state.usage,
            exportsThisMonth: state.usage.exportsThisMonth + 1,
          },
        }))
        return true
      },

      addSavedWork: () => {
        const { subscription, usage } = get()
        const limits = TIER_LIMITS[subscription.tier]

        if (usage.savedWorks >= limits.maxSavedWorks) {
          return false // 제한 초과
        }

        set((state) => ({
          usage: {
            ...state.usage,
            savedWorks: state.usage.savedWorks + 1,
          },
        }))
        return true
      },

      removeSavedWork: () => {
        set((state) => ({
          usage: {
            ...state.usage,
            savedWorks: Math.max(0, state.usage.savedWorks - 1),
          },
        }))
      },

      resetMonthlyUsage: () => {
        set((state) => ({
          usage: {
            ...state.usage,
            exportsThisMonth: 0,
            lastResetDate: new Date().toISOString().slice(0, 7),
          },
        }))
      },

      canUseFeature: (feature) => {
        const { subscription } = get()
        const limits = TIER_LIMITS[subscription.tier]
        return limits[feature] as boolean
      },

      getRemainingExports: () => {
        const { subscription, usage } = get()
        const limits = TIER_LIMITS[subscription.tier]
        if (limits.exportsPerMonth === Infinity) return Infinity
        return Math.max(0, limits.exportsPerMonth - usage.exportsThisMonth)
      },

      getRemainingSavedWorks: () => {
        const { subscription, usage } = get()
        const limits = TIER_LIMITS[subscription.tier]
        if (limits.maxSavedWorks === Infinity) return Infinity
        return Math.max(0, limits.maxSavedWorks - usage.savedWorks)
      },

      isSubscriptionActive: () => {
        const { subscription } = get()

        if (subscription.tier === 'free') return true

        // 트라이얼 확인
        if (subscription.isTrialActive && subscription.trialEndDate) {
          return new Date(subscription.trialEndDate) > new Date()
        }

        // 구독 만료 확인
        if (subscription.endDate) {
          return new Date(subscription.endDate) > new Date()
        }

        return false
      },

      toggleDemoMode: () => {
        set((state) => ({ isDemoMode: !state.isDemoMode }))
      },

      setDemoTier: (tier) => {
        set((state) => ({
          subscription: { ...state.subscription, tier },
        }))
      },
    }),
    {
      name: 'pairy-subscription',
      partialize: (state) => ({
        subscription: state.subscription,
        usage: state.usage,
        isDemoMode: state.isDemoMode,
      }),
    }
  )
)

// 편의 훅
export function usePremiumFeature(feature: keyof typeof TIER_LIMITS.free) {
  const canUse = useSubscriptionStore((state) => state.canUseFeature(feature))
  const tier = useSubscriptionStore((state) => state.subscription.tier)

  return {
    canUse,
    tier,
    requiresUpgrade: !canUse,
  }
}

export function useSubscriptionTier() {
  return useSubscriptionStore((state) => state.subscription.tier)
}

export function useIsCreator() {
  return useSubscriptionStore((state) => state.subscription.tier === 'creator')
}

export function useIsPremium() {
  const tier = useSubscriptionStore((state) => state.subscription.tier)
  return tier === 'premium' || tier === 'creator'
}
