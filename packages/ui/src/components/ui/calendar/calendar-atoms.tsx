import { atom } from 'jotai'

export type CalendarState = {
  currentDate: Date
  selected?: DateSelection | DateSelection[]
  events?: CalendarEvent[]
  exclude?: DateSelection | DateSelection[]
  minDate?: Date
  maxDate?: Date
}

export type CalendarEvent = {
  dateFrom: Date
  dateTo: Date
  identifier: string
}

export type DateSelection = Date | DateRange
export type DateRange = { from: Date; to: Date }

export const currentDateAtom = atom<Date>(new Date())
export const selectedAtom = atom<DateSelection | DateSelection[] | undefined>(undefined)
export const eventsAtom = atom<CalendarEvent[]>([])
export const excludeAtom = atom<DateSelection | DateSelection[] | undefined>(undefined)
export const minDateAtom = atom<Date | undefined>(undefined)
export const maxDateAtom = atom<Date | undefined>(undefined)
export const monthOffsetAtom = atom<number>(0)
