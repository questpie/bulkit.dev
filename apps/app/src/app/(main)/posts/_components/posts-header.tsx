'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { POST_TYPE_ICON } from '@bulkit/app/app/(main)/posts/post.constants'
import { POST_TYPE, POST_TYPE_NAME } from '@bulkit/shared/constants/db.constants'
import { Card, CardContent } from '@bulkit/ui/components/ui/card'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@bulkit/ui/components/ui/responsive-dialog'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { cn } from '@bulkit/ui/lib'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { LuPlus } from 'react-icons/lu'

export function PostsHeader() {
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: async (...args: Parameters<typeof apiClient.posts.index.post>) => {
      const res = await apiClient.posts.index.post(...args)
      if (res.error) {
        throw new Error('Failed to create post')
      }
      return res
    },
    onSuccess: (res) => {
      router.push(`/posts/${res.data.id}`)
    },
  })

  return (
    <Header title='Posts'>
      <ResponsiveDialog>
        <ResponsiveDialogTrigger asChild>
          <HeaderButton icon={<LuPlus />} label='Create Post' />
        </ResponsiveDialogTrigger>

        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Select Post Type</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>

          <div className='flex gap-4 flex-wrap justify-center py-8'>
            {POST_TYPE.map((postType) => {
              const Icon = POST_TYPE_ICON[postType]
              return (
                <Card
                  role='button'
                  tabIndex={0}
                  key={postType}
                  className={cn(
                    'w-24 h-24 hover:bg-accent cursor-pointer',
                    mutation.isPending && 'opacity-50 pointer-events-none'
                  )}
                  onClick={async () => {
                    toast.promise(mutation.mutateAsync({ type: postType }), {
                      loading: 'Creating post...',
                      success: 'Post created!',
                      error: (err) => err?.message,
                    })
                  }}
                >
                  <CardContent className='py-4 text-center flex flex-col gap-2 items-center font-bold text-sm'>
                    <Icon className='size-8' />
                    <span className='line-clamp-1 text-nowrap'>{POST_TYPE_NAME[postType]}</span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </Header>
  )
}
