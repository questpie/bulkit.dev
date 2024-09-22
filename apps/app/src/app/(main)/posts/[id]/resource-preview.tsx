import type { Resource } from '@bulkit/api/modules/resources/services/resources.service'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@bulkit/ui/components/ui/responsive-dialog'
import { cn } from '@bulkit/ui/lib'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  LuEye,
  LuFile,
  LuFilm,
  LuImage,
  LuMoreVertical,
  LuMusic,
  LuPlay,
  LuTrash,
} from 'react-icons/lu'

type ResourcePreviewProps = {
  resource: Resource
  variant?: 'square' | 'wide'
  className?: string
  hideActions?: boolean
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
  allowPreview = true,
  hideActions = false,
}: ResourcePreviewProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const isVideo = resource.type.startsWith('video/')

  useEffect(() => {
    const generateThumbnail = async () => {
      if (resource.type.startsWith('video/')) {
        try {
          const video = document.createElement('video')
          video.src = resource.url
          video.crossOrigin = 'anonymous'
          video.currentTime = 1 // Set to 1 second to avoid black frames at the start

          await new Promise((resolve) => {
            video.addEventListener('loadeddata', resolve, { once: true })
            video.load()
          })

          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)

          const thumbnailDataUrl = canvas.toDataURL('image/jpeg')
          setThumbnailUrl(thumbnailDataUrl)
        } catch (error) {
          console.error('Error generating video thumbnail:', error)
        }
      } else if (resource.type.startsWith('image/')) {
        setThumbnailUrl(resource.url)
      } else {
        setThumbnailUrl(null)
      }
    }

    generateThumbnail()
  }, [resource])

  const Icon = getPlaceholderIcon(resource.type)

  const renderThumbnail = () => (
    <div className='relative w-full h-full'>
      {thumbnailUrl ? (
        <>
          <Image src={thumbnailUrl} alt={resource.location} layout='fill' objectFit='cover' />
        </>
      ) : (
        <div className='flex flex-col justify-center items-center h-full text-center gap-2'>
          <Icon className='w-12 h-12 text-muted-foreground' />
        </div>
      )}
      {isVideo && thumbnailUrl ? (
        <div className='absolute inset-0 flex items-center justify-center bg-black/30'>
          <LuPlay className='w-8 h-8 text-white' />
        </div>
      ) : null}
    </div>
  )

  const handleOpenPreview = () => {
    setIsPreviewOpen(true)
  }

  const renderActionsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          className='absolute group-hover:opacity-100 opacity-0 z-20 rounded-full h-6 w-6 top-0 right-0 p-1 text-sm'
          size='icon'
          variant='outline'
        >
          <LuMoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {allowPreview && (
          <DropdownMenuItem onClick={handleOpenPreview} className='cursor-pointer gap-2'>
            <LuEye /> Open Preview
          </DropdownMenuItem>
        )}
        {onRemove && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRemove} className='cursor-pointer gap-2 text-destructive'>
              <LuTrash /> Remove
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (variant === 'square') {
    return (
      <>
        <Card
          className={cn('w-auto h-auto aspect-square group relative overflow-hidden', className)}
        >
          {renderThumbnail()}
          {!hideActions && renderActionsDropdown()}
        </Card>
        {isPreviewOpen && (
          <ResourceDialogPreview resource={resource} onClose={() => setIsPreviewOpen(false)} />
        )}
      </>
    )
  }

  return (
    <>
      <Card className={cn('flex flex-row items-center gap-4 p-2 overflow-hidden', className)}>
        <div className='w-16 h-16 flex-shrink-0'>{renderThumbnail()}</div>
        <div className='flex-grow min-w-0'>
          <p className='text-sm font-medium truncate'>{resource.location.split('/').pop()}</p>
        </div>
        {!hideActions && renderActionsDropdown()}
      </Card>
      {isPreviewOpen && (
        <ResourceDialogPreview resource={resource} onClose={() => setIsPreviewOpen(false)} />
      )}
    </>
  )
}

type ResourceDialogPreviewProps = {
  resource: Resource
  onClose: () => void
}

export function ResourceDialogPreview({ resource, onClose }: ResourceDialogPreviewProps) {
  return (
    <ResponsiveDialog open={true} onOpenChange={onClose} activeSnapPoint={1}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{resource.location.split('/').pop()}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        {/* Add preview content based on resource type */}
        {resource.type.startsWith('image/') && (
          <img src={resource.url} alt={resource.location} style={{ maxWidth: '100%' }} />
        )}
        {resource.type.startsWith('video/') && (
          <video src={resource.url} controls style={{ maxWidth: '100%' }}>
            <track kind='captions' />
          </video>
        )}
        {/* Add more preview types as needed */}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
