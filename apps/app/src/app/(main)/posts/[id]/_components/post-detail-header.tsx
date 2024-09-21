'use client'

import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { cn } from '@bulkit/transactional/style-utils'
import { Button } from '@bulkit/ui/components/ui/button'
import { useFormContext } from 'react-hook-form'
import { LuSave, LuSend } from 'react-icons/lu'
import { PiChair, PiChat, PiEye } from 'react-icons/pi'

export type PostDetailHeaderProps = {
  post: Post
}
export function PostDetailHeader({ post }: PostDetailHeaderProps) {
  const form = useFormContext()

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
          <HeaderButton variant='outline' icon={<PiChat />} label='Comments' />
          <HeaderButton variant='outline' icon={<PiEye />} label='Preview' className='md:hidden' />
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
        <Button
          type='submit'
          disabled={!form.formState.isDirty}
          isLoading={form.formState.isSubmitting}
          className='w-full md:w-auto'
          size='lg'
        >
          <LuSave />
          Save
        </Button>
      </div>
    </>
  )
}
