'use client'

/**
 * gamificationStore.ts - 게이미피케이션 스토어
 *
 * UX 서사: "창작의 여정은 혼자가 아니다.
 *          작은 발걸음마다 축하하고, 성장을 함께 기록한다."
 *
 * 사용자의 활동을 추적하고, 성취를 시각화하여
 * 지속적인 창작 동기를 부여합니다.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 레벨 시스템
export const LEVEL_CONFIG = {
  // 각 레벨에 필요한 총 경험치
  thresholds: [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200, 6600, 8200, 10000],
  // 레벨 이름
  names: [
    '새싹 크리에이터',
    '호기심 탐험가',
    '열정의 화가',
    '감성 스토리텔러',
    '재능 있는 창작자',
    '영감의 원천',
    '예술의 길잡이',
    '마스터 크리에이터',
    '전설의 작가',
    '우주적 상상력',
    '창작의 신',
    '초월적 존재',
    '무한의 창조자',
  ],
  // 레벨 색상 (배지에 사용)
  colors: [
    'from-gray-400 to-gray-500',      // 새싹
    'from-green-400 to-emerald-500',   // 호기심
    'from-yellow-400 to-amber-500',    // 열정
    'from-orange-400 to-red-500',      // 감성
    'from-pink-400 to-rose-500',       // 재능
    'from-purple-400 to-violet-500',   // 영감
    'from-blue-400 to-indigo-500',     // 예술
    'from-cyan-400 to-blue-500',       // 마스터
    'from-amber-400 to-yellow-500',    // 전설
    'from-violet-400 to-purple-500',   // 우주적
    'from-rose-400 to-pink-500',       // 신
    'from-fuchsia-400 to-pink-500',    // 초월
    'from-amber-300 to-orange-400',    // 무한
  ],
} as const

// 활동 종류와 경험치
export const ACTIVITY_XP = {
  // 일반 활동
  login: 10,              // 로그인
  viewTemplate: 2,        // 템플릿 조회
  downloadTemplate: 15,   // 템플릿 다운로드
  likeTemplate: 5,        // 좋아요
  bookmarkTemplate: 5,    // 북마크
  followCreator: 10,      // 팔로우
  commentTemplate: 10,    // 댓글

  // 창작 활동 (더 높은 보상)
  createWork: 30,         // 작품 생성
  completeWork: 50,       // 작품 완성
  uploadTemplate: 100,    // 템플릿 업로드
  getDownloaded: 20,      // 내 템플릿이 다운로드됨
  getLiked: 10,           // 내 템플릿이 좋아요 받음
  getFollowed: 15,        // 팔로워 획득

  // 마일스톤 보너스
  first10Downloads: 100,  // 첫 10 다운로드
  first100Downloads: 500, // 첫 100 다운로드
  first10Followers: 150,  // 첫 10 팔로워
  first100Followers: 750, // 첫 100 팔로워
} as const

// 뱃지 정의
export interface Badge {
  id: string
  name: string
  description: string
  icon: string // Lucide 아이콘 이름
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  color: string
  unlockedAt?: string // ISO date
}

export const BADGES: Record<string, Omit<Badge, 'id' | 'unlockedAt'>> = {
  firstSteps: {
    name: '첫 발자국',
    description: '첫 번째 작품을 만들었어요',
    icon: 'Footprints',
    rarity: 'common',
    color: 'bg-green-100 text-green-600',
  },
  explorer: {
    name: '탐험가',
    description: '10개의 템플릿을 둘러봤어요',
    icon: 'Compass',
    rarity: 'common',
    color: 'bg-blue-100 text-blue-600',
  },
  collector: {
    name: '수집가',
    description: '10개의 템플릿을 다운로드했어요',
    icon: 'Archive',
    rarity: 'common',
    color: 'bg-amber-100 text-amber-600',
  },
  heartGiver: {
    name: '하트 뿌리기',
    description: '50개의 좋아요를 눌렀어요',
    icon: 'Heart',
    rarity: 'rare',
    color: 'bg-pink-100 text-pink-600',
  },
  socialButterfly: {
    name: '소셜 나비',
    description: '10명의 크리에이터를 팔로우했어요',
    icon: 'Users',
    rarity: 'rare',
    color: 'bg-purple-100 text-purple-600',
  },
  risingCreator: {
    name: '떠오르는 창작자',
    description: '첫 템플릿을 업로드했어요',
    icon: 'Upload',
    rarity: 'rare',
    color: 'bg-cyan-100 text-cyan-600',
  },
  beloved: {
    name: '사랑받는',
    description: '100개의 좋아요를 받았어요',
    icon: 'Sparkles',
    rarity: 'epic',
    color: 'bg-rose-100 text-rose-600',
  },
  trendsetter: {
    name: '트렌드세터',
    description: '내 템플릿이 100번 다운로드됐어요',
    icon: 'TrendingUp',
    rarity: 'epic',
    color: 'bg-orange-100 text-orange-600',
  },
  influencer: {
    name: '인플루언서',
    description: '100명의 팔로워를 달성했어요',
    icon: 'Crown',
    rarity: 'legendary',
    color: 'bg-amber-100 text-amber-600',
  },
  legend: {
    name: '전설',
    description: '1000번 이상 다운로드된 템플릿이 있어요',
    icon: 'Star',
    rarity: 'legendary',
    color: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-600',
  },
}

// 일일 체크인 보상
export const DAILY_STREAK_REWARDS = [
  { day: 1, xp: 10, message: '오늘도 반가워요!' },
  { day: 2, xp: 15, message: '연속 2일째!' },
  { day: 3, xp: 20, message: '3일 연속 방문!' },
  { day: 4, xp: 25, message: '4일 연속!' },
  { day: 5, xp: 30, message: '5일 연속! 대단해요!' },
  { day: 6, xp: 35, message: '6일째! 거의 다 왔어요!' },
  { day: 7, xp: 50, message: '일주일 연속! 보너스 경험치!' },
]

interface GamificationState {
  // 경험치 & 레벨
  xp: number
  level: number
  levelName: string

  // 통계
  stats: {
    totalViews: number
    totalDownloads: number
    totalLikes: number
    totalFollowers: number
    totalFollowing: number
    totalWorks: number
    totalUploads: number
    totalComments: number
  }

  // 뱃지
  badges: Badge[]
  recentBadge: Badge | null // 최근 획득 뱃지 (알림용)

  // 일일 체크인
  lastCheckIn: string | null // ISO date
  currentStreak: number
  longestStreak: number

  // 액션
  addXP: (amount: number, activity: keyof typeof ACTIVITY_XP) => void
  checkIn: () => { xp: number; message: string; isNewStreak: boolean } | null
  incrementStat: (stat: keyof GamificationState['stats'], amount?: number) => void
  unlockBadge: (badgeId: string) => boolean // true if newly unlocked
  checkBadgeEligibility: () => string[] // 새로 획득 가능한 뱃지 ID 반환

  // 유틸리티
  getXPToNextLevel: () => number
  getLevelProgress: () => number // 0-100%
  clearRecentBadge: () => void
}

// 레벨 계산
function calculateLevel(xp: number): { level: number; name: string } {
  let level = 0
  for (let i = LEVEL_CONFIG.thresholds.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_CONFIG.thresholds[i]) {
      level = i
      break
    }
  }
  return {
    level,
    name: LEVEL_CONFIG.names[Math.min(level, LEVEL_CONFIG.names.length - 1)],
  }
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 0,
      levelName: LEVEL_CONFIG.names[0],

      stats: {
        totalViews: 0,
        totalDownloads: 0,
        totalLikes: 0,
        totalFollowers: 0,
        totalFollowing: 0,
        totalWorks: 0,
        totalUploads: 0,
        totalComments: 0,
      },

      badges: [],
      recentBadge: null,

      lastCheckIn: null,
      currentStreak: 0,
      longestStreak: 0,

      addXP: (amount, _activity) => {
        const currentXP = get().xp
        const newXP = currentXP + amount
        const { level, name } = calculateLevel(newXP)

        set({
          xp: newXP,
          level,
          levelName: name,
        })
      },

      checkIn: () => {
        const { lastCheckIn, currentStreak, longestStreak } = get()
        const today = new Date().toISOString().slice(0, 10)

        // 이미 오늘 체크인했으면 null 반환
        if (lastCheckIn === today) {
          return null
        }

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().slice(0, 10)

        // 연속 체크인 계산
        let newStreak = 1
        if (lastCheckIn === yesterdayStr) {
          newStreak = currentStreak + 1
        }

        // 일주일 넘으면 7일 보상 반복
        const streakDay = ((newStreak - 1) % 7) + 1
        const reward = DAILY_STREAK_REWARDS[streakDay - 1]

        const newLongestStreak = Math.max(longestStreak, newStreak)

        set({
          lastCheckIn: today,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
        })

        // XP 추가
        get().addXP(reward.xp, 'login')

        return {
          xp: reward.xp,
          message: reward.message,
          isNewStreak: newStreak > currentStreak,
        }
      },

      incrementStat: (stat, amount = 1) => {
        set((state) => ({
          stats: {
            ...state.stats,
            [stat]: state.stats[stat] + amount,
          },
        }))
      },

      unlockBadge: (badgeId) => {
        const { badges } = get()

        // 이미 획득한 뱃지면 false
        if (badges.some((b) => b.id === badgeId)) {
          return false
        }

        const badgeConfig = BADGES[badgeId]
        if (!badgeConfig) return false

        const newBadge: Badge = {
          id: badgeId,
          ...badgeConfig,
          unlockedAt: new Date().toISOString(),
        }

        set({
          badges: [...badges, newBadge],
          recentBadge: newBadge,
        })

        return true
      },

      checkBadgeEligibility: () => {
        const { stats, badges } = get()
        const newBadges: string[] = []

        // 이미 획득한 뱃지 ID 목록
        const unlockedIds = new Set(badges.map((b) => b.id))

        // 각 뱃지 조건 확인
        if (!unlockedIds.has('firstSteps') && stats.totalWorks >= 1) {
          newBadges.push('firstSteps')
        }
        if (!unlockedIds.has('explorer') && stats.totalViews >= 10) {
          newBadges.push('explorer')
        }
        if (!unlockedIds.has('collector') && stats.totalDownloads >= 10) {
          newBadges.push('collector')
        }
        if (!unlockedIds.has('heartGiver') && stats.totalLikes >= 50) {
          newBadges.push('heartGiver')
        }
        if (!unlockedIds.has('socialButterfly') && stats.totalFollowing >= 10) {
          newBadges.push('socialButterfly')
        }
        if (!unlockedIds.has('risingCreator') && stats.totalUploads >= 1) {
          newBadges.push('risingCreator')
        }

        // 뱃지 자동 해금
        newBadges.forEach((id) => get().unlockBadge(id))

        return newBadges
      },

      getXPToNextLevel: () => {
        const { xp, level } = get()
        const nextThreshold = LEVEL_CONFIG.thresholds[level + 1] || Infinity
        return nextThreshold - xp
      },

      getLevelProgress: () => {
        const { xp, level } = get()
        const currentThreshold = LEVEL_CONFIG.thresholds[level] || 0
        const nextThreshold = LEVEL_CONFIG.thresholds[level + 1] || currentThreshold + 1000
        const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
        return Math.min(100, Math.max(0, progress))
      },

      clearRecentBadge: () => {
        set({ recentBadge: null })
      },
    }),
    {
      name: 'pairy-gamification',
      partialize: (state) => ({
        xp: state.xp,
        level: state.level,
        levelName: state.levelName,
        stats: state.stats,
        badges: state.badges,
        lastCheckIn: state.lastCheckIn,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
      }),
    }
  )
)

/**
 * 레벨 정보 훅
 */
export function useLevelInfo() {
  const { level, levelName, xp, getXPToNextLevel, getLevelProgress } = useGamificationStore()

  return {
    level,
    levelName,
    xp,
    xpToNext: getXPToNextLevel(),
    progress: getLevelProgress(),
    color: LEVEL_CONFIG.colors[Math.min(level, LEVEL_CONFIG.colors.length - 1)],
  }
}

/**
 * 뱃지 훅
 */
export function useBadges() {
  const { badges, recentBadge, clearRecentBadge, checkBadgeEligibility } = useGamificationStore()

  return {
    badges,
    recentBadge,
    clearRecentBadge,
    checkForNewBadges: checkBadgeEligibility,
    totalBadges: Object.keys(BADGES).length,
    unlockedCount: badges.length,
  }
}

/**
 * 일일 체크인 훅
 */
export function useDailyCheckIn() {
  const { checkIn, currentStreak, longestStreak, lastCheckIn } = useGamificationStore()

  const today = new Date().toISOString().slice(0, 10)
  const hasCheckedInToday = lastCheckIn === today

  return {
    checkIn,
    currentStreak,
    longestStreak,
    hasCheckedInToday,
  }
}
