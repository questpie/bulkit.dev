'use client'

import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { apiClient } from '@bulkit/app/api/api.client'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { isPostDeletable } from '@bulkit/shared/modules/posts/posts.utils'
import { Button } from '@bulkit/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@bulkit/ui/components/ui/responsive-dialog'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { cn } from '@bulkit/ui/lib'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LuMoreVertical, LuTrash } from 'react-icons/lu'
import { PiPencil, PiArrowCounterClockwise, PiArchive, PiChartBar } from 'react-icons/pi'
import { DialogFooter } from '@bulkit/ui/components/ui/dialog'
import { Input } from '@bulkit/ui/components/ui/input'

export type PostResultsHeaderProps = {
  post: Post
}

export function PostResultsHeader({ post }: PostResultsHeaderProps) {
  const router = useRouter()
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(post.name)

  const deleteMutation = useMutation({
    mutationFn: apiClient.posts({ id: post.id }).delete,
    onSuccess: (res) => {
      if (!res.error) {
        toast.success('Post deleted')
        router.refresh()
        router.push('/posts')
        return
      }
      toast.error('Failed to delete post', {
        description: res.error.value.message,
      })
    },
  })

  const returnToDraftMutation = useMutation({
    mutationFn: () => apiClient.posts({ id: post.id })['return-to-draft'].patch(),
    onSuccess: (res) => {
      if (!res.error) {
        toast.success('Post returned to draft')
        router.refresh()
        return
      }
      toast.error('Failed to return post to draft', {
        description: res.error.value.message,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { name: string }) => apiClient.posts({ id: post.id }).rename.patch(data),
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

  const archiveMutation = useMutation({
    mutationFn: () => apiClient.posts({ id: post.id }).archive.patch(),
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
    <>
      <Header
        title={post.name}
        description={
          <>
            <span
              className={cn(
                'capitalize',
                post.status === 'draft' ? 'text-warning' : 'text-primary'
              )}
            >
              {post.status}{' '}
            </span>{' '}
          </>
        }
      >
        <div className='flex flex-row gap-4 items-center'>
          <Button variant='outline' asChild>
            <Link href={`/posts/${post.id}`}>
              <PiPencil className='mr-2 h-4 w-4' />
              Edit Post
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon'>
                <LuMoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                <PiPencil className='mr-2 h-4 w-4' />
                Rename
              </DropdownMenuItem>

              {post.status === 'scheduled' && (
                <DropdownMenuItem onClick={() => returnToDraftMutation.mutate(undefined)}>
                  <PiArrowCounterClockwise className='mr-2 h-4 w-4' />
                  Return to Draft
                </DropdownMenuItem>
              )}

              {isPostDeletable(post) ? (
                <DropdownMenuItem
                  className='text-destructive'
                  onClick={() => deleteMutation.mutate(undefined)}
                >
                  <LuTrash className='mr-2 h-4 w-4' />
                  Delete
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => archiveMutation.mutate()}>
                  <PiArchive className='mr-2 h-4 w-4' />
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Header>

      <ResponsiveDialog open={isRenaming} onOpenChange={setIsRenaming}>
        <ResponsiveDialogContent className='px-4'>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Rename Post</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
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
              disabled={!newName || newName === post.name}
            >
              Rename
            </Button>
          </DialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  )
}
