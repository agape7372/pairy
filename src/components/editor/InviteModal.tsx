'use client'

import { useState } from 'react'
import { X, Copy, Check, Link, Twitter, MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { copyToClipboard } from '@/lib/utils/clipboard'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  inviteCode: string
  inviteLink: string
  onCopyLink: () => Promise<boolean>
}

export function InviteModal({
  isOpen,
  onClose,
  inviteCode,
  inviteLink,
  onCopyLink,
}: InviteModalProps) {
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  if (!isOpen) return null

  const handleCopyLink = async () => {
    const success = await onCopyLink()
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyCode = async () => {
    const success = await copyToClipboard(inviteCode)
    if (success) {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const shareToTwitter = () => {
    const text = `함께 페어틀을 완성해요!\n초대 코드: ${inviteCode}`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(inviteLink)}`
    window.open(url, '_blank')
  }

  const shareToKakao = () => {
    // 카카오톡 공유 (Kakao SDK 필요)
    // 현재는 클립보드 복사로 대체
    handleCopyLink()
  }

  return (
    <>
      {/* 배경 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[24px] shadow-xl p-6 z-50 animate-scale-in">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">친구 초대하기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 초대 코드 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            초대 코드
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4 text-center border-2 border-dashed border-primary-200">
              <p className="font-mono font-bold text-3xl text-gray-900 tracking-[0.3em]">
                {inviteCode}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleCopyCode}
              className="shrink-0"
            >
              {copiedCode ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            친구에게 이 코드를 전달하세요
          </p>
        </div>

        {/* 링크 복사 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            초대 링크
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 overflow-hidden">
              <Link className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-600 truncate">{inviteLink}</span>
            </div>
            <Button onClick={handleCopyLink}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  복사
                </>
              )}
            </Button>
          </div>
        </div>

        {/* SNS 공유 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            SNS로 공유하기
          </label>
          <div className="flex gap-3">
            <button
              onClick={shareToTwitter}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-xl transition-colors"
            >
              <Twitter className="w-5 h-5" />
              <span className="font-medium">트위터</span>
            </button>
            <button
              onClick={shareToKakao}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FEE500] hover:bg-[#e6cf00] text-[#3C1E1E] rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">카카오톡</span>
            </button>
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-accent-50 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 mb-2">사용 방법</h4>
          <ol className="text-sm text-gray-600 space-y-1.5">
            <li className="flex gap-2">
              <span className="text-accent-400 font-bold">1.</span>
              친구에게 초대 코드나 링크를 공유하세요
            </li>
            <li className="flex gap-2">
              <span className="text-accent-400 font-bold">2.</span>
              친구가 참여하면 함께 편집할 수 있어요
            </li>
            <li className="flex gap-2">
              <span className="text-accent-400 font-bold">3.</span>
              실시간으로 서로의 편집 내용을 볼 수 있어요
            </li>
          </ol>
        </div>

        {/* 닫기 버튼 */}
        <div className="mt-6">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </>
  )
}

// 협업 참여 모달 (초대받은 사용자용)
interface JoinModalProps {
  isOpen: boolean
  onClose: () => void
  onJoin: (code: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function JoinModal({
  isOpen,
  onClose,
  onJoin,
  isLoading,
  error,
}: JoinModalProps) {
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return

    setJoining(true)
    const success = await onJoin(code)
    setJoining(false)

    if (success) {
      onClose()
    }
  }

  const handleCodeChange = (value: string) => {
    // 대문자로 변환, 영숫자만 허용
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(cleaned)
  }

  return (
    <>
      {/* 배경 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[24px] shadow-xl p-6 z-50 animate-scale-in">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">협업 세션 참여</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 코드 입력 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              초대 코드 입력
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="XXXXXX"
              className="w-full text-center font-mono font-bold text-3xl tracking-[0.3em] py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent placeholder:text-gray-300"
              autoFocus
            />
            {error && (
              <p className="text-sm text-error mt-2">{error}</p>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={code.length !== 6 || joining || isLoading}
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  참여 중...
                </>
              ) : (
                '참여하기'
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
