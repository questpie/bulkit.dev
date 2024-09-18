import { apiServer } from '@bulkit/app/api/api.server'
import { PostDetailHeader } from '@bulkit/app/app/(main)/posts/[id]/_components/post-detail-header'
import {
  PostFormProvider,
  RegularPostFields,
  ShortPostFields,
  StoryPostFields,
  ThreadPostFields,
} from '@bulkit/app/app/(main)/posts/[id]/post-form'
import { POST_TYPE_ICON } from '@bulkit/app/app/(main)/posts/post.constants'
import { POST_TYPE_NAME } from '@bulkit/shared/constants/db.constants'
import { Button } from '@bulkit/ui/components/ui/button'
import { Separator } from '@bulkit/ui/components/ui/separator'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { LuActivity } from 'react-icons/lu'

export default async function PostDetail(props: { params: { id: string } }) {
  const postResp = await apiServer.posts({ id: props.params.id }).get()

  if (!postResp.data) {
    notFound()
  }

  const Icon = POST_TYPE_ICON[postResp.data.type]

  let content: ReactNode = null

  switch (postResp.data.type) {
    case 'post':
      content = <RegularPostFields />
      break
    case 'short':
      content = <ShortPostFields />
      break
    case 'story':
      content = <StoryPostFields />
      break
    case 'thread':
      content = <ThreadPostFields />
      break
    default:
      content = <div>Unsupported post type</div>
  }

  return (
    <PostFormProvider defaultValues={postResp.data} className='flex flex-col'>
      <PostDetailHeader post={postResp.data} />

      <div className=''>
        <div className='pb-4 px-4 w-full flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='flex flex-col gap-2'>
              <h3 className='text-lg font-bold flex flex-row gap-2 items-center'>
                <Icon className='size-4' />
                <span>{POST_TYPE_NAME[postResp.data.type]}</span>
              </h3>
            </div>
          </div>

          <Button variant='secondary'>
            <LuActivity />
            Activity
          </Button>
        </div>

        <Separator />

        <div className='px-4 py-4 flex flex-col'>{content}</div>
      </div>
    </PostFormProvider>
  )
}
