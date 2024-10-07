import { apiServer } from '@bulkit/app/api/api.server'
import { Header } from '@bulkit/app/app/(main)/_components/header'
import { PLATFORM_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import { PLATFORM_TO_NAME } from '@bulkit/shared/constants/db.constants'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Button } from '@bulkit/ui/components/ui/button'
import { Separator } from '@bulkit/ui/components/ui/separator'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LuExternalLink, LuLink2Off } from 'react-icons/lu'

export default async function ChannelDetails(props: { params: { id: string } }) {
  const channelResp = await apiServer.channels({ id: props.params.id }).get()

  if (!channelResp.data) {
    notFound()
  }

  const channel = channelResp.data

  const Icon = PLATFORM_ICON[channel.platform]
  const channelAvatarFallback = channel.name.charAt(0).toUpperCase()

  return (
    <div className='flex flex-col'>
      <Header title='Channel Details' />

      <div className=''>
        <div className='pb-4 px-4 w-full flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Avatar className='size-18'>
              <AvatarImage src={channel.imageUrl ?? undefined} />
              <AvatarFallback>{channelAvatarFallback} </AvatarFallback>
            </Avatar>
            <div className='flex flex-col gap-2'>
              <h3 className='text-lg font-bold'>{channel.name}</h3>
              <div className='flex items-center gap-2'>
                <Icon className='size-5' />
                <span>{PLATFORM_TO_NAME[channel.platform]}</span>
              </div>
            </div>
          </div>

          {channel.url ? (
            <Button asChild>
              <Link href={channel.url}>
                <LuExternalLink className='h-4 w-4' />
                Profile
              </Link>
            </Button>
          ) : (
            <Button variant='ghost' asChild disabled>
              <LuLink2Off className='h-4 w-4' />
              Profile
            </Button>
          )}
        </div>

        <Separator />

        <div className='px-4 py-4'>
          <h4 className='text-xl font-bold mb-4'>Posts History</h4>
          <p className='text-muted-foreground text-sm'>No posts yet</p>
        </div>
      </div>
    </div>
  )
}
