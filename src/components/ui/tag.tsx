import { cn } from '@/lib/utils/cn'

interface TagProps {
  children: React.ReactNode
  variant?: 'primary' | 'accent'
  className?: string
}

export function Tag({ children, variant = 'primary', className }: TagProps) {
  const variants = {
    primary: 'bg-primary-200 text-gray-700',
    accent: 'bg-accent-200 text-accent-700',
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
