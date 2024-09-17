import { apiServer } from '@bulkit/app/api/api.server'
import { Header } from '@bulkit/app/app/(main)/_components/header'
import { PostFormProvider, RegularPostFields } from '@bulkit/app/app/(main)/posts/[id]/post-form'
import { POST_TYPE_ICON } from '@bulkit/app/app/(main)/posts/post.constants'
import { POST_TYPE_NAME } from '@bulkit/shared/constants/db.constants'
import { Button } from '@bulkit/ui/components/ui/button'
import { Separator } from '@bulkit/ui/components/ui/separator'
import { cn } from '@bulkit/ui/lib'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { LuActivity, LuSave, LuSend } from 'react-icons/lu'

export default async function PostDetail(props: { params: { id: string } }) {
  const postResp = await apiServer.posts({ id: props.params.id }).get()

  if (!postResp.data) {
    notFound()
  }

  const post = postResp.data

  const Icon = POST_TYPE_ICON[post.type]

  let content: ReactNode = null

  switch (post.type) {
    case 'post':
      content = <RegularPostFields />
      break
  }

  return (
    <PostFormProvider defaultValues={postResp.data} className='flex flex-col'>
      <Header
        title={post.name}
        description={
          <>
            <span
              className={cn(
                'capitalize',
                post.status === 'draft' ? 'text-warning' : 'text-primary'
              )}
            >
              {post.status}{' '}
            </span>{' '}
            • <span>v{post.currentVersion} •</span>
          </>
        }
      >
        {post.status === 'draft' ? (
          <Button>
            <LuSave />
            Save
          </Button>
        ) : (
          <Button variant='ghost' asChild disabled>
            <LuSend className='h-4 w-4' />
            Publish
          </Button>
        )}
      </Header>

      <div className=''>
        <div className='pb-4 px-4 w-full flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='flex flex-col gap-2'>
              <h3 className='text-lg font-bold flex flex-row gap-2 items-center'>
                <Icon className='size-4' />
                <span>{POST_TYPE_NAME[post.type]}</span>
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
