'use client'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from '@bulkit/ui/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  type DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import { cn } from '@bulkit/ui/lib'
import { createResponsiveComponent } from '@bulkit/ui/utils/responsive.utils'
import { type ComponentProps, forwardRef } from 'react'

// Custom components for desktop fallbacks
const DesktopHeader = forwardRef<HTMLDivElement, ComponentProps<'div'>>((props, ref) => {
  const { className, ...rest } = props
  return <div ref={ref} className={cn('px-4 py-2', className)} {...rest} />
})
DesktopHeader.displayName = 'DesktopHeader'

const DesktopFooter = forwardRef<HTMLDivElement, ComponentProps<'div'>>((props, ref) => {
  const { className, ...rest } = props
  return <div ref={ref} className={cn('px-4 py-2', className)} {...rest} />
})
DesktopFooter.displayName = 'DesktopFooter'

const DesktopClose = forwardRef<HTMLButtonElement, ComponentProps<'button'>>((props, ref) => {
  const { className, ...rest } = props
  return (
    <button
      ref={ref}
      className={cn('rounded-sm opacity-70 hover:opacity-100', className)}
      {...rest}
    />
  )
})
DesktopClose.displayName = 'DesktopClose'

// Main components
const ResponsiveDropdownMenu = createResponsiveComponent(
  'ResponsiveDropdownMenu',
  DropdownMenu,
  Drawer,
  true
)

const ResponsiveDropdownMenuTrigger = createResponsiveComponent(
  'ResponsiveDropdownMenuTrigger',
  DropdownMenuTrigger,
  DrawerTrigger
)

const ResponsiveDropdownMenuContent = createResponsiveComponent(
  'ResponsiveDropdownMenuContent',
  DropdownMenuContent,
  DrawerContent,
  false
)

const ResponsiveDropdownMenuHeader = createResponsiveComponent(
  'ResponsiveDropdownMenuHeader',
  DesktopHeader,
  DrawerHeader,
  false,
  {
    className: 'px-4 py-2 border-b',
  }
)

const ResponsiveDropdownMenuFooter = createResponsiveComponent(
  'ResponsiveDropdownMenuFooter',
  DesktopFooter,
  DrawerFooter,
  false,
  {
    className: 'px-4 py-2 border-t',
  }
)

const ResponsiveDropdownMenuClose = createResponsiveComponent(
  'ResponsiveDropdownMenuClose',
  DesktopClose,
  DrawerClose,
  false,
  {
    className:
      'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary',
  }
)

// Mobile-optimized components (unchanged)
type ItemProps = Omit<ComponentProps<'div'>, 'ref'> & {
  inset?: boolean
}

const ResponsiveDropdownMenuItem = forwardRef<HTMLDivElement, ItemProps>(
  (props: ItemProps, ref) => {
    const { className, inset, ...rest } = props

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
          'transition-colors hover:bg-accent/50 cursor-pointer focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          'md:font-medium',
          inset && 'pl-8',
          className
        )}
        {...rest}
      />
    )
  }
)
ResponsiveDropdownMenuItem.displayName = 'ResponsiveDropdownMenuItem'

const ResponsiveDropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof DropdownMenuSeparator>
>((props, ref) => {
  const { className, ...rest } = props

  return (
    <div
      ref={ref}
      className={cn(
        'h-px bg-muted my-1',
        'md:-mx-1', // Negative margin only on mobile
        className
      )}
      {...rest}
    />
  )
})
ResponsiveDropdownMenuSeparator.displayName = 'ResponsiveDropdownMenuSeparator'

type LabelProps = ComponentProps<typeof DropdownMenuLabel> & {
  inset?: boolean
}

const MobileDropdownMenuLabel = forwardRef<HTMLDivElement, LabelProps>((props, ref) => {
  const { className, inset, ...rest } = props

  return (
    <div
      ref={ref}
      className={cn(
        'px-2 py-1.5 text-sm font-semibold',
        'md:text-base', // Slightly larger text on mobile
        inset && 'pl-8',
        className
      )}
      {...rest}
    />
  )
})

MobileDropdownMenuLabel.displayName = 'MobileDropdownMenuLabel'

const ResponsiveDropdownMenuLabel = createResponsiveComponent(
  'ResponsiveDropdownMenuLabel',
  DropdownMenuLabel,
  MobileDropdownMenuLabel,
  false,
  {
    className: 'px-2 py-1.5 text-sm font-semibold text-muted-foreground',
  }
)

export {
  ResponsiveDropdownMenu,
  ResponsiveDropdownMenuClose,
  ResponsiveDropdownMenuContent,
  ResponsiveDropdownMenuFooter,
  ResponsiveDropdownMenuHeader,
  ResponsiveDropdownMenuItem,
  ResponsiveDropdownMenuLabel,
  ResponsiveDropdownMenuSeparator,
  ResponsiveDropdownMenuTrigger,
}
