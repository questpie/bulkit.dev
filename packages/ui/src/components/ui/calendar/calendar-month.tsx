'use client'

import { getIsoDateString } from '@bulkit/shared/utils/date'
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
import { atom, useAtomValue } from 'jotai'
import * as React from 'react'
import { CalendarContext } from './calendar'
import {
  currentDateAtom,
  eventsAtom,
  excludeAtom,
  maxDateAtom,
  minDateAtom,
  monthOffsetAtom,
  selectedAtom,
} from './calendar.atoms'
import { isDateDisabled, isDateSelected } from './calendar-utils'

type CalendarDayClassNames = {
  override?: string
  selected?: string
  disabled?: string
  today?: string
  outside?: string
  rangeFrom?: string
  rangeTo?: string
  rangeMiddle?: string
  text?: string
}

export type CalendarDayRenderProps = {
  isSelected: boolean
  isDisabled: boolean
  isToday: boolean
  isOutsideMonth: boolean
  isRangeStart: boolean
  isRangeEnd: boolean
  isRangeMiddle: boolean
}

export interface CalendarMonthProps {
  className?: {
    wrapper?: string
    day?: CalendarDayClassNames | ((props: CalendarDayRenderProps) => CalendarDayClassNames)
  }
}

export const createMonthEventsAtom = (date: Date) =>
  atom((get) => {
    const events = get(eventsAtom)
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)

    // Get all events that overlap with this month
    const monthEvents = events.filter((event) => {
      return !(event.dateTo < monthStart || event.dateFrom > monthEnd)
    })

    return monthEvents.reduce<Record<string, typeof events>>((acc, event) => {
      // For range events, get all dates in the range within this month
      const rangeStart = event.dateFrom < monthStart ? monthStart : event.dateFrom
      const rangeEnd = event.dateTo > monthEnd ? monthEnd : event.dateTo

      // Get all dates in the range
      const datesInRange = eachDayOfInterval({
        start: rangeStart,
        end: rangeEnd,
      })

      // Add event to each date in range
      for (const rangeDate of datesInRange) {
        const dateKey = getIsoDateString(new Date(rangeDate))
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(event)
      }

      return acc
    }, {})
  })

export function CalendarMonth({ className }: CalendarMonthProps) {
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
  const { onSelect, renderEvent } = React.useContext(CalendarContext)

  const monthEvents = useAtomValue(
    React.useMemo(() => createMonthEventsAtom(currentDate), [currentDate])
  )

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
    <div className={cn('grid grid-cols-7 gap-1', className?.wrapper)} data-month={monthOffset}>
      {days.map((day, index) => {
        const isOutside = !isSameMonth(day, currentDate)
        const isToday = isSameDay(day, new Date())
        const isDisabled = isDateDisabled(day, { minDate, maxDate, exclude })
        const isSelected = isDateSelected(day, selected)
        const eventsInADay = monthEvents[getIsoDateString(day)] ?? []

        const renderProps = {
          isSelected,
          isDisabled,
          isToday,
          isOutsideMonth: isOutside,
          isRangeStart: isRangeStart(day),
          isRangeEnd: isRangeEnd(day),
          isRangeMiddle: isRangeMiddle(day),
        }

        const resolvedClassNames =
          typeof className?.day === 'function' ? className.day(renderProps) : className?.day

        return (
          <button
            type='button'
            key={`${getIsoDateString(day)}-${index}`}
            data-date={getIsoDateString(day)}
            onClick={() => !isDisabled && onSelect?.(day)}
            onKeyDown={(e) => handleKeyDown(e, day)}
            disabled={isDisabled}
            tabIndex={0}
            className={cn(
              'h-10 w-10 rounded-md relative',
              'hover:bg-accent hover:text-accent-foreground',
              'focus:outline-ring',
              isOutside && cn('text-muted-foreground', resolvedClassNames?.outside),
              isToday && cn('bg-accent text-accent-foreground', resolvedClassNames?.today),
              isSelected && cn('bg-primary text-primary-foreground', resolvedClassNames?.selected),
              isDisabled && cn('opacity-50 cursor-not-allowed', resolvedClassNames?.disabled),
              renderProps.isRangeStart && resolvedClassNames?.rangeFrom,
              renderProps.isRangeEnd && resolvedClassNames?.rangeTo,
              renderProps.isRangeMiddle && resolvedClassNames?.rangeMiddle,
              resolvedClassNames?.override
            )}
          >
            <time dateTime={day.toISOString()} className={resolvedClassNames?.text}>
              {day.getDate()}
            </time>
            {renderEvent &&
              eventsInADay.map((event, eventIndex) => (
                <React.Fragment key={`${getIsoDateString(day)}-event-${eventIndex}`}>
                  {renderEvent(event)}
                </React.Fragment>
              ))}
          </button>
        )
      })}
    </div>
  )
}
