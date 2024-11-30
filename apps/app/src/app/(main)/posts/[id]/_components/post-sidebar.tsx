import { PostChat } from '@bulkit/app/app/(main)/posts/[id]/_components/post-chat'
import { PostPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/post-preview'
import { POST_TYPE_NAME, type PostType } from '@bulkit/shared/constants/db.constants'
import { PiEye } from 'react-icons/pi'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bulkit/ui/components/ui/tabs'

type PostSidebarProps = {
  postId: string
  type: PostType
}

export function PostSidebar(props: PostSidebarProps) {
  return (
    <div className='h-full'>
      <Tabs defaultValue='preview' className='h-full flex flex-col'>
        <TabsList className='w-full justify-start rounded-none border-b'>
          <TabsTrigger value='preview'>Preview</TabsTrigger>
          <TabsTrigger value='chat'>Chat</TabsTrigger>
        </TabsList>
        <TabsContent value='preview' className='flex-1 m-0'>
          <div className='flex flex-row items-center gap-2 pt-4'>
            <h4 className='text-lg font-bold'>{POST_TYPE_NAME[props.type]} Preview</h4>
            <PiEye />
          </div>

          <PostPreview />
        </TabsContent>
        <TabsContent value='chat' className='flex-1 m-0'>
          <PostChat postId={props.postId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
