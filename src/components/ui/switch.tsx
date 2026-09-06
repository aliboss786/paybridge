import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface SwitchProps extends HTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function Switch({ checked: controlledChecked, defaultChecked = false, onCheckedChange, className, ...props }: SwitchProps) {
  const isChecked = controlledChecked !== undefined ? controlledChecked : defaultChecked
  return (
    <button
      role="switch"
      aria-checked={isChecked}
      className={cn(
        'inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
        isChecked ? 'bg-primary' : 'bg-input',
        className,
      )}
      onClick={() => onCheckedChange?.(!isChecked)}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
          isChecked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}
