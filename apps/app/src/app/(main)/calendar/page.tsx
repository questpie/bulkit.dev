'use client'

import { Header } from '@bulkit/app/app/(main)/_components/header'
import {
  CalendarDates,
  CalendarHeader,
  WeekCalendar,
} from '@bulkit/app/app/(main)/calendar/_components/week-calendar'

export default function CalendarPage() {
  return (
    <>
      <Header title='Calendar' />
      <div className='w-full flex-1 h-full relative flex flex-col overflow-auto'>
        <WeekCalendar>
          <div className='bg-background top-0 sticky z-10'>
            <CalendarHeader />
          </div>
          <CalendarDates />
        </WeekCalendar>
      </div>
    </>
  )
}
