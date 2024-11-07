'use client'

import { AtomsProvider } from '@bulkit/ui/components/atoms-provider'
import useControllableState from '@bulkit/ui/hooks/use-controllable-state'
import { cn } from '@bulkit/ui/lib'
import { isSameDay } from 'date-fns'
import { useSetAtom } from 'jotai'
import * as React from 'react'
import type { DateRange } from 'react-day-picker'
import type { CalendarState, DateSelection } from './calendar-atoms'
import {
  currentDateAtom,
  eventsAtom,
  excludeAtom,
  maxDateAtom,
  minDateAtom,
  monthOffsetAtom,
  selectedAtom,
} from './calendar-atoms'

export type CalendarSelectionMode = 'single' | 'multiple' | 'range'
export type CalendarProps<TMode extends CalendarSelectionMode = 'single'> = {
  currentDate?: Date
  selected?: TMode extends 'multiple' ? Date[] : TMode extends 'single' ? Date : DateRange
  events?: CalendarState['events']
  exclude?: DateSelection | DateSelection[]
  minDate?: Date
  maxDate?: Date
  mode?: TMode
  onSelect?: TMode extends 'multiple'
    ? (selection: Date[]) => void
    : TMode extends 'single'
      ? (selection: Date) => void
      : (selection: DateRange) => void
  className?: {
    wrapper?: string
    container?: string
  }
}

export const CalendarContext = React.createContext<{
  mode: CalendarSelectionMode
  onSelect?: (selected: Date) => void
}>({
  mode: 'single',
})

export function Calendar<TMode extends CalendarSelectionMode = 'single'>({
  currentDate = new Date(),
  selected,
  events = [],
  exclude,
  minDate,
  maxDate,
  mode = 'single' as TMode,
  onSelect,
  className,
  children,
  ...props
}: React.PropsWithChildren<CalendarProps<TMode>>) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const atomValues = React.useMemo(
    () =>
      [
        [currentDateAtom, currentDate],
        [selectedAtom, selected],
        [eventsAtom, events],
        [excludeAtom, exclude],
        [minDateAtom, minDate],
        [maxDateAtom, maxDate],
        [monthOffsetAtom, 0],
      ] as const,
    []
  )

  return (
    <AtomsProvider atomValues={atomValues}>
      <CalendarManager mode={mode} onSelect={onSelect} selected={selected}>
        <div
          className={cn('flex w-full flex-col space-y-4', className?.wrapper, className)}
          {...props}
        >
          <div className={cn('space-y-4', className?.container)}>{children}</div>
        </div>
      </CalendarManager>
    </AtomsProvider>
  )
}

function CalendarManager<TMode extends CalendarSelectionMode = 'single'>({
  mode,
  children,
  selected,
  onSelect,
}: {
  mode: TMode
  selected?: TMode extends 'multiple' ? Date[] : TMode extends 'single' ? Date : DateRange
  onSelect?: TMode extends 'multiple'
    ? (selection: Date[]) => void
    : TMode extends 'single'
      ? (selection: Date) => void
      : (selection: DateRange) => void
  children: React.ReactNode
}) {
  const setAtomSelected = useSetAtom(selectedAtom)
  const [internalSelected, setInternalSelected] = useControllableState<
    DateSelection | Date[] | undefined
  >({
    defaultValue: selected as any,
    value: selected as any,
    onChange: (value) => {
      setAtomSelected(value)
    },
  })

  const [rangeStart, setRangeStart] = React.useState<Date | null>(null)

  const handleSelect = React.useCallback(
    (day: Date) => {
      let newSelection: DateSelection | DateSelection[] | undefined

      switch (mode) {
        case 'single': {
          newSelection = day
          break
        }
        case 'multiple': {
          const currentSelection = Array.isArray(internalSelected)
            ? internalSelected
            : internalSelected
              ? [internalSelected]
              : []

          const isCurrentlySelected = currentSelection.some((d) =>
            d instanceof Date ? isSameDay(d, day) : false
          )

          newSelection = isCurrentlySelected
            ? currentSelection.filter((d) => !isSameDay(d as Date, day))
            : [...currentSelection, day]
          break
        }
        case 'range': {
          if (!rangeStart) {
            setRangeStart(day)
            return
          }

          newSelection = { from: rangeStart, to: day }
          setRangeStart(null)
          break
        }
      }

      setInternalSelected(newSelection as any)
      onSelect?.(newSelection! as any)
    },
    [mode, internalSelected, rangeStart, onSelect, setInternalSelected]
  )

  return (
    <CalendarContext.Provider
      value={{
        mode,
        onSelect: handleSelect,
      }}
    >
      {children}
    </CalendarContext.Provider>
  )
}
