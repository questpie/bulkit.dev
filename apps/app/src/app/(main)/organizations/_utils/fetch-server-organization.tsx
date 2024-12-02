import { apiServer } from '@bulkit/app/api/api.server'
import { ORGANIZATION_COOKIE_NAME } from '@bulkit/app/app/(main)/organizations/organizations.constants'
import { cookies } from 'next/headers'

export async function fetchServerOrganization() {
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

  return selectedOrganizationResp?.data ?? orgsResp.data?.data[0]!
}
