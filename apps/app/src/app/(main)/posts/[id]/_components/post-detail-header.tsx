'use client'

import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { apiClient } from '@bulkit/app/api/api.client'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { PostPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/post-preview'
import { type Platform, PLATFORM_TO_NAME } from '@bulkit/shared/constants/db.constants'
import { Button } from '@bulkit/ui/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@bulkit/ui/components/ui/responsive-dialog'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { cn } from '@bulkit/ui/lib'
import { useMutation } from '@tanstack/react-query'
import { useFormContext, type FieldPath } from 'react-hook-form'
import { LuSend } from 'react-icons/lu'
import { PiChat, PiEye } from 'react-icons/pi'

export type PostDetailHeaderProps = {
  post: Post
}
export function PostDetailHeader({ post }: PostDetailHeaderProps) {
  const form = useFormContext()

  const publishMutation = useMutation({
    mutationFn: apiClient.posts({ id: post.id }).publish.patch,
    onSuccess: (res) => {
      if (!res.error) {
        toast.success('Post published')
        return
      }

      if (res.error.status === 400) {
        toast.error('Failed to publish post. Please check the form for errors.')
        for (const platform in res.error.value) {
          const platformErrors = res.error.value[platform as Platform]
          for (const error of platformErrors) {
            form.setError(error.path as FieldPath<Post>, {
              type: 'manual',
              message: `${PLATFORM_TO_NAME[platform as Platform]}: ${error.message}`,
            })
          }
        }
      }
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
            <ResponsiveDialogContent mobileProps={{ className: 'p-4' }}>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Preview</ResponsiveDialogTitle>
              </ResponsiveDialogHeader>

              <PostPreview />
            </ResponsiveDialogContent>
          </ResponsiveDialog>
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
