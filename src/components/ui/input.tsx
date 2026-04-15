import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm',
          'shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]',
          'transition-all duration-200 ease-out',
          'placeholder:text-muted-foreground/60',
          'focus-glow',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
