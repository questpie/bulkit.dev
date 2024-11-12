import { Button, type ButtonProps } from '@bulkit/ui/components/ui/button'
import { cn } from '@bulkit/ui/lib'
import Link from 'next/link'
import { Fragment, type PropsWithChildren, type ReactNode } from 'react'

type HeaderProps = {
  beforeTitle?: ReactNode
  title: string | ReactNode
  afterTitle?: ReactNode
  description?: string | ReactNode
}

export function Header(props: PropsWithChildren<HeaderProps>) {
  return (
    <header className='flex w-full justify-between items-center h-20 px-4 bg-background border-b border-border absolute top-0 left-0 right-0 z-10'>
      <div className='flex flex-row items-center gap-4'>
        {props.beforeTitle}
        <div className='flex flex-col gap-1'>
          <h1 className='text-xl font-bold'>{props.title}</h1>
          {!!props.description && (
            <p className='text-xs text-muted-foreground'>{props.description}</p>
          )}
        </div>
        {props.afterTitle}
      </div>
      {props.children}
    </header>
  )
}

export function HeaderButton(
  props: Omit<ButtonProps, 'children'> & {
    icon: ReactNode
    href?: string
    label?: string
  }
) {
  const Wrapper = props.href ? Link : Fragment

  const wrapperProps = props.href ? { href: props.href as any } : ({} as any)

  return (
    <Button
      {...props}
      size='default'
      className={cn('w-9 px-0 py-0 md:px-4 md:py-2 md:w-auto', props.className)}
      asChild={!!props.href}
    >
      <Wrapper {...wrapperProps}>
        {props.icon}
        {props.label && <span className='hidden md:inline'>{props.label}</span>}
      </Wrapper>
    </Button>
  )
}
