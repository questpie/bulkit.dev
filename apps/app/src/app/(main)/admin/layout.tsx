import { apiServer } from '@bulkit/app/api/api.server'
import { AdminLayout } from '@bulkit/app/app/(main)/admin/admin-layout'
import { redirect } from 'next/navigation'
import type { PropsWithChildren } from 'react'

export default async function Layout({ children }: PropsWithChildren) {
  const resp = await apiServer.admin.status.get()

  if (!resp.data?.isAdmin) {
    redirect('/')
  }

  return <AdminLayout>{children}</AdminLayout>
}
