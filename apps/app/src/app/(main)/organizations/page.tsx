import { apiServer } from '@bulkit/app/api/api.server'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { OrganizationMembersTable } from '@bulkit/app/app/(main)/organizations/_components/organization-members-table'
import {
  OrganizationSendInviteDialog,
  OrganizationSendInviteDialogTrigger,
} from '@bulkit/app/app/(main)/organizations/_components/send-invitation-dialog'
import { ORGANIZATION_COOKIE_NAME } from '@bulkit/app/app/(main)/organizations/organizations.constants'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PiPaperPlane } from 'react-icons/pi'

export default async function OrganizationsPage() {
  const selectedOrganizationId = (await cookies()).get(ORGANIZATION_COOKIE_NAME)?.value

  if (!selectedOrganizationId) {
    redirect('/onboarding/organization')
  }

  const selectedOrg = await apiServer.organizations({ id: selectedOrganizationId }).get()
  if (!selectedOrg.data) {
    redirect('/onboarding/organization')
  }

  const organizationMembers = await apiServer
    .organizations({ id: selectedOrganizationId })
    .members.get({
      query: {
        cursor: 0,
        limit: 100,
      },
    })

  return (
    <div>
      <Header title={selectedOrg.data.name}>
        <OrganizationSendInviteDialog>
          <OrganizationSendInviteDialogTrigger asChild>
            <HeaderButton icon={<PiPaperPlane />} variant='secondary' label='Invite Members' />
          </OrganizationSendInviteDialogTrigger>
        </OrganizationSendInviteDialog>
      </Header>
      <OrganizationMembersTable
        members={organizationMembers.data?.data ?? []}
        organizationId={selectedOrganizationId}
      />
    </div>
  )
}
