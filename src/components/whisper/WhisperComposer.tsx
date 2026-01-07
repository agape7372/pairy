'use client'

/**
 * Sprint 35: Whisper Composer 컴포넌트
 *
 * 크리에이터가 구독자에게 위스퍼를 보내는 모달
 * - 비밀 편지를 쓰는 듯한 어두운/차분한 UI
 * - 테마 선택
 * - 선물 첨부 기능
 * - 예약 발송
 * - 사라지는 위스퍼 옵션
 */

import React, { useCallback, useState, memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Send,
  Gift,
  Clock,
  Sparkles,
  Users,
  User,
  Crown,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { playClickSound } from '@/lib/utils/whisperSound'
import type {
  WhisperTheme,
  WhisperType,
  WhisperPayload,
  WhisperGiftPayload,
  CreateWhisperInput,
  BroadcastWhisperInput,
} from '@/types/whisper'
import { WHISPER_THEMES, getWhisperTypeLabel } from '@/types/whisper'

// ============================================
// 타입 정의
// ============================================

interface WhisperComposerProps {
  /** 모달 표시 여부 */
  isOpen: boolean
  /** 모달 닫기 콜백 */
  onClose: () => void
  /** 위스퍼 발송 콜백 */
  onSend: (input: CreateWhisperInput | BroadcastWhisperInput) => Promise<void>
  /** 사용 가능한 선물 목록 */
  availableGifts?: WhisperGiftPayload[]
  /** 구독자 목록 (개별 발송용) */
  subscribers?: Array<{ id: string; username: string; tier?: string }>
  /** 구독 등급 목록 */
  tiers?: Array<{ id: string; name: string }>
}

type RecipientMode = 'all' | 'tier' | 'individual'

// ============================================
// 테마 선택기 컴포넌트
// ============================================

const ThemeSelector = memo(function ThemeSelector({
  selectedTheme,
  onSelect,
}: {
  selectedTheme: WhisperTheme
  onSelect: (theme: WhisperTheme) => void
}) {
  const themes = useMemo(() => Object.values(WHISPER_THEMES), [])

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">테마 선택</label>
      <div className="flex flex-wrap gap-2">
        {themes.map((theme) => (
          <motion.button
            key={theme.id}
            type="button"
            className={cn(
              'relative px-3 py-2 rounded-lg text-sm',
              'border transition-all duration-200',
              selectedTheme === theme.id
                ? 'border-white/40 bg-white/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            )}
            onClick={() => {
              playClickSound()
              onSelect(theme.id)
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="mr-1">{theme.icon}</span>
            <span className="text-gray-300">{theme.name}</span>
            {selectedTheme === theme.id && (
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <Check className="w-3 h-3 text-gray-900" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
})

// ============================================
// 수신자 선택기 컴포넌트
// ============================================

const RecipientSelector = memo(function RecipientSelector({
  mode,
  onModeChange,
  selectedTiers,
  onTiersChange,
  selectedReceivers,
  onReceiversChange,
  tiers,
  subscribers,
}: {
  mode: RecipientMode
  onModeChange: (mode: RecipientMode) => void
  selectedTiers: string[]
  onTiersChange: (tiers: string[]) => void
  selectedReceivers: string[]
  onReceiversChange: (receivers: string[]) => void
  tiers?: Array<{ id: string; name: string }>
  subscribers?: Array<{ id: string; username: string; tier?: string }>
}) {
  const modeOptions: Array<{ value: RecipientMode; label: string; icon: React.ReactNode }> = [
    { value: 'all', label: '전체 구독자', icon: <Users className="w-4 h-4" /> },
    { value: 'tier', label: '등급별', icon: <Crown className="w-4 h-4" /> },
    { value: 'individual', label: '개별 선택', icon: <User className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-3">
      <label className="text-sm text-gray-400">받는 사람</label>

      {/* 모드 선택 */}
      <div className="flex gap-2">
        {modeOptions.map((option) => (
          <motion.button
            key={option.value}
            type="button"
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg',
              'border transition-all duration-200 text-sm',
              mode === option.value
                ? 'border-purple-500/50 bg-purple-500/20 text-purple-300'
                : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
            )}
            onClick={() => {
              playClickSound()
              onModeChange(option.value)
            }}
            whileTap={{ scale: 0.98 }}
          >
            {option.icon}
            {option.label}
          </motion.button>
        ))}
      </div>

      {/* 등급 선택 (tier 모드) */}
      {mode === 'tier' && tiers && tiers.length > 0 && (
        <motion.div
          className="flex flex-wrap gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {tiers.map((tier) => (
            <button
              key={tier.id}
              type="button"
              className={cn(
                'px-3 py-1.5 rounded-full text-xs border transition-all',
                selectedTiers.includes(tier.id)
                  ? 'border-purple-400 bg-purple-500/30 text-purple-200'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
              )}
              onClick={() => {
                playClickSound()
                const newTiers = selectedTiers.includes(tier.id)
                  ? selectedTiers.filter((t) => t !== tier.id)
                  : [...selectedTiers, tier.id]
                onTiersChange(newTiers)
              }}
            >
              {tier.name}
            </button>
          ))}
        </motion.div>
      )}

      {/* 개별 선택 (individual 모드) */}
      {mode === 'individual' && subscribers && subscribers.length > 0 && (
        <motion.div
          className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-white/10 p-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {subscribers.map((sub) => (
            <button
              key={sub.id}
              type="button"
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-all',
                selectedReceivers.includes(sub.id)
                  ? 'bg-purple-500/20 text-purple-200'
                  : 'text-gray-400 hover:bg-white/5'
              )}
              onClick={() => {
                playClickSound()
                const newReceivers = selectedReceivers.includes(sub.id)
                  ? selectedReceivers.filter((r) => r !== sub.id)
                  : [...selectedReceivers, sub.id]
                onReceiversChange(newReceivers)
              }}
            >
              {selectedReceivers.includes(sub.id) && <Check className="w-3 h-3" />}
              <span>{sub.username}</span>
              {sub.tier && (
                <span className="text-xs text-gray-500 ml-auto">{sub.tier}</span>
              )}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  )
})

// ============================================
// 선물 첨부 컴포넌트
// ============================================

const GiftAttachment = memo(function GiftAttachment({
  selectedGift,
  onSelect,
  availableGifts,
}: {
  selectedGift: WhisperGiftPayload | null
  onSelect: (gift: WhisperGiftPayload | null) => void
  availableGifts?: WhisperGiftPayload[]
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!availableGifts || availableGifts.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <motion.button
        type="button"
        className={cn(
          'w-full flex items-center justify-between p-3 rounded-xl',
          'border transition-all duration-200',
          selectedGift
            ? 'border-yellow-500/50 bg-yellow-500/10'
            : 'border-white/10 bg-white/5 hover:bg-white/10'
        )}
        onClick={() => {
          playClickSound()
          setIsExpanded(!isExpanded)
        }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            selectedGift ? 'bg-yellow-500/20' : 'bg-white/10'
          )}>
            <Gift className={cn(
              'w-5 h-5',
              selectedGift ? 'text-yellow-400' : 'text-gray-400'
            )} />
          </div>
          <div className="text-left">
            <p className={cn(
              'text-sm',
              selectedGift ? 'text-yellow-200' : 'text-gray-300'
            )}>
              {selectedGift
                ? '마법이 담겼습니다 ✨'
                : '이 위스퍼에 마법(선물)을 담으시겠습니까?'}
            </p>
            {selectedGift && (
              <p className="text-xs text-gray-500">
                {'stickerName' in selectedGift && selectedGift.stickerName}
                {'templateName' in selectedGift && selectedGift.templateName}
                {'couponCode' in selectedGift && `쿠폰: ${selectedGift.couponCode}`}
                {'contentTitle' in selectedGift && selectedGift.contentTitle}
              </p>
            )}
          </div>
        </div>
        <ChevronDown className={cn(
          'w-5 h-5 text-gray-400 transition-transform',
          isExpanded && 'rotate-180'
        )} />
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="grid grid-cols-2 gap-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {/* 선물 없음 옵션 */}
            <button
              type="button"
              className={cn(
                'p-3 rounded-lg border text-left transition-all',
                !selectedGift
                  ? 'border-purple-400/50 bg-purple-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              )}
              onClick={() => {
                playClickSound()
                onSelect(null)
                setIsExpanded(false)
              }}
            >
              <p className="text-sm text-gray-300">선물 없이</p>
              <p className="text-xs text-gray-500">메시지만 전달</p>
            </button>

            {/* 선물 목록 */}
            {availableGifts.map((gift, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  'p-3 rounded-lg border text-left transition-all',
                  selectedGift === gift
                    ? 'border-yellow-400/50 bg-yellow-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                )}
                onClick={() => {
                  playClickSound()
                  onSelect(gift)
                  setIsExpanded(false)
                }}
              >
                <p className="text-sm text-gray-300">
                  {gift.type === 'STICKER' && '🎨 스티커'}
                  {gift.type === 'TEMPLATE' && '📝 템플릿'}
                  {gift.type === 'COUPON' && '🎟️ 쿠폰'}
                  {gift.type === 'EXCLUSIVE_CONTENT' && '🔒 독점 콘텐츠'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {'stickerName' in gift && gift.stickerName}
                  {'templateName' in gift && gift.templateName}
                  {'couponCode' in gift && gift.couponCode}
                  {'contentTitle' in gift && gift.contentTitle}
                </p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

// ============================================
// 추가 옵션 컴포넌트
// ============================================

const AdditionalOptions = memo(function AdditionalOptions({
  ephemeral,
  onEphemeralChange,
  isScheduled,
  onScheduledChange,
  scheduledAt,
  onScheduledAtChange,
  limitedQuantity,
  onLimitedQuantityChange,
}: {
  ephemeral: boolean
  onEphemeralChange: (value: boolean) => void
  isScheduled: boolean
  onScheduledChange: (value: boolean) => void
  scheduledAt: string | null
  onScheduledAtChange: (value: string | null) => void
  limitedQuantity: number
  onLimitedQuantityChange: (value: number) => void
}) {
  return (
    <div className="space-y-3">
      {/* 사라지는 위스퍼 */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          {ephemeral ? (
            <EyeOff className="w-5 h-5 text-purple-400" />
          ) : (
            <Eye className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <p className="text-sm text-gray-300">사라지는 위스퍼</p>
            <p className="text-xs text-gray-500">읽은 후 가루처럼 사라집니다</p>
          </div>
        </div>
        <button
          type="button"
          className={cn(
            'w-12 h-6 rounded-full transition-all duration-200',
            ephemeral ? 'bg-purple-500' : 'bg-gray-700'
          )}
          onClick={() => {
            playClickSound()
            onEphemeralChange(!ephemeral)
          }}
        >
          <motion.div
            className="w-5 h-5 bg-white rounded-full shadow"
            animate={{ x: ephemeral ? 26 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* 예약 발송 */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className={cn(
              'w-5 h-5',
              isScheduled ? 'text-blue-400' : 'text-gray-400'
            )} />
            <div>
              <p className="text-sm text-gray-300">예약 발송</p>
              <p className="text-xs text-gray-500">지정한 시간에 자동 발송</p>
            </div>
          </div>
          <button
            type="button"
            className={cn(
              'w-12 h-6 rounded-full transition-all duration-200',
              isScheduled ? 'bg-blue-500' : 'bg-gray-700'
            )}
            onClick={() => {
              playClickSound()
              onScheduledChange(!isScheduled)
              if (isScheduled) {
                onScheduledAtChange(null)
              }
            }}
          >
            <motion.div
              className="w-5 h-5 bg-white rounded-full shadow"
              animate={{ x: isScheduled ? 26 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {isScheduled && (
          <motion.input
            type="datetime-local"
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm',
              'bg-gray-900/50 border border-white/10',
              'text-gray-300 focus:outline-none focus:border-blue-500/50'
            )}
            value={scheduledAt || ''}
            onChange={(e) => onScheduledAtChange(e.target.value || null)}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          />
        )}
      </div>

      {/* 선착순 제한 */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className={cn(
              'w-5 h-5',
              limitedQuantity > 0 ? 'text-amber-400' : 'text-gray-400'
            )} />
            <div>
              <p className="text-sm text-gray-300">선착순 제한</p>
              <p className="text-xs text-gray-500">선물 수령 인원 제한</p>
            </div>
          </div>
          <input
            type="number"
            min="0"
            max="1000"
            className={cn(
              'w-20 px-3 py-1.5 rounded-lg text-sm text-center',
              'bg-gray-900/50 border border-white/10',
              'text-gray-300 focus:outline-none focus:border-amber-500/50'
            )}
            value={limitedQuantity || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0
              onLimitedQuantityChange(Math.max(0, Math.min(1000, value)))
            }}
            placeholder="0"
          />
        </div>
        {limitedQuantity > 0 && (
          <p className="text-xs text-amber-400/80 text-center">
            선착순 {limitedQuantity}명만 선물을 받을 수 있습니다
          </p>
        )}
      </div>
    </div>
  )
})

// ============================================
// 메인 컴포넌트
// ============================================

export const WhisperComposer = memo(function WhisperComposer({
  isOpen,
  onClose,
  onSend,
  availableGifts,
  subscribers,
  tiers,
}: WhisperComposerProps) {
  // 폼 상태
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('all')
  const [selectedReceiverIds, setSelectedReceiverIds] = useState<string[]>([])
  const [selectedTiers, setSelectedTiers] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [gift, setGift] = useState<WhisperGiftPayload | null>(null)
  const [theme, setTheme] = useState<WhisperTheme>('NIGHT')
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
  const [ephemeral, setEphemeral] = useState(false)
  const [limitedQuantity, setLimitedQuantity] = useState(0)
  const [isSending, setIsSending] = useState(false)

  // 위스퍼 타입 자동 결정
  const whisperType: WhisperType = useMemo(() => {
    if (gift) return 'GIFT'
    if (limitedQuantity > 0) return 'SECRET_EVENT'
    return 'NOTICE'
  }, [gift, limitedQuantity])

  // 유효성 검사
  const isValid = useMemo(() => {
    if (!message.trim()) return false
    if (recipientMode === 'tier' && selectedTiers.length === 0) return false
    if (recipientMode === 'individual' && selectedReceiverIds.length === 0) return false
    if (isScheduled && !scheduledAt) return false
    return true
  }, [message, recipientMode, selectedTiers, selectedReceiverIds, isScheduled, scheduledAt])

  // 발송 처리
  const handleSend = useCallback(async () => {
    if (!isValid || isSending) return

    setIsSending(true)
    try {
      const payload: WhisperPayload = {
        message: message.trim(),
        gift: gift || undefined,
        ephemeral: ephemeral || undefined,
        limitedQuantity: limitedQuantity > 0 ? limitedQuantity : undefined,
      }

      if (recipientMode === 'individual' && selectedReceiverIds.length === 1) {
        // 개별 발송
        await onSend({
          receiverId: selectedReceiverIds[0],
          whisperType,
          payload,
          scheduledAt: isScheduled ? scheduledAt : null,
          theme,
        })
      } else {
        // 대량 발송
        await onSend({
          whisperType,
          payload,
          scheduledAt: isScheduled ? scheduledAt : null,
          theme,
          tierFilter: recipientMode === 'tier' ? selectedTiers : undefined,
        })
      }

      // 폼 초기화
      setMessage('')
      setGift(null)
      setEphemeral(false)
      setLimitedQuantity(0)
      setIsScheduled(false)
      setScheduledAt(null)
      onClose()
    } catch (error) {
      console.error('[WhisperComposer] Send failed:', error)
    } finally {
      setIsSending(false)
    }
  }, [
    isValid,
    isSending,
    message,
    gift,
    ephemeral,
    limitedQuantity,
    recipientMode,
    selectedReceiverIds,
    whisperType,
    isScheduled,
    scheduledAt,
    theme,
    selectedTiers,
    onSend,
    onClose,
  ])

  const selectedTheme = WHISPER_THEMES[theme]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 오버레이 */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* 모달 */}
          <motion.div
            className={cn(
              'relative w-full max-w-lg max-h-[90vh] overflow-y-auto',
              'rounded-3xl shadow-2xl',
              'bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900',
              'border border-white/10'
            )}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* 헤더 */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-gray-900/95 backdrop-blur-sm rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br',
                  selectedTheme.backgroundGradient
                )}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">위스퍼 보내기</h2>
                  <p className="text-xs text-gray-500">
                    {getWhisperTypeLabel(whisperType)} · {selectedTheme.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-4 space-y-6">
              {/* 테마 선택 */}
              <ThemeSelector selectedTheme={theme} onSelect={setTheme} />

              {/* 수신자 선택 */}
              <RecipientSelector
                mode={recipientMode}
                onModeChange={setRecipientMode}
                selectedTiers={selectedTiers}
                onTiersChange={setSelectedTiers}
                selectedReceivers={selectedReceiverIds}
                onReceiversChange={setSelectedReceiverIds}
                tiers={tiers}
                subscribers={subscribers}
              />

              {/* 메시지 입력 */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">메시지</label>
                <div className={cn(
                  'relative rounded-xl overflow-hidden',
                  'bg-gradient-to-br',
                  selectedTheme.backgroundGradient
                )}>
                  <textarea
                    className={cn(
                      'w-full min-h-[120px] p-4 resize-none',
                      'bg-transparent border-none outline-none',
                      'text-lg leading-relaxed',
                      selectedTheme.textColor,
                      'placeholder:text-white/30'
                    )}
                    style={{
                      fontFamily: '"Nanum Myeongjo", serif',
                      letterSpacing: '0.02em',
                    }}
                    placeholder="속삭이고 싶은 말을 적어주세요..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                  />
                  <div className="absolute bottom-2 right-3 text-xs text-white/30">
                    {message.length}/500
                  </div>
                </div>
              </div>

              {/* 선물 첨부 */}
              <GiftAttachment
                selectedGift={gift}
                onSelect={setGift}
                availableGifts={availableGifts}
              />

              {/* 추가 옵션 */}
              <AdditionalOptions
                ephemeral={ephemeral}
                onEphemeralChange={setEphemeral}
                isScheduled={isScheduled}
                onScheduledChange={setIsScheduled}
                scheduledAt={scheduledAt}
                onScheduledAtChange={setScheduledAt}
                limitedQuantity={limitedQuantity}
                onLimitedQuantityChange={setLimitedQuantity}
              />
            </div>

            {/* 푸터 */}
            <div className="sticky bottom-0 p-4 border-t border-white/10 bg-gray-900/95 backdrop-blur-sm rounded-b-3xl">
              <motion.button
                type="button"
                className={cn(
                  'w-full py-3 px-6 rounded-xl font-medium',
                  'flex items-center justify-center gap-2',
                  'transition-all duration-200',
                  isValid && !isSending
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                )}
                onClick={handleSend}
                disabled={!isValid || isSending}
                whileHover={isValid && !isSending ? { scale: 1.02 } : {}}
                whileTap={isValid && !isSending ? { scale: 0.98 } : {}}
              >
                {isSending ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    속삭이는 중...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {isScheduled ? '예약하기' : '속삭이기'}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export default WhisperComposer
