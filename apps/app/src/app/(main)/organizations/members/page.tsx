import { apiServer } from '@bulkit/app/api/api.server'
import { MembersTable } from './_components/members-table'
import { ORGANIZATION_COOKIE_NAME } from '@bulkit/app/app/(main)/organizations/organizations.constants'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function MembersPage() {
  const selectedOrganizationId = (await cookies()).get(ORGANIZATION_COOKIE_NAME)?.value

  if (!selectedOrganizationId) {
    redirect('/onboarding/organization')
  }

  const organizationMembers = await apiServer
    .organizations({ id: selectedOrganizationId })
    .members.get({
      query: {
        cursor: 0,
        limit: 25,
      },
    })

  if (!organizationMembers.data) {
    redirect('/onboarding/organization')
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col'>
        <h4 className='text-xl font-bold'>Members</h4>
        <p className='text-sm text-muted-foreground'>
          Manage your organization members and their roles
        </p>
      </div>

      <MembersTable
        initialMembers={organizationMembers.data}
        organizationId={selectedOrganizationId}
      />
    </div>
  )
}
