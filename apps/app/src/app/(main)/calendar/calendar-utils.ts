import { getIsoDateString } from '@bulkit/shared/utils/date-utils'
import { endOfMonth, isValid, startOfMonth } from 'date-fns'
import type { ReadonlyURLSearchParams } from 'next/navigation'

export function getCalendarParams(
  searchParamsProp: string | Record<string, string> | ReadonlyURLSearchParams
) {
  const searchParams = new URLSearchParams(searchParamsProp)
  let day = new Date(searchParams.get('day') ?? getIsoDateString(new Date()))

  if (!isValid(day)) {
    day = new Date()
  }

  return {
    dateFrom: startOfMonth(day),
    dateTo: endOfMonth(day),
    today: new Date(),
    currentDay: day,
  }
}
