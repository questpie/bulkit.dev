import type { Resource } from '@bulkit/api/modules/resources/services/resources.service'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
import { cn } from '@bulkit/ui/lib'
import Image from 'next/image'
import { LuFile, LuFilm, LuImage, LuMusic, LuX } from 'react-icons/lu'

type ResourcePreviewProps = {
  resource: Resource
  variant?: 'square' | 'wide'
  className?: string

  onRemove?: () => void

  allowPreview?: boolean
}

const getPlaceholderIcon = (mimeType: string) => {
  switch (mimeType.split('/')[0]) {
    case 'audio':
      return LuMusic
    case 'video':
      return LuFilm
    case 'image':
      return LuImage
    default:
      return LuFile
  }
}

export function ResourcePreview({
  resource,
  variant = 'square',
  className,
  onRemove,
}: ResourcePreviewProps) {
  const isImage = resource.type.startsWith('image/')
  const thumbnailUrl = isImage ? resource.url : null // Replace with your placeholder image
  const Icon = getPlaceholderIcon(resource.type)

  const renderThumbnail = () => (
    <div className='relative w-full h-full'>
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={resource.location}
          layout='fill'
          objectFit='cover'
          className='rounded-md'
        />
      ) : (
        <div className='flex flex-col justify-center items-center h-full text-center gap-2'>
          <Icon className='w-12 h-12 text-muted-foreground' />
        </div>
      )}

      {/* {!isImage && (
        <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-xs'>
          {resource.type.split('/')[0]}
        </div>
      )} */}
    </div>
  )

  if (variant === 'square') {
    return (
      <Card className={cn('w-24 h-24 group  relative', className)}>
        {renderThumbnail()}

        {/* <div className='absolute inset-0 flex items-center rounded-xl justify-center bg-background opacity-0 cursor-pointer hover:opacity-50 transition-opacity z-10' /> */}

        {onRemove && (
          <Button
            type='button'
            className='absolute group-hover:opacity-100 opacity-0 z-20 rounded-full h-6 w-6  -top-2 -right-2 p-1 text-sm'
            onClick={onRemove}
            size='icon'
            variant='outline'
          >
            <LuX />
          </Button>
        )}
      </Card>
    )
  }

  return (
    <Card className={cn('flex flex-row items-center gap-4 p-2', className)}>
      <div className='w-16 h-16 flex-shrink-0'>{renderThumbnail()}</div>
      <div className='flex-grow min-w-0'>
        <p className='text-sm font-medium truncate'>{resource.location.split('/').pop()}</p>
      </div>
    </Card>
  )
}
