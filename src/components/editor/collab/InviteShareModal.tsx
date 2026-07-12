'use client'

/**
 * 초대 공유 모달 컴포넌트
 * 협업 세션 초대 코드 및 링크 공유
 */

import { useState, useCallback, useEffect } from 'react'
import QRCode from 'qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Copy,
  Check,
  Share2,
  Link,
  QrCode,
  MessageCircle,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui'

interface InviteShareModalProps {
  isOpen: boolean
  onClose: () => void
  inviteCode: string
  sessionId: string
  maxParticipants?: number
  currentParticipants?: number
}

export function InviteShareModal({
  isOpen,
  onClose,
  inviteCode,
  sessionId,
  maxParticipants = 2,
  currentParticipants = 1,
}: InviteShareModalProps) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/collab/${inviteCode}`
    : `/collab/${inviteCode}`

  // QR 실 생성 (M6) — 열 때 한 번 생성, 링크 바뀌면 갱신
  useEffect(() => {
    if (!showQR) return
    let cancelled = false
    QRCode.toDataURL(inviteLink, { width: 320, margin: 1 })
      .then((url) => { if (!cancelled) setQrDataUrl(url) })
      .catch(() => { if (!cancelled) setQrDataUrl(null) })
    return () => { cancelled = true }
  }, [showQR, inviteLink])

  const copyToClipboard = useCallback(async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [])

  const shareViaWebShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '페어리 협업 초대',
          text: `함께 페어틀을 만들어요! 초대 코드: ${inviteCode}`,
          url: inviteLink,
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    }
  }, [inviteCode, inviteLink])

  // 카카오톡 공유 — SDK(앱 키) 없이는 직접 열기가 불가.
  // 모바일이면 OS 공유 시트(카카오톡 선택 가능), 아니면 링크 복사로 정직하게 안내.
  const [kakaoHint, setKakaoHint] = useState(false)
  const shareViaKakao = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '페어리 협업 초대',
          text: `함께 페어틀을 만들어요! 초대 코드: ${inviteCode}`,
          url: inviteLink,
        })
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }
    await copyToClipboard(inviteLink, 'link')
    setKakaoHint(true)
    setTimeout(() => setKakaoHint(false), 3000)
  }, [inviteCode, inviteLink, copyToClipboard])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* 헤더 */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-primary-100 to-accent-100">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">협업 초대하기</h2>
                <p className="text-sm text-gray-600">
                  {currentParticipants}/{maxParticipants}명 참여 중
                </p>
              </div>
            </div>
          </div>

          {/* 초대 코드 */}
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                초대 코드
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 font-mono text-2xl font-bold text-center tracking-[0.3em] text-gray-800">
                  {inviteCode}
                </div>
                <button
                  onClick={() => copyToClipboard(inviteCode, 'code')}
                  className={`p-3 rounded-xl transition-all ${
                    copied === 'code'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {copied === 'code' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 링크 복사 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                초대 링크
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600 truncate">
                  {inviteLink}
                </div>
                <button
                  onClick={() => copyToClipboard(inviteLink, 'link')}
                  className={`p-3 rounded-xl transition-all ${
                    copied === 'link'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {copied === 'link' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Link className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 공유 버튼들 */}
            <div className="grid grid-cols-3 gap-3">
              <ShareButton
                icon={<Share2 className="w-5 h-5" />}
                label="공유"
                onClick={shareViaWebShare}
                color="bg-gray-100 text-gray-700 hover:bg-gray-200"
              />
              <ShareButton
                icon={<MessageCircle className="w-5 h-5" />}
                label="카카오톡"
                onClick={shareViaKakao}
                color="bg-[#FEE500] text-[#391B1B] hover:bg-[#FFEB3B]"
              />
              <ShareButton
                icon={<QrCode className="w-5 h-5" />}
                label="QR코드"
                onClick={() => setShowQR(!showQR)}
                color={showQR ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              />
            </div>

            {/* 카카오톡 폴백 안내 */}
            {kakaoHint && (
              <p className="text-xs text-center text-gray-500 -mt-2">
                링크를 복사했어요 — 카카오톡에 붙여넣어 공유하세요
              </p>
            )}

            {/* QR 코드 (실 생성, M6) */}
            <AnimatePresence>
              {showQR && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center">
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- data URL QR, next/image 불필요
                      <img src={qrDataUrl} alt={`초대 링크 QR 코드 (${inviteLink})`} className="w-40 h-40 rounded-lg" />
                    ) : (
                      <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                        <QrCode className="w-20 h-20 text-gray-300 animate-pulse" />
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      QR 코드를 스캔하여 참여
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 푸터 */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <p className="text-xs text-gray-500 text-center">
              초대 코드는 세션이 종료될 때까지 유효합니다
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================
// 공유 버튼 컴포넌트
// ============================================

interface ShareButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  color: string
}

function ShareButton({ icon, label, onClick, color }: ShareButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 px-4 rounded-xl transition-colors ${color}`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </motion.button>
  )
}

export default InviteShareModal
