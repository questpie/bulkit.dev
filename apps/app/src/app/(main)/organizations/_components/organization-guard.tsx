import { apiServer } from '@bulkit/app/api/api.server'
import { OrganizationProvider } from '@bulkit/app/app/(main)/organizations/_components/selected-organization-provider'
import { fetchServerOrganization } from '@bulkit/app/app/(main)/organizations/_utils/fetch-server-organization'
import { redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'

export async function OrganizationGuard(props: PropsWithChildren) {
  const sessionResp = await apiServer.auth.session.index.get()

  if (!sessionResp.data?.user) {
    redirect('/login')
  }

  const organization = await fetchServerOrganization()

  if (!organization) {
    redirect('/onboarding/organization')
  }

  return <OrganizationProvider organization={organization}>{props.children}</OrganizationProvider>
}
