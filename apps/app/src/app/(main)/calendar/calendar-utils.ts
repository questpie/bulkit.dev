import { getIsoDateString } from '@bulkit/shared/utils/date-utils'
import { endOfWeek, isValid, startOfMonth, startOfWeek } from 'date-fns'
import type { ReadonlyURLSearchParams } from 'next/navigation'

export function getCalendarParams(
  searchParamsProp: string | Record<string, string> | ReadonlyURLSearchParams
) {
  const searchParams = new URLSearchParams(searchParamsProp)

  let day = new Date(searchParams.get('day') ?? getIsoDateString(new Date()))
  let type = searchParams.get('type') ?? 'week'

  if (type !== 'week' && type !== 'month') {
    type = 'week'
  }

  if (!isValid(day)) {
    day = new Date()
  }

  return {
    dateFrom: type === 'week' ? startOfWeek(day) : startOfMonth(day),
    dateTo: endOfWeek(day),
    today: new Date(),
    currentDay: day,
  }
}
