'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import {
  POST_STATUS_NAME,
  POST_STATUS_TO_BADGE_VARIANT,
  POST_STATUS_TO_COLOR,
  POST_TYPE_ICON,
} from '@bulkit/app/app/(main)/posts/post.constants'
import { postsInfiniteQueryOptions } from '@bulkit/app/app/(main)/posts/posts.queries'
import { POST_TYPE_NAME } from '@bulkit/shared/constants/db.constants'
import type { PostListItem } from '@bulkit/shared/modules/posts/posts.schemas'
import { isPostDeletable } from '@bulkit/shared/modules/posts/posts.utils'
import type { PaginatedResponse } from '@bulkit/shared/schemas/misc'
import { capitalize } from '@bulkit/shared/utils/string'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Button } from '@bulkit/ui/components/ui/button'
import { DataTable } from '@bulkit/ui/components/ui/data-table/data-table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bulkit/ui/components/ui/dialog'
import { Input } from '@bulkit/ui/components/ui/input'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { cn } from '@bulkit/ui/lib'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { LuArchive, LuTrash } from 'react-icons/lu'
import { PiChartBar, PiPencil } from 'react-icons/pi'

type PostsTableProps = {
  initialPosts?: PaginatedResponse<PostListItem>
}

export function PostsTable(props: PostsTableProps) {
  const [selectedPost, setSelectedPost] = useState<PostListItem | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const queryClient = useQueryClient()

  const postsQuery = useInfiniteQuery(
    postsInfiniteQueryOptions({
      initialPosts: props.initialPosts,
    })
  )

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; id: string }) => {
      return apiClient.posts({ id: data.id }).rename.patch(data)
    },
    onSuccess: (res) => {
      if (!res.error) {
        toast.success('Post renamed')
        setIsRenaming(false)
        queryClient.invalidateQueries({ queryKey: postsInfiniteQueryOptions({}).queryKey })
        return
      }
      toast.error('Failed to rename post', {
        description: res.error?.value.message,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.posts({ id }).delete(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsInfiniteQueryOptions({}).queryKey })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiClient.posts({ id }).archive.patch(),
    onSuccess: (res) => {
      if (!res.error) {
        toast.success('Post archived')
        queryClient.invalidateQueries({ queryKey: postsInfiniteQueryOptions({}).queryKey })
        return
      }
      toast.error('Failed to archive post', {
        description: res.error?.value.message,
      })
    },
  })

  const allPosts = postsQuery.data?.pages.flatMap((page) => page.data ?? []) ?? []
  console.log('allPosts', allPosts)

  return (
    <>
      <DataTable
        data={allPosts}
        keyExtractor={(row) => row.id}
        columns={[
          {
            id: 'name',
            header: 'Name',
            accessorKey: 'name',
            cell: (row) => {
              const Icon = POST_TYPE_ICON[row.type]
              return (
                <div>
                  <div>{row.name}</div>
                  <div className='sm:hidden flex flex-row items-center gap-2 text-muted-foreground text-sm'>
                    <div className='flex items-center gap-2'>
                      {Icon && <Icon className='h-4 w-4' />}
                      <span className='capitalize'>{POST_TYPE_NAME[row.type]}</span>
                    </div>
                    <span className='text-xs'>•</span>
                    <span className={cn('text-xs', POST_STATUS_TO_COLOR[row.status])}>
                      {POST_STATUS_NAME[row.status]}
                    </span>
                  </div>
                </div>
              )
            },
          },
          {
            id: 'status',
            header: 'Status',
            accessorKey: 'status',
            hideBelow: 'sm',
            cell: (row) => (
              <Badge variant={POST_STATUS_TO_BADGE_VARIANT[row.status]} className='capitalize'>
                {row.status}
              </Badge>
            ),
          },
          {
            id: 'type',
            header: 'Type',
            accessorKey: 'type',
            hideBelow: 'md',
            cell: (row) => {
              const Icon = POST_TYPE_ICON[row.type]
              return (
                <div className='flex items-center gap-2'>
                  <Icon className='h-4 w-4' />
                  <span className='capitalize'>{row.type.toLowerCase()}</span>
                </div>
              )
            },
          },
          {
            id: 'channels',
            header: 'Channels',
            accessorKey: 'channels',
            hideBelow: 'lg',
            cell: (row) => (
              <div className='flex items-center -space-x-4'>
                {row.channels.slice(0, 3).map((channel, index) => (
                  <div key={channel.id} className='relative'>
                    <Avatar className={cn('shadow-lg border border-border')}>
                      <AvatarImage src={channel.imageUrl ?? undefined} />
                      <AvatarFallback className='bg-muted'>
                        {capitalize(channel.name)[0] ?? ''}
                      </AvatarFallback>
                    </Avatar>
                    {index === 2 && row.channels.length > 3 && (
                      <div className='absolute bottom-0 flex items-center justify-center w-full h-full right-0 bg-black/60 rounded-full p-1'>
                        <span className='text-xs text-white'>+{row.channels.length - 3}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ),
          },
          {
            id: 'createdAt',
            header: 'Created At',
            accessorKey: 'createdAt',
            hideBelow: 'xl',
            cell: (row) => new Date(row.createdAt).toLocaleDateString(),
          },
        ]}
        actions={(row) => ({
          primary: {
            variant: 'secondary',
            label: row.status === 'draft' ? 'Edit' : 'Results',
            icon:
              row.status === 'draft' ? (
                <PiPencil className='h-4 w-4' />
              ) : (
                <PiChartBar className='h-4 w-4' />
              ),
            href: row.status === 'draft' ? `/posts/${row.id}` : `/posts/${row.id}/results`,
          },
          options: [
            {
              label: 'Rename',
              icon: <PiPencil className='h-4 w-4' />,
              onClick: (row) => {
                setSelectedPost(row)
                setNewName(row.name)
                setIsRenaming(true)
              },
            },
            {
              label: 'Delete',
              icon: <LuTrash className='h-4 w-4' />,
              show: isPostDeletable(row),
              variant: 'destructive',
              onClick: async (row) => {
                await deleteMutation.mutateAsync(row.id)
              },
              requireConfirm: {
                title: 'Delete Post',
                content: 'Are you sure you want to delete this post?',
                confirmLabel: 'Delete',
                cancelLabel: 'Cancel',
              },
            },
            {
              label: 'Archive',
              icon: <LuArchive className='h-4 w-4' />,
              show: !isPostDeletable(row),
              onClick: async (row) => {
                await archiveMutation.mutateAsync(row.id)
              },
            },
          ],
        })}
        onLoadMore={postsQuery.fetchNextPage}
        hasNextPage={postsQuery.hasNextPage}
      />

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Post</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder='Enter new name'
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsRenaming(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedPost) return
                updateMutation.mutate({ name: newName, id: selectedPost.id })
              }}
              disabled={!newName || !!(selectedPost && newName === selectedPost.name)}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
