import { cn } from '@/lib/utils/cn'

interface TagProps {
  children: React.ReactNode
  variant?: 'primary' | 'accent' | 'outline' | 'gray' | 'new' | 'premium'
  className?: string
  /** 인터랙티브 모드 (호버 시 톡 튀어오름) */
  interactive?: boolean
}

export function Tag({ children, variant = 'primary', className, interactive = false }: TagProps) {
  const variants = {
    primary: 'bg-primary-200 text-gray-700',
    accent: 'bg-accent-200 text-accent-700',
    outline: 'bg-white border border-gray-300 text-gray-600',
    gray: 'bg-gray-100 text-gray-600',
    // 새로운 뿅뿅 스타일
    new: 'bg-gradient-to-r from-primary-400 to-accent-400 text-white badge-sparkle',
    premium: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white badge-sparkle',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium',
        variants[variant],
        interactive && 'transition-all duration-200 ease-out cursor-pointer hover:translate-y-[-2px] hover:scale-105 hover:shadow-sm',
        className
      )}
    >
      {children}
    </span>
  )
}
