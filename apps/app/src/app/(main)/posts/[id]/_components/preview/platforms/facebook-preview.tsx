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
  PiChatTeardrop,
  PiShareFat,
  PiDotsThree,
  PiGlobe,
  PiSmileyStickerLight,
} from 'react-icons/pi'

export function FacebookPreview(props: PreviewPostProps) {
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
      case 'story':
        return (
          <StoryPostPreview
            postData={postData as Extract<Post, { type: 'story' }>}
            previewUser={props.previewUser}
          />
        )
      default:
        return <div>Unsupported post type</div>
    }
  }

  return <div className='bg-background rounded-lg flex flex-col'>{renderPreview()}</div>
}

export type FacebookPreviewProps<Type extends PostType = PostType> = {
  postData: Post & { type: Type }
  previewUser: PreviewPostProps['previewUser']
}

function PostHeader(props: FacebookPreviewProps) {
  return (
    <div className='py-4'>
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
  const [likes] = useState(Math.floor(Math.random() * 1000))
  const [comments] = useState(Math.floor(Math.random() * 100))
  const [shares] = useState(Math.floor(Math.random() * 50))

  return (
    <div className='pb-4 pt-4'>
      <div className='flex justify-between items-center text-sm text-muted-foreground mb-3'>
        <div className='flex items-center gap-1'>
          <div className='bg-primary text-primary-foreground rounded-full p-1'>
            <PiThumbsUp className='h-3 w-3' />
          </div>
          <span suppressHydrationWarning>{likes}</span>
        </div>
        <div className='flex items-center gap-3'>
          <span suppressHydrationWarning>{comments} comments</span>
          <span suppressHydrationWarning>{shares} shares</span>
        </div>
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
          <PiShareFat className='h-5 w-5' />
          Share
        </Button>
      </div>
      <div className='flex items-center gap-2 mt-3'>
        <Avatar className='h-8 w-8'>
          <AvatarFallback>Y</AvatarFallback>
        </Avatar>
        <div className='flex-1 flex items-center gap-2 rounded-full bg-accent px-4 py-1.5'>
          <span className='text-sm text-muted-foreground'>Write a comment...</span>
          <PiSmileyStickerLight className='h-5 w-5 text-muted-foreground' />
        </div>
      </div>
    </div>
  )
}

function RegularPostPreview({ postData, previewUser }: FacebookPreviewProps<'post'>) {
  return (
    <>
      <PostHeader postData={postData} previewUser={previewUser} />
      <TextPreview text={postData.text} platform='facebook' />
      {postData.media.length > 0 && (
        <div className='mt-4'>
          <div
            className={`grid gap-1 ${
              postData.media.length === 1
                ? 'grid-cols-1'
                : postData.media.length === 2
                  ? 'grid-cols-2'
                  : postData.media.length === 3
                    ? 'grid-cols-2'
                    : 'grid-cols-2'
            }`}
          >
            {postData.media.slice(0, 4).map((media, index) => (
              <div
                key={media.id}
                className={`relative ${postData.media.length === 3 && index === 0 ? 'col-span-2' : ''}`}
              >
                <ResourcePreview resource={media.resource} hideActions />
                {index === 3 && postData.media.length > 4 && (
                  <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
                    <span className='text-white font-bold'>+{postData.media.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <PostActions />
    </>
  )
}

function ReelPostPreview({ postData, previewUser }: FacebookPreviewProps<'reel'>) {
  return (
    <>
      <PostHeader postData={postData} previewUser={previewUser} />
      <div className='px-4'>
        <TextPreview text={postData.description} platform='facebook' />
      </div>
      {postData.resource && (
        <div className='mt-4 aspect-[9/16] relative'>
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

function StoryPostPreview({ postData, previewUser }: FacebookPreviewProps<'story'>) {
  return (
    <div className='aspect-[9/16] relative rounded-lg overflow-hidden'>
      {postData.resource && (
        <div className='absolute inset-0'>
          <ResourcePreview resource={postData.resource} hideActions className='w-full h-full' />
          <div className='absolute top-0 left-0 right-0 p-4'>
            <div className='flex items-center gap-2'>
              <Avatar className='h-10 w-10 ring-2 ring-primary'>
                <AvatarFallback>{previewUser.name[0]}</AvatarFallback>
                <AvatarImage src={previewUser.avatar} alt={previewUser.name} />
              </Avatar>
              <div className='text-white'>
                <p className='font-semibold text-sm'>{previewUser.name}</p>
                <p className='text-xs opacity-90'>Just now</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
