import { apiServer } from '@bulkit/app/api/api.server'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { Pagination } from '@bulkit/app/app/(main)/_components/pagination-buttons'
import { PLATFORM_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { PostsTable } from '@bulkit/app/app/(main)/posts/_components/posts-table'
import { getPagination } from '@bulkit/app/app/_utils/pagination'
import { PLATFORM_TO_NAME } from '@bulkit/shared/constants/db.constants'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Button } from '@bulkit/ui/components/ui/button'
import { Separator } from '@bulkit/ui/components/ui/separator'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LuExternalLink, LuLink2Off } from 'react-icons/lu'

export default async function ChannelDetails(props: {
  params: { id: string }
  searchParams: Record<string, any>
}) {
  const channelResp = await apiServer.channels({ id: props.params.id }).get()

  if (!channelResp.data) {
    notFound()
  }

  const pagination = getPagination(props.searchParams)
  const posts = await apiServer.posts.index.get({
    query: {
      limit: pagination.limit,
      cursor: pagination.cursor,
      channelId: props.params.id,
    },
  })

  const channel = channelResp.data

  const Icon = PLATFORM_ICON[channel.platform]
  const channelAvatarFallback = channel.name.charAt(0).toUpperCase()

  return (
    <div className='flex flex-col'>
      <Header
        title={channel.name}
        beforeTitle={
          <Avatar className='size-9'>
            <AvatarImage src={channel.imageUrl ?? undefined} />
            <AvatarFallback>{channelAvatarFallback} </AvatarFallback>
          </Avatar>
        }
        description={
          <span className='flex flex-row gap-1 items-center font-bold'>
            <Icon className='size-4' />
            {PLATFORM_TO_NAME[channel.platform]}
          </span>
        }
      >
        {channel.url && (
          <HeaderButton icon={<LuExternalLink className='h-4 w-4' />} label={'Profile'} />
        )}
      </Header>

      <div className=' py-4'>
        <h4 className='text-xl font-bold mb-4 px-4'>Related posts</h4>
        <PostsTable posts={posts.data?.data ?? []} />
        <Pagination
          canGoNext={!!posts.data?.nextCursor}
          canGoPrev={pagination.page > 1}
          className='justify-end px-4'
        />
      </div>
    </div>
  )
}
