'use client'
import type { PreviewPostProps } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/post-preview'
import { ResourcePreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/resource-preview'
import { TextPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/text-preview'
import type { PostType } from '@bulkit/shared/constants/db.constants'
import type { Post, PostMedia } from '@bulkit/shared/modules/posts/posts.schemas'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Button } from '@bulkit/ui/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@bulkit/ui/components/ui/carousel'
import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import {
  PiHeart,
  PiChatTeardrop,
  PiPaperPlaneTilt,
  PiBookmarkSimple,
  PiDotsThree,
  PiSmileyStickerLight,
} from 'react-icons/pi'

export function InstagramPreview(props: PreviewPostProps) {
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

  return <div className='bg-background rounded-lg'>{renderPreview()}</div>
}

export type InstagramPreviewProps<Type extends PostType = PostType> = {
  postData: Post & { type: Type }
  previewUser: PreviewPostProps['previewUser']
}

function PostHeader(props: InstagramPreviewProps) {
  return (
    <div className='p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Avatar className='h-8 w-8'>
            <AvatarFallback>{props.previewUser.name[0]}</AvatarFallback>
            <AvatarImage src={props.previewUser.avatar} alt={props.previewUser.name} />
          </Avatar>
          <span className='font-semibold text-sm'>{props.previewUser.username}</span>
        </div>
        <Button variant='ghost' size='icon'>
          <PiDotsThree className='h-5 w-5' />
        </Button>
      </div>
    </div>
  )
}

function PostActions() {
  const [likes] = useState(Math.floor(Math.random() * 10000))
  const [comments] = useState(Math.floor(Math.random() * 1000))

  return (
    <div className='px-4 pb-4'>
      <div className='flex justify-between py-2'>
        <div className='flex gap-4'>
          <Button variant='ghost' size='icon'>
            <PiHeart className='h-7 w-7' />
          </Button>
          <Button variant='ghost' size='icon'>
            <PiChatTeardrop className='h-7 w-7' />
          </Button>
          <Button variant='ghost' size='icon'>
            <PiPaperPlaneTilt className='h-7 w-7' />
          </Button>
        </div>
        <Button variant='ghost' size='icon'>
          <PiBookmarkSimple className='h-7 w-7' />
        </Button>
      </div>
      <div className='font-semibold text-sm' suppressHydrationWarning>
        {Intl.NumberFormat(undefined, { notation: 'compact' }).format(likes)} likes
      </div>
      <div className='flex items-center gap-2 mt-3'>
        <div className='flex-1 flex items-center gap-2 rounded-full bg-accent px-4 py-1.5'>
          <span className='text-sm text-muted-foreground'>Add a comment...</span>
          <PiSmileyStickerLight className='h-5 w-5 text-muted-foreground' />
        </div>
      </div>
    </div>
  )
}

function MediaCarousel({ media }: { media: PostMedia[] }) {
  return (
    <div className='relative'>
      <Carousel>
        <CarouselContent>
          {media.map((item) => (
            <CarouselItem key={item.id}>
              <div className='aspect-square relative'>
                <ResourcePreview resource={item.resource} hideActions className='w-full h-full' />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {media.length > 1 && (
          <>
            <CarouselPrevious className='absolute left-2 -translate-y-1/2 top-1/2' />
            <CarouselNext className='absolute right-2 -translate-y-1/2 top-1/2' />
          </>
        )}
      </Carousel>
    </div>
  )
}

function RegularPostPreview({ postData, previewUser }: InstagramPreviewProps<'post'>) {
  return (
    <>
      <PostHeader postData={postData} previewUser={previewUser} />
      {postData.media.length > 0 && <MediaCarousel media={postData.media} />}
      <div className='px-4 pt-2'>
        <TextPreview text={postData.text} platform='instagram' />
      </div>
      <PostActions />
    </>
  )
}

function ReelPostPreview({ postData, previewUser }: InstagramPreviewProps<'reel'>) {
  return (
    <div className='aspect-9/16 relative rounded-lg overflow-hidden'>
      {postData.resource && (
        <>
          <ResourcePreview resource={postData.resource} hideActions className='w-full h-full' />
          <div className='absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/40'>
            <div className='absolute bottom-20 left-4 right-20'>
              <div className='flex items-center gap-2 mb-4'>
                <Avatar className='h-10 w-10 ring-2 ring-white'>
                  <AvatarFallback>{previewUser.name[0]}</AvatarFallback>
                  <AvatarImage src={previewUser.avatar} alt={previewUser.name} />
                </Avatar>
                <span className='text-white font-semibold'>{previewUser.username}</span>
                <Button
                  variant='ghost'
                  size='sm'
                  className='ml-2 bg-white hover:bg-white/90 text-foreground'
                >
                  Follow
                </Button>
              </div>
              <TextPreview
                text={postData.description}
                platform='instagram'
                className={{
                  root: 'text-white',
                  text: 'text-white',
                  mention: 'text-white',
                  link: 'text-white',
                }}
              />
            </div>
            <div className='absolute bottom-20 right-2 flex flex-col items-center gap-4'>
              <Button variant='ghost' size='icon' className='text-white hover:text-white/90'>
                <PiHeart className='h-7 w-7' />
              </Button>
              <Button variant='ghost' size='icon' className='text-white hover:text-white/90'>
                <PiChatTeardrop className='h-7 w-7' />
              </Button>
              <Button variant='ghost' size='icon' className='text-white hover:text-white/90'>
                <PiPaperPlaneTilt className='h-7 w-7' />
              </Button>
              <Button variant='ghost' size='icon' className='text-white hover:text-white/90'>
                <PiBookmarkSimple className='h-7 w-7' />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StoryPostPreview({ postData, previewUser }: InstagramPreviewProps<'story'>) {
  return (
    <div className='aspect-9/16 relative rounded-lg overflow-hidden'>
      {postData.resource && (
        <>
          <ResourcePreview resource={postData.resource} hideActions className='w-full h-full' />
          <div className='absolute top-0 left-0 right-0 p-4'>
            <div className='flex items-center gap-2'>
              <Avatar className='h-8 w-8 ring-2 ring-primary'>
                <AvatarFallback>{previewUser.name[0]}</AvatarFallback>
                <AvatarImage src={previewUser.avatar} alt={previewUser.name} />
              </Avatar>
              <span className='text-white font-semibold text-sm'>{previewUser.username}</span>
              <span className='text-white/70 text-xs'>Just now</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
