'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { AvatarCropModal } from './avatar-crop-modal'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  onUpload: (file: File) => Promise<string | null>
  className?: string
  placeholder?: string
  shape?: 'square' | 'circle'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  /** 업로드 전 크롭·줌·위치조정 모달을 띄운다(프로필/캐릭터 사진용) */
  enableCrop?: boolean
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  className,
  placeholder = '이미지 업로드',
  shape = 'square',
  size = 'md',
  disabled = false,
  enableCrop = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  // 크롭 대상 원본(objectURL). 설정되면 크롭 모달이 뜬다.
  const [cropState, setCropState] = useState<{ src: string; name: string } | null>(null)

  // 크롭 모달이 닫힐 때 objectURL 해제(메모리 누수 방지)
  useEffect(() => {
    return () => { if (cropState) URL.revokeObjectURL(cropState.src) }
  }, [cropState])

  const sizes = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  }

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setIsUploading(true)

    try {
      const url = await onUpload(file)
      if (url) {
        onChange(url)
      } else {
        setError('업로드에 실패했습니다.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }, [onUpload, onChange])

  // 파일 선택 → 크롭 활성 시 모달, 아니면 바로 업로드
  const acceptFile = useCallback((file: File) => {
    if (enableCrop) {
      setError(null)
      setCropState({ src: URL.createObjectURL(file), name: file.name })
    } else {
      handleFile(file)
    }
  }, [enableCrop, handleFile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      acceptFile(file)
    }
    // 같은 파일 재선택 허용
    e.target.value = ''
  }

  const handleCropped = useCallback((file: File) => {
    setCropState((prev) => {
      if (prev) URL.revokeObjectURL(prev.src)
      return null
    })
    handleFile(file)
  }, [handleFile])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      acceptFile(file)
    } else {
      setError('이미지 파일만 업로드할 수 있습니다.')
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          sizes[size],
          'relative cursor-pointer transition-all',
          'border-2 border-dashed',
          'flex items-center justify-center',
          shape === 'circle' ? 'rounded-full' : 'rounded-xl',
          dragActive
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-300 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/50',
          disabled && 'opacity-50 cursor-not-allowed',
          value && 'border-solid border-transparent'
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-1 text-primary-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs">업로드 중...</span>
          </div>
        ) : value ? (
          <>
            <img
              src={value}
              alt=""
              className={cn(
                'w-full h-full object-cover',
                shape === 'circle' ? 'rounded-full' : 'rounded-xl'
              )}
            />
            {!disabled && (
              <button
                onClick={handleRemove}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            {size === 'sm' ? (
              <ImageIcon className="w-5 h-5" />
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-xs text-center px-2">{placeholder}</span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {cropState && (
        <AvatarCropModal
          imageSrc={cropState.src}
          fileName={cropState.name}
          cropShape={shape === 'circle' ? 'round' : 'rect'}
          onCancel={() => setCropState((prev) => {
            if (prev) URL.revokeObjectURL(prev.src)
            return null
          })}
          onCropped={handleCropped}
        />
      )}
    </div>
  )
}
