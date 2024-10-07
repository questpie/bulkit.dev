'use client'

import { buttonVariants } from '@bulkit/ui/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { cn } from '@bulkit/ui/lib'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import * as React from 'react'
import { DayPicker } from 'react-day-picker'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3 w-full', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full',
        month: 'space-y-4 w-full',
        caption: 'flex flex-col gap-2 w-full relative',
        caption_dropdowns: 'flex flex-row gap-0 z-10 justify-center flex-1 mx-10',
        caption_label: 'hidden',
        nav: 'absolute top-0 w-full flex items-center justify-between gap-1',
        nav_button: cn(buttonVariants({ variant: 'outline' }), 'h-8 w-8 bg-transparent p-0'),
        nav_button_previous: 'relative',
        nav_button_next: 'relative',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex w-full',
        head_cell: 'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2 ',
        cell: cn(
          'relative p-0 text-center w-10 h-10 text-sm focus-within:relative focus-within:z-20 flex-1'
          // props.mode === 'range'
          //   ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
          //   : '[&:has([aria-selected])]:rounded-md'
        ),
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'w-full rounded-sm h-full aria-selected:opacity-100 border border-transparent focus:ring-ring'
        ),
        day_range_start:
          'bg-primary/80 !rounded-r-none text-primary-foreground font-bold hover:text-primary-foreground  hover:bg-primary/70',
        day_range_end:
          'bg-primary/80 !rounded-l-none text-primary-foreground font-bold hover:text-primary-foreground  hover:bg-primary/70',
        day_selected:
          'bg-primary/20 border-primary !border-primary text-primary !font-bold hover:text-primary hover:bg-primary/20',
        day_today: 'bg-accent text-accent-foreground',
        day_outside: 'text-muted-foreground  h-auto',
        day_disabled: 'text-muted-foreground  h-auto',
        day_range_middle:
          'bg-primary/20 z-10 !rounded-none text-primary font-bold hover:text-primary hover:bg-primary/10',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeftIcon className='h-4 w-4' />,
        IconRight: ({ ...props }) => <ChevronRightIcon className='h-4 w-4' />,
        Dropdown: (dropdownProps) => {
          if (!dropdownProps.children) {
            return null
          }
          const options = React.Children.toArray(dropdownProps.children)
            .filter(React.isValidElement)
            .map((child) => {
              const props = child.props as any
              return {
                label: typeof props.children === 'string' ? props.children : String(props.value),
                value: props.value as number,
              }
            })

          const selectedOption = options.find((option) => option.value === dropdownProps.value)
          return (
            // <MultiSelect
            //   onChange={(value) => {
            //     if (!value) return
            //     props.onChange?.({ target: { value: value.value } } as any)
            //   }}
            //   value={options.find((option) => option.value === props.value) ?? null}
            //   options={options}
            //   className='w-full'
            // />

            <Select
              value={String(dropdownProps.value)}
              onValueChange={(v) => {
                dropdownProps.onChange?.({ target: { value: v } } as any)
              }}
            >
              <SelectTrigger
                className={cn(
                  dropdownProps.className,
                  'border-0 shadow-none hover:text-foreground/90 gap-1 justify-center w-auto focus-within:ring-0 px-0 h-8 underline',
                  dropdownProps.name === 'months' ? 'mr-2' : ''
                )}
                // hideCaret
              >
                <SelectValue>{selectedOption?.label}</SelectValue>
              </SelectTrigger>

              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
