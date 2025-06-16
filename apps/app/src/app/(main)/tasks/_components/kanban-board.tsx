'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@bulkit/ui/components/ui/card'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Button } from '@bulkit/ui/components/ui/button'
import { Plus } from 'lucide-react'
import { TaskCard } from './task-card'
import { CreateTaskDialog } from './create-task-dialog'
import type { TaskListItem } from '@bulkit/shared/modules/tasks/tasks.schemas'
import { TASK_STATUS } from '@bulkit/shared/constants/db.constants'
import { useQuery } from '@tanstack/react-query'
import {
  kanbanQueryOptions,
  useUpdateTaskStatusMutation,
  useReorderTasksMutation,
} from '../tasks.queries'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { toast } from '@bulkit/ui/components/ui/sonner'
import type { TaskStatus } from '@bulkit/shared/constants/db.constants'

const statusConfig = {
  todo: {
    title: 'To Do',
    color: 'bg-gray-100',
    count: 0,
  },
  in_progress: {
    title: 'In Progress',
    color: 'bg-blue-100',
    count: 0,
  },
  review: {
    title: 'Review',
    color: 'bg-yellow-100',
    count: 0,
  },
  done: {
    title: 'Done',
    color: 'bg-green-100',
    count: 0,
  },
  blocked: {
    title: 'Blocked',
    color: 'bg-red-100',
    count: 0,
  },
} as const

// Sortable Task Card Component
function SortableTaskCard({ task }: { task: TaskListItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className='cursor-move'>
      <TaskCard task={task} />
    </div>
  )
}

// Droppable Column Component
function KanbanColumn({
  status,
  title,
  count,
  tasks,
}: {
  status: TaskStatus
  title: string
  count: number
  tasks: TaskListItem[]
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div className='flex-shrink-0 w-80'>
      <Card
        className={`h-full flex flex-col transition-colors ${isOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
      >
        <CardHeader className='pb-4'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-medium flex items-center space-x-2'>
              <span>{title}</span>
              <Badge variant='secondary' className='text-xs'>
                {count}
              </Badge>
            </CardTitle>

            <CreateTaskDialog defaultStatus={status}>
              <Button variant='ghost' size='sm'>
                <Plus className='h-4 w-4' />
              </Button>
            </CreateTaskDialog>
          </div>
        </CardHeader>

        <CardContent className='flex-1 pt-0' ref={setNodeRef}>
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-3 min-h-32'>
              {tasks.map((task) => (
                <SortableTaskCard key={task.id} task={task} />
              ))}

              {tasks.length === 0 && (
                <div className='text-center py-8 text-gray-500 text-sm'>
                  {isOver ? (
                    <span className='text-blue-600 font-medium'>Drop task here</span>
                  ) : (
                    `No tasks in ${title.toLowerCase()}`
                  )}
                </div>
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  )
}

export function KanbanBoard() {
  const kanbanQuery = useQuery(kanbanQueryOptions())
  const updateStatusMutation = useUpdateTaskStatusMutation()
  const reorderTasksMutation = useReorderTasksMutation()

  const [activeTask, setActiveTask] = useState<TaskListItem | null>(null)

  const tasksByStatus = kanbanQuery.data?.columns || {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
    blocked: [],
  }

  // Update counts
  const statusWithCounts = Object.fromEntries(
    TASK_STATUS.map((status) => [
      status,
      {
        ...statusConfig[status],
        count: tasksByStatus[status]?.length || 0,
      },
    ])
  ) as typeof statusConfig

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const taskId = String(active.id)

    // Find the task being dragged
    const task = Object.values(tasksByStatus)
      .flat()
      .find((t) => t.id === taskId)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = String(active.id)
    const overId = String(over.id)

    // Find the task and its current status
    const task = Object.values(tasksByStatus)
      .flat()
      .find((t) => t.id === taskId)
    if (!task) return

    // Determine the new status
    let newStatus: TaskStatus = task.status

    // Check if dropped over a status column
    if (TASK_STATUS.includes(overId as TaskStatus)) {
      newStatus = overId as TaskStatus
    } else {
      // Dropped over another task - find that task's status
      const targetTask = Object.values(tasksByStatus)
        .flat()
        .find((t) => t.id === overId)
      if (targetTask) {
        newStatus = targetTask.status
      }
    }

    // Only update if status changed
    if (newStatus !== task.status) {
      updateStatusMutation.mutate(
        {
          taskId,
          status: newStatus,
        },
        {
          onSuccess: () => {
            toast.success(`Task moved to ${statusWithCounts[newStatus].title}`)
          },
          onError: (error) => {
            toast.error('Failed to move task. Please try again.')
            console.error('Error moving task:', error)
          },
        }
      )
    }
  }

  if (kanbanQuery.isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='text-lg text-gray-500'>Loading tasks...</div>
      </div>
    )
  }

  if (kanbanQuery.error) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='text-lg text-red-500'>Error loading tasks</div>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className='flex space-x-6 h-full overflow-x-auto'>
        {TASK_STATUS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            title={statusWithCounts[status].title}
            count={statusWithCounts[status].count}
            tasks={tasksByStatus[status] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className='opacity-90 rotate-3 scale-105'>
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
