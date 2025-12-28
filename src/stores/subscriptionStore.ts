'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 구독 티어
export type SubscriptionTier = 'free' | 'premium' | 'creator' | 'duo'

// 구독 주기
export type BillingCycle = 'monthly' | 'yearly'

// 듀오 파트너 상태
export interface DuoPartner {
  id: string
  displayName: string
  avatarUrl?: string
  linkedAt: string
}

// 구독 상태
export interface Subscription {
  tier: SubscriptionTier
  billingCycle: BillingCycle | null
  startDate: string | null
  endDate: string | null
  isTrialActive: boolean
  trialEndDate: string | null
  // Duo 전용 필드
  duoPartner: DuoPartner | null
  duoCredits: number // 듀오 보너스 크레딧 (다운로드 등에 사용)
  duoInviteCode: string | null // 파트너 초대 코드
}

// 사용량 추적
export interface Usage {
  exportsThisMonth: number
  savedWorks: number
  downloadsThisMonth: number // 다운로드 횟수 추가
  lastResetDate: string
}

// 기능 제한 설정
export const TIER_LIMITS = {
  free: {
    exportsPerMonth: 5,
    downloadsPerMonth: 10,
    maxSavedWorks: 3,
    maxCollaborators: 2,
    maxLibraryFolders: 3,
    cloudStorageMB: 100,
    hasWatermark: true,
    canExportHighRes: false,
    canUploadTemplates: false,
    canAccessPremiumTemplates: false,
    canRemoveWatermark: false,
    canAccessPaidResources: false,
    hasDuoCredits: false,
    hasSharedLibrary: false,
  },
  premium: {
    exportsPerMonth: Infinity,
    downloadsPerMonth: Infinity,
    maxSavedWorks: Infinity,
    maxCollaborators: 10,
    maxLibraryFolders: 20,
    cloudStorageMB: 1024,
    hasWatermark: false,
    canExportHighRes: true,
    canUploadTemplates: false,
    canAccessPremiumTemplates: true,
    canRemoveWatermark: true,
    canAccessPaidResources: true,
    hasDuoCredits: false,
    hasSharedLibrary: false,
  },
  duo: {
    exportsPerMonth: Infinity,
    downloadsPerMonth: Infinity,
    maxSavedWorks: Infinity,
    maxCollaborators: 2, // 듀오는 2인 전용
    maxLibraryFolders: 30, // 공유 폴더 포함
    cloudStorageMB: 2048, // 듀오 공유 스토리지
    hasWatermark: false,
    canExportHighRes: true,
    canUploadTemplates: false,
    canAccessPremiumTemplates: true,
    canRemoveWatermark: true,
    canAccessPaidResources: true,
    hasDuoCredits: true, // 매월 보너스 크레딧
    hasSharedLibrary: true, // 공유 서재
  },
  creator: {
    exportsPerMonth: Infinity,
    downloadsPerMonth: Infinity,
    maxSavedWorks: Infinity,
    maxCollaborators: Infinity,
    maxLibraryFolders: Infinity,
    cloudStorageMB: 5120,
    hasWatermark: false,
    canExportHighRes: true,
    canUploadTemplates: true,
    canAccessPremiumTemplates: true,
    canRemoveWatermark: true,
    canAccessPaidResources: true,
    hasDuoCredits: false,
    hasSharedLibrary: false,
  },
} as const

// 가격 정보 (월간 구독만)
export const PRICING = {
  premium: {
    monthly: 2900,
  },
  duo: {
    monthly: 3900, // 2인 기준 (1인당 1,950원 - 프리미엄 대비 33% 할인)
    perPerson: 1950,
    bonusCredits: 5, // 매월 5크레딧 보너스
  },
  creator: {
    monthly: 4900,
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

  // Duo 전용 액션
  generateDuoInviteCode: () => string
  linkDuoPartner: (partner: DuoPartner) => void
  unlinkDuoPartner: () => void
  useDuoCredit: () => boolean
  addDuoCredits: (amount: number) => void

  // 사용량 추적
  incrementExports: () => boolean // 성공 여부 반환
  incrementDownloads: () => boolean
  addSavedWork: () => boolean
  removeSavedWork: () => void
  resetMonthlyUsage: () => void

  // 유틸리티
  canUseFeature: (feature: keyof typeof TIER_LIMITS.free) => boolean
  getRemainingExports: () => number
  getRemainingDownloads: () => number
  getRemainingSavedWorks: () => number
  isSubscriptionActive: () => boolean
  isDuoLinked: () => boolean

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
  duoPartner: null,
  duoCredits: 0,
  duoInviteCode: null,
}

const initialUsage: Usage = {
  exportsThisMonth: 0,
  savedWorks: 0,
  downloadsThisMonth: 0,
  lastResetDate: new Date().toISOString().slice(0, 7), // YYYY-MM
}

// 랜덤 초대 코드 생성
const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'PAIR-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
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

        const duoCredits = tier === 'duo' ? PRICING.duo.bonusCredits : 0

        set({
          subscription: {
            tier,
            billingCycle: cycle,
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            isTrialActive: false,
            trialEndDate: null,
            duoPartner: null,
            duoCredits,
            duoInviteCode: tier === 'duo' ? generateInviteCode() : null,
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
            duoPartner: null,
            duoCredits: 0,
            duoInviteCode: null,
          },
        })
      },

      // Duo 전용 액션
      generateDuoInviteCode: () => {
        const code = generateInviteCode()
        set((state) => ({
          subscription: { ...state.subscription, duoInviteCode: code },
        }))
        return code
      },

      linkDuoPartner: (partner) => {
        set((state) => ({
          subscription: { ...state.subscription, duoPartner: partner },
        }))
      },

      unlinkDuoPartner: () => {
        set((state) => ({
          subscription: { ...state.subscription, duoPartner: null },
        }))
      },

      useDuoCredit: () => {
        const { subscription } = get()
        if (subscription.duoCredits <= 0) return false

        set((state) => ({
          subscription: {
            ...state.subscription,
            duoCredits: state.subscription.duoCredits - 1,
          },
        }))
        return true
      },

      addDuoCredits: (amount) => {
        set((state) => ({
          subscription: {
            ...state.subscription,
            duoCredits: state.subscription.duoCredits + amount,
          },
        }))
      },

      incrementExports: () => {
        const { subscription } = get()
        const limits = TIER_LIMITS[subscription.tier]

        // 월간 초기화 확인
        const currentMonth = new Date().toISOString().slice(0, 7)
        let { usage } = get()
        if (usage.lastResetDate !== currentMonth) {
          get().resetMonthlyUsage()
          // 리셋 후 최신 usage 다시 가져오기
          usage = get().usage
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

      incrementDownloads: () => {
        const { subscription } = get()
        const limits = TIER_LIMITS[subscription.tier]

        // 월간 초기화 확인
        const currentMonth = new Date().toISOString().slice(0, 7)
        let { usage } = get()
        if (usage.lastResetDate !== currentMonth) {
          get().resetMonthlyUsage()
          // 리셋 후 최신 usage 다시 가져오기
          usage = get().usage
        }

        if (usage.downloadsThisMonth >= limits.downloadsPerMonth) {
          return false // 제한 초과
        }

        set((state) => ({
          usage: {
            ...state.usage,
            downloadsThisMonth: state.usage.downloadsThisMonth + 1,
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
        const { subscription } = get()
        // Duo 구독자는 매월 크레딧 보너스 지급
        const bonusCredits = subscription.tier === 'duo' ? PRICING.duo.bonusCredits : 0

        set((state) => ({
          usage: {
            ...state.usage,
            exportsThisMonth: 0,
            downloadsThisMonth: 0,
            lastResetDate: new Date().toISOString().slice(0, 7),
          },
          subscription: {
            ...state.subscription,
            duoCredits: state.subscription.tier === 'duo'
              ? state.subscription.duoCredits + bonusCredits
              : state.subscription.duoCredits,
          },
        }))
      },

      canUseFeature: (feature) => {
        const { subscription } = get()
        const limits = TIER_LIMITS[subscription.tier]
        const value = limits[feature]
        // 숫자인 경우 0보다 크거나 Infinity면 true
        if (typeof value === 'number') {
          return value > 0 || value === Infinity
        }
        return Boolean(value)
      },

      getRemainingExports: () => {
        const { subscription, usage } = get()
        const limits = TIER_LIMITS[subscription.tier]
        if (limits.exportsPerMonth === Infinity) return Infinity
        return Math.max(0, limits.exportsPerMonth - usage.exportsThisMonth)
      },

      getRemainingDownloads: () => {
        const { subscription, usage } = get()
        const limits = TIER_LIMITS[subscription.tier]
        if (limits.downloadsPerMonth === Infinity) return Infinity
        return Math.max(0, limits.downloadsPerMonth - usage.downloadsThisMonth)
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

      isDuoLinked: () => {
        const { subscription } = get()
        return subscription.tier === 'duo' && subscription.duoPartner !== null
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
  return tier === 'premium' || tier === 'duo' || tier === 'creator'
}

export function useIsDuo() {
  return useSubscriptionStore((state) => state.subscription.tier === 'duo')
}

export function useDuoPartner() {
  return useSubscriptionStore((state) => state.subscription.duoPartner)
}

export function useDuoCredits() {
  return useSubscriptionStore((state) => state.subscription.duoCredits)
}

export function useDuoInviteCode() {
  return useSubscriptionStore((state) => state.subscription.duoInviteCode)
}
