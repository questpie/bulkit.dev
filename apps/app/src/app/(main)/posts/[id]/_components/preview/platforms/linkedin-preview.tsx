'use client'
import type { PreviewPostProps } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/post-preview'
import { ResourcePreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/resource-preview'
import { TextPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/text-preview'
import type { PostType } from '@bulkit/shared/constants/db.constants'
import type { Post, PostMedia } from '@bulkit/shared/modules/posts/posts.schemas'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Button } from '@bulkit/ui/components/ui/button'
import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import {
  PiThumbsUp,
  PiChatTeardrop,
  PiRepeat,
  PiPaperPlaneTilt,
  PiDotsThree,
  PiGlobe,
} from 'react-icons/pi'

export function LinkedInPreview(props: PreviewPostProps) {
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
      case 'thread':
        return (
          <ThreadPostPreview
            postData={postData as Extract<Post, { type: 'thread' }>}
            previewUser={props.previewUser}
          />
        )
      default:
        return <div>Unsupported post type</div>
    }
  }

  return <div className='bg-background rounded-lg '>{renderPreview()}</div>
}

export type LinkedInPreviewProps<Type extends PostType = PostType> = {
  postData: Post & { type: Type }
  previewUser: PreviewPostProps['previewUser']
}

function PostHeader(props: LinkedInPreviewProps) {
  return (
    <div className='p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Avatar>
            <AvatarFallback>{props.previewUser.name[0]}</AvatarFallback>
            <AvatarImage src={props.previewUser.avatar} alt={props.previewUser.name} />
          </Avatar>
          <div>
            <p className='font-semibold'>{props.previewUser.name}</p>
            <div className='flex items-center gap-1 text-xs text-muted-foreground'>
              <span suppressHydrationWarning>Just now</span>
              <span>•</span>
              <PiGlobe />
            </div>
          </div>
        </div>
        <Button variant='ghost' size='icon'>
          <PiDotsThree className='h-5 w-5' />
        </Button>
      </div>
    </div>
  )
}

function PostActions() {
  const [reactions] = useState(Math.floor(Math.random() * 500))
  const [comments] = useState(Math.floor(Math.random() * 50))
  const [reposts] = useState(Math.floor(Math.random() * 20))

  return (
    <div className='px-4 pb-4'>
      <div className='flex justify-between text-sm text-muted-foreground mb-3'>
        <span className='text-xs' suppressHydrationWarning>
          {reactions} reactions • {comments} comments
        </span>
        <span className='text-xs' suppressHydrationWarning>
          {reposts} reposts
        </span>
      </div>
      <div className='flex border-y border-border'>
        <Button variant='ghost' className='flex-1 gap-2'>
          <PiThumbsUp className='h-5 w-5' />
          Like
        </Button>
        <Button variant='ghost' className='flex-1 gap-2'>
          <PiChatTeardrop className='h-5 w-5' />
          Comment
        </Button>
        <Button variant='ghost' className='flex-1 gap-2'>
          <PiRepeat className='h-5 w-5' />
          Repost
        </Button>
        <Button variant='ghost' className='flex-1 gap-2'>
          <PiPaperPlaneTilt className='h-5 w-5' />
          Send
        </Button>
      </div>
    </div>
  )
}

function MediaGrid({ media }: { media: PostMedia[] }) {
  if (media.length === 0) return null

  // For single media item
  if (media.length === 1) {
    return (
      <div className='relative'>
        <ResourcePreview resource={media[0]!.resource} hideActions className='w-full' />
      </div>
    )
  }

  // For multiple media items
  return (
    <div
      className={`grid gap-1 ${
        media.length === 2
          ? 'grid-cols-2'
          : media.length === 3
            ? 'grid-cols-2'
            : 'grid-cols-2 grid-rows-2'
      }`}
    >
      {media.slice(0, 4).map((item, index) => (
        <div
          key={item.id}
          className={`relative ${media.length === 3 && index === 0 ? 'col-span-2' : ''}`}
        >
          <ResourcePreview resource={item.resource} hideActions className='w-full h-full' />
          {index === 3 && media.length > 4 && (
            <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
              <span className='text-white font-semibold'>+{media.length - 4}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function RegularPostPreview({ postData, previewUser }: LinkedInPreviewProps<'post'>) {
  return (
    <>
      <PostHeader postData={postData} previewUser={previewUser} />
      <div className='px-4'>
        <TextPreview text={postData.text} platform='linkedin' />
      </div>
      {postData.media.length > 0 && (
        <div className='mt-4'>
          <MediaGrid media={postData.media} />
        </div>
      )}
      <PostActions />
    </>
  )
}

function ReelPostPreview({ postData, previewUser }: LinkedInPreviewProps<'reel'>) {
  return (
    <>
      <PostHeader postData={postData} previewUser={previewUser} />
      <div className='px-4'>
        <TextPreview text={postData.description} platform='linkedin' />
      </div>
      {postData.resource && (
        <div className='mt-4 aspect-video relative'>
          <ResourcePreview resource={postData.resource} hideActions className='w-full h-full' />
          {postData.resource.type.startsWith('video') && (
            <div className='absolute bottom-2 right-2 bg-black/50 text-white text-sm px-1 rounded'>
              0:00
            </div>
          )}
        </div>
      )}
      <PostActions />
    </>
  )
}

function ThreadPostPreview({ postData, previewUser }: LinkedInPreviewProps<'thread'>) {
  return (
    <>
      {postData.items.map((item, index) => (
        <div key={item.id} className='relative'>
          {index > 0 && <div className='absolute top-0 left-6 w-0.5 h-full bg-border -mt-4' />}
          <div className='p-4'>
            <div className='flex gap-3'>
              <Avatar>
                <AvatarFallback>{previewUser.name[0]}</AvatarFallback>
                <AvatarImage src={previewUser.avatar} alt={previewUser.name} />
              </Avatar>
              <div className='flex-1'>
                <div className='flex items-center gap-1 mb-1'>
                  <span className='font-semibold'>{previewUser.name}</span>
                  <span className='text-xs text-muted-foreground'>•</span>
                  <span className='text-xs text-muted-foreground'>Just now</span>
                </div>
                <TextPreview text={item.text} platform='linkedin' />
                {item.media.length > 0 && (
                  <div className='mt-3'>
                    <MediaGrid media={item.media} />
                  </div>
                )}
              </div>
            </div>
          </div>
          {index === postData.items.length - 1 && <PostActions />}
        </div>
      ))}
    </>
  )
}
