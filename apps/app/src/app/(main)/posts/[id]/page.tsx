import { apiServer } from '@bulkit/app/api/api.server'
import { Header } from '@bulkit/app/app/(main)/_components/header'
import { POST_TYPE_ICON } from '@bulkit/app/app/(main)/posts/post.constants'
import { POST_TYPE_NAME } from '@bulkit/shared/constants/db.constants'
import { Button } from '@bulkit/ui/components/ui/button'
import { Separator } from '@bulkit/ui/components/ui/separator'
import { notFound } from 'next/navigation'
import { LuLink2Off } from 'react-icons/lu'

export default async function PostDetail(props: { params: { id: string } }) {
  const postResp = await apiServer.posts({ id: props.params.id }).get()

  if (!postResp.data) {
    notFound()
  }

  const post = postResp.data

  const Icon = POST_TYPE_ICON[post.type]

  return (
    <div className='flex flex-col'>
      <Header title='Channel Details' />

      <div className=''>
        <div className='pb-4 px-4 w-full flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Icon className='size-18' />
            <div className='flex flex-col gap-2'>
              <h3 className='text-lg font-bold'>{post.name}</h3>
              <div className='flex items-center gap-2'>
                <span>{POST_TYPE_NAME[post.type]}</span>
              </div>
            </div>
          </div>

          <Button variant='ghost' asChild disabled>
            <LuLink2Off className='h-4 w-4' />
            Profile
          </Button>
        </div>

        <Separator />
      </div>
    </div>
  )
}
