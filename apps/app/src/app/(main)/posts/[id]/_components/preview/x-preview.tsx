'use client'
import { useState, useEffect } from 'react'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import type { PreviewPostProps } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/post-preview'
import { TextPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/text-preview'
import { POST_TYPE_ICON } from '@bulkit/app/app/(main)/posts/post.constants'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import Image from 'next/image'
import { useFormContext } from 'react-hook-form'
import { PiBookmarkSimple, PiChartBar, PiChatTeardrop, PiHeart, PiRepeat } from 'react-icons/pi'

export function XPreview(props: PreviewPostProps) {
  const { watch } = useFormContext<Post>()
  const postData = watch()
  const Icon = POST_TYPE_ICON[postData.type]

  const renderPreview = () => {
    switch (postData.type) {
      case 'post':
        return <RegularPostPreview postData={postData} previewUser={props.previewUser} />
      case 'short':
        return <ShortPostPreview postData={postData} previewUser={props.previewUser} />
      case 'thread':
        return <ThreadPostPreview postData={postData} previewUser={props.previewUser} />
      default:
        return <div>Unsupported post type</div>
    }
  }

  return (
    <div className='bg-background relative'>
      {renderPreview()}
      <div className='mt-4 flex items-center text-muted-foreground'>
        <Icon className='mr-2' />
        <span suppressHydrationWarning>{new Date(postData.createdAt).toLocaleString()}</span>
      </div>
    </div>
  )
}

function PostFooter() {
  // helps to prevent rerenders
  const [comments] = useState(Math.floor(Math.random() * 100))
  const [retweets] = useState(Math.floor(Math.random() * 100))
  const [likes] = useState(Math.floor(Math.random() * 100))
  const [views] = useState(Math.floor(Math.random() * 10000))

  return (
    <div className='mt-4 flex ml-2 justify-between text-sm text-muted-foreground'>
      <span className='flex items-center gap-1' suppressHydrationWarning>
        <PiChatTeardrop /> {comments}
      </span>
      <span className='flex items-center gap-1' suppressHydrationWarning>
        <PiRepeat /> {retweets}
      </span>
      <span className='flex items-center gap-1' suppressHydrationWarning>
        <PiHeart /> {likes}
      </span>
      <span className='flex items-center gap-1' suppressHydrationWarning>
        <PiChartBar />{' '}
        {Intl.NumberFormat(undefined, {
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(views)}
      </span>
      <span className='flex items-center gap-1'>
        <PiBookmarkSimple />
      </span>
    </div>
  )
}

function RegularPostPreview({
  postData,
  previewUser,
}: { postData: Post & { type: 'post' }; previewUser: PreviewPostProps['previewUser'] }) {
  return (
    <div className='mb-4 relative pl-12'>
      <div className='absolute left-1 top-0'>
        <Avatar>
          <AvatarFallback>{previewUser.name[0]}</AvatarFallback>
          <AvatarImage src={previewUser.avatar} alt={previewUser.name} />
        </Avatar>
      </div>
      <div className='flex items-center gap-2 ml-2'>
        <span className='font-bold text-sm'>{previewUser.name}</span>
        <span className='text-muted-foreground text-xs'>@{previewUser.username}</span>
      </div>
      <TextPreview text={postData.text} className={{ root: 'mb-2 ml-2' }} />
      {postData.media.length > 0 && (
        <div
          className={`grid gap-2 ${postData.media.length === 1 ? 'grid-cols-1' : postData.media.length === 2 ? 'grid-cols-2' : postData.media.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}
        >
          {postData.media.slice(0, 4).map((media, index) => (
            <div
              key={media.id}
              className={`relative ${postData.media.length === 3 && index === 0 ? 'col-span-2' : ''}`}
            >
              <Image
                src={media.resource.url}
                alt={media.resource.location}
                width={400}
                height={400}
                className='rounded-md object-cover w-full h-full'
              />
              {index === 3 && postData.media.length > 4 && (
                <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md'>
                  <span className='text-white font-bold'>+{postData.media.length - 4} more</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <PostFooter />
    </div>
  )
}

function ShortPostPreview({
  postData,
  previewUser,
}: { postData: Post & { type: 'short' }; previewUser: PreviewPostProps['previewUser'] }) {
  return (
    <div className='mb-4 relative pl-12'>
      <div className='absolute left-1 top-0'>
        <Avatar>
          <AvatarFallback>{previewUser.name[0]}</AvatarFallback>
          <AvatarImage src={previewUser.avatar} alt={previewUser.name} />
        </Avatar>
      </div>
      <div className='flex items-center gap-2 ml-2'>
        <span className='font-bold text-sm'>{previewUser.name}</span>
        <span className='text-muted-foreground text-xs'>@{previewUser.username}</span>
      </div>
      <TextPreview text={postData.description} className={{ root: 'mb-2 ml-2' }} />
      {postData.resource && (
        <div className='relative w-full aspect-video'>
          {postData.resource.type.startsWith('video') ? (
            <video
              src={postData.resource.url}
              className='w-full h-full object-cover rounded-md'
              controls
            />
          ) : (
            <Image
              src={postData.resource.url}
              alt={postData.resource.location}
              layout='fill'
              objectFit='cover'
              className='rounded-md'
            />
          )}
          {postData.resource.type.startsWith('video') && (
            <div className='absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-sm px-1 rounded'>
              0:00
            </div>
          )}
        </div>
      )}
      <PostFooter />
    </div>
  )
}

function StoryPostPreview({ postData }: { postData: Post & { type: 'story' } }) {
  return null
}

function ThreadPostPreview({
  postData,
  previewUser,
}: { postData: Post & { type: 'thread' }; previewUser: PreviewPostProps['previewUser'] }) {
  return (
    <div className='mb-4'>
      {postData.items.map((item, index) => (
        <div key={item.id} className='relative pl-12 pt-1 pb-4'>
          {<div className='absolute top-0 left-6 w-0.5 h-full bg-border' />}
          <div className='absolute left-1 top-0'>
            <Avatar>
              <AvatarFallback>{previewUser.name[0]}</AvatarFallback>
              <AvatarImage src={previewUser.avatar} alt={previewUser.name} />
            </Avatar>
          </div>
          <div className='flex items-center gap-2 ml-2'>
            <span className='font-bold text-sm'>{previewUser.name}</span>
            <span className='text-muted-foreground text-xs'>@{previewUser.username}</span>
          </div>
          <TextPreview text={item.text} className={{ root: 'mb-2 ml-2' }} />
          {item.media.length > 0 && (
            <div
              className={`grid gap-2 ${item.media.length === 1 ? 'grid-cols-1' : item.media.length === 2 ? 'grid-cols-2' : item.media.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}
            >
              {item.media.slice(0, 4).map((media, mediaIndex) => (
                <div
                  key={media.id}
                  className={`relative ${item.media.length === 3 && mediaIndex === 0 ? 'col-span-2' : ''}`}
                >
                  {media.resource.type.startsWith('video') ? (
                    <video
                      src={media.resource.url}
                      className='w-full h-full object-cover rounded-md'
                    />
                  ) : (
                    <Image
                      src={media.resource.url}
                      alt={media.resource.location}
                      width={150}
                      height={150}
                      className='rounded-md object-cover w-full h-full'
                    />
                  )}
                  {mediaIndex === 3 && item.media.length > 4 && (
                    <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md'>
                      <span className='text-white text-lg font-bold'>
                        +{item.media.length - 4} more
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <PostFooter />
        </div>
      ))}
      <div className='mt-2 text-muted-foreground'>
        <span>Show this thread</span>
      </div>
    </div>
  )
}
