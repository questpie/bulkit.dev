import { cn } from '@bulkit/ui/lib'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import * as React from 'react'

const inputVariants = cva(
  'flex h-9 w-full relative rounded-md overflow-hidden text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        outlined: 'border border-input bg-transparent',
        filled: 'bg-input',
      },
    },
    defaultVariants: {
      variant: 'outlined',
    },
  }
)
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'>,
    VariantProps<typeof inputVariants> {
  before?: React.ReactNode
  after?: React.ReactNode

  beforeOuter?: React.ReactNode
  afterOuter?: React.ReactNode

  className?: {
    wrapper?: string
    main?: string
  }
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, before, after, afterOuter, beforeOuter, ...props }, ref) => {
    return (
      <>
        {beforeOuter}
        <div
          className={cn(
            inputVariants({
              variant: props.variant,
              className: cn(
                props['aria-invalid'] && 'border-destructive text-destructive',
                className?.wrapper
              ),
            })
          )}
        >
          <span className='absolute inset-y-0 left-0 flex items-center'>{before}</span>
          <input
            type={type}
            className={cn(
              'h-full w-full flex-1 bg-transparent px-3 py-1 hover:outline-none focus:outline-none',
              'file:h-full file:cursor-pointer file:rounded-md file:border-none file:border-input file:bg-secondary file:outline-none file:hover:bg-secondary/90',
              !!before && 'pl-9 ',
              !!after && 'pr-9',
              className?.main
            )}
            ref={ref}
            {...props}
          />
          <span className='absolute inset-y-0 right-0 flex items-center'>{after}</span>
        </div>
        {afterOuter}
      </>
    )
  }
)
Input.displayName = 'Input'

export { Input }
