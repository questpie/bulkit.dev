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
import { createContext, useContext, useEffect, type PropsWithChildren, type ReactNode } from 'react'

interface WeekCalendarProps {
  today?: Date
  slotDurationMinutes?: number
  renderSlot?: (opts: { date: Date }) => ReactNode
  children?: ReactNode
}

export const CalendarContext = createContext<{ today: Date; slotDurationMinutes: number }>(
  {} as any
)

export function WeekCalendar({
  today = new Date(),
  slotDurationMinutes = 60,
  children,
}: WeekCalendarProps) {
  // on mount scroll to this dat
  useEffect(() => {
    const todayDay = today.getDay()
    const todayHour = today.getHours()
    const todayMinute = Math.floor(today.getMinutes() / slotDurationMinutes) * slotDurationMinutes
    const todayElement = document.querySelector(
      `[data-day="${todayDay}"][data-hour="${todayHour}"][data-minutes="${todayMinute}"]`
    ) as HTMLDivElement
    if (todayElement) {
      todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [today, slotDurationMinutes])
  return (
    <CalendarContext.Provider value={{ today, slotDurationMinutes }}>
      {children}
    </CalendarContext.Provider>
  )
}

export function CalendarHeader() {
  const { today } = useContext(CalendarContext)
  const weekStart = startOfWeek(today)

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

export function CalendarDates(props: { sidebarDisplayStep?: number }) {
  const sidebarDisplayStep = props.sidebarDisplayStep ?? 2
  const { today, slotDurationMinutes } = useContext(CalendarContext)
  const weekStart = startOfWeek(today)
  const minutes = Array.from(
    { length: Math.floor(24 * (60 / slotDurationMinutes)) },
    (_, i) => i * slotDurationMinutes
  )

  return (
    <div className='hidden flex-row relative md:flex'>
      <div className='w-12 flex flex-col'>
        {minutes.map((startOfSlotMinutes, i) => {
          const hour = Math.floor(startOfSlotMinutes / 60)
          const minute = startOfSlotMinutes - hour * 60
          const slotDate = addMinutes(weekStart, startOfSlotMinutes)

          const showText = i % sidebarDisplayStep === 0

          return (
            <div
              className='text-xs text-muted-foreground  h-16 flex justify-center '
              key={`minutes-${startOfSlotMinutes}`}
            >
              {showText && format(slotDate, 'HH:mm')}
            </div>
          )
        })}
      </div>
      {Array.from({ length: 7 }, (_, day) => {
        const weekDay = startOfDay(addDays(weekStart, day))

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <div key={day} className='flex border-l flex-col flex-1'>
            {minutes.map((startOfSlotMinutes) => {
              return (
                <CalendarDate
                  day={day}
                  isMobile={true}
                  slotDurationMinutes={slotDurationMinutes}
                  startOfSlotMinutes={startOfSlotMinutes}
                  today={today}
                  weekDay={weekDay}
                  key={startOfSlotMinutes}
                  // renderSlot={}
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
  today: Date
  startOfSlotMinutes: number
  day: number
  renderSlot?: (opts: { date: Date }) => ReactNode
  isMobile: boolean
}
function CalendarDate({
  slotDurationMinutes,
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

  return (
    <div
      key={startOfSlotMinutes}
      // biome-ignore lint/a11y/useSemanticElements: <explanation>
      role='button'
      className={cn(
        'h-16 flex flex-col border-b focus:ring-2 p-2  uring-ring outline-none',
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
      {/* <div className='text-xs text-muted-foreground'>{format(slotDate, 'HH:mm')}</div> */}
      <div className='flex-1'>{renderSlot?.({ date: slotDate })}</div>
    </div>
  )
}
