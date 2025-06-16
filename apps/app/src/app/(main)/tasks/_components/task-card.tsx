'use client'

import { Card, CardContent } from '@bulkit/ui/components/ui/card'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Calendar, Clock, MessageCircle, Paperclip } from 'lucide-react'
import { format } from 'date-fns'
import type { TaskListItem } from '@bulkit/shared/modules/tasks/tasks.schemas'

interface TaskCardProps {
  task: TaskListItem
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

export function TaskCard({ task }: TaskCardProps) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = dueDate && dueDate < new Date()

  return (
    <Card className='cursor-pointer hover:shadow-md transition-shadow'>
      <CardContent className='p-4'>
        <div className='space-y-3'>
          {/* Title and Priority */}
          <div className='flex items-start justify-between'>
            <h3 className='font-medium text-sm leading-tight line-clamp-2'>{task.title}</h3>
            <Badge variant='secondary' className={`ml-2 text-xs ${priorityColors[task.priority]}`}>
              {task.priority}
            </Badge>
          </div>

          {/* Description */}
          {task.description && (
            <p className='text-xs text-gray-600 line-clamp-2'>{task.description}</p>
          )}

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {task.labels.slice(0, 3).map((label) => (
                <Badge
                  key={label.id}
                  variant='outline'
                  className='text-xs'
                  style={{
                    borderColor: label.color,
                    color: label.color,
                  }}
                >
                  {label.name}
                </Badge>
              ))}
              {task.labels.length > 3 && (
                <Badge variant='outline' className='text-xs'>
                  +{task.labels.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Due Date */}
          {dueDate && (
            <div className='flex items-center text-xs text-gray-500'>
              <Calendar className='h-3 w-3 mr-1' />
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {format(dueDate, 'MMM d')}
              </span>
            </div>
          )}

          {/* Estimated Time */}
          {task.estimatedHours && (
            <div className='flex items-center text-xs text-gray-500'>
              <Clock className='h-3 w-3 mr-1' />
              <span>{task.estimatedHours}h estimated</span>
            </div>
          )}

          {/* Footer */}
          <div className='flex items-center justify-between pt-2'>
            {/* Assignee */}
            <div className='flex items-center'>
              {task.assignedToUser ? (
                <Avatar className='h-6 w-6'>
                  <AvatarImage src={`https://avatar.vercel.sh/${task.assignedToUser.email}`} />
                  <AvatarFallback className='text-xs'>
                    {task.assignedToUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className='h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center'>
                  <span className='text-xs text-gray-500'>?</span>
                </div>
              )}
            </div>

            {/* Task indicators */}
            <div className='flex items-center space-x-2'>
              {task.subtasksCount && task.subtasksCount > 0 && (
                <div className='flex items-center text-xs text-gray-500'>
                  <Paperclip className='h-3 w-3 mr-1' />
                  <span>{task.subtasksCount}</span>
                </div>
              )}

              {/* Comment count placeholder */}
              <div className='flex items-center text-xs text-gray-500'>
                <MessageCircle className='h-3 w-3 mr-1' />
                <span>0</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
