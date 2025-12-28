import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 text-base',
          'bg-white border rounded-xl',
          'transition-all duration-200',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:border-transparent',
          error
            ? 'border-error focus:ring-error/30'
            : 'border-gray-200 focus:ring-primary-300',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
