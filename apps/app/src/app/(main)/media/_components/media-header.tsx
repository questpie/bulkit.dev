'use client'
import { Header, HeaderButton } from '@bulkit/app/app/(main)/_components/header'
import { ResourceUploadDialog } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/resource-uploader'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { LuPlus } from 'react-icons/lu'
import { mediaInfiniteQueryOptions } from '../media.queries'
import { useRouter } from 'next/navigation'

export function MediaPageHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()

  return (
    <Header title='Media Library'>
      <ResourceUploadDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        hideTabs={['library']}
        onUploaded={() => {
          console.log('uploading', mediaInfiniteQueryOptions({}))
          router.refresh()
          queryClient.invalidateQueries(mediaInfiniteQueryOptions({}))
        }}
      />
      <HeaderButton icon={<LuPlus />} label='Upload Media' onClick={() => setIsOpen(true)} />
    </Header>
  )
}
