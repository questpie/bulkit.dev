'use client'

import type * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Button } from '@bulkit/ui/components/ui/button'
import { useAtom } from 'jotai'
import { currentDateAtom } from './calendar.atoms'
import { addMonths, setMonth } from 'date-fns'

interface CalendarControlProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  className?: string
}

export function CalendarControlPrevTrigger({ asChild, className, ...props }: CalendarControlProps) {
  const [currentDate, setCurrentDate] = useAtom(currentDateAtom)
  const Comp = asChild ? Slot : Button

  return (
    <Comp
      variant='outline'
      className={className}
      onClick={() => setCurrentDate(addMonths(currentDate, -1))}
      {...props}
    >
      {props.children ?? 'Previous'}
    </Comp>
  )
}

export function CalendarControlNextTrigger({ asChild, className, ...props }: CalendarControlProps) {
  const [currentDate, setCurrentDate] = useAtom(currentDateAtom)
  const Comp = asChild ? Slot : Button

  return (
    <Comp
      variant='outline'
      className={className}
      onClick={() => setCurrentDate(addMonths(currentDate, 1))}
      {...props}
    >
      {props.children ?? 'Next'}
    </Comp>
  )
}

export function CalendarControlTodayTrigger({
  asChild,
  className,
  ...props
}: CalendarControlProps) {
  const [, setCurrentDate] = useAtom(currentDateAtom)
  const Comp = asChild ? Slot : Button

  return (
    <Comp
      variant='outline'
      className={className}
      onClick={() => setCurrentDate(new Date())}
      {...props}
    >
      {props.children ?? 'Today'}
    </Comp>
  )
}
