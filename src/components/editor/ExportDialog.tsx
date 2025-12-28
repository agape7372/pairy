'use client'

import { useState } from 'react'
import { X, Download, Image, FileImage, Loader2, AtSign, Twitter, Crown, Lock, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import {
  type ExportFormat,
  type ExportQuality,
  captureElementAsImage,
  downloadBlob,
  generateFilename,
} from '@/lib/utils/export'
import { useSubscriptionStore, TIER_LIMITS } from '@/stores/subscriptionStore'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  canvasRef: React.RefObject<HTMLElement>
  title: string
  isPremium?: boolean
  creatorName?: string // 틀 제작자 이름
  templateTitle?: string // 틀 이름
}

export function ExportDialog({
  isOpen,
  onClose,
  canvasRef,
  title,
  isPremium = false,
  creatorName,
  templateTitle,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [quality, setQuality] = useState<ExportQuality>('high')
  const [scale, setScale] = useState<number>(1)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [includeCredit, setIncludeCredit] = useState(true) // 크레딧 포함 여부
  const [shareToTwitter, setShareToTwitter] = useState(false) // 트위터 공유

  // 구독 상태 가져오기
  const {
    subscription,
    getRemainingExports,
    incrementExports,
  } = useSubscriptionStore()

  const limits = TIER_LIMITS[subscription.tier]
  const remainingExports = getRemainingExports()
  const canExportHighRes = limits.canExportHighRes
  const hasWatermark = limits.hasWatermark

  if (!isOpen) return null

  // 크레딧 텍스트 생성
  const getCreditText = () => {
    if (!creatorName) return '페어리에서 만듦 - pairy.app'
    return `틀: ${templateTitle || '페어리 틀'} by @${creatorName}`
  }

  // 트위터 공유 URL 생성
  const getTwitterShareUrl = (imageUrl?: string) => {
    const text = creatorName
      ? `${templateTitle || '페어리'}로 만든 나의 작품!\n\n틀 by @${creatorName}\n#페어리 #Pairy`
      : `페어리로 만든 나의 작품!\n\n#페어리 #Pairy`
    const url = 'https://pairy.app'
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  }

  const handleExport = async () => {
    if (!canvasRef.current) {
      setError('캔버스를 찾을 수 없습니다.')
      return
    }

    // 내보내기 횟수 체크
    if (remainingExports <= 0) {
      setError('이번 달 내보내기 횟수를 모두 사용했습니다. 프리미엄으로 업그레이드하세요!')
      return
    }

    try {
      setIsExporting(true)
      setError(null)

      // 실제 적용할 스케일 (무료 사용자는 1x만 가능)
      const actualScale = canExportHighRes ? scale : 1

      // 워터마크 설정 (무료 사용자는 항상 워터마크 포함)
      let watermarkOption
      if (hasWatermark) {
        // 무료 사용자: 강제 워터마크
        watermarkOption = {
          text: '페어리에서 만듦 - pairy.app',
          position: 'bottom-right' as const,
          opacity: 0.8,
          fontSize: 16,
          color: '#888888',
        }
      } else if (includeCredit && creatorName) {
        // 프리미엄 사용자: 선택적 크레딧
        watermarkOption = {
          text: getCreditText(),
          position: 'bottom-right' as const,
          opacity: 0.7,
          fontSize: 14,
          color: '#666666',
        }
      }

      const blob = await captureElementAsImage(canvasRef.current, {
        format,
        quality,
        scale: actualScale,
        backgroundColor: format === 'jpg' ? '#FFFFFF' : undefined,
        watermark: watermarkOption,
      })

      const filename = generateFilename(title, format, actualScale)
      downloadBlob(blob, filename)

      // 내보내기 횟수 증가
      incrementExports()

      // 트위터 공유 옵션이 선택된 경우
      if (shareToTwitter) {
        window.open(getTwitterShareUrl(), '_blank', 'width=600,height=400')
      }

      onClose()
    } catch (err) {
      console.error('Export failed:', err)
      setError('내보내기에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsExporting(false)
    }
  }

  const formatOptions: { value: ExportFormat; label: string; icon: typeof Image }[] = [
    { value: 'png', label: 'PNG', icon: Image },
    { value: 'jpg', label: 'JPG', icon: FileImage },
    { value: 'webp', label: 'WebP', icon: FileImage },
  ]

  const qualityOptions: { value: ExportQuality; label: string }[] = [
    { value: 'low', label: '낮음' },
    { value: 'medium', label: '중간' },
    { value: 'high', label: '높음' },
    { value: 'max', label: '최대' },
  ]

  const scaleOptions = [
    { value: 1, label: '1x (기본)' },
    { value: 2, label: '2x (고해상도)' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[20px] shadow-xl p-6 z-50 animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">이미지 내보내기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            파일 형식
          </label>
          <div className="grid grid-cols-3 gap-3">
            {formatOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFormat(option.value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  format === option.value
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <option.icon
                  className={cn(
                    'w-6 h-6',
                    format === option.value ? 'text-primary-400' : 'text-gray-400'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    format === option.value ? 'text-primary-700' : 'text-gray-600'
                  )}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quality Selection (for JPG/WebP) */}
        {format !== 'png' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              품질
            </label>
            <div className="grid grid-cols-4 gap-2">
              {qualityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setQuality(option.value)}
                  className={cn(
                    'py-2 px-3 rounded-lg text-sm font-medium transition-all',
                    quality === option.value
                      ? 'bg-primary-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scale Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            해상도
          </label>
          <div className="grid grid-cols-2 gap-3">
            {scaleOptions.map((option) => {
              const isLocked = option.value === 2 && !canExportHighRes
              return (
                <button
                  key={option.value}
                  onClick={() => !isLocked && setScale(option.value)}
                  disabled={isLocked}
                  className={cn(
                    'py-3 px-4 rounded-xl text-sm font-medium transition-all relative',
                    isLocked
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : scale === option.value
                      ? 'bg-primary-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {option.label}
                  {isLocked && (
                    <Lock className="w-3 h-3 absolute top-1 right-1 text-gray-400" />
                  )}
                </button>
              )
            })}
          </div>
          {!canExportHighRes && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Crown className="w-3 h-3 text-primary-400" />
              고해상도 내보내기는 프리미엄 기능이에요
            </p>
          )}
        </div>

        {/* Export Limit Info */}
        {limits.exportsPerMonth !== Infinity && (
          <div className={cn(
            'mb-6 p-3 rounded-xl border',
            remainingExports <= 1
              ? 'bg-red-50 border-red-200'
              : remainingExports <= 3
              ? 'bg-amber-50 border-amber-200'
              : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">이번 달 남은 내보내기</span>
              <span className={cn(
                'text-sm font-bold',
                remainingExports <= 1 ? 'text-red-600' :
                remainingExports <= 3 ? 'text-amber-600' : 'text-gray-900'
              )}>
                {remainingExports}회
              </span>
            </div>
            {remainingExports <= 3 && (
              <a
                href="/premium"
                className="text-xs text-primary-500 hover:underline mt-1 inline-block"
              >
                프리미엄으로 무제한 내보내기 →
              </a>
            )}
          </div>
        )}

        {/* Watermark Notice for Free Users */}
        {hasWatermark && (
          <div className="mb-6 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
              <span>무료 플랜에서는 워터마크가 포함돼요</span>
            </p>
            <a
              href="/premium"
              className="text-xs text-primary-500 hover:underline mt-1 inline-block"
            >
              워터마크 제거하기 →
            </a>
          </div>
        )}

        {/* Creator Options */}
        {creatorName && (
          <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AtSign className="w-4 h-4 text-primary-400" />
              크리에이터 옵션
            </h3>

            {/* 크레딧 포함 토글 */}
            <label className="flex items-center justify-between cursor-pointer mb-3">
              <div>
                <span className="text-sm text-gray-700">틀 크레딧 포함</span>
                <p className="text-xs text-gray-500">이미지에 제작자 정보가 표시돼요</p>
              </div>
              <button
                type="button"
                onClick={() => setIncludeCredit(!includeCredit)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  includeCredit ? 'bg-primary-400' : 'bg-gray-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    includeCredit ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </label>

            {/* 트위터 공유 토글 */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                <div>
                  <span className="text-sm text-gray-700">트위터에 공유</span>
                  <p className="text-xs text-gray-500">다운로드 후 트윗 창이 열려요</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareToTwitter(!shareToTwitter)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  shareToTwitter ? 'bg-[#1DA1F2]' : 'bg-gray-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    shareToTwitter ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </label>

            {/* 크레딧 미리보기 */}
            {includeCredit && (
              <div className="mt-3 pt-3 border-t border-primary-100">
                <p className="text-xs text-gray-500 mb-1">크레딧 미리보기:</p>
                <p className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded">
                  {getCreditText()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-error-light rounded-xl">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button
            className="flex-1"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                내보내는 중...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                내보내기
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
