import { apiServer } from '@bulkit/app/api/api.server'
import { redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'

export default async function AdminLayout(props: PropsWithChildren) {
  const resp = await apiServer.admin.status.get()

  if (!resp.data?.isAdmin) {
    redirect('/')
  }

  return <>{props.children}</>
}
