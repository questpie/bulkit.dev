import { apiServer } from '@bulkit/app/api/api.server'
import { Sidebar } from '@bulkit/app/app/(main)/_components/sidebar'
import { redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'

export default async function MainLayout(props: PropsWithChildren) {
  const sessionResp = await apiServer.auth.session.index.get()

  if (!sessionResp.data?.user) {
    redirect('/login')
  }

  return (
    <div className='flex border-x xl:border-border h-screen max-w-screen-xl w-full mx-auto'>
      <Sidebar />
      <main className='flex flex-1 h-screen flex-col items-center justify-between relative'>
        <div className='overflow-auto w-full h-screen pt-24 pb-4'>{props.children}</div>
      </main>
    </div>
  )
}
