import { apiServer } from '@bulkit/app/api/api.server'
import { Pagination } from '@bulkit/app/app/(main)/_components/pagination-buttons'
import {
  CreatePostDialog,
  CreatePostDialogTrigger,
} from '@bulkit/app/app/(main)/posts/_components/create-post-dialog'
import { PostsHeader } from '@bulkit/app/app/(main)/posts/_components/posts-header'
import { PostsTable } from '@bulkit/app/app/(main)/posts/_components/posts-table'
import { getPagination } from '@bulkit/app/app/_utils/pagination'
import { Button } from '@bulkit/ui/components/ui/button'
import { PiPlus } from 'react-icons/pi'

export default async function PostsPage(props: { searchParams: Promise<Record<string, any>> }) {
  const pagination = getPagination(await props.searchParams, 50)
  const posts = await apiServer.posts.index.get({
    query: {
      limit: pagination.limit,
      cursor: pagination.cursor,
    },
  })

  return (
    <div className='flex flex-col'>
      <PostsHeader />
      {!!posts.data?.data.length && (
        <>
          <PostsTable posts={posts.data?.data ?? []} />
          <Pagination
            canGoNext={!!posts.data?.nextCursor}
            canGoPrev={pagination.page > 1}
            className='justify-end px-4'
          />
        </>
      )}

      <div className='text-center py-12'>
        <h2 className='text-2xl font-semibold mb-2'>No posts yet</h2>
        <p className='text-muted-foreground mb-4'>Get started by creating your first post</p>
        <CreatePostDialog>
          <CreatePostDialogTrigger asChild>
            <Button>
              <PiPlus /> Create post
            </Button>
          </CreatePostDialogTrigger>
        </CreatePostDialog>
      </div>
    </div>
  )
}
