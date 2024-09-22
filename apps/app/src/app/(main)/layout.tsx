import { apiServer } from '@bulkit/app/api/api.server'
import { Sidebar } from '@bulkit/app/app/(main)/_components/sidebar'
import { OrganizationProvider } from '@bulkit/app/app/(main)/organizations/_components/selected-organization-provider'
import { ORGANIZATION_COOKIE_NAME } from '@bulkit/app/app/(main)/organizations/organizations.constants'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'

export default async function MainLayout(props: PropsWithChildren) {
  const sessionResp = await apiServer.auth.session.index.get()

  if (!sessionResp.data?.user) {
    redirect('/login')
  }

  const selectedOrganizationId = cookies().get(ORGANIZATION_COOKIE_NAME)?.value
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

  const organization = selectedOrganizationResp?.data ?? orgsResp.data?.data[0]

  return (
    <OrganizationProvider organization={organization}>
      <div className='flex border-x xl:border-border h-screen max-w-screen-2xl bg-background w-full mx-auto'>
        <Sidebar />
        <main className='flex flex-1 h-screen flex-col items-center justify-between relative'>
          <div className='overflow-auto w-full h-screen pt-24 sm:pb-4 pb-16'>{props.children}</div>
        </main>
      </div>
    </OrganizationProvider>
  )
}
