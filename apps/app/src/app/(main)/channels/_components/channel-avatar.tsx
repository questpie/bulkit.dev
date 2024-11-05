import { PLATFORM_ICON } from '@bulkit/app/app/(main)/channels/channels.constants'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import { capitalize } from '@bulkit/shared/utils/string'
import { cn } from '@bulkit/transactional/style-utils'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Fragment } from 'react'

type ChannelForAvatar = {
  id: string
  name: string
  imageUrl: string | null
  platform: Platform
}

export function ChannelsAvatar(props: {
  channel: ChannelForAvatar
  className?: string
}) {
  const channel = props.channel
  const PlatformIcon = PLATFORM_ICON[channel.platform]

  return (
    <div className='relative w-auto'>
      <Avatar className={cn('shadow-lg size-8 border border-border', props.className)}>
        <AvatarImage src={channel.imageUrl ?? undefined} />
        <AvatarFallback className='bg-muted'>{capitalize(channel.name)[0] ?? ''}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'absolute -bottom-1 -right-1 border rounded-full size-4 flex bg-card justify-center items-center border-border'
        )}
      >
        <PlatformIcon className='text-foreground size-3' />
      </div>
    </div>
  )
}

export function ChannelAvatarList(props: {
  channels: ChannelForAvatar[]
  size: 'sm' | 'md' | 'lg'
}) {
  return (
    <div
      className={cn('flex flex-row', {
        '-space-x-3': props.size === 'md',
        '-space-x-2': props.size === 'sm',
        '-space-x-4': props.size === 'lg',
      })}
    >
      {props.channels.slice(0, 4).map((channel, index) => {
        return (
          <Fragment key={channel.id}>
            <ChannelsAvatar
              channel={channel}
              className={cn({
                'size-8': props.size === 'md',
                'size-7': props.size === 'sm',
                'size-9': props.size === 'lg',
              })}
            />
            {index === 2 && props.channels.length > 4 && (
              <div className='absolute bottom-0 flex items-center justify-center w-full h-full left-0 bg-black/60 rounded-full p-1'>
                <span className='text-xs text-white'>+{props.channels.length - 4}</span>
              </div>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
