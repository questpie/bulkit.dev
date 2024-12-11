'use client'
import { ResourceUploadDialog } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/resource-uploader'
import { Button } from '@bulkit/ui/components/ui/button'
import { useState } from 'react'
import { PiPlus } from 'react-icons/pi'
import { MediaPageHeader } from './media-header'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { mediaInfiniteQueryOptions } from '@bulkit/app/app/(main)/media/media.queries'

export function MediaEmptyState() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  return (
    <div className='flex flex-col'>
      <MediaPageHeader />
      <div className='text-center py-12'>
        <h2 className='text-2xl font-semibold mb-2'>No media yet</h2>
        <p className='text-muted-foreground mb-4'>Get started by uploading your first media</p>
        <Button onClick={() => setIsOpen(true)}>
          <PiPlus className='mr-2' /> Upload Media
        </Button>
      </div>

      <ResourceUploadDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onUploaded={() => {
          router.refresh()
          queryClient.invalidateQueries({ queryKey: mediaInfiniteQueryOptions({}).queryKey })
        }}
      />
    </div>
  )
}
