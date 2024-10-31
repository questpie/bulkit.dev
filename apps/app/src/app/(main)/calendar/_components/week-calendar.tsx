'use client'
import { cn } from '@bulkit/transactional/style-utils'
import {
  addDays,
  addMinutes,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameHour,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { nanoid } from 'nanoid'
import { createContext, useContext, useEffect, type ReactNode } from 'react'

interface WeekCalendarProps {
  currentDate?: Date
  slotDurationMinutes?: number
  renderSlot?: (opts: { date: Date }) => ReactNode
  children?: ReactNode
}

export const CalendarContext = createContext<{
  currentDate: Date
  today: Date
  slotDurationMinutes: number
}>({} as any)

export function WeekCalendar({
  currentDate = new Date(),
  slotDurationMinutes = 60,
  children,
}: WeekCalendarProps) {
  // on mount scroll to this dat
  useEffect(() => {
    const todayDay = currentDate.getDay()
    const todayHour = currentDate.getHours()
    const todayMinute =
      Math.floor(currentDate.getMinutes() / slotDurationMinutes) * slotDurationMinutes
    const todayElement = document.querySelector(
      `[data-day="${todayDay}"][data-hour="${todayHour}"][data-minutes="${todayMinute}"]`
    ) as HTMLDivElement
    if (todayElement) {
      todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentDate, slotDurationMinutes])
  return (
    <CalendarContext.Provider
      value={{ currentDate: currentDate, slotDurationMinutes, today: new Date() }}
    >
      {children}
    </CalendarContext.Provider>
  )
}

export function CalendarHeader() {
  const { currentDate } = useContext(CalendarContext)
  const weekStart = startOfWeek(currentDate)

  return (
    <div className='flex flex-row flex-1'>
      <div className='w-12' />
      {Array.from({ length: 7 }, (_, day) => {
        const weekDay = startOfDay(addDays(weekStart, day))
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={day}
            className='flex-1 text-sm font-bold border-b text-muted-foreground px-2 py-2 text-center'
          >
            {format(weekDay, 'EEE dd/MM')}
          </div>
        )
      })}
    </div>
  )
}

export function CalendarDates(props: {
  sidebarDisplayStep?: number
  renderSlot?: (opts: { slotStart: Date; slotEnd: Date }) => ReactNode
}) {
  const sidebarDisplayStep = props.sidebarDisplayStep ?? 2
  const { currentDate, today, slotDurationMinutes } = useContext(CalendarContext)
  const weekStart = startOfWeek(currentDate)
  const minutes = Array.from(
    { length: Math.floor(24 * (60 / slotDurationMinutes)) },
    (_, i) => i * slotDurationMinutes
  )

  return (
    <div className='flex-col relative flex'>
      {minutes.map((startOfSlotMinutes, i) => {
        const hour = Math.floor(startOfSlotMinutes / 60)
        const minute = startOfSlotMinutes - hour * 60
        const slotDate = addMinutes(weekStart, startOfSlotMinutes)

        const showText = i % sidebarDisplayStep === 0

        return (
          <div className='min-h-10 w-full  flex flex-row' key={startOfSlotMinutes}>
            <div
              className='text-xs border-r text-muted-foreground w-12 flex justify-center '
              key={`minutes-${startOfSlotMinutes}`}
            >
              {showText && format(slotDate, 'HH:mm')}
            </div>
            {Array.from({ length: 7 }).map((_, day) => {
              const weekDay = startOfDay(addDays(weekStart, day))
              const slotStart = addMinutes(weekDay, startOfSlotMinutes)
              const slotEnd = addMinutes(slotStart, slotDurationMinutes)
              const isPast = isBefore(slotEnd, today)

              return (
                <CalendarDate
                  key={`${day}-${startOfSlotMinutes}`}
                  day={day}
                  isMobile={true}
                  slotDurationMinutes={slotDurationMinutes}
                  startOfSlotMinutes={startOfSlotMinutes}
                  currentDate={currentDate}
                  today={today}
                  weekDay={weekDay}
                  renderSlot={props.renderSlot}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

type CalendarDateProps = {
  slotDurationMinutes: number
  weekDay: Date
  currentDate: Date
  today: Date
  startOfSlotMinutes: number
  day: number
  renderSlot?: (opts: { slotStart: Date; slotEnd: Date }) => ReactNode
  isMobile: boolean
}
function CalendarDate({
  slotDurationMinutes,
  currentDate,
  today,
  day,
  weekDay,
  startOfSlotMinutes,
  renderSlot,
  isMobile,
}: CalendarDateProps) {
  const hour = Math.floor(startOfSlotMinutes / 60)
  const minute = startOfSlotMinutes - hour * 60
  const slotDate = addMinutes(weekDay, startOfSlotMinutes)
  const isThisSlot =
    isSameDay(slotDate, today) &&
    isSameHour(slotDate, today) &&
    isAfter(today, slotDate) &&
    isBefore(today, addMinutes(slotDate, slotDurationMinutes))

  const content = renderSlot?.({
    slotStart: addMinutes(weekDay, startOfSlotMinutes),
    slotEnd: addMinutes(weekDay, startOfSlotMinutes + slotDurationMinutes),
  })

  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: <explanation>
      role='button'
      className={cn(
        'h-full flex flex-col flex-1 border-r border-b focus:ring-2 p-1  uring-ring outline-none',
        isThisSlot && 'border-primary border bg-primary/20'
      )}
      // onClick={() => onSlotClick?.(slotDate)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // onSlotClick?.(slotDate)
        }
        if (e.key.startsWith('Arrow')) {
          e.preventDefault()
          let newDate = slotDate
          switch (e.key) {
            case 'ArrowUp':
              newDate = addMinutes(slotDate, -slotDurationMinutes)
              break
            case 'ArrowDown':
              newDate = addMinutes(slotDate, slotDurationMinutes)
              break
            case 'ArrowLeft':
              newDate = addDays(slotDate, -1)
              break
            case 'ArrowRight':
              newDate = addDays(slotDate, 1)
              break
          }
          const newElement = document.querySelector(
            `[data-date="${format(newDate, 'yyyy-MM-dd-HH-mm')}"][data-mobile="${!isMobile}"]`
          ) as HTMLDivElement
          if (newElement) {
            newElement.focus()
          }
        }
      }}
      data-date={format(slotDate, 'yyyy-MM-dd-HH-mm')}
      data-day={day}
      data-minutes={minute}
      data-hour={hour}
      data-mobile={!isMobile}
    >
      <div className='flex-1'>{content}</div>
    </div>
  )
}
