'use client'

import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { apiClient } from '@bulkit/app/api/api.client'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { PostPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/post-preview'
import { setPostValidationErrors } from '@bulkit/app/app/(main)/posts/post.utils'
import { PLATFORM_TO_NAME, type Platform } from '@bulkit/shared/constants/db.constants'
import { isPostDeletable } from '@bulkit/shared/modules/posts/post.utils'
import { Button } from '@bulkit/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import {
  ResponsiveConfirmDialog,
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@bulkit/ui/components/ui/responsive-dialog'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { cn } from '@bulkit/ui/lib'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useFormContext, type FieldPath } from 'react-hook-form'
import { LuMoreVertical, LuSend, LuTrash } from 'react-icons/lu'
import { PiEye } from 'react-icons/pi'

export type PostDetailHeaderProps = {
  post: Post
}
export function PostDetailHeader({ post }: PostDetailHeaderProps) {
  const form = useFormContext()
  const router = useRouter()

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
          {/* <HeaderButton variant='outline' icon={<PiChat />} label='Comments' /> */}
          <ResponsiveDialog>
            <ResponsiveDialogTrigger asChild>
              <HeaderButton
                variant='outline'
                icon={<PiEye />}
                label='Preview'
                className='md:hidden'
              />
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent mobileProps={{ className: 'flex flex-col h-[95dvh]' }}>
              <ResponsiveDialogHeader className='px-4'>
                <ResponsiveDialogTitle>Preview</ResponsiveDialogTitle>
              </ResponsiveDialogHeader>

              <div className='flex-1 pb-2 px-4 overflow-auto relative'>
                <PostPreview />
              </div>
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          {isPostDeletable(post) && (
            <DropdownMenu>
              <ResponsiveConfirmDialog
                title='Delete post'
                confirmLabel='Delete'
                onConfirm={() => deleteMutation.mutateAsync(undefined).then((r) => !r.error)}
                cancelLabel='Cancel'
                content='Are you sure you want to delete this post?'
              >
                <DropdownMenuTrigger asChild>
                  <div>
                    <HeaderButton
                      variant='outline'
                      icon={<LuMoreVertical />}
                      label='Options'
                      onClick={() => console.log('click')}
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <ResponsiveDialogTrigger asChild>
                    <DropdownMenuItem className='text-destructive gap-2'>
                      <LuTrash />
                      Delete
                    </DropdownMenuItem>
                  </ResponsiveDialogTrigger>
                </DropdownMenuContent>
              </ResponsiveConfirmDialog>
            </DropdownMenu>
          )}
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
    </>
  )
}
