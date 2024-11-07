import type { DateSelection } from './calendar-atoms'
import { isWithinInterval, isSameDay, parseISO, isValid } from 'date-fns'

export function isDateSelected(
  date: Date,
  selected: DateSelection | DateSelection[] | undefined
): boolean {
  if (!selected) return false

  if (Array.isArray(selected)) {
    return selected.some((selection) => isDateInSelection(date, selection))
  }

  return isDateInSelection(date, selected)
}

export function isDateInSelection(date: Date, selection: DateSelection): boolean {
  if (selection instanceof Date) {
    return isSameDay(date, selection)
  }

  return isWithinInterval(date, {
    start: selection.from,
    end: selection.to,
  })
}

export function isDateDisabled(
  date: Date,
  {
    minDate,
    maxDate,
    exclude,
  }: {
    minDate?: Date
    maxDate?: Date
    exclude?: DateSelection | DateSelection[]
  }
): boolean {
  if (minDate && date < minDate) return true
  if (maxDate && date > maxDate) return true
  if (exclude) return isDateSelected(date, exclude)
  return false
}

export function createDateRange(from: Date, to: Date): { from: Date; to: Date } {
  return {
    from: from < to ? from : to,
    to: from < to ? to : from,
  }
}
