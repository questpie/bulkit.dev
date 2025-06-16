import { Button } from '@bulkit/ui/components/ui/button'
import { Plus } from 'lucide-react'
import { KanbanBoard } from './_components/kanban-board'
import { TasksHeader } from './_components/tasks-header'
import { TaskStats } from './_components/tasks-stats'
import { CreateTaskDialog } from './_components/create-task-dialog'

export default async function TasksPage() {
  return (
    <div className='flex flex-col h-full'>
      <TasksHeader />

      <div className='flex-1 flex flex-col p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Tasks</h1>
            <p className='text-gray-600'>Manage your tasks and projects</p>
          </div>

          <CreateTaskDialog>
            <Button>
              <Plus className='h-4 w-4 mr-2' />
              Create Task
            </Button>
          </CreateTaskDialog>
        </div>

        <TaskStats />

        <div className='flex-1 mt-6'>
          <KanbanBoard />
        </div>
      </div>
    </div>
  )
}
