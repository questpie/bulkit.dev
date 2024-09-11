import { cn } from '@bulkit/ui/lib'
import { cva, type VariantProps } from 'class-variance-authority'
import { FaSpinner } from 'react-icons/fa'

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
  return <FaSpinner className={cn(spinnerVariants({ size, className }))} {...props} />
}

export { Spinner, spinnerVariants }
