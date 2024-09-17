import { Button, type ButtonProps } from '@bulkit/ui/components/ui/button'
import type { PropsWithChildren, ReactNode } from 'react'

type HeaderProps = {
  title: string
  description?: string | ReactNode
}

export function Header(props: PropsWithChildren<HeaderProps>) {
  return (
    <header className='flex w-full justify-between items-center h-20 px-4 bg-background border-b border-border absolute top-0 left-0 right-0 z-20'>
      <div className='flex flex-col'>
        <h1 className='text-xl font-bold'>{props.title}</h1>
        {!!props.description && (
          <p className='text-xs text-muted-foreground'>{props.description}</p>
        )}
      </div>
      {props.children}
    </header>
  )
}

export function HeaderButton(
  props: Omit<ButtonProps, 'children'> & {
    icon: ReactNode
    label?: string
  }
) {
  return (
    <Button {...props} size='default' className='w-9 px-0 py-0 md:px-4 md:py-2 md:w-auto'>
      {props.icon}
      {props.label && <span className='hidden md:inline'>{props.label}</span>}
    </Button>
  )
}
