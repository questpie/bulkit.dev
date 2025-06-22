'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import { PLATFORM_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { channelsInfiniteQueryOptions } from '@bulkit/app/app/(main)/channels/channels.queries'
import { PLATFORM_TO_NAME } from '@bulkit/shared/constants/db.constants'
import type { ChannelListItem } from '@bulkit/shared/modules/channels/channels.schemas'
import type { PaginatedResponse } from '@bulkit/shared/schemas/misc'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { DataTable } from '@bulkit/ui/components/ui/data-table/data-table'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LuEye, LuTrash } from 'react-icons/lu'

type ChannelsTableProps = {
  initialChannels?: PaginatedResponse<ChannelListItem>
}

export function ChannelsTable(props: ChannelsTableProps) {
  const queryClient = useQueryClient()

  const channelsQuery = useInfiniteQuery(
    channelsInfiniteQueryOptions({
      initialChannels: props.initialChannels,
    })
  )

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.channels({ id }).delete(),
    onSuccess: (res) => {
      if (!res.error) {
        toast.success('Channel deleted')
        queryClient.invalidateQueries({ queryKey: channelsInfiniteQueryOptions({}).queryKey })
        return
      }
      toast.error('Failed to delete channel', {
        description: res.error?.value.message,
      })
    },
  })

  const allChannels = channelsQuery.data?.pages.flatMap((page) => page.items ?? []) ?? []

  return (
    <DataTable
      data={allChannels}
      keyExtractor={(row) => row.id}
      columns={[
        {
          id: 'name',
          header: 'Name',
          accessorKey: 'name',
          cell: (row) => {
            const Icon = PLATFORM_ICON[row.platform]
            return (
              <div className='flex items-center gap-2'>
                <Avatar>
                  <AvatarImage src={row.imageUrl ?? undefined} />
                  <AvatarFallback>{row.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div>{row.name}</div>
                  <div className='sm:hidden flex flex-row items-center gap-2 text-muted-foreground text-sm'>
                    <Icon className='h-4 w-4' />
                    <span className='capitalize'>{PLATFORM_TO_NAME[row.platform]}</span>
                  </div>
                </div>
              </div>
            )
          },
        },
        {
          id: 'platform',
          header: 'Platform',
          accessorKey: 'platform',
          hideBelowBreakpoint: 'sm',
          cell: (row) => {
            const Icon = PLATFORM_ICON[row.platform]
            return (
              <div className='flex items-center gap-2'>
                <Icon className='h-4 w-4' />
                <span className='capitalize'>{PLATFORM_TO_NAME[row.platform]}</span>
              </div>
            )
          },
        },
        {
          id: 'stats',
          header: 'Posts',
          accessorKey: 'postsCount',
          hideBelowBreakpoint: 'sm',
          cell: (row) => (
            <div className='flex  gap-2'>
              <Badge variant='secondary'>
                {row.postsCount} / {row.publishedPostsCount} / {row.scheduledPostsCount}
              </Badge>
            </div>
          ),
        },
      ]}
      actions={(row) => ({
        primary: {
          variant: 'secondary',
          label: 'View',
          icon: <LuEye className='h-4 w-4' />,
          href: `/channels/${row.id}`,
        },
        options: [
          {
            label: 'Delete',
            icon: <LuTrash className='h-4 w-4' />,
            variant: 'destructive',
            onClick: (row) => deleteMutation.mutate(row.id),
            requireConfirm: {
              title: 'Delete Channel',
              content: 'Are you sure you want to delete this channel?',
              confirmLabel: 'Delete',
              cancelLabel: 'Cancel',
            },
          },
        ],
      })}
      onLoadMore={channelsQuery.fetchNextPage}
      hasNextPage={channelsQuery.hasNextPage}
    />
  )
}
