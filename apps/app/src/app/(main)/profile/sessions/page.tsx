import { apiServer } from '@bulkit/app/api/api.server'
import {
  RemoveAllSessions,
  SessionsTable,
} from '@bulkit/app/app/(main)/profile/_components/sessions-table'

export default async function ProfileSessionsPage() {
  const sessionsResp = await apiServer.auth.session.list.get()

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-row items-center justify-between'>
        <div className='flex flex-col'>
          <h4 className='text-xl font-bold'>Sessions</h4>
          <p className='text-sm text-muted-foreground'>Manage your active sessions and devices</p>
        </div>

        {/* <OrganizationSendInviteDialog>
          <OrganizationSendInviteDialogTrigger asChild>
            <HeaderButton icon={<PiPaperPlane />} variant='secondary' label='Invite Members' />
          </OrganizationSendInviteDialogTrigger>
        </OrganizationSendInviteDialog> */}
        <RemoveAllSessions />
      </div>

      <SessionsTable sessions={sessionsResp.data ?? []} />
    </div>
  )
}
