'use client'

import { getIsoDateString } from '@bulkit/shared/utils/date-utils'
import { cn } from '@bulkit/ui/lib'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { useAtomValue } from 'jotai'
import * as React from 'react'
import { CalendarContext } from './calendar'
import {
  currentDateAtom,
  excludeAtom,
  maxDateAtom,
  minDateAtom,
  monthOffsetAtom,
  selectedAtom,
} from './calendar-atoms'
import { isDateDisabled, isDateSelected } from './calendar-utils'
export interface CalendarMonthProps {
  className?: string
  classNames?: {
    day?: string
    selected?: string
    disabled?: string
    today?: string
    outside?: string
    rangeFrom?: string
    rangeTo?: string
    rangeMiddle?: string
  }
}

export function CalendarMonth({ className, classNames }: CalendarMonthProps) {
  const baseDate = useAtomValue(currentDateAtom)
  const selected = useAtomValue(selectedAtom)
  const exclude = useAtomValue(excludeAtom)
  const minDate = useAtomValue(minDateAtom)
  const maxDate = useAtomValue(maxDateAtom)
  const monthOffset = useAtomValue(monthOffsetAtom)
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const currentDate = React.useMemo(
    () => addMonths(baseDate, monthOffset),
    [monthOffset, getIsoDateString(baseDate)]
  )
  const { onSelect } = React.useContext(CalendarContext)

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const isRangeStart = (day: Date) => {
    if (!selected || selected instanceof Date || Array.isArray(selected)) return false
    return isSameDay(day, selected.from)
  }

  const isRangeEnd = (day: Date) => {
    if (!selected || selected instanceof Date || Array.isArray(selected)) return false
    return isSameDay(day, selected.to)
  }

  const isRangeMiddle = (day: Date) => {
    if (!selected || selected instanceof Date || Array.isArray(selected)) return false
    return day > selected.from && day < selected.to
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, day: Date) => {
    const currentMonth = document.querySelector(`[data-month="${monthOffset}"]`)
    if (!currentMonth) return

    const allMonths = Array.from(document.querySelectorAll('[data-month]'))
    const currentMonthIndex = allMonths.indexOf(currentMonth)

    const daysCopy = [...days]
    const currentIndex = daysCopy.findIndex((d) => isSameDay(d, day))
    let nextIndex: number
    let targetMonth = monthOffset

    switch (event.key) {
      case 'ArrowLeft':
        if (currentIndex === 0 && currentMonthIndex > 0) {
          targetMonth = monthOffset - 1
          nextIndex = -1 // Signal to focus last day of previous month
        } else {
          nextIndex = currentIndex - 1
        }
        break
      case 'ArrowRight':
        if (currentIndex === daysCopy.length - 1 && currentMonthIndex < allMonths.length - 1) {
          targetMonth = monthOffset + 1
          nextIndex = 0 // Signal to focus first day of next month
        } else {
          nextIndex = currentIndex + 1
        }
        break
      case 'ArrowUp':
        if (currentIndex < 7 && currentMonthIndex > 0) {
          targetMonth = monthOffset - 1
          nextIndex = -7 // Signal to focus corresponding day in previous month
        } else {
          nextIndex = currentIndex - 7
        }
        break
      case 'ArrowDown':
        if (currentIndex >= daysCopy.length - 7 && currentMonthIndex < allMonths.length - 1) {
          targetMonth = monthOffset + 1
          nextIndex = 7 // Signal to focus corresponding day in next month
        } else {
          nextIndex = currentIndex + 7
        }
        break
      default:
        return
    }

    event.preventDefault()

    if (targetMonth !== monthOffset) {
      // Find the target month's first day button
      const targetMonthElement = document.querySelector(`[data-month="${targetMonth}"]`)
      if (!targetMonthElement) return

      const targetButtons = targetMonthElement.querySelectorAll('button[data-date]')
      let targetButton: HTMLButtonElement | null = null

      if (nextIndex === -1) {
        // Focus last day of previous month
        targetButton = targetButtons[targetButtons.length - 1] as HTMLButtonElement
      } else if (nextIndex === 0) {
        // Focus first day of next month
        targetButton = targetButtons[0] as HTMLButtonElement
      } else if (nextIndex === -7 || nextIndex === 7) {
        // Focus corresponding day in adjacent month
        const targetIndex =
          nextIndex === -7 ? targetButtons.length - 7 + (currentIndex % 7) : currentIndex % 7
        targetButton = targetButtons[targetIndex] as HTMLButtonElement
      }

      if (targetButton) {
        targetButton.focus()
      }
    } else if (nextIndex >= 0 && nextIndex < daysCopy.length) {
      const nextDay = daysCopy[nextIndex]!
      document
        .querySelector<HTMLButtonElement>(`[data-date="${getIsoDateString(nextDay)}"]`)
        ?.focus()
    }
  }

  return (
    <div className={cn('grid grid-cols-7 gap-1', className)} data-month={monthOffset}>
      {days.map((day, index) => {
        const isOutside = !isSameMonth(day, currentDate)
        const isToday = isSameDay(day, new Date())
        const isDisabled = isDateDisabled(day, { minDate, maxDate, exclude })
        const isSelected = isDateSelected(day, selected)

        return (
          <button
            type='button'
            key={getIsoDateString(day)}
            data-date={getIsoDateString(day)}
            onClick={() => !isDisabled && onSelect?.(day)}
            onKeyDown={(e) => handleKeyDown(e, day)}
            disabled={isDisabled}
            tabIndex={0}
            className={cn(
              'h-10 w-10 rounded-md relative',
              'hover:bg-accent hover:text-accent-foreground',
              'focus:outline-ring ',
              isOutside && cn('text-muted-foreground', classNames?.outside),
              isToday && cn('bg-accent text-accent-foreground', classNames?.today),
              isSelected && cn('bg-primary text-primary-foreground', classNames?.selected),
              isDisabled && cn('opacity-50 cursor-not-allowed', classNames?.disabled),
              isRangeStart(day) && classNames?.rangeFrom,
              isRangeEnd(day) && classNames?.rangeTo,
              isRangeMiddle(day) && classNames?.rangeMiddle,
              classNames?.day
            )}
          >
            <time dateTime={day.toISOString()}>{day.getDate()}</time>
          </button>
        )
      })}
    </div>
  )
}
