'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { entityCommentsInfiniteQueryOptions } from '../comments.queries'
import { CommentCard } from './comment-card'
import { CommentForm } from './comment-form'
import { Button } from '@bulkit/ui/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { CommentListQuery } from '@bulkit/shared/modules/comments/comments.schemas'

interface CommentListProps {
  entityType: 'post' | 'task'
  entityId: string
  parentCommentId?: string | null
  query?: Omit<CommentListQuery, 'cursor' | 'parentCommentId'>
  showForm?: boolean
  maxDepth?: number
}

export function CommentList({
  entityType,
  entityId,
  parentCommentId = null,
  query = {},
  showForm = true,
  maxDepth = 5,
}: CommentListProps) {
  const commentsQuery = useInfiniteQuery(
    entityCommentsInfiniteQueryOptions(entityType, entityId, {
      ...query,
      parentCommentId,
    })
  )

  const allComments = commentsQuery.data?.pages.flat() ?? []

  if (commentsQuery.isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin' />
        <span className='ml-2 text-sm text-muted-foreground'>Loading comments...</span>
      </div>
    )
  }

  if (commentsQuery.error) {
    return (
      <div className='py-8 text-center'>
        <p className='text-sm text-red-600'>Failed to load comments</p>
        <Button
          variant='outline'
          size='sm'
          onClick={() => commentsQuery.refetch()}
          className='mt-2'
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Comment Form */}
      {showForm && (
        <CommentForm
          entityType={entityType}
          entityId={entityId}
          parentCommentId={parentCommentId}
        />
      )}

      {/* Comments List */}
      {allComments.length === 0 ? (
        <div className='py-8 text-center'>
          <p className='text-sm text-muted-foreground'>
            {parentCommentId ? 'No replies yet' : 'No comments yet'}
          </p>
          {!showForm && (
            <p className='text-xs text-muted-foreground mt-1'>
              Be the first to {parentCommentId ? 'reply' : 'comment'}!
            </p>
          )}
        </div>
      ) : (
        <div className='space-y-4'>
          {allComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              entityType={entityType}
              entityId={entityId}
              maxDepth={maxDepth}
            />
          ))}

          {/* Load More Button */}
          {commentsQuery.hasNextPage && (
            <div className='flex justify-center pt-4'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => commentsQuery.fetchNextPage()}
                disabled={commentsQuery.isFetchingNextPage}
              >
                {commentsQuery.isFetchingNextPage ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    Loading...
                  </>
                ) : (
                  'Load more comments'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
