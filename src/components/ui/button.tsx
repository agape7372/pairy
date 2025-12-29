'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  asChild?: boolean
  /** 귀여운 인터랙션 효과 활성화 (기본값: true) */
  cute?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, asChild = false, cute = true, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    // 기본 스타일: 뿅뿅 반짝 인터랙션 포함
    const baseStyles = `
      inline-flex items-center justify-center
      font-semibold rounded-full
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `

    // 귀여운 인터랙션 스타일
    const cuteStyles = cute && !disabled ? `
      transition-all duration-200 ease-out
      hover:translate-y-[-2px] hover:shadow-md
      active:translate-y-0 active:scale-[0.98]
    ` : 'transition-all duration-200'

    const variants = {
      primary: cn(
        'bg-primary-400 text-white focus:ring-primary-300',
        cute && !disabled && 'hover:bg-primary-500 hover:shadow-[0_4px_16px_rgba(255,180,180,0.4)]'
      ),
      secondary: cn(
        'bg-primary-200 text-gray-700 focus:ring-primary-200',
        cute && !disabled && 'hover:bg-primary-300 hover:shadow-[0_4px_12px_rgba(255,217,217,0.5)]'
      ),
      accent: cn(
        'bg-accent-400 text-white focus:ring-accent-300',
        cute && !disabled && 'hover:bg-accent-500 hover:shadow-[0_4px_16px_rgba(180,230,230,0.4)]'
      ),
      ghost: cn(
        'bg-transparent text-gray-700 focus:ring-primary-200',
        cute && !disabled && 'hover:bg-primary-100'
      ),
      outline: cn(
        'bg-transparent border-2 border-accent-400 text-accent-700 focus:ring-accent-200',
        cute && !disabled && 'hover:bg-accent-100 hover:border-accent-500'
      ),
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-8 py-3.5 text-base',
    }

    // When asChild is true, we can't add loading spinner as it requires a single child
    const renderChildren = () => {
      if (asChild) {
        return children
      }
      return (
        <>
          {isLoading && (
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {children}
        </>
      )
    }

    return (
      <Comp
        ref={ref}
        className={cn(baseStyles, cuteStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {renderChildren()}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button }
