import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  /** 귀여운 포커스 효과 (반짝 글로우) */
  cute?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, cute = true, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 text-base',
          'bg-white border rounded-xl',
          'transition-all duration-200',
          'placeholder:text-gray-400',
          'focus:outline-none focus:border-transparent',
          // 에러 상태
          error && 'border-error focus:ring-2 focus:ring-error/30',
          // 기본 + 귀여운 포커스 효과
          !error && cute && `
            border-gray-200
            focus:ring-2 focus:ring-primary-200
            focus:shadow-[0_0_0_3px_rgba(255,217,217,0.3),0_0_12px_rgba(255,180,180,0.2)]
          `,
          // 귀여움 없는 기본
          !error && !cute && 'border-gray-200 focus:ring-2 focus:ring-primary-300',
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
