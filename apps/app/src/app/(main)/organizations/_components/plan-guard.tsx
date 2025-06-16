import { apiServer } from '@bulkit/app/api/api.server'
import { fetchServerOrganization } from '@bulkit/app/app/(main)/organizations/_utils/fetch-server-organization'
import { buildOrganizationHeaders } from '@bulkit/app/app/(main)/organizations/_utils/organizations.utils'
import { redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'

export async function PlanGuard(props: PropsWithChildren) {
  const organization = await fetchServerOrganization()

  if (!organization) {
    redirect('/onboarding/organization')
  }

  const planResp = await apiServer.plans.active.get({
    headers: buildOrganizationHeaders(organization.id),
  })

  if (!planResp.data) {
    redirect('/onboarding/plan')
  }

  return <>{props.children}</>
}
