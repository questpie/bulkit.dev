'use client'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import type { Resource } from '@bulkit/api/modules/resources/services/resources.service'
import type { PreviewPostProps } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/post-preview'
import { TextPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/text-preview'
import { ResourcePreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/resource-preview'
import { POST_TYPE_ICON } from '@bulkit/app/app/(main)/posts/post.constants'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@bulkit/ui/components/ui/carousel'
import Image from 'next/image'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { PiBookmarkSimple, PiChatTeardrop, PiHeart, PiPaperPlaneTilt } from 'react-icons/pi'

export function InstagramPreview(props: PreviewPostProps) {
  const { watch } = useFormContext<Post>()
  const postData = watch()
  const Icon = POST_TYPE_ICON[postData.type]

  const renderPreview = () => {
    switch (postData.type) {
      case 'post':
        return <RegularPostPreview postData={postData} previewUser={props.previewUser} />
      case 'reel':
        return <ReelPreview postData={postData} previewUser={props.previewUser} />
      case 'story':
        return <StoryPreview postData={postData} previewUser={props.previewUser} />
      case 'thread':
        return <CarouselPostPreview postData={postData} previewUser={props.previewUser} />
      default:
        return <div>Unsupported post type</div>
    }
  }

  return (
    <div className='bg-background w-full mx-auto border border-border rounded-md overflow-hidden'>
      {renderPreview()}
    </div>
  )
}

function PostHeader({ previewUser }: { previewUser: PreviewPostProps['previewUser'] }) {
  return (
    <div className='flex items-center p-3'>
      <Avatar className='w-8 h-8'>
        <AvatarFallback>{previewUser.name[0]}</AvatarFallback>
        <AvatarImage src={previewUser.avatar} alt={previewUser.name} />
      </Avatar>
      <span className='ml-2 font-semibold text-sm'>{previewUser.username}</span>
    </div>
  )
}

function PostFooter() {
  const [likes] = useState(Math.floor(Math.random() * 1000))

  return (
    <div className='px-3 py-2'>
      <div className='flex justify-between mb-2'>
        <div className='flex space-x-4'>
          <PiHeart className='w-6 h-6' />
          <PiChatTeardrop className='w-6 h-6' />
          <PiPaperPlaneTilt className='w-6 h-6' />
        </div>
        <PiBookmarkSimple className='w-6 h-6' />
      </div>
      <div className='font-semibold text-sm' suppressHydrationWarning>
        {likes} likes
      </div>
    </div>
  )
}

function PostCarousel(props: { resources: Resource[] }) {
  return (
    <Carousel className='relative'>
      <CarouselContent>
        {props.resources.map((resource) => (
          <CarouselItem key={resource.id} className='relative w-full aspect-square'>
            <ResourcePreview hideActions resource={resource} className='border-none rounded-none' />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className='disabled:hidden absolute left-4 -translate-y-1/2 top-1/2 z-10' />
      <CarouselNext className='disabled:hidden absolute right-4 -translate-y-1/2 top-1/2 z-10' />
      {/* <CarouselPrevious />
          <CarouselNext /> */}
    </Carousel>
  )
}

function RegularPostPreview({
  postData,
  previewUser,
}: { postData: Post & { type: 'post' }; previewUser: PreviewPostProps['previewUser'] }) {
  const resources = postData.media.map((m) => m.resource)
  return (
    <div>
      <PostHeader previewUser={previewUser} />
      <PostCarousel resources={resources} />
      <PostFooter />
      <div className='px-3 pb-3'>
        <TextPreview text={postData.text} className={{ root: 'text-sm' }} />
      </div>
    </div>
  )
}

function ReelPreview({
  postData,
  previewUser,
}: { postData: Post & { type: 'reel' }; previewUser: PreviewPostProps['previewUser'] }) {
  return (
    <div className='relative aspect-[9/16] bg-black'>
      {postData.resource && (
        <video
          src={postData.resource.url}
          className='w-full h-full object-cover'
          loop
          muted
          playsInline
        />
      )}
      <div className='absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent'>
        <div className='flex items-center'>
          <Avatar className='w-8 h-8'>
            <AvatarFallback>{previewUser.name[0]}</AvatarFallback>
            <AvatarImage src={previewUser.avatar} alt={previewUser.name} />
          </Avatar>
          <span className='ml-2 font-semibold text-sm text-white'>{previewUser.username}</span>
        </div>
        <TextPreview text={postData.description} className={{ root: 'text-sm text-white mt-2' }} />
      </div>
    </div>
  )
}

function StoryPreview({
  postData,
  previewUser,
}: { postData: Post & { type: 'story' }; previewUser: PreviewPostProps['previewUser'] }) {
  return (
    <div className='relative aspect-[9/16] bg-muted'>
      {postData.resource && (
        <ResourcePreview
          resource={postData.resource}
          hideActions
          className='aspect-auto h-full w-auto border-none'
        />
      )}
      <div className='absolute top-4 left-4 flex items-center'>
        <Avatar className='w-8 h-8 ring-2 ring-white'>
          <AvatarFallback>{previewUser.name[0]}</AvatarFallback>
          <AvatarImage src={previewUser.avatar} alt={previewUser.name} />
        </Avatar>
        <span className='ml-2 font-semibold text-sm text-white'>{previewUser.username}</span>
      </div>
    </div>
  )
}

function CarouselPostPreview({
  postData,
  previewUser,
}: { postData: Post & { type: 'thread' }; previewUser: PreviewPostProps['previewUser'] }) {
  const combinedText = postData.items.map((item, i) => `${item.text}`).join('\n\n')

  const resources = postData.items.flatMap((item) => item.media).map((m) => m.resource)

  return (
    <div>
      <PostHeader previewUser={previewUser} />
      <PostCarousel resources={resources} />
      <PostFooter />
      <div className='px-3 pb-3'>
        <TextPreview text={combinedText} className={{ root: 'text-sm' }} />
      </div>
    </div>
  )
}
