import { apiServer } from '@bulkit/app/api/api.server'
import { CHANNEL_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { PostDetailHeader } from '@bulkit/app/app/(main)/posts/[id]/_components/post-detail-header'
import { PostPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/post-preview'
import { XPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/x-preview'
import {
  PostFormProvider,
  RegularPostFields,
  ShortPostFields,
  StoryPostFields,
  ThreadPostFields,
} from '@bulkit/app/app/(main)/posts/[id]/post-form'
import { POST_TYPE_ICON } from '@bulkit/app/app/(main)/posts/post.constants'
import { PLATFORM_TO_NAME, PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { Select } from '@bulkit/ui/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bulkit/ui/components/ui/tabs'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

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
    <PostFormProvider defaultValues={postResp.data} className='flex flex-col h-full'>
      <PostDetailHeader post={postResp.data} />
      {/* <div className='pb-4 px-4 w-full flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='flex flex-col gap-2'>
            <h3 className='text-lg font-bold flex flex-row gap-2 items-center'>
              <Icon className='size-4' />
              <span>{POST_TYPE_NAME[postResp.data.type]}</span>
            </h3>
          </div>
        </div>
        <Button variant='secondary'>
          <PiChat />
          Comments
        </Button>
      </div> */}

      {/* <Separator /> */}

      <div className='flex flex-row w-full flex-1 h-full -mt-4'>
        <div className='py-4 flex flex-col flex-1'>{content}</div>
        <div className='w-full max-w-lg border-l flex-col gap-4 flex px-4 border-border py-4'>
          <h4 className='text-lg font-bold'>Preview</h4>
          <PostPreview />
        </div>
      </div>
    </PostFormProvider>
  )
}
