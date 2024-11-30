'use client'
import type { PreviewPostProps } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/post-preview'
import { ResourcePreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/resource-preview'
import { TextPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/text-preview'
import type { PostType } from '@bulkit/shared/constants/db.constants'
import type { Post } from '@bulkit/shared/modules/posts/posts.schemas'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Button } from '@bulkit/ui/components/ui/button'
import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import {
  PiThumbsUp,
  PiThumbsDown,
  PiChatTeardrop,
  PiShareFat,
  PiDotsThree,
  PiDownload,
  PiScissors,
  PiPlaylist,
  PiBell,
} from 'react-icons/pi'

export function YoutubePreview(props: PreviewPostProps) {
  const form = useFormContext<Post>()
  const postData = useWatch({
    control: form.control,
  })

  if (!postData.type) {
    throw new Error('Post type is required')
  }

  const renderPreview = () => {
    switch (postData.type) {
      case 'post':
        return (
          <RegularPostPreview
            postData={postData as Extract<Post, { type: 'post' }>}
            previewUser={props.previewUser}
          />
        )
      case 'reel':
        return (
          <ReelPostPreview
            postData={postData as Extract<Post, { type: 'reel' }>}
            previewUser={props.previewUser}
          />
        )
      default:
        return <div>Unsupported post type</div>
    }
  }

  return <div className='bg-background rounded-lg '>{renderPreview()}</div>
}

export type YoutubePreviewProps<Type extends PostType = PostType> = {
  postData: Post & { type: Type }
  previewUser: PreviewPostProps['previewUser']
}

function VideoActions() {
  const [likes] = useState(Math.floor(Math.random() * 100000))
  const [comments] = useState(Math.floor(Math.random() * 10000))
  const [views] = useState(Math.floor(Math.random() * 1000000))

  return (
    <div className='flex items-center gap-2 text-sm'>
      <div className='flex items-center rounded-full bg-accent'>
        <Button variant='ghost' size='sm' className='rounded-l-full gap-1'>
          <PiThumbsUp className='h-4 w-4' />
          <span suppressHydrationWarning>
            {Intl.NumberFormat(undefined, { notation: 'compact' }).format(likes)}
          </span>
        </Button>
        <div className='w-px h-5 bg-border' />
        <Button variant='ghost' size='sm' className='rounded-r-full'>
          <PiThumbsDown className='h-4 w-4' />
        </Button>
      </div>

      <Button variant='ghost' size='sm' className='rounded-full gap-1'>
        <PiChatTeardrop className='h-4 w-4' />
        <span suppressHydrationWarning>
          {Intl.NumberFormat(undefined, { notation: 'compact' }).format(comments)}
        </span>
      </Button>

      <Button variant='ghost' size='sm' className='rounded-full gap-1'>
        <PiShareFat className='h-4 w-4' />
        Share
      </Button>

      <Button variant='ghost' size='sm' className='rounded-full gap-1'>
        <PiDownload className='h-4 w-4' />
        Download
      </Button>

      <Button variant='ghost' size='sm' className='rounded-full gap-1'>
        <PiScissors className='h-4 w-4' />
        Clip
      </Button>

      <Button variant='ghost' size='sm' className='rounded-full gap-1'>
        <PiPlaylist className='h-4 w-4' />
        Save
      </Button>

      <Button variant='ghost' size='sm' className='rounded-full'>
        <PiDotsThree className='h-4 w-4' />
      </Button>
    </div>
  )
}

function ChannelInfo(props: YoutubePreviewProps) {
  const [subscribers] = useState(Math.floor(Math.random() * 1000000))

  return (
    <div className='flex items-start justify-between'>
      <div className='flex items-start gap-3'>
        <Avatar className='h-10 w-10'>
          <AvatarFallback>{props.previewUser.name[0]}</AvatarFallback>
          <AvatarImage src={props.previewUser.avatar} alt={props.previewUser.name} />
        </Avatar>
        <div>
          <p className='font-semibold'>{props.previewUser.name}</p>
          <p className='text-sm text-muted-foreground' suppressHydrationWarning>
            {Intl.NumberFormat(undefined, { notation: 'compact' }).format(subscribers)} subscribers
          </p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Button variant='ghost' size='sm' className='rounded-full'>
          <PiBell className='h-4 w-4' />
        </Button>
        <Button className='rounded-full bg-primary text-primary-foreground hover:bg-primary/90'>
          Subscribe
        </Button>
      </div>
    </div>
  )
}

function RegularPostPreview({ postData, previewUser }: YoutubePreviewProps<'post'>) {
  const [views] = useState(Math.floor(Math.random() * 1000000))

  return (
    <div className='space-y-4'>
      {postData.media[0] && (
        <div className='aspect-video relative'>
          <ResourcePreview
            resource={postData.media[0].resource}
            hideActions
            className='w-full h-full'
          />
          <div className='absolute bottom-2 right-2 bg-black text-white text-sm px-1 rounded'>
            0:00
          </div>
        </div>
      )}
      <div className='p-4 space-y-4'>
        <div>
          <h1 className='font-semibold text-lg'>{postData.text}</h1>
          <p className='text-sm text-muted-foreground' suppressHydrationWarning>
            {Intl.NumberFormat(undefined, { notation: 'compact' }).format(views)} views • Just now
          </p>
        </div>

        <VideoActions />

        <div className='border-t border-b border-border py-4'>
          <ChannelInfo postData={postData} previewUser={previewUser} />
        </div>

        <div className='text-sm'>
          <TextPreview text={postData.text} platform='youtube' />
        </div>
      </div>
    </div>
  )
}

function ReelPostPreview({ postData, previewUser }: YoutubePreviewProps<'reel'>) {
  const [views] = useState(Math.floor(Math.random() * 1000000))

  return (
    <div className='space-y-4'>
      {postData.resource && (
        <div className='aspect-[9/16] relative'>
          <ResourcePreview resource={postData.resource} hideActions className='w-full h-full' />
          <div className='absolute bottom-2 right-2 bg-black text-white text-sm px-1 rounded'>
            0:00
          </div>
        </div>
      )}
      <div className='p-4 space-y-4'>
        <div>
          <h1 className='font-semibold text-lg'>{postData.description}</h1>
          <p className='text-sm text-muted-foreground' suppressHydrationWarning>
            {Intl.NumberFormat(undefined, { notation: 'compact' }).format(views)} views • Just now
          </p>
        </div>

        <VideoActions />

        <div className='border-t border-b border-border py-4'>
          <ChannelInfo postData={postData} previewUser={previewUser} />
        </div>

        <div className='text-sm'>
          <TextPreview text={postData.description} platform='youtube' />
        </div>
      </div>
    </div>
  )
}
