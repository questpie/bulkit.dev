'use client'

import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { apiClient } from '@bulkit/app/api/api.client'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { PostPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/post-preview'
import { setPostValidationErrors } from '@bulkit/app/app/(main)/posts/post.utils'
import { isPostDeletable } from '@bulkit/shared/modules/posts/posts.utils'
import { Button } from '@bulkit/ui/components/ui/button'
import { DialogFooter } from '@bulkit/ui/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import { Input } from '@bulkit/ui/components/ui/input'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@bulkit/ui/components/ui/responsive-dialog'
import {
  Sheet,
  SheetTitle,
  SheetHeader,
  SheetContent,
  SheetTrigger,
} from '@bulkit/ui/components/ui/sheet'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { cn } from '@bulkit/ui/lib'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { LuMoreVertical, LuSend, LuTrash } from 'react-icons/lu'
import { PiArchive, PiArrowCounterClockwise, PiChartBar, PiEye, PiPencil } from 'react-icons/pi'

export type PostDetailHeaderProps = {
  post: Post
}
export function PostDetailHeader({ post }: PostDetailHeaderProps) {
  const form = useFormContext()
  const router = useRouter()
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(post.name)

  const publishMutation = useMutation({
    mutationFn: apiClient.posts({ id: post.id }).publish.patch,
    onSuccess: (res) => {
      if (!res.error) {
        toast.success('Post published')
        router.refresh()
        return
      }

      if (res.error.status === 400) {
        toast.error('Publish failed', { description: res.error.value.message })
        if (res.error.value.data.errors) setPostValidationErrors(form, res.error.value.data.errors)
      }
    },
  })

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
          {(post.status === 'published' || post.status === 'partially-published') && (
            <HeaderButton
              variant='outline'
              label='View Results'
              icon={<PiChartBar />}
              href={`/posts/${post.id}/results`}
            />
          )}

          <Sheet>
            <SheetTrigger asChild>
              {post.status === 'draft' && (
                <HeaderButton
                  variant='outline'
                  icon={<PiEye />}
                  label='Preview'
                  className='xl:hidden'
                />
              )}
            </SheetTrigger>
            <SheetContent className='w-[500px] px-0  max-w-full sm:max-w-full'>
              <SheetHeader className='px-4'>
                <SheetTitle>Preview</SheetTitle>
              </SheetHeader>

              <div className='flex-1 pb-2 px-4 overflow-auto relative'>
                <PostPreview />
              </div>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <HeaderButton variant='outline' icon={<LuMoreVertical />} label='More' />
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

        {/* {post.status === 'draft' ? (
          <Button
            type='submit'
            disabled={!form.formState.isDirty}
            isLoading={form.formState.isSubmitting}
          >
            <LuSave />
            Save
          </Button>
        ) : (
          <Button variant='ghost' asChild disabled>
            <LuSend className='h-4 w-4' />
            Publish
          </Button>
        )} */}
      </Header>

      <div className='h-16 mb-14  md:mb-0 sm:border-t justify-end bg-background z-10  flex flex-row px-4 items-center absolute bottom-0 w-full left-0'>
        {post.status === 'draft' ? (
          <Button
            type='button'
            disabled={form.formState.isSubmitting}
            isLoading={publishMutation.isPending}
            className='w-full md:w-auto'
            loadingText='Publishing...'
            size='lg'
            onClick={() => publishMutation.mutate(undefined)}
          >
            <LuSend />
            Publish
          </Button>
        ) : (
          <Button disabled className='w-full md:w-auto' size='lg'>
            <LuSend className='h-4 w-4' />
            Published
          </Button>
        )}
      </div>

      {/* Add rename dialog */}
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
