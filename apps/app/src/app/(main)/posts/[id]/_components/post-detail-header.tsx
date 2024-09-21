'use client'

import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { Header } from '@bulkit/app/app/(main)/_components/header'
import { cn } from '@bulkit/transactional/style-utils'
import { Button } from '@bulkit/ui/components/ui/button'
import { useFormContext } from 'react-hook-form'
import { LuSave, LuSend } from 'react-icons/lu'

export type PostDetailHeaderProps = {
  post: Post
}
export function PostDetailHeader({ post }: PostDetailHeaderProps) {
  const form = useFormContext()

  return (
    <Header
      title={post.name}
      description={
        <>
          <span
            className={cn('capitalize', post.status === 'draft' ? 'text-warning' : 'text-primary')}
          >
            {post.status}{' '}
          </span>{' '}
        </>
      }
    >
      {post.status === 'draft' ? (
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
      )}
    </Header>
  )
}
