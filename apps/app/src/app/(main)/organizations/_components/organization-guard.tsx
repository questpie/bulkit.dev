import { apiServer } from '@bulkit/app/api/api.server'
import { OrganizationProvider } from '@bulkit/app/app/(main)/organizations/_components/selected-organization-provider'
import { ORGANIZATION_COOKIE_NAME } from '@bulkit/app/app/(main)/organizations/organizations.constants'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'

export async function OrganizationGuard(props: PropsWithChildren) {
  const sessionResp = await apiServer.auth.session.index.get()

  if (!sessionResp.data?.user) {
    redirect('/login')
  }

  const selectedOrganizationId = (await cookies()).get(ORGANIZATION_COOKIE_NAME)?.value
  const [orgsResp, selectedOrganizationResp] = await Promise.all([
    apiServer.organizations.index.get({
      query: {
        limit: 1,
        cursor: 0,
      },
    }),
    selectedOrganizationId ? apiServer.organizations({ id: selectedOrganizationId }).get() : null,
  ])

  if (!selectedOrganizationResp?.data && !orgsResp.data?.data[0]) {
    redirect('/onboarding/organization')
  }

  const organization = selectedOrganizationResp?.data ?? orgsResp.data?.data[0]!

  return <OrganizationProvider organization={organization}>{props.children}</OrganizationProvider>
}
