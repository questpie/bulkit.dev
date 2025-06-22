import { Sidebar } from '@bulkit/app/app/(main)/_components/sidebar'
import { OrganizationGuard } from '@bulkit/app/app/(main)/organizations/_components/organization-guard'
import { PlanGuard } from '@bulkit/app/app/(main)/organizations/_components/plan-guard'
import { ChatDrawer } from '@bulkit/app/app/(main)/chat/_components/chat-drawer'
import type { PropsWithChildren } from 'react'

export default async function MainLayout(props: PropsWithChildren) {
  return (
    <OrganizationGuard>
      <PlanGuard>
        <div className='flex border-x xl:border-border h-screen max-w-(--breakpoint-2xl) bg-background w-full mx-auto'>
          <Sidebar />
          <main className='flex flex-1 h-screen flex-col items-center justify-between relative'>
            <div className='overflow-auto w-full h-screen pt-24 sm:pb-4 pb-16'>
              {props.children}
            </div>
          </main>
          <ChatDrawer />
        </div>
      </PlanGuard>
    </OrganizationGuard>
  )
}
