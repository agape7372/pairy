/**
 * Sprint 35: Whisper(위스퍼) 시스템 타입 정의
 *
 * 크리에이터가 구독자에게 보내는 은밀한 선물과 메시지
 * "팬에게만 전하는 은밀한 속삭임"
 */

// ============================================
// 기본 타입 정의
// ============================================

/** 위스퍼 유형 */
export type WhisperType = 'GIFT' | 'NOTICE' | 'SECRET_EVENT'

/** 위스퍼 상태 */
export type WhisperStatus = 'PENDING' | 'SENT' | 'READ' | 'CLAIMED' | 'EXPIRED'

/** 위스퍼 시각적 테마 */
export type WhisperTheme = 'NIGHT' | 'LOVE' | 'GOLDEN' | 'MYSTIC' | 'SPRING'

/** 선물 유형 */
export type GiftType = 'STICKER' | 'TEMPLATE' | 'COUPON' | 'EXCLUSIVE_CONTENT'

// ============================================
// 페이로드 타입 (JSONB 구조)
// ============================================

/** 스티커 선물 페이로드 */
export interface StickerGiftPayload {
  type: 'STICKER'
  stickerId: string
  stickerName: string
  stickerImageUrl: string
  quantity: number
}

/** 템플릿 이용권 페이로드 */
export interface TemplateGiftPayload {
  type: 'TEMPLATE'
  templateId: string
  templateName: string
  templateThumbnailUrl: string
  validDays: number // 유효 기간 (일)
}

/** 쿠폰 페이로드 */
export interface CouponGiftPayload {
  type: 'COUPON'
  couponCode: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  minPurchase?: number
  expiresAt: string // ISO 8601
}

/** 독점 콘텐츠 페이로드 */
export interface ExclusiveContentPayload {
  type: 'EXCLUSIVE_CONTENT'
  contentId: string
  contentTitle: string
  contentType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'
  previewUrl?: string
}

/** 위스퍼 페이로드 유니온 타입 */
export type WhisperGiftPayload =
  | StickerGiftPayload
  | TemplateGiftPayload
  | CouponGiftPayload
  | ExclusiveContentPayload

/** 위스퍼 전체 페이로드 */
export interface WhisperPayload {
  /** 메시지 본문 */
  message: string
  /** 첨부된 선물 (선택) */
  gift?: WhisperGiftPayload
  /** 읽은 후 사라지는 위스퍼 여부 */
  ephemeral?: boolean
  /** 선착순 제한 (있을 경우) */
  limitedQuantity?: number
  /** 이미 클레임한 수 */
  claimedCount?: number
}

// ============================================
// 메인 Whisper 인터페이스
// ============================================

/** 위스퍼 데이터베이스 레코드 */
export interface Whisper {
  /** 고유 ID (UUID) */
  readonly id: string
  /** 발신자 (크리에이터) ID */
  senderId: string
  /** 수신자 (구독자) ID */
  receiverId: string
  /** 위스퍼 유형 */
  whisperType: WhisperType
  /** 페이로드 (메시지, 선물 등) */
  payload: WhisperPayload
  /** 예약 발송 시간 (null이면 즉시 발송) */
  scheduledAt: string | null
  /** 실제 발송 시간 */
  sentAt: string | null
  /** 읽은 시간 */
  readAt: string | null
  /** 선물 수령 시간 */
  claimedAt: string | null
  /** 상태 */
  status: WhisperStatus
  /** 시각적 테마 */
  theme: WhisperTheme
  /** 생성 일시 */
  createdAt: string
  /** 수정 일시 */
  updatedAt: string
}

/** 위스퍼 생성 입력 */
export interface CreateWhisperInput {
  receiverId: string
  whisperType: WhisperType
  payload: WhisperPayload
  scheduledAt?: string | null
  theme?: WhisperTheme
}

/** 위스퍼 대량 발송 입력 (구독자 전체) */
export interface BroadcastWhisperInput {
  whisperType: WhisperType
  payload: WhisperPayload
  scheduledAt?: string | null
  theme?: WhisperTheme
  /** 특정 구독 등급만 (선택) */
  tierFilter?: string[]
}

// ============================================
// UI 상태 타입
// ============================================

/** 위스퍼 알림 상태 */
export interface WhisperNotificationState {
  /** 미확인 위스퍼 수 */
  unreadCount: number
  /** 최근 도착한 위스퍼 */
  latestWhisper: Whisper | null
  /** 알림 표시 여부 */
  showNotification: boolean
  /** 알림 애니메이션 진행 중 */
  isAnimating: boolean
}

/** 위스퍼 카드 표시 상태 */
export type WhisperCardRevealState = 'hidden' | 'blurred' | 'revealing' | 'revealed' | 'dissolving'

/** 위스퍼 작성 폼 상태 */
export interface WhisperComposerState {
  /** 수신자 선택 */
  recipients: 'all' | 'tier' | 'individual'
  /** 선택된 개별 수신자 ID 목록 */
  selectedReceiverIds: string[]
  /** 선택된 등급 */
  selectedTiers: string[]
  /** 메시지 내용 */
  message: string
  /** 첨부된 선물 */
  gift: WhisperGiftPayload | null
  /** 선택된 테마 */
  theme: WhisperTheme
  /** 예약 발송 여부 */
  isScheduled: boolean
  /** 예약 시간 */
  scheduledAt: string | null
  /** 사라지는 위스퍼 여부 */
  ephemeral: boolean
  /** 선착순 수량 (0이면 무제한) */
  limitedQuantity: number
}

// ============================================
// 테마 설정
// ============================================

/** 테마별 스타일 설정 */
export interface WhisperThemeConfig {
  /** 테마 ID */
  id: WhisperTheme
  /** 테마 이름 */
  name: string
  /** 배경 그라디언트 */
  backgroundGradient: string
  /** 텍스트 색상 */
  textColor: string
  /** 강조 색상 */
  accentColor: string
  /** 글로우 색상 */
  glowColor: string
  /** 아이콘 이모지 */
  icon: string
}

export const WHISPER_THEMES: Record<WhisperTheme, WhisperThemeConfig> = {
  NIGHT: {
    id: 'NIGHT',
    name: '밤의 속삭임',
    backgroundGradient: 'from-slate-900 via-purple-900 to-slate-900',
    textColor: 'text-purple-100',
    accentColor: 'text-purple-400',
    glowColor: 'shadow-purple-500/50',
    icon: '🌙',
  },
  LOVE: {
    id: 'LOVE',
    name: '사랑의 고백',
    backgroundGradient: 'from-rose-900 via-pink-800 to-rose-900',
    textColor: 'text-rose-100',
    accentColor: 'text-pink-400',
    glowColor: 'shadow-pink-500/50',
    icon: '💕',
  },
  GOLDEN: {
    id: 'GOLDEN',
    name: '황금빛 선물',
    backgroundGradient: 'from-amber-900 via-yellow-800 to-amber-900',
    textColor: 'text-amber-100',
    accentColor: 'text-yellow-400',
    glowColor: 'shadow-yellow-500/50',
    icon: '✨',
  },
  MYSTIC: {
    id: 'MYSTIC',
    name: '신비로운 비밀',
    backgroundGradient: 'from-indigo-900 via-violet-800 to-indigo-900',
    textColor: 'text-indigo-100',
    accentColor: 'text-violet-400',
    glowColor: 'shadow-violet-500/50',
    icon: '🔮',
  },
  SPRING: {
    id: 'SPRING',
    name: '봄의 설렘',
    backgroundGradient: 'from-emerald-900 via-teal-800 to-emerald-900',
    textColor: 'text-emerald-100',
    accentColor: 'text-teal-400',
    glowColor: 'shadow-teal-500/50',
    icon: '🌸',
  },
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 위스퍼 타입 한글 변환
 */
export function getWhisperTypeLabel(type: WhisperType): string {
  const labels: Record<WhisperType, string> = {
    GIFT: '선물',
    NOTICE: '공지',
    SECRET_EVENT: '비밀 이벤트',
  }
  return labels[type]
}

/**
 * 선물 타입 한글 변환
 */
export function getGiftTypeLabel(type: GiftType): string {
  const labels: Record<GiftType, string> = {
    STICKER: '스티커',
    TEMPLATE: '템플릿 이용권',
    COUPON: '할인 쿠폰',
    EXCLUSIVE_CONTENT: '독점 콘텐츠',
  }
  return labels[type]
}

/**
 * 위스퍼 상태 한글 변환
 */
export function getWhisperStatusLabel(status: WhisperStatus): string {
  const labels: Record<WhisperStatus, string> = {
    PENDING: '발송 대기',
    SENT: '발송됨',
    READ: '읽음',
    CLAIMED: '수령 완료',
    EXPIRED: '만료됨',
  }
  return labels[status]
}

/**
 * 위스퍼가 선물을 포함하는지 확인
 */
export function hasGift(whisper: Whisper): boolean {
  return whisper.payload.gift !== undefined
}

/**
 * 위스퍼가 선착순 제한이 있는지 확인
 */
export function isLimited(whisper: Whisper): boolean {
  return (whisper.payload.limitedQuantity ?? 0) > 0
}

/**
 * 선착순 마감 여부 확인
 */
export function isSoldOut(whisper: Whisper): boolean {
  if (!isLimited(whisper)) return false
  const limit = whisper.payload.limitedQuantity ?? 0
  const claimed = whisper.payload.claimedCount ?? 0
  return claimed >= limit
}
