'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { USER_ROLE_LABEL } from '@bulkit/app/app/(main)/organizations/organizations.constants'
import type { OrganizationMember } from '@bulkit/shared/modules/organizations/organizations.schemas'
import type { PaginatedResponse } from '@bulkit/shared/schemas/misc'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { DataTable } from '@bulkit/ui/components/ui/data-table/data-table'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LuTrash } from 'react-icons/lu'
import { membersInfiniteQueryOptions } from '../members.queries'

type MembersTableProps = {
  initialMembers?: PaginatedResponse<OrganizationMember>
  organizationId: string
}

export function MembersTable(props: MembersTableProps) {
  const queryClient = useQueryClient()

  const membersQuery = useInfiniteQuery(
    membersInfiniteQueryOptions({
      initialMembers: props.initialMembers,
      organizationId: props.organizationId,
    })
  )

  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      apiClient.organizations({ id: props.organizationId }).members({ userId: memberId }).delete(),
    onSuccess: (res) => {
      if (!res.error) {
        toast.success('Member removed')
        queryClient.invalidateQueries({
          queryKey: membersInfiniteQueryOptions({ organizationId: props.organizationId }).queryKey,
        })
        return
      }
      toast.error('Failed to remove member', {
        description: res.error.value.message,
      })
    },
  })

  const allMembers = membersQuery.data?.pages.flatMap((page) => page.items ?? []) ?? []

  return (
    <DataTable
      data={allMembers}
      keyExtractor={(row) => row.id}
      columns={[
        {
          id: 'user',
          header: 'User',
          accessorKey: 'name',
          cell: (row) => (
            <div className='flex items-center gap-2'>
              {/* <Avatar>
                <AvatarImage src={row..imageUrl ?? undefined} />
                <AvatarFallback>{row.user.name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar> */}
              <div>
                <div className='font-medium'>{row.name}</div>
                <div className='flex items-center gap-2'>
                  <div className='text-sm text-muted-foreground'>{row.email}</div>
                  <div className='flex sm:hidden text-xs text-muted-foreground'>
                    <span>{USER_ROLE_LABEL[row.role]}</span>
                    <span>•</span>
                    <span>{new Date(row.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'role',
          header: 'Role',
          accessorKey: 'role',
          cell: (row) => (
            <Badge variant='outline' className='capitalize'>
              {USER_ROLE_LABEL[row.role]}
            </Badge>
          ),
          hideBelowBreakpoint: 'sm',
        },
        {
          id: 'joinedAt',
          header: 'Joined',
          accessorKey: 'createdAt',
          cell: (row) => new Date(row.createdAt).toLocaleDateString(),
          hideBelowBreakpoint: 'sm',
        },
      ]}
      actions={(row) => ({
        options: [
          {
            label: 'Remove',
            icon: <LuTrash className='h-4 w-4' />,
            variant: 'destructive',
            onClick: async (row) => {
              await removeMutation.mutateAsync(row.id)
            },
            requireConfirm: {
              title: 'Remove Member',
              content: 'Are you sure you want to remove this member?',
              confirmLabel: 'Remove',
              cancelLabel: 'Cancel',
            },
          },
        ],
      })}
      onLoadMore={membersQuery.fetchNextPage}
      hasNextPage={membersQuery.hasNextPage}
    />
  )
}
