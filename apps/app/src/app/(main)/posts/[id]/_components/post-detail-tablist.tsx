'use client'
import { PostDetailTab } from '@bulkit/app/app/(main)/posts/post.constants'
import { TabsList, TabsTrigger } from '@bulkit/ui/components/ui/tabs'
import { useRouter } from 'next/navigation'

const TAB_LABEL: Record<PostDetailTab, string> = {
  [PostDetailTab.Content]: 'Content',
  [PostDetailTab.Publish]: 'Publish settings',
}

export function PostDetailTablist() {
  const router = useRouter()

  return (
    <TabsList className='w-full'>
      <TabsTrigger
        value={PostDetailTab.Content}
        className='flex-1 h-full'
        onClick={(e) => {
          router.push(`?tab=${PostDetailTab.Content}`)
        }}
      >
        {TAB_LABEL[PostDetailTab.Content]}
      </TabsTrigger>
      <TabsTrigger
        value={PostDetailTab.Publish}
        className='flex-1 h-full'
        onClick={() => {
          router.push(`?tab=${PostDetailTab.Publish}`)
        }}
      >
        {TAB_LABEL[PostDetailTab.Publish]}
      </TabsTrigger>
    </TabsList>
  )
}
