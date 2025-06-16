'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { Type } from '@sinclair/typebox'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@bulkit/app/api/api.client'
import { useDebouncedValue } from '@bulkit/ui/hooks/use-debounce'
import type { TaskWithRelations } from '@bulkit/shared/modules/tasks/tasks.schemas'
import {
  TASK_STATUS,
  TASK_PRIORITY,
  type TaskStatus,
  type TaskPriority,
} from '@bulkit/shared/constants/db.constants'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@bulkit/ui/components/ui/card'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { RichTextEditor } from '@bulkit/ui/components/ui/rich-text-editor'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@bulkit/ui/components/ui/form'
import { Input } from '@bulkit/ui/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { Calendar, Clock, User, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { TASKS_QUERY_KEY } from '../../tasks.queries'

const TaskFormSchema = Type.Object({
  title: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
  status: Type.String(),
  priority: Type.String(),
  dueDate: Type.Optional(Type.String()),
  estimatedHours: Type.Optional(Type.Number()),
})

type TaskFormData = {
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  estimatedHours?: number
}

type TaskDetailContentProps = {
  task: TaskWithRelations
}

export function TaskDetailContent({ task }: TaskDetailContentProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const form = useForm<TaskFormData>({
    resolver: typeboxResolver(TaskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || undefined,
      estimatedHours: task.estimatedHours || undefined,
    },
  })

  const values = useWatch({ control: form.control })
  const debouncedValues = useDebouncedValue(values, 1000)

  const updateMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const res = await apiClient.tasks({ id: task.id }).put({
        ...data,
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority,
      })
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: () => {
      setLastSaved(new Date())
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
    },
  })

  // Auto-save functionality
  useEffect(() => {
    if (form.formState.isDirty && !form.formState.isSubmitting) {
      updateMutation.mutate(debouncedValues as TaskFormData)
    }
  }, [debouncedValues, form.formState.isDirty, form.formState.isSubmitting, updateMutation])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'review':
        return 'bg-purple-100 text-purple-800'
      case 'done':
        return 'bg-green-100 text-green-800'
      case 'blocked':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className='flex flex-col h-full bg-gray-50'>
      <div className='bg-white border-b border-gray-200 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button variant='ghost' size='sm' onClick={() => router.back()}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back
            </Button>
            <div className='flex items-center space-x-2'>
              <Badge className={getStatusColor(task.status)}>{task.status.replace('_', ' ')}</Badge>
              <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
            </div>
          </div>

          <div className='flex items-center space-x-4'>
            {lastSaved && (
              <span className='text-sm text-gray-500'>Saved {lastSaved.toLocaleTimeString()}</span>
            )}
            {updateMutation.isPending && <span className='text-sm text-blue-600'>Saving...</span>}
            <Button
              onClick={() => updateMutation.mutate(form.getValues())}
              disabled={updateMutation.isPending}
            >
              <Save className='h-4 w-4 mr-2' />
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-auto'>
        <div className='max-w-5xl mx-auto p-6'>
          <Form {...form}>
            <form className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='lg:col-span-2 space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Details</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <FormField
                        control={form.control}
                        name='title'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder='Task title' />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='description'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <RichTextEditor
                                content={field.value}
                                onChange={field.onChange}
                                placeholder='Add a detailed description...'
                                mentions={{
                                  items: [
                                    { id: '1', label: 'Task #123', type: 'task' },
                                    { id: '2', label: 'Post ABC', type: 'post' },
                                  ],
                                }}
                                className='min-h-[300px]'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Subtasks */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Subtasks ({task.subtasks.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2'>
                          {task.subtasks.map((subtask) => (
                            <div
                              key={subtask.id}
                              className='flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50'
                            >
                              <Badge className={getStatusColor(subtask.status)} variant='outline'>
                                {subtask.status}
                              </Badge>
                              <Link
                                href={`/tasks/${subtask.id}`}
                                className='flex-1 text-sm hover:text-blue-600'
                              >
                                {subtask.title}
                              </Link>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className='space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Properties</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <FormField
                        control={form.control}
                        name='status'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select status' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TASK_STATUS.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status.replace('_', ' ')}
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select priority' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TASK_PRIORITY.map((priority) => (
                                  <SelectItem key={priority} value={priority}>
                                    {priority}
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
                        name='dueDate'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date</FormLabel>
                            <FormControl>
                              <Input
                                type='datetime-local'
                                {...field}
                                value={
                                  field.value
                                    ? new Date(field.value).toISOString().slice(0, 16)
                                    : ''
                                }
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value ? new Date(e.target.value).toISOString() : ''
                                  )
                                }
                              />
                            </FormControl>
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
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value ? Number.parseInt(e.target.value) : undefined
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Task Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Information</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div className='flex items-center space-x-2 text-sm'>
                        <Calendar className='h-4 w-4 text-gray-500' />
                        <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                      </div>

                      {task.assignedToUser && (
                        <div className='flex items-center space-x-2 text-sm'>
                          <User className='h-4 w-4 text-gray-500' />
                          <span>Assigned to {task.assignedToUser.name}</span>
                        </div>
                      )}

                      {task.timeSpent && (
                        <div className='flex items-center space-x-2 text-sm'>
                          <Clock className='h-4 w-4 text-gray-500' />
                          <span>{task.timeSpent} minutes logged</span>
                        </div>
                      )}

                      {task.labels && task.labels.length > 0 && (
                        <div className='space-y-2'>
                          <span className='text-sm font-medium'>Labels</span>
                          <div className='flex flex-wrap gap-1'>
                            {task.labels.map((label) => (
                              <Badge
                                key={label.id}
                                variant='outline'
                                style={{
                                  backgroundColor: label.color + '20',
                                  borderColor: label.color,
                                }}
                              >
                                {label.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
