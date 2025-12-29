/**
 * 에디터 진입 흐름 관련 타입 정의
 *
 * Solo/Duo 모드 선택 → 템플릿 선택 → 제목 입력 → 에디터 진입
 */

// ============================================
// 에디터 모드
// ============================================

/** 에디터 작업 모드 */
export type EditorMode = 'solo' | 'duo'

/** 모드별 설명 정보 */
export interface EditorModeInfo {
  id: EditorMode
  title: string
  description: string
  icon: string
  features: string[]
  /** 프리미엄 기능 여부 */
  isPremium?: boolean
}

/** 기본 모드 정보 */
export const EDITOR_MODES: readonly EditorModeInfo[] = [
  {
    id: 'solo',
    title: '솔로 모드',
    description: '혼자서 차분하게 작업해요',
    icon: '🎨',
    features: [
      '자유로운 작업 속도',
      '자동 저장',
      '히스토리 관리',
    ],
    isPremium: false,
  },
  {
    id: 'duo',
    title: '듀오 모드',
    description: '친구와 함께 실시간으로 만들어요',
    icon: '👥',
    features: [
      '실시간 협업',
      '참여자 커서 표시',
      '활동 알림',
      '초대 링크 공유',
    ],
    isPremium: false, // 추후 프리미엄으로 전환 가능
  },
] as const

// ============================================
// 템플릿 소스
// ============================================

/** 템플릿을 가져온 출처 */
export type TemplateSource = 'built-in' | 'my-library' | 'hub'

/** 템플릿 소스 탭 정보 */
export interface TemplateSourceTab {
  id: TemplateSource
  label: string
  icon: string
  emptyMessage: string
}

/** 기본 템플릿 소스 탭 */
export const TEMPLATE_SOURCE_TABS: readonly TemplateSourceTab[] = [
  {
    id: 'built-in',
    label: '기본 템플릿',
    icon: '📦',
    emptyMessage: '기본 템플릿이 준비 중이에요',
  },
  {
    id: 'my-library',
    label: '내 서재',
    icon: '📚',
    emptyMessage: '저장한 템플릿이 없어요',
  },
  {
    id: 'hub',
    label: '자료 허브',
    icon: '🌐',
    emptyMessage: '자료 허브에서 템플릿을 찾아보세요',
  },
] as const

// ============================================
// 선택된 템플릿
// ============================================

/** 진입 흐름에서 선택된 템플릿 정보 */
export interface SelectedTemplate {
  /** 템플릿 고유 ID */
  id: string
  /** 템플릿 제목 */
  title: string
  /** 이모지 아이콘 */
  emoji: string
  /** 설명 */
  description: string
  /** 출처 */
  source: TemplateSource
  /** 썸네일 URL (선택적) */
  thumbnailUrl?: string
  /** 카테고리 */
  category?: 'pair' | 'profile' | 'group' | 'custom'
  /** 태그 목록 */
  tags?: string[]
  /** 새 템플릿 여부 */
  isNew?: boolean
  /** 작성자 (허브 템플릿) */
  author?: string
}

// ============================================
// 진입 단계
// ============================================

/** 에디터 진입 흐름 단계 */
export type EntryStep = 'mode-select' | 'template-select' | 'title-input'

/** 단계 순서 */
export const ENTRY_STEPS: readonly EntryStep[] = [
  'mode-select',
  'template-select',
  'title-input',
] as const

/** 단계 인덱스 맵 */
export const ENTRY_STEP_INDEX: Record<EntryStep, number> = {
  'mode-select': 0,
  'template-select': 1,
  'title-input': 2,
}

// ============================================
// 진입 상태
// ============================================

/** 에디터 진입 흐름 전체 상태 */
export interface EditorEntryState {
  /** 현재 단계 */
  step: EntryStep
  /** 선택된 모드 */
  mode: EditorMode | null
  /** 선택된 템플릿 */
  selectedTemplate: SelectedTemplate | null
  /** 작업 제목 */
  title: string
  /** 로딩 상태 */
  isLoading: boolean
  /** 에러 메시지 */
  error: string | null
}

/** 초기 상태 */
export const INITIAL_ENTRY_STATE: EditorEntryState = {
  step: 'mode-select',
  mode: null,
  selectedTemplate: null,
  title: '',
  isLoading: false,
  error: null,
}

// ============================================
// 애니메이션 설정
// ============================================

/** 페이지 전환 애니메이션 variants */
export const PAGE_TRANSITION_VARIANTS = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
} as const

/** 애니메이션 기본 설정 */
export const PAGE_TRANSITION_CONFIG = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
} as const

// ============================================
// Duo 모드 Presence 타입
// ============================================

/** 활동 스트림 아이템 */
export interface ActivityItem {
  id: string
  userId: string
  nickname: string
  avatarUrl?: string
  type: 'join' | 'leave' | 'edit' | 'upload' | 'color-change'
  message: string
  timestamp: Date
  /** 관련 슬롯/필드 ID (edit, upload 시) */
  targetId?: string
}

/** Presence 상태 (Duo 모드에서 사용) */
export interface PresenceState {
  /** 현재 참여자 목록 */
  participants: PresenceParticipant[]
  /** 활동 스트림 */
  activities: ActivityItem[]
  /** 최대 표시할 활동 수 */
  maxActivities: number
}

/** Presence 참여자 정보 */
export interface PresenceParticipant {
  userId: string
  nickname: string
  avatarUrl?: string
  isOnline: boolean
  role: 'host' | 'guest'
  cursor?: { x: number; y: number }
  /** 현재 편집 중인 요소 ID */
  editingElementId?: string
  /** 마지막 활동 시간 */
  lastActiveAt: Date
}
