import { cn } from '@questpie/transactional/style-utils'
import { Button } from '@react-email/components'
import type * as React from 'react'

type Props = React.ComponentProps<typeof Button> & {
  className?: string
}
export function MailButton(props: Props) {
  return (
    <Button
      {...props}
      className={cn(
        'bg-brand inline-block text-brand-foreground min-w-[100px] text-center text-sm font-bold px-4 rounded-lg  py-3',
        props.className
      )}
    >
      {props.children}
    </Button>
  )
}
