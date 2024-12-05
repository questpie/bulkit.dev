import { Header } from '@bulkit/app/app/(main)/_components/header'
import { OrganizationSidebar } from '@bulkit/app/app/(main)/organizations/_components/organization-sidebar'
import { fetchServerOrganization } from '@bulkit/app/app/(main)/organizations/_utils/fetch-server-organization'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

export default async function OrganizationLayout({ children }: { children: ReactNode }) {
  const organization = await fetchServerOrganization()

  if (!organization) {
    redirect('/onboarding/organization')
  }

  return (
    <>
      <Header title={`${organization.name}'s settings`} />
      <div className='flex-1 w-full h-full flex md:flex-row flex-col'>
        <OrganizationSidebar
          className={{
            wrapper: 'w-full md:w-48',
            nav: 'flex flex-row md:flex-col py-0',
            item: 'flex-1 md:flex-none min-w-24 flex flex-row justify-center md:justify-start',
          }}
        />
        <main className='flex-1 px-6 pt-4'>{children}</main>
      </div>
    </>
  )
}
