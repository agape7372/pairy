'use client'

import { useState, useCallback } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Button } from './button'
import { Modal } from './modal'
import { getCroppedFile } from '@/lib/utils/cropImage'

interface AvatarCropModalProps {
  /** 크롭할 원본 이미지(objectURL 또는 dataURL) */
  imageSrc: string
  /** 원본 파일명(확장자 유지용) */
  fileName?: string
  /** 크롭 형태 — 프로필=원형, 그 외 사각 */
  cropShape?: 'round' | 'rect'
  onCancel: () => void
  onCropped: (file: File) => void
}

/**
 * 프로필/캐릭터 사진 크롭·줌·위치조정 모달.
 * 확대(슬라이더)+드래그(마우스/터치)로 원 안에 맞춘 뒤 정사각 512px 로 잘라 반환.
 */
export function AvatarCropModal({
  imageSrc,
  fileName = 'avatar.png',
  cropShape = 'round',
  onCancel,
  onCropped,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaPixels, setAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setAreaPixels(croppedAreaPixels)
  }, [])

  const handleApply = useCallback(async () => {
    if (!areaPixels) return
    setIsProcessing(true)
    try {
      const file = await getCroppedFile(imageSrc, areaPixels, fileName)
      onCropped(file)
    } catch {
      setIsProcessing(false)
    }
  }, [areaPixels, imageSrc, fileName, onCropped])

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!isProcessing) onCancel()
      }}
      ariaLabel="프로필 사진 편집"
      closeOnBackdrop={false}
      showClose={false}
      className="max-w-md p-0 rounded-3xl overflow-hidden shadow-xl"
    >
        <div className="px-6 pt-5 pb-3">
          <h2 className="text-lg font-bold text-gray-900">사진 편집</h2>
          <p className="mt-0.5 text-xs text-gray-500">확대하고 드래그해 위치를 맞춰요.</p>
        </div>

        {/* 크롭 영역 */}
        <div className="relative h-72 w-full bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* 줌 슬라이더 */}
        <div className="flex items-center gap-3 px-6 py-4">
          <span className="text-xs text-gray-400" aria-hidden>축소</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="확대"
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-pink-400"
          />
          <span className="text-xs text-gray-400" aria-hidden>확대</span>
        </div>

        {/* 액션 */}
        <div className="flex gap-2 border-t border-gray-100 px-6 py-4">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isProcessing}>
            취소
          </Button>
          <Button className="flex-1" onClick={handleApply} disabled={isProcessing || !areaPixels}>
            {isProcessing ? '처리 중…' : '적용'}
          </Button>
        </div>
    </Modal>
  )
}
