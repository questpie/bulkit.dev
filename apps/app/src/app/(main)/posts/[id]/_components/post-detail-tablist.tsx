'use client'
import { PostDetailTab } from '@bulkit/app/app/(main)/posts/post.constants'
import { TabsList, TabsTrigger } from '@bulkit/ui/components/ui/tabs'
import { useRouter } from 'next/navigation'

export function PostDetailTablist() {
  const router = useRouter()

  return (
    <TabsList className='w-full'>
      <TabsTrigger
        value={PostDetailTab.Content}
        className='flex-1'
        onClick={(e) => {
          router.push(`?tab=${PostDetailTab.Content}`)
        }}
      >
        Content
      </TabsTrigger>
      <TabsTrigger
        value={PostDetailTab.Publish}
        className='flex-1'
        onClick={() => {
          router.push(`?tab=${PostDetailTab.Publish}`)
        }}
      >
        Publish Settings
      </TabsTrigger>
    </TabsList>
  )
}
