'use client'

import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { Header } from '@bulkit/app/app/(main)/_components/header'
import { cn } from '@bulkit/ui/lib'
import { useRouter } from 'next/navigation'
import { useFormContext } from 'react-hook-form'

export type PostResultsHeaderProps = {
  post: Post
}
export function PostResultsHeader({ post }: PostResultsHeaderProps) {
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
      />

      {/* <div className='h-16 mb-14  md:mb-0 sm:border-t justify-end bg-background z-10  flex flex-row px-4 items-center absolute bottom-0 w-full left-0'>
      </div> */}
    </>
  )
}
