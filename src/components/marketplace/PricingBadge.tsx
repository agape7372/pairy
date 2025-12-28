'use client'

import { Coins, Gift, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { PricingType } from '@/stores/marketplaceStore'

interface PricingBadgeProps {
  pricingType: PricingType
  price: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
}

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export function PricingBadge({
  pricingType,
  price,
  size = 'md',
  className,
}: PricingBadgeProps) {
  if (pricingType === 'free') {
    return (
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          'bg-green-100 text-green-700',
          sizeStyles[size],
          className
        )}
      >
        <Gift className={iconSizes[size]} />
        무료
      </span>
    )
  }

  if (pricingType === 'credit') {
    return (
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          'bg-amber-100 text-amber-700',
          sizeStyles[size],
          className
        )}
      >
        <Coins className={iconSizes[size]} />
        {price} 크레딧
      </span>
    )
  }

  // paid
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        'bg-primary-100 text-primary-700',
        sizeStyles[size],
        className
      )}
    >
      <CreditCard className={iconSizes[size]} />
      {price.toLocaleString()}원
    </span>
  )
}

// 더 간단한 가격 표시 (텍스트만)
interface PriceTextProps {
  pricingType: PricingType
  price: number
  className?: string
}

export function PriceText({ pricingType, price, className }: PriceTextProps) {
  if (pricingType === 'free') {
    return <span className={cn('text-green-600 font-semibold', className)}>무료</span>
  }

  if (pricingType === 'credit') {
    return <span className={cn('text-amber-600 font-semibold', className)}>{price} 크레딧</span>
  }

  return <span className={cn('text-primary-600 font-semibold', className)}>{price.toLocaleString()}원</span>
}
