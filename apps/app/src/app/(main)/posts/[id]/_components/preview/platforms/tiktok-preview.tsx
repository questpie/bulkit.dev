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
  PiHeart,
  PiChatTeardrop,
  PiBookmarkSimple,
  PiPlus,
  PiMusicNote,
  PiShare,
} from 'react-icons/pi'

export function TiktokPreview(props: PreviewPostProps) {
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

  return (
    <div className='bg-black relative h-[600px] rounded-lg overflow-hidden'>{renderPreview()}</div>
  )
}

export type TiktokPreviewProps<Type extends PostType = PostType> = {
  postData: Post & { type: Type }
  previewUser: PreviewPostProps['previewUser']
}

function SideActions() {
  const [likes] = useState(Math.floor(Math.random() * 100000))
  const [comments] = useState(Math.floor(Math.random() * 10000))
  const [bookmarks] = useState(Math.floor(Math.random() * 50000))
  const [shares] = useState(Math.floor(Math.random() * 10000))

  return (
    <div className='absolute bottom-20 right-2 flex flex-col items-center gap-4'>
      <div className='flex flex-col items-center'>
        <Button variant='ghost' size='icon' className='text-white hover:text-white/90'>
          <PiHeart className='h-7 w-7' />
        </Button>
        <span className='text-white text-xs' suppressHydrationWarning>
          {Intl.NumberFormat(undefined, { notation: 'compact' }).format(likes)}
        </span>
      </div>
      <div className='flex flex-col items-center'>
        <Button variant='ghost' size='icon' className='text-white hover:text-white/90'>
          <PiChatTeardrop className='h-7 w-7' />
        </Button>
        <span className='text-white text-xs' suppressHydrationWarning>
          {Intl.NumberFormat(undefined, { notation: 'compact' }).format(comments)}
        </span>
      </div>
      <div className='flex flex-col items-center'>
        <Button variant='ghost' size='icon' className='text-white hover:text-white/90'>
          <PiBookmarkSimple className='h-7 w-7' />
        </Button>
        <span className='text-white text-xs' suppressHydrationWarning>
          {Intl.NumberFormat(undefined, { notation: 'compact' }).format(bookmarks)}
        </span>
      </div>
      <div className='flex flex-col items-center'>
        <Button variant='ghost' size='icon' className='text-white hover:text-white/90'>
          <PiShare className='h-7 w-7' />
        </Button>
        <span className='text-white text-xs' suppressHydrationWarning>
          {Intl.NumberFormat(undefined, { notation: 'compact' }).format(shares)}
        </span>
      </div>
    </div>
  )
}

function UserInfo(props: TiktokPreviewProps) {
  return (
    <div className='absolute bottom-32 left-2 right-20 z-10'>
      <div className='flex items-center gap-3 mb-4'>
        <Avatar className='h-12 w-12 border-2 border-white'>
          <AvatarFallback>{props.previewUser.name[0]}</AvatarFallback>
          <AvatarImage src={props.previewUser.avatar} alt={props.previewUser.name} />
        </Avatar>
        <div className='text-white'>
          <p className='font-semibold'>{props.previewUser.username}</p>
          <p className='text-sm opacity-90'>{props.previewUser.name}</p>
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='rounded-full px-4 gap-1 bg-white hover:bg-white/90'
        >
          <PiPlus className='h-4 w-4' />
          Follow
        </Button>
      </div>

      {/* Description */}
      <div className='text-white mb-4'>
        {props.postData.type === 'post' ? (
          <TextPreview text={props.postData.text} platform='tiktok' />
        ) : props.postData.type === 'reel' ? (
          <TextPreview text={props.postData.description} platform='tiktok' />
        ) : null}
      </div>

      {/* Music */}
      <div className='flex items-center gap-2 text-white mb-4'>
        <PiMusicNote className='h-4 w-4 animate-spin' />
        <p className='text-sm animate-marquee whitespace-nowrap'>
          Original Sound - {props.previewUser.name}
        </p>
      </div>
    </div>
  )
}

function RegularPostPreview({ postData, previewUser }: TiktokPreviewProps<'post'>) {
  return (
    <>
      {postData.media.length > 0 && (
        <div className='absolute inset-0'>
          <ResourcePreview
            resource={postData.media[0]!.resource}
            hideActions
            className='w-full h-full object-cover'
          />
          <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50' />
        </div>
      )}
      <UserInfo postData={postData} previewUser={previewUser} />
      <SideActions />
    </>
  )
}

function ReelPostPreview({ postData, previewUser }: TiktokPreviewProps<'reel'>) {
  return (
    <>
      {postData.resource && (
        <div className='absolute inset-0'>
          <ResourcePreview
            resource={postData.resource}
            hideActions
            className='w-full h-full object-cover'
          />
          <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50' />
        </div>
      )}
      <UserInfo postData={postData} previewUser={previewUser} />
      <SideActions />
    </>
  )
}
