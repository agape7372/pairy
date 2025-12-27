import { cn } from '@/lib/utils/cn'

interface TagProps {
  children: React.ReactNode
  variant?: 'primary' | 'accent' | 'outline' | 'gray'
  className?: string
}

export function Tag({ children, variant = 'primary', className }: TagProps) {
  const variants = {
    primary: 'bg-primary-200 text-gray-700',
    accent: 'bg-accent-200 text-accent-700',
    outline: 'bg-white border border-gray-300 text-gray-600',
    gray: 'bg-gray-100 text-gray-600',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
