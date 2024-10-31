import { apiServer } from '@bulkit/app/api/api.server'
import { Header } from '@bulkit/app/app/(main)/_components/header'
import { OrganizationSidebar } from '@bulkit/app/app/(main)/organizations/_components/organization-sidebar'
import { ORGANIZATION_COOKIE_NAME } from '@bulkit/app/app/(main)/organizations/organizations.constants'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

export default async function OrganizationLayout({ children }: { children: ReactNode }) {
  const selectedOrganizationId = (await cookies()).get(ORGANIZATION_COOKIE_NAME)?.value

  if (!selectedOrganizationId) {
    redirect('/onboarding/organization')
  }

  const selectedOrg = await apiServer.organizations({ id: selectedOrganizationId }).get()
  if (!selectedOrg.data) {
    redirect('/onboarding/organization')
  }

  return (
    <>
      <Header title={`${selectedOrg.data.name}'s settings`} />
      <div className='flex-1 w-full h-full flex flex-row'>
        <OrganizationSidebar />
        <main className='flex-1 px-6 pt-4'>{children}</main>
      </div>
    </>
  )
}
