import { Button } from '@bulkit/ui/components/ui/button'
import { Calendar, type CalendarProps } from '@bulkit/ui/components/ui/calendar'
import {
  ResponsivePopover,
  ResponsivePopoverContent,
  ResponsivePopoverTrigger,
} from '@bulkit/ui/components/ui/responsive-popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { Separator } from '@bulkit/ui/components/ui/separator'
import { cva, type VariantProps } from 'class-variance-authority'
import { setHours, setMinutes, startOfDay } from 'date-fns'
import type React from 'react'
import { useMemo, useState } from 'react'
import { isMatch } from 'react-day-picker'
import { LuCalendar, LuX } from 'react-icons/lu'

const datepickerVariants = cva(
  'flex h-9 w-full relative rounded-md overflow-hidden text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        outlined: 'border border-input bg-transparent',
        filled: 'bg-input',
      },
    },
    defaultVariants: {
      variant: 'outlined',
    },
  }
)

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'>,
    VariantProps<typeof datepickerVariants> {
  onValueChange: (value: Date | null) => void
  calendarProps?: CalendarProps
  showTime?: boolean
  placeholder?: string
}

export function DatePicker(props: DatePickerProps) {
  const values = useMemo(() => {
    if (!props.value) return null
    const value = props.value.toString()
    const isValid = new Date(value).toString() !== 'Invalid Date'
    if (!isValid) return null

    return {
      date: new Date(value),
      month: new Date(value),
      hours: String(new Date(value).getHours()),
      minutes: String(new Date(value).getMinutes()),
    }
  }, [props.value])

  const [month, setMonth] = useState<Date | undefined>(values?.month)

  const [hoursOpen, setHoursOpen] = useState(false)
  const [minutesOpen, setMinutesOpen] = useState(false)

  const hourFormat = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
    })
  }, [])

  const minuteFormat = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      minute: 'numeric',
    })
  }, [])

  //   get intl hours and minutes eg 12pm for eng 12:00 for deuths
  const hoursOptions = Array.from({ length: 24 }, (_, i) => ({
    value: String(i),
    label: hourFormat.format(setHours(startOfDay(new Date()), i)).padStart(2, '0'),
  }))
  const minutesOptions = Array.from({ length: 12 }, (_, i) => {
    const minute = i * 5
    return {
      value: String(minute),
      label: minuteFormat.format(setMinutes(startOfDay(new Date()), minute)).padStart(2, '0'),
    }
  })
  const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })

  return (
    <ResponsivePopover>
      <div className='rounded-md border-border flex overflow-hidden border bg-background'>
        <ResponsivePopoverTrigger asChild>
          <Button
            variant='ghost'
            disabled={props.disabled}
            className='w-auto rounded-none'
            suppressHydrationWarning
          >
            <LuCalendar className='h-4 w-4 ' />

            {values ? (
              dateFormatter.format(values.date)
            ) : (
              <span className='text-muted-foreground'>{props.placeholder ?? 'Select date'}</span>
            )}
          </Button>
        </ResponsivePopoverTrigger>
        {!!values && (
          <>
            <Separator orientation='vertical' />
            <Button
              variant='ghost'
              size='icon'
              className='rounded-none'
              onClick={() => {
                props.onValueChange(null)
              }}
            >
              <LuX className='h-4 w-4 ' />
            </Button>
          </>
        )}
      </div>
      <ResponsivePopoverContent className='w-auto p-0 bg-popover'>
        <Calendar
          captionLayout='dropdown-buttons'
          fromYear={new Date().getFullYear()}
          toYear={new Date().getFullYear() + 10}
          mode='single'
          selected={values?.date ? new Date(values.date) : undefined}
          month={month}
          className='w-full'
          // @ts-expect-error
          onSelect={(selectedDate) => {
            if (selectedDate) {
              return props.onValueChange(
                setHours(
                  setMinutes(selectedDate, Number(values?.minutes || 0)),
                  Number(values?.hours || 0)
                )
              )
            }

            props.onValueChange(null)
          }}
          onMonthChange={(newMonth: Date) => setMonth(newMonth)}
          initialFocus
          {...props.calendarProps}
        />
        {props.showTime && (
          <div className='p-3 border-t flex justify-between items-center'>
            <p className='text-sm'>{currentTimezone}</p>
            <div className='flex justify-center gap-1 items-center rounded-md border border-border '>
              <Select
                open={hoursOpen}
                onOpenChange={setHoursOpen}
                value={values?.hours}
                onValueChange={(value) => {
                  const currentDate = values?.date ?? new Date()
                  props.onValueChange(setHours(new Date(currentDate), Number(value)))
                  setMinutesOpen(true)
                }}
              >
                <SelectTrigger className='w-auto underline border-none' hideCaret>
                  <SelectValue placeholder='Hours' />
                </SelectTrigger>
                <SelectContent>
                  {hoursOptions.map((hour) => (
                    <SelectItem key={hour.value} value={hour.value}>
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>:</span>
              <Select
                open={minutesOpen}
                onOpenChange={setMinutesOpen}
                value={values?.minutes}
                onValueChange={(value) => {
                  const currentDate = values?.date ?? new Date()
                  props.onValueChange(setMinutes(new Date(currentDate), Number(value)))
                }}
              >
                <SelectTrigger className='w-auto underline border-none' hideCaret>
                  <SelectValue placeholder='Minutes' />
                </SelectTrigger>
                <SelectContent>
                  {minutesOptions.map((minute) => (
                    <SelectItem key={minute.value} value={minute.value}>
                      {minute.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </ResponsivePopoverContent>
    </ResponsivePopover>
  )
}
