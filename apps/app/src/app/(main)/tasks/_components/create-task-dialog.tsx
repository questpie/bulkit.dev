'use client'

import { TASK_PRIORITY, TASK_STATUS } from '@bulkit/shared/constants/db.constants'
import type { Label } from '@bulkit/shared/modules/labels/labels.schemas'
import { CreateTaskSchema, type CreateTaskInput } from '@bulkit/shared/modules/tasks/tasks.schemas'
import { Button } from '@bulkit/ui/components/ui/button'
import { Calendar } from '@bulkit/ui/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@bulkit/ui/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@bulkit/ui/components/ui/form'
import { Input } from '@bulkit/ui/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@bulkit/ui/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import useControllableState from '@bulkit/ui/hooks/use-controllable-state'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { useCreateTaskMutation } from '../tasks.queries'
import { LabelSelector } from '@bulkit/app/app/(main)/labels/_components/label-selector'

interface CreateTaskDialogProps {
  children: React.ReactNode
  defaultStatus?: (typeof TASK_STATUS)[number]
  open?: boolean
  onOpenChange?: (value: boolean) => void
}

export function CreateTaskDialog({
  children,
  defaultStatus = 'todo',
  open: openProp,
  onOpenChange,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: false,
    onChange: onOpenChange,
  })

  const [selectedLabels, setSelectedLabels] = React.useState<Label[]>([])
  const createTaskMutation = useCreateTaskMutation()

  const form = useForm<CreateTaskInput>({
    resolver: typeboxResolver(CreateTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: defaultStatus,
      priority: 'medium',
      dueDate: undefined,
      estimatedHours: undefined,
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    const taskData = {
      ...data,
      labelIds: selectedLabels.map((label) => label.id),
    }

    return toast.promise(
      createTaskMutation.mutateAsync(taskData).then(() => {
        form.reset()
        setSelectedLabels([])
        setOpen(false)
      }),
      {
        loading: 'Creating task...',
        success: 'Task created successfully!',
        error: 'Failed to create task',
      }
    )
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Title */}
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter task title' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Describe the task (optional)' rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Labels */}
            <div className='space-y-2'>
              <FormLabel>Labels</FormLabel>
              <LabelSelector
                selectedLabels={selectedLabels}
                onLabelsChange={setSelectedLabels}
                placeholder='Add labels to organize this task...'
              />
            </div>

            {/* Status and Priority */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='priority'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_PRIORITY.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due Date and Estimate */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='dueDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            className='w-full justify-start text-left font-normal'
                          >
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {field.value ? format(new Date(field.value), 'PPP') : 'Pick a date'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0'>
                        <Calendar
                          mode='single'
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='estimatedHours'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0'
                        min='0'
                        max='999'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number.parseInt(e.target.value) : undefined
                          )
                        }
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className='flex justify-end space-x-2 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={createTaskMutation.isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
