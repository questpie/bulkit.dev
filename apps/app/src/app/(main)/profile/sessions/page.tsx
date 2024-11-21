import { apiServer } from '@bulkit/app/api/api.server'
import { RemoveAllSessionsButton } from '@bulkit/app/app/(main)/profile/_components/remove-all-sessions-button'
import { SessionsTable } from '@bulkit/app/app/(main)/profile/_components/sessions-table'

export default async function ProfileSessionsPage() {
  const initialSessions = await apiServer.auth.session.list.get({
    query: {
      limit: 25,
      cursor: 0,
    },
  })

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-row items-center justify-between'>
        <div className='flex flex-col'>
          <h4 className='text-xl font-bold'>Sessions</h4>
          <p className='text-sm text-muted-foreground'>Manage your active sessions and devices</p>
        </div>
        <RemoveAllSessionsButton />
      </div>

      <SessionsTable initialSessions={initialSessions.data ?? []} />
    </div>
  )
}
