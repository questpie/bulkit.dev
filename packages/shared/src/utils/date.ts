import { format } from 'date-fns'

export function formatDateToMonthDayYear(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMM d, yyyy')
}
