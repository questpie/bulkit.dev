import { apiServer } from '@bulkit/app/api/api.server'
import { PostsHeader } from '@bulkit/app/app/(main)/posts/_components/posts-header'
import { PostsTable } from '@bulkit/app/app/(main)/posts/_components/posts-table'
import { Button } from '@bulkit/ui/components/ui/button'
import { CreatePostDialog, CreatePostDialogTrigger } from './_components/create-post-dialog'
import { PiPlus } from 'react-icons/pi'

export default async function PostsPage() {
  const initialPosts = await apiServer.posts.get({
    query: {
      limit: 25,
      cursor: 0,
    },
  })

  if (!initialPosts.data?.items.length) {
    return (
      <div className='flex flex-col'>
        <PostsHeader />
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

  return (
    <div className='flex flex-col'>
      <PostsHeader />
      <PostsTable initialPosts={initialPosts.data} />
    </div>
  )
}
