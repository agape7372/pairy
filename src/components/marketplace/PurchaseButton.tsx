'use client'

import { useState } from 'react'
import { ShoppingCart, Download, Loader2, Check, Lock } from 'lucide-react'
import { Button } from '@/components/ui'
import { usePurchase, formatPrice } from '@/hooks/usePurchase'
import { cn } from '@/lib/utils/cn'
import type { PricingType } from '@/stores/marketplaceStore'

interface PurchaseButtonProps {
  template: {
    id: string
    title: string
    preview: string
    creatorId: string
    creatorName: string
    price: number
    pricingType: PricingType
  }
  onPurchaseComplete?: () => void
  onUseTemplate?: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullWidth?: boolean
}

export function PurchaseButton({
  template,
  onPurchaseComplete,
  onUseTemplate,
  size = 'md',
  className,
  fullWidth = false,
}: PurchaseButtonProps) {
  const { isPurchasing, hasPurchased, purchaseTemplate, error } = usePurchase(template)
  const [showSuccess, setShowSuccess] = useState(false)

  const handlePurchase = async () => {
    const result = await purchaseTemplate()
    if (result) {
      setShowSuccess(true)
      onPurchaseComplete?.()
      setTimeout(() => setShowSuccess(false), 2000)
    }
  }

  const handleUse = () => {
    onUseTemplate?.()
  }

  // 이미 구매한 경우
  if (hasPurchased) {
    return (
      <div className={cn('flex flex-col gap-2', fullWidth && 'w-full', className)}>
        <Button
          onClick={handleUse}
          size={size}
          className={cn('gap-2', fullWidth && 'w-full')}
        >
          <Download className="w-4 h-4" />
          이 틀 사용하기
        </Button>
        <span className="text-xs text-center text-gray-500 flex items-center justify-center gap-1">
          <Check className="w-3 h-3 text-green-500" />
          구매 완료
        </span>
      </div>
    )
  }

  // 무료인 경우
  if (template.pricingType === 'free') {
    return (
      <Button
        onClick={handleUse}
        size={size}
        className={cn('gap-2', fullWidth && 'w-full', className)}
      >
        <Download className="w-4 h-4" />
        무료로 사용하기
      </Button>
    )
  }

  // 구매 성공 표시
  if (showSuccess) {
    return (
      <Button
        size={size}
        className={cn('gap-2 bg-green-500 hover:bg-green-600', fullWidth && 'w-full', className)}
        disabled
      >
        <Check className="w-4 h-4" />
        구매 완료!
      </Button>
    )
  }

  // 구매 버튼
  return (
    <div className={cn('flex flex-col gap-2', fullWidth && 'w-full', className)}>
      <Button
        onClick={handlePurchase}
        size={size}
        disabled={isPurchasing}
        className={cn('gap-2', fullWidth && 'w-full')}
      >
        {isPurchasing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            구매 중...
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4" />
            {formatPrice(template.price, template.pricingType)}에 구매하기
          </>
        )}
      </Button>
      {error && (
        <span className="text-xs text-center text-red-500">{error}</span>
      )}
      <span className="text-xs text-center text-gray-400">
        데모 모드: 실제 결제 없이 구매됩니다
      </span>
    </div>
  )
}

// 잠금 표시 (미구매 프리미엄 컨텐츠)
interface LockedContentProps {
  price: number
  pricingType: PricingType
  onPurchaseClick?: () => void
}

export function LockedContent({ price, pricingType, onPurchaseClick }: LockedContentProps) {
  return (
    <div
      onClick={onPurchaseClick}
      className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl cursor-pointer hover:bg-black/60 transition-colors"
    >
      <Lock className="w-8 h-8 text-white mb-2" />
      <span className="text-white font-medium">
        {formatPrice(price, pricingType)}
      </span>
      <span className="text-white/70 text-sm mt-1">클릭하여 구매</span>
    </div>
  )
}

// 작은 가격 버튼 (카드에서 사용)
interface PriceButtonProps {
  price: number
  pricingType: PricingType
  hasPurchased: boolean
  onClick?: () => void
  size?: 'sm' | 'md'
}

export function PriceButton({
  price,
  pricingType,
  hasPurchased,
  onClick,
  size = 'sm',
}: PriceButtonProps) {
  if (hasPurchased) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 font-medium text-green-600',
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}>
        <Check className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        보유
      </span>
    )
  }

  if (pricingType === 'free') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 font-medium text-green-600 hover:text-green-700 transition-colors',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}
      >
        무료
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 transition-colors',
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}
    >
      {formatPrice(price, pricingType)}
    </button>
  )
}
