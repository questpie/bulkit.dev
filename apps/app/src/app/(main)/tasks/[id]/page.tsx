import { apiServer } from '@bulkit/app/api/api.server'
import { TaskDetailContent } from '@bulkit/app/app/(main)/tasks/[id]/_components/task-detail-content'
import { notFound } from 'next/navigation'

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const task = await apiServer.tasks({ id }).get()

  if (!task.data) {
    return notFound()
  }

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 mt-6'>
        <TaskDetailContent task={task.data.data} />
      </div>
    </div>
  )
}
