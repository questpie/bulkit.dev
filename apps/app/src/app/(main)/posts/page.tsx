import { apiServer } from '@bulkit/app/api/api.server'
import { Pagination } from '@bulkit/app/app/(main)/_components/pagination-buttons'
import { PostsHeader } from '@bulkit/app/app/(main)/posts/_components/posts-header'
import { PostsTable } from '@bulkit/app/app/(main)/posts/_components/posts-table'
import { getPagination } from '@bulkit/app/app/_utils/pagination'

export default async function PostsPage(props: { serachParams: Record<string, any> }) {
  const pagination = getPagination(props.serachParams)
  const posts = await apiServer.posts.index.get({
    query: {
      limit: pagination.limit,
      cursor: pagination.cursor,
    },
  })

  return (
    <div className='flex flex-col'>
      <PostsHeader />
      <PostsTable posts={posts.data?.data ?? []} />
      <Pagination
        canGoNext={!!posts.data?.nextCursor}
        canGoPrev={pagination.page > 1}
        className='justify-end px-4'
      />
    </div>
  )
}
