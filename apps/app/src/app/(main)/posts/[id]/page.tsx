import { apiServer } from '@bulkit/app/api/api.server'
import { PostDetailHeader } from '@bulkit/app/app/(main)/posts/[id]/_components/post-detail-header'
import { PostDetailTablist } from '@bulkit/app/app/(main)/posts/[id]/_components/post-detail-tablist'
import {
  PostCommonFields,
  PostFormProvider,
  ReelPostFields,
  RegularPostFields,
  ThreadPostFields,
} from '@bulkit/app/app/(main)/posts/[id]/_components/post-form'
import { PostSidebar } from '@bulkit/app/app/(main)/posts/[id]/_components/post-sidebar'
import { PublishSettings } from '@bulkit/app/app/(main)/posts/[id]/_components/publish-settings'
import { PostDetailTab } from '@bulkit/app/app/(main)/posts/post.constants'
import { Tabs, TabsContent } from '@bulkit/ui/components/ui/tabs'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

export default async function PostDetail(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const postResp = await apiServer.posts({ id: (await props.params).id }).get()

  if (!postResp.data) {
    notFound()
  }

  // const Icon = POST_TYPE_ICON[postResp.data.type]

  const selectedTab = Object.values(PostDetailTab).includes(
    (await props.searchParams).tab as PostDetailTab
  )
    ? ((await props.searchParams).tab as PostDetailTab)
    : PostDetailTab.Content

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
        <div className='py-4 flex flex-col gap-4 flex-1 mb-12 overflow-auto'>
          <PostCommonFields />
          <Tabs className='gap-4' value={selectedTab}>
            <div className='px-4 mb-4'>
              <PostDetailTablist />
            </div>
            <TabsContent value='content'>{content}</TabsContent>
            <TabsContent value='publish'>
              <PublishSettings />
            </TabsContent>
          </Tabs>
        </div>

        <div className='hidden md:flex w-full max-w-lg border-l flex-col gap-4 px-4 border-border pb-4 bottom-0 h-full overflow-auto '>
          {/* <div className='flex flex-row items-center gap-2 pt-4'>
            <h4 className='text-lg font-bold'>{POST_TYPE_NAME[postResp.data.type]} Preview</h4>
            <PiEye />
          </div>


          <PostPreview /> */}
          <PostSidebar postId={postResp.data.id} type={postResp.data.type} />
        </div>
      </div>
    </PostFormProvider>
  )
}
