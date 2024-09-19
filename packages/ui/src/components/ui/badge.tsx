import type * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@bulkit/ui/lib'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground  hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground  hover:bg-destructive/80',
        warning:
          'border-transparent bg-warning/20 text-warning border-warning  hover:bg-warning/90 hover:text-warning-foreground',
        outline: 'text-foreground',
      },

      size: {
        sm: 'text-[11px] px-2 py-0.25',
        default: 'text-xs',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { Badge, badgeVariants }
