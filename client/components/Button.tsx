import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

const Button = ({ variant = 'primary', className, children, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(
        'cursor-pointer rounded-full px-8 py-3.5 text-sm font-semibold tracking-tight transition-all duration-200',
        variant === 'primary' &&
          'relative overflow-hidden border border-white/30 bg-black text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_10px_25px_-6px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_14px_30px_-6px_rgba(0,0,0,0.6)] active:translate-y-0 active:bg-white/5 active:shadow-[0_4px_10px_-4px_rgba(0,0,0,0.4)]',
        variant === 'secondary' &&
          'border border-white px-6 text-white/95 hover:text-white',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
