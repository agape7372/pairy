'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  onUpload: (file: File) => Promise<string | null>
  className?: string
  placeholder?: string
  shape?: 'square' | 'circle'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
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
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

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
      handleFile(file)
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
    </div>
  )
}
