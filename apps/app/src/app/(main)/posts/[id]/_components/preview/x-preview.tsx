'use client'

import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { POST_TYPE_ICON } from '@bulkit/app/app/(main)/posts/post.constants'
import Image from 'next/image'
import { useFormContext } from 'react-hook-form'

export function XPreview() {
  const { watch } = useFormContext<Post>()
  const postData = watch()

  const Icon = POST_TYPE_ICON[postData.type]

  const renderPreview = () => {
    switch (postData.type) {
      case 'post':
        return <RegularPostPreview postData={postData} />
      case 'short':
        return <ShortPostPreview postData={postData} />
      case 'story':
        return <StoryPostPreview postData={postData} />
      case 'thread':
        return <ThreadPostPreview postData={postData} />
      default:
        return <div>Unsupported post type</div>
    }
  }

  return (
    <div className='bg-background p-4 rounded-lg shadow-md max-w-md mx-auto'>
      <div className='flex items-center mb-4'>
        <div className='w-12 h-12 bg-border rounded-full mr-3' />
        <div>
          <h3 className='font-bold'>User Name</h3>
          <p className='text-muted-foreground'>@username</p>
        </div>
      </div>
      {renderPreview()}
      <div className='mt-4 flex items-center text-gray-500'>
        <Icon className='mr-2' />
        <span>{new Date(postData.createdAt).toLocaleString()}</span>
      </div>
    </div>
  )
}

function RegularPostPreview({ postData }: { postData: Post & { type: 'post' } }) {
  return (
    <>
      <p className='mb-4 whitespace-pre'>{postData.text}</p>
      {postData.media.length > 0 && (
        <div className='grid grid-cols-2 gap-2'>
          {postData.media.map((media) => (
            <Image
              key={media.id}
              src={media.resource.url}
              alt={media.resource.location}
              width={200}
              height={200}
              className='rounded-md'
            />
          ))}
        </div>
      )}
    </>
  )
}

function ShortPostPreview({ postData }: { postData: Post & { type: 'short' } }) {
  return (
    <>
      <p className='mb-4 whitespace-pre'>{postData.description}</p>
      {postData.resource?.type.startsWith('video') ? (
        <video
          key={postData.resource.id}
          src={postData.resource.url}
          alt={postData.resource.location}
        />
      ) : postData.resource ? (
        <Image
          src={postData.resource.url}
          alt={postData.resource.location}
          width={400}
          height={300}
          className='rounded-md'
        />
      ) : null}
    </>
  )
}

function StoryPostPreview({ postData }: { postData: Post & { type: 'story' } }) {
  return (
    <>
      {postData.resource && (
        <Image
          src={postData.resource.url}
          alt={postData.resource.location}
          width={400}
          height={600}
          className='rounded-md'
        />
      )}
    </>
  )
}

function ThreadPostPreview({ postData }: { postData: Post & { type: 'thread' } }) {
  return (
    <div className='border-l-2 border-border pl-4'>
      {postData.items.map((item, index) => (
        <div key={item.id} className='mb-4'>
          <p>{item.text}</p>
          {item.media.length > 0 && (
            <div className='grid grid-cols-2 gap-2 mt-2'>
              {item.media.map((media) => {
                if (media.resource.type.startsWith('video')) {
                  return (
                    <video key={media.id} src={media.resource.url} alt={media.resource.location} />
                  )
                }

                return (
                  <Image
                    key={media.id}
                    src={media.resource.url}
                    alt={media.resource.location}
                    width={150}
                    height={150}
                    className='rounded-md'
                  />
                )
              })}
            </div>
          )}
          {index < postData.items.length - 1 && (
            <div className='h-4 border-l-2 border-border ml-2 mt-2' />
          )}
        </div>
      ))}
    </div>
  )
}
