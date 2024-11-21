'use client'
import * as React from 'react'
import { cn } from '@bulkit/ui/lib'
import { useAtomValue } from 'jotai'
import { currentDateAtom, monthOffsetAtom } from './calendar.atoms'
import { format, addMonths } from 'date-fns'

type CalendarMonthLabelProps = {
  className?: string
}

export function CalendarMonthLabel({ className }: CalendarMonthLabelProps) {
  const offset = useAtomValue(monthOffsetAtom)
  const currentDate = useAtomValue(currentDateAtom)
  const date = addMonths(currentDate, offset)
  return <div className={cn('font-semibold', className)}>{format(date, 'MMMM yyyy')}</div>
}
