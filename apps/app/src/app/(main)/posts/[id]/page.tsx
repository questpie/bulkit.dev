import { apiServer } from '@bulkit/app/api/api.server'
import { PostDetailHeader } from '@bulkit/app/app/(main)/posts/[id]/_components/post-detail-header'
import { PostPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/post-preview'
import {
  PostCommonFields,
  PostFormProvider,
  ReelPostFields,
  RegularPostFields,
  ThreadPostFields,
} from '@bulkit/app/app/(main)/posts/[id]/post-form'
import { POST_TYPE_NAME } from '@bulkit/shared/constants/db.constants'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bulkit/ui/components/ui/tabs'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { PiEye } from 'react-icons/pi'

const PostDetailTab = {}

export default async function PostDetail(props: {
  params: { id: string }
  searchParams: Record<string, string>
}) {
  const postResp = await apiServer.posts({ id: props.params.id }).get()

  if (!postResp.data) {
    notFound()
  }

  // const Icon = POST_TYPE_ICON[postResp.data.type]

  let content: ReactNode = null

  switch (postResp.data.type) {
    case 'post':
      content = <RegularPostFields />
      break
    case 'reel':
      content = <ReelPostFields />
      break
    case 'story':
      content = <ReelPostFields />
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

      <div className='flex flex-row w-full flex-1 h-full -mt-4 overflow-auto'>
        <div className='py-4 flex flex-col gap-4 flex-1'>
          <PostCommonFields />
          <Tabs defaultValue='content' className='gap-4'>
            <div className='px-4'>
              <TabsList className='w-full'>
                <TabsTrigger value='content' className='flex-1'>
                  Content
                </TabsTrigger>
                <TabsTrigger value='Platforms' className='flex-1'>
                  Publish Settings
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value='content'>{content}</TabsContent>
          </Tabs>
        </div>

        <div className='hidden md:flex w-full max-w-lg border-l flex-col gap-4 px-4 border-border py-4 bottom-0 sticky'>
          <div className='flex flex-row items-center gap-2'>
            <h4 className='text-lg font-bold'>{POST_TYPE_NAME[postResp.data.type]} Preview</h4>
            <PiEye />
          </div>
          <PostPreview />
        </div>
      </div>
    </PostFormProvider>
  )
}
