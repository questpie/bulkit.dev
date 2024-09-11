import { Icon } from '@iconify-icon/react'
import { cn } from '@questpie/ui/lib'
import { cva, type VariantProps } from 'class-variance-authority'

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      md: 'h-4 w-4',
      sm: 'h-3 w-3',
      lg: 'h-5 w-5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string
}

const Spinner = ({ className, size, ...props }: SpinnerProps) => {
  return (
    <Icon icon='lucide:loader-2' className={cn(spinnerVariants({ size, className }))} {...props} />
  )
}

export { Spinner, spinnerVariants }
