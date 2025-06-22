import { apiServer } from '@bulkit/app/api/api.server'
import { fetchServerOrganization } from '@bulkit/app/app/(main)/organizations/_utils/fetch-server-organization'
import { redirect } from 'next/navigation'
import { MembersTable } from './_components/members-table'

export default async function MembersPage() {
  const organization = await fetchServerOrganization()
  if (!organization) {
    redirect('/onboarding/organization')
  }

  const organizationMembers = await apiServer.organizations({ id: organization.id }).members.get({
    query: {
      cursor: 0,
      limit: 25,
    },
  })

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col'>
        <h4 className='text-xl font-bold'>Members</h4>
        <p className='text-sm text-muted-foreground'>
          Manage your organization members and their roles
        </p>
      </div>

      <MembersTable
        initialMembers={organizationMembers.data ?? { items: [], nextCursor: null }}
        organizationId={organization.id}
      />
    </div>
  )
}
