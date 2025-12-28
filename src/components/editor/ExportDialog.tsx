'use client'

import { useState } from 'react'
import { X, Download, Image, FileImage, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import {
  type ExportFormat,
  type ExportQuality,
  captureElementAsImage,
  downloadBlob,
  generateFilename,
} from '@/lib/utils/export'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  canvasRef: React.RefObject<HTMLElement>
  title: string
  isPremium?: boolean
}

export function ExportDialog({
  isOpen,
  onClose,
  canvasRef,
  title,
  isPremium = false,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [quality, setQuality] = useState<ExportQuality>('high')
  const [scale, setScale] = useState<number>(1)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleExport = async () => {
    if (!canvasRef.current) {
      setError('캔버스를 찾을 수 없습니다.')
      return
    }

    try {
      setIsExporting(true)
      setError(null)

      const blob = await captureElementAsImage(canvasRef.current, {
        format,
        quality,
        scale,
        backgroundColor: format === 'jpg' ? '#FFFFFF' : undefined,
        // 워터마크 없음 - 무료/프리미엄 모두 깨끗한 이미지 제공
      })

      const filename = generateFilename(title, format, scale)
      downloadBlob(blob, filename)
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
            {scaleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setScale(option.value)}
                className={cn(
                  'py-3 px-4 rounded-xl text-sm font-medium transition-all',
                  scale === option.value
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

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
