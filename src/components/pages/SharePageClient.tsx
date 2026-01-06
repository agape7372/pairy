'use client'

/**
 * 공유 페이지 클라이언트 컴포넌트
 * OG 미리보기 + 작품 표시
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  Share2,
  Download,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Twitter,
  MessageCircle,
  ExternalLink,
  Heart,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui'
import { useShareWork } from '@/hooks/useShareWork'
import type { Work } from '@/types/database.types'
import { cn } from '@/lib/utils/cn'
import { copyToClipboard } from '@/lib/utils/clipboard'

interface SharePageClientProps {
  shareId: string
}

export default function SharePageClient({ shareId }: SharePageClientProps) {
  const shareHook = useShareWork()
  const shareHookRef = useRef(shareHook)
  shareHookRef.current = shareHook

  const [work, setWork] = useState<Work | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  // 작품 로드 (shareId 변경 시에만 실행)
  useEffect(() => {
    let mounted = true

    const loadWork = async () => {
      setIsLoading(true)
      setError(null)

      const { getSharedWork, incrementViewCount, error: hookError } = shareHookRef.current
      const result = await getSharedWork(shareId)

      if (!mounted) return

      if (result) {
        setWork(result)
        // 조회수 증가 (비동기, 결과 무시)
        incrementViewCount(shareId)
      } else {
        setError(hookError || '작품을 찾을 수 없습니다.')
      }

      setIsLoading(false)
    }

    loadWork()

    return () => {
      mounted = false
    }
  }, [shareId])

  // 링크 복사
  const handleCopyLink = useCallback(async () => {
    const url = typeof window !== 'undefined'
      ? window.location.href
      : `/share/${shareId}`

    const success = await copyToClipboard(url)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [shareId])

  // 트위터 공유
  const handleShareTwitter = useCallback(() => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = work?.title || 'Pairy에서 만든 작품을 확인해보세요!'
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }, [work])

  // 카카오톡 공유 (링크 복사로 대체)
  const handleShareKakao = useCallback(() => {
    handleCopyLink()
  }, [handleCopyLink])

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">작품을 불러오는 중...</p>
        </motion.div>
      </div>
    )
  }

  // 에러 상태
  if (error || !work) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            작품을 찾을 수 없어요
          </h1>
          <p className="text-gray-500 mb-6">
            {error || '링크가 만료되었거나 삭제된 작품이에요.'}
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  // 미리보기 이미지 URL
  const previewImageUrl = work.og_image_url || work.thumbnail_url || '/og-default.png'

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Pairy</span>
          </Link>

          {/* 공유 버튼 */}
          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => setShowShareMenu(!showShareMenu)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              공유하기
            </Button>

            <AnimatePresence>
              {showShareMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowShareMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-2 z-20 min-w-[180px]"
                  >
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-success" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-500" />
                      )}
                      <span className="text-sm font-medium">
                        {copied ? '복사됨!' : '링크 복사'}
                      </span>
                    </button>

                    <button
                      onClick={handleShareTwitter}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                      <span className="text-sm font-medium">트위터</span>
                    </button>

                    <button
                      onClick={handleShareKakao}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <MessageCircle className="w-5 h-5 text-[#FEE500]" />
                      <span className="text-sm font-medium">카카오톡</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* 메인 컨텐츠 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {/* 작품 미리보기 이미지 */}
          <div className="relative aspect-[4/5] bg-gray-100">
            <Image
              src={previewImageUrl}
              alt={work.title}
              fill
              className="object-contain"
              priority
              onError={(e) => {
                // 이미지 로드 실패 시 기본 이미지
                const target = e.target as HTMLImageElement
                target.src = '/og-default.png'
              }}
            />

            {/* 조회수 뱃지 */}
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                {work.view_count?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          {/* 정보 섹션 */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {work.title}
            </h1>

            {work.published_at && (
              <p className="text-sm text-gray-500 mb-6">
                {new Date(work.published_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} 공유됨
              </p>
            )}

            {/* 액션 버튼들 */}
            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button className="w-full" variant="primary">
                  <Heart className="w-4 h-4 mr-2" />
                  나도 만들기
                </Button>
              </Link>

              <Button
                variant="secondary"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* 앱 홍보 섹션 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500 mb-4">
            Pairy로 나만의 커플 프로필을 만들어보세요
          </p>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Pairy 시작하기
            </Button>
          </Link>
        </motion.div>

        {/* 푸터 */}
        <footer className="mt-12 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Pairy. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
