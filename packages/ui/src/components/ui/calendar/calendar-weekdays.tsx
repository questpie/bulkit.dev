import { cn } from '@bulkit/ui/lib'

type CalendarWeekdaysProps = {
  className?: {
    wrapper?: string
    weekDay?: string
  }
}

export function CalendarWeekdays({ className }: CalendarWeekdaysProps) {
  return (
    <div className={cn('grid grid-cols-7 gap-1 w-full text-sm', className?.wrapper)}>
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className={cn('text-center', className?.weekDay)}>
          {day}
        </div>
      ))}
    </div>
  )
}
