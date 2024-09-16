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

  if (!selectedOrganizationId) {
    redirect('/onboarding/organization')
  }

  const organization = await apiServer.organizations({ id: selectedOrganizationId }).get()

  if (!organization.data) {
    redirect('/onboarding/organization')
  }

  return (
    <OrganizationProvider organization={organization.data}>
      <div className='flex border-x xl:border-border h-screen max-w-screen-xl w-full mx-auto'>
        <Sidebar />
        <main className='flex flex-1 h-screen flex-col items-center justify-between relative'>
          <div className='overflow-auto w-full h-screen pt-24 pb-4'>{props.children}</div>
        </main>
      </div>
    </OrganizationProvider>
  )
}
