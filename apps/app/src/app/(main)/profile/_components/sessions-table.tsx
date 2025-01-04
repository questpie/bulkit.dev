'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { useAuthData } from '@bulkit/app/app/(auth)/use-auth'
import { sessionsQueryOptions } from '@bulkit/app/app/(main)/profile/sessions/sessions.queries'
import { Avatar, AvatarFallback } from '@bulkit/ui/components/ui/avatar'
import { DataTable } from '@bulkit/ui/components/ui/data-table/data-table'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PiTrash } from 'react-icons/pi'

export type Session = {
  id: string
  deviceInfo: {
    browser: string
    os: string
    country: string
    device: string
  }
  expiresAt: string
}

type SessionsTableProps = {
  initialSessions?: Session[]
}

export function SessionsTable(props: SessionsTableProps) {
  const authData = useAuthData()
  const activeSessionId = authData?.session.id
  const queryClient = useQueryClient()
  const router = useRouter()

  const sessionsQuery = useQuery(
    sessionsQueryOptions({
      initialSessions: props.initialSessions,
    })
  )

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.auth.session.revoke.delete(undefined, {
        query: { sessionId: id },
      }),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error.value.message ?? 'Something went wrong')
        return
      }
      queryClient.invalidateQueries({ queryKey: sessionsQueryOptions({}).queryKey })
      router.refresh()
    },
  })

  return (
    <div className='px-4'>
      <DataTable
        data={sessionsQuery.data ?? []}
        keyExtractor={(row) => row.id}
        columns={[
          {
            id: 'browser',
            header: 'Browser',
            accessorKey: (row) => row.deviceInfo.browser,
            cell: (row) => (
              <div className='flex items-center gap-2'>
                <Avatar className='h-8 w-8'>
                  <AvatarFallback>{row.deviceInfo.browser[0]}</AvatarFallback>
                </Avatar>
                {row.deviceInfo.browser}
              </div>
            ),
          },
          {
            id: 'os',
            header: 'OS',
            accessorKey: (row) => row.deviceInfo.os,
            hideBelowBreakpoint: 'sm',
          },
          {
            id: 'country',
            header: 'Country',
            accessorKey: (row) => row.deviceInfo.country,
            hideBelowBreakpoint: 'md',
          },
          {
            id: 'device',
            header: 'Device',
            accessorKey: (row) => row.deviceInfo.device,
            hideBelowBreakpoint: 'lg',
          },
          {
            id: 'expiresAt',
            header: 'Expires At',
            accessorKey: 'expiresAt',
            hideBelowBreakpoint: 'xl',
            cell: (row) => new Date(row.expiresAt).toLocaleDateString(),
          },
        ]}
        actions={(row) => ({
          options: [
            {
              label: 'Revoke',
              icon: <PiTrash className='h-4 w-4' />,
              variant: 'destructive',
              show: row.id !== activeSessionId,
              onClick: async (row) => {
                await deleteMutation.mutateAsync(row.id)
              },
            },
          ],
        })}
      />
    </div>
  )
}
