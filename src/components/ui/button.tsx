'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, asChild = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    const baseStyles = `
      inline-flex items-center justify-center
      font-semibold rounded-full
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `

    const variants = {
      primary: 'bg-primary-400 text-white hover:bg-primary-500 focus:ring-primary-300',
      secondary: 'bg-primary-200 text-gray-700 hover:bg-primary-300 focus:ring-primary-200',
      accent: 'bg-accent-400 text-white hover:bg-accent-500 focus:ring-accent-300',
      ghost: 'bg-transparent text-gray-700 hover:bg-primary-200 focus:ring-primary-200',
      outline: 'bg-transparent border-2 border-accent-400 text-accent-700 hover:bg-accent-200 focus:ring-accent-200',
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
        className={cn(baseStyles, variants[variant], sizes[size], className)}
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
