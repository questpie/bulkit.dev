'use client'
import { apiClient, type RouteOutput } from '@bulkit/app/api/api.client'
import {
  POST_STATUS_TO_BADGE_VARIANT,
  POST_STATUS_TO_COLOR,
  POST_TYPE_ICON,
} from '@bulkit/app/app/(main)/posts/post.constants'
import { isPostDeletable } from '@bulkit/shared/modules/posts/posts.utils'
import { capitalize } from '@bulkit/shared/utils/string'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bulkit/ui/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import { Input } from '@bulkit/ui/components/ui/input'
import {
  ResponsiveConfirmDialog,
  ResponsiveDialogTrigger,
} from '@bulkit/ui/components/ui/responsive-dialog'
import { toast } from '@bulkit/ui/components/ui/sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bulkit/ui/components/ui/table'
import { cn } from '@bulkit/ui/lib'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LuArchive, LuMoreVertical, LuTrash } from 'react-icons/lu'
import { PiChartBar, PiPencil } from 'react-icons/pi'

export type Post = RouteOutput<typeof apiClient.posts.index.get>['data'][number]

export function PostsTable(props: { posts: Post[] }) {
  return (
    <>
      <div className='hidden sm:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-4'>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Channels</TableHead>
              <TableHead>Created At</TableHead>
              {/* <TableHead>Actions</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.posts.map((post) => (
              <PostTableRow key={post.id} post={post} />
            ))}
          </TableBody>
        </Table>
      </div>
      <div className='sm:hidden px-4'>
        {props.posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </>
  )
}

type PostTableRowProps = {
  post: Post
}

export function PostTableRow(props: PostTableRowProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState<string>(props.post.name)

  const updateMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      apiClient.posts({ id: props.post.id }).rename.patch(data),
    onSuccess: (res) => {
      if (!res.error) {
        toast.success('Post renamed')
        setIsRenaming(false)
        router.refresh()
        return
      }
      toast.error('Failed to rename post', {
        description: res.error.value.message,
      })
    },
  })

  const Icon = POST_TYPE_ICON[props.post.type]
  const router = useRouter()

  const deleteMutation = useMutation({
    mutationFn: apiClient.posts({ id: props.post.id }).delete,
    onSuccess: () => {
      router.refresh()
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => apiClient.posts({ id: props.post.id }).archive.patch(),
    onSuccess: (res) => {
      if (!res.error) {
        toast.success('Post archived')
        router.refresh()
        return
      }
      toast.error('Failed to archive post', {
        description: res.error.value.message,
      })
    },
  })

  return (
    <TableRow key={props.post.id}>
      <TableCell className='font-medium pl-4'>
        <div className='flex items-center gap-2'>{props.post.name}</div>
      </TableCell>
      <TableCell>
        <Badge variant={POST_STATUS_TO_BADGE_VARIANT[props.post.status]} className='capitalize'>
          {props.post.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className='flex items-center gap-2'>
          <Icon className='h-4 w-4' />
          <span className='capitalize'>{props.post.type.toLowerCase()}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className='flex items-center -space-x-4'>
          {props.post.channels.slice(0, 3).map((channel, index) => (
            <div key={channel.id} className='relative'>
              <Avatar className={cn('shadow-lg border border-border')}>
                <AvatarImage src={channel.imageUrl ?? undefined} />
                <AvatarFallback className='bg-muted'>
                  {capitalize(channel.name)[0] ?? ''}
                </AvatarFallback>
              </Avatar>
              {index === 2 && props.post.channels.length > 3 && (
                <div
                  key={`channel-overlay-${channel.id}`}
                  className='absolute bottom-0 flex items-center justify-center w-full h-full right-0 bg-black/60 rounded-full p-1'
                >
                  <span className='text-xs text-white'>+{props.post.channels.length - 3}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </TableCell>
      {/* <TableCell>v{props.post.currentVersion}</TableCell> */}

      <TableCell suppressHydrationWarning>
        {new Date(props.post.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className='flex justify-start items-center gap-2'>
          {props.post.status === 'draft' ? (
            <Button variant='secondary' className='flex-1 max-w-32' asChild>
              <Link href={`/posts/${props.post.id}`}>
                <PiPencil className='h-4 w-4' />
                Edit
              </Link>
            </Button>
          ) : (
            <Button variant='secondary' className='flex-1 max-w-32' asChild>
              <Link href={`/posts/${props.post.id}/results`}>
                <PiChartBar className='h-4 w-4' />
                Results
              </Link>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='h-8 w-8 p-0'>
                <LuMoreVertical className='h-4 w-4' />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                <PiPencil className='mr-2 h-4 w-4' />
                Rename
              </DropdownMenuItem>
              {isPostDeletable(props.post) ? (
                <ResponsiveConfirmDialog
                  title='Delete Post'
                  confirmLabel='Delete'
                  cancelLabel='Cancel'
                  content='Are you sure you want to delete this post?'
                  onConfirm={() => deleteMutation.mutateAsync(undefined).then((res) => !!res.data)}
                >
                  <ResponsiveDialogTrigger className='w-full text-left' asChild>
                    <DropdownMenuItem className='text-destructive'>
                      <LuTrash className='mr-2 h-4 w-4' />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </ResponsiveDialogTrigger>
                </ResponsiveConfirmDialog>
              ) : (
                <DropdownMenuItem onClick={() => archiveMutation.mutate()}>
                  <LuArchive className='mr-2 h-4 w-4' />
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
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
              onClick={() => updateMutation.mutate({ name: newName })}
              disabled={!newName || newName === props.post.name}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TableRow>
  )
}

function PostCard({ post }: PostTableRowProps) {
  const Icon = POST_TYPE_ICON[post.type]

  return (
    <Link href={`/posts/${post.id}`}>
      <Card className='p-4 mb-2 '>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex-1 flex flex-col gap-2'>
            <div className='flex items-center gap-2'>
              <h3 className='text-sm font-bold'>{post.name}</h3>
              {/* <Badge
                variant={post.status === 'scheduled' ? 'default' : 'warning'}
                className='capitalize'
                size='sm'
              >
                {post.status}
              </Badge> */}
            </div>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <span className='capitalize'>{post.type.toLowerCase()}</span>
              <span>•</span>
              <span className={cn('capitalize font-bold', POST_STATUS_TO_COLOR[post.status])}>
                {post.status}
              </span>
              {/* <Badge
                variant={post.status === 'scheduled' ? 'default' : 'warning'}
                className='capitalize'
                size='sm'
              >
                {post.status}
              </Badge> */}
              {/* <span>v{post.currentVersion}</span> */}
              {/* <span>•</span> */}
              {/* <span suppressHydrationWarning>{new Date(post.createdAt).toLocaleDateString()}</span> */}
            </div>
          </div>
          <div className='flex flex-col items-center gap-2'>
            {post.channels?.length ? (
              <div className='flex items-center -space-x-4'>
                {post.channels.slice(0, 3).map((channel, index) => (
                  <div key={channel.id} className='relative'>
                    <Avatar className={cn('shadow-lg size-8 border border-border')}>
                      <AvatarImage src={channel.imageUrl ?? undefined} />
                      <AvatarFallback className='bg-muted'>
                        {capitalize(channel.name)[0] ?? ''}
                      </AvatarFallback>
                    </Avatar>
                    {index === 2 && post.channels.length > 3 && (
                      <div
                        key={`channel-overlay-${channel.id}`}
                        className='absolute bottom-0 flex items-center justify-center w-full h-full right-0 bg-black/60 rounded-full p-1'
                      >
                        <span className='text-xs text-white'>+{post.channels.length - 3}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Icon className='size-6' />
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
