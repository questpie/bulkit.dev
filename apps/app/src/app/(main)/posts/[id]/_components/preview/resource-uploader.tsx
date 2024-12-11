import { apiClient } from '@bulkit/app/api/api.client'
import { mediaInfiniteQueryOptions } from '@bulkit/app/app/(main)/media/media.queries'
import { ResourcePreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/resource-preview'
import type { Resource } from '@bulkit/shared/modules/resources/resources.schemas'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@bulkit/ui/components/ui/dialog'
import { Input } from '@bulkit/ui/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { Skeleton } from '@bulkit/ui/components/ui/skeleton'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { useDebouncedValue } from '@bulkit/ui/hooks/use-debounce'
import { cn } from '@bulkit/ui/lib'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { PiFolder, PiImage, PiMagnifyingGlass, PiSparkle, PiUploadSimple } from 'react-icons/pi'

type ResourceUploaderProps = {
  onUploaded?: (resources: Resource[]) => void
  allowedTypes?: string[]
  maxFiles?: number
  maxSize?: number // in bytes
  disabled?: boolean
}

type StockImage = {
  id: string
  url: string
  thumbnailUrl: string
  alt: string
  author: string
}

function StockImageGrid({
  images,
  onSelect,
  isLoading,
}: {
  images: StockImage[]
  onSelect: (image: StockImage) => void
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        {Array.from({ length: 6 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <Skeleton key={i} className='aspect-square rounded-lg' />
        ))}
      </div>
    )
  }

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
      {images.map((image) => (
        <button
          type='button'
          key={image.id}
          onClick={() => onSelect(image)}
          className='group relative aspect-square overflow-hidden rounded-lg border bg-muted hover:bg-muted/80 transition-colors'
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.thumbnailUrl} alt={image.alt} className='object-cover w-full h-full' />
          <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2'>
            <span className='text-xs text-white truncate'>by {image.author}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

function StockTabContent(props: { onSelect: (image: StockImage) => void }) {
  const [search, setSearch] = useState('nature landscape')
  const debouncedSearch = useDebouncedValue(search, 500)

  const { data: providers = [] } = useQuery({
    queryKey: ['admin', 'stock-providers'],
    queryFn: async () => {
      const response = await apiClient.admin['stock-image-providers'].index.get()
      if (response.error) throw response.error
      return response.data
    },
  })

  const [activeProvider, setActiveProvider] = useState<string | undefined>(providers[0]?.id)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['stock-images', debouncedSearch, activeProvider],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.resources.stock.search.get({
        query: {
          query: debouncedSearch,
          per_page: 30,
          page: pageParam,
          provider: activeProvider,
        },
      })

      if (response.error) {
        throw new Error(response.error.value.message)
      }

      return response.data
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 30 ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
    enabled: search.length > 0 && !!activeProvider,
  })

  const images = data?.pages.flat() ?? []

  if (providers.length === 0) {
    return (
      <div className='h-full flex flex-col items-center justify-center text-center p-4'>
        <PiImage className='w-12 h-12 text-muted-foreground/40' />
        <h3 className='mt-4 text-sm font-bold'>Stock images not configured</h3>
        <p className='mt-2 text-xs text-muted-foreground max-w-xs'>
          Contact your administrator to configure stock image providers.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-4 h-full flex flex-col'>
      <div className='space-y-2'>
        <Input
          type='search'
          value={search}
          placeholder='Search stock images...'
          onChange={(e) => setSearch(e.target.value)}
          before={<PiMagnifyingGlass className='ml-3 text-muted-foreground' />}
        />
        {providers.length > 1 && (
          <Select value={activeProvider} onValueChange={setActiveProvider}>
            <SelectTrigger className='h-6 gap-2 rounded-sm w-auto px-2  shadow-none text-xs'>
              <p className='text-xs'>
                Using <SelectValue />
              </p>
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id} className='text-xs'>
                  {provider.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {providers.length === 1 && <p className='text-xs'>Using {providers[0]!.id}</p>}
      </div>
      <div className='overflow-y-auto flex-1 space-y-4'>
        <StockImageGrid images={images} onSelect={props.onSelect} isLoading={isLoading} />

        {hasNextPage && (
          <div className='flex justify-center pb-4'>
            <Button
              variant='outline'
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              size='sm'
            >
              {isFetchingNextPage ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function useResourceUploader({
  onUploaded,
  allowedTypes = ['image/*', 'video/*', 'audio/*'],
  maxFiles = 10,
  maxSize = 1024 * 1024 * 1024, // 1024MB
  disabled,
}: ResourceUploaderProps) {
  const mutation = useMutation({
    mutationFn: (...args: Parameters<typeof apiClient.resources.index.post>) =>
      apiClient.resources.index.post(...args).then((res) => {
        if (res.error) {
          throw new Error(res.error.value.message)
        }

        return res.data
      }),
    onSuccess: (data) => {
      onUploaded?.(data)
    },
  })

  const dropzone = useDropzone({
    disabled,
    onDropAccepted: useCallback(
      (acceptedFiles: File[]) => {
        toast.promise(
          mutation.mutateAsync({
            files: acceptedFiles as any,
            isPrivate: true,
          }),
          {
            loading: 'Uploading files...',
            success: 'Files uploaded',
            error: (err) => err.message,
          }
        )
      },
      [mutation]
    ),
    accept: allowedTypes?.reduce(
      (acc, type) => {
        acc[type] = []
        return acc
      },
      {} as Record<string, string[]>
    ),
    onDropRejected: (rejectedFiles) => {
      const uniqueErrorMessages = new Set<string>()
      for (const file of rejectedFiles) {
        for (const error of file.errors) {
          uniqueErrorMessages.add(error.message)
        }
      }
      const m = Array.from(uniqueErrorMessages).map((m, i) => (
        <>
          <span key={`${m}-span`}>{m}</span>
          <br key={`${m}-br`} />
        </>
      ))

      toast.error('Some files were rejected.', {
        description: m,
      })
    },
    maxSize,
    maxFiles,
  })

  return {
    ...dropzone,
    isUploading: mutation.isPending,
  }
}

export function ResourceDropzone(
  props: ResourceUploaderProps & {
    className?: React.ComponentProps<'div'>['className']
  }
) {
  const { getRootProps, getInputProps, isDragActive } = useResourceUploader(props)
  // TODO: add a middle step which opens a dialog, shows the selected file and lets you either cancel or upload

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 text-sm transition  text-muted-foreground duration-200 flex flex-col gap-4 hover:bg-accent/50 border-dashed border-border rounded-xl p-5 text-center cursor-pointer',
        isDragActive && 'bg-primary/20 border-primary text-primary',
        props.disabled && 'opacity-80 pointer-events-none',
        props.className
      )}
    >
      <PiUploadSimple className='h-12 w-12 mx-auto' />

      <input {...getInputProps()} />
      {isDragActive ? (
        <p className='text-sm text-center w-full'>Drop the files here ...</p>
      ) : (
        <p className='text-sm text-center w-full'>
          Drag 'n' drop some files here, or click to select files
        </p>
      )}
    </div>
  )
}

export function ResourceUploadDialog({
  open,
  onOpenChange,
  onUploaded,
  ...props
}: ResourceUploaderProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [activeTab, setActiveTab] = useState<'upload' | 'stock' | 'ai' | 'library'>('upload')

  const { data: stockProviders = [] } = useQuery({
    queryKey: ['admin', 'stock-providers'],
    queryFn: async () => {
      const response = await apiClient.admin['stock-image-providers'].index.get()
      if (response.error) throw response.error
      return response.data
    },
  })

  const stockSaveMutation = useMutation({
    mutationFn: async (image: StockImage) => {
      const response = await apiClient.resources.stock.index.post({
        url: image.url,
        caption: image.alt,
        isPrivate: true,
      })

      if (response.error) {
        throw new Error(response.error.value.message)
      }

      return response.data
    },
  })

  const handleStockImageSelect = (image: StockImage) => {
    toast.promise(stockSaveMutation.mutateAsync(image), {
      loading: 'Saving stock image...',
      success: (resource) => {
        onUploaded?.([resource])
        onOpenChange(false)
        return 'Stock image saved'
      },
      error: 'Failed to save stock image',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl'>
        <DialogHeader>
          <DialogTitle>Select Resource</DialogTitle>
        </DialogHeader>
        <div className='flex md:flex-row flex-col h-[600px] gap-4 md:gap-2'>
          <div className='flex md:flex-col md:w-48 w-full gap-2 md:h-full pr-4 md:border-border md:border-r'>
            <Card
              onClick={() => setActiveTab('upload')}
              className={cn(
                'flex md:flex-row flex-col flex-1 md:flex-none items-center gap-2 p-4 rounded-lg border transition-colors',
                activeTab === 'upload' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              )}
              asChild
            >
              <button type='button'>
                <PiUploadSimple className='h-5 w-5' />
                <span className='text-sm w-full line-clamp-1 text-ellipsis font-bold'>Upload</span>
              </button>
            </Card>
            <Card
              onClick={() => setActiveTab('stock')}
              className={cn(
                'flex md:flex-row flex-col flex-1 md:flex-none items-center gap-2 p-4 rounded-lg border transition-colors relative',
                activeTab === 'stock' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                // stockProviders.length === 0 && 'opacity-50 cursor-not-allowed hover:bg-transparent'
              )}
              asChild
            >
              <button type='button'>
                <PiImage className='h-5 w-5' />
                <span className='text-sm w-full line-clamp-1 text-ellipsis font-bold'>Stock</span>
              </button>
            </Card>
            <Card
              onClick={() => setActiveTab('library')}
              className={cn(
                'flex md:flex-row flex-col flex-1 md:flex-none items-center gap-2 p-4 rounded-lg border transition-colors',
                activeTab === 'library' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              )}
              asChild
            >
              <button type='button'>
                <PiFolder className='h-5 w-5' />
                <span className='text-sm w-full line-clamp-1 text-ellipsis font-bold'>Library</span>
              </button>
            </Card>
            <Card
              className='flex md:flex-row flex-1 md:flex-none relative flex-col items-center gap-2 p-4 rounded-lg border opacity-50 cursor-not-allowed'
              asChild
            >
              <button type='button' disabled>
                <PiSparkle className='h-5 w-5' />
                <span className='text-sm w-full line-clamp-1 text-ellipsis font-bold'>
                  AI Image
                </span>
                <Badge
                  size='sm'
                  variant='warning'
                  className='ml-1 absolute rotate-12 -top-1 -right-3 text-xs text-muted-foreground flex items-center gap-1'
                >
                  Soon
                </Badge>
              </button>
            </Card>
          </div>

          <div className='flex-1'>
            {activeTab === 'upload' && (
              <ResourceDropzone
                {...props}
                className='h-full items-center justify-center'
                onUploaded={(resources) => {
                  onUploaded?.(resources)
                  onOpenChange(false)
                }}
              />
            )}

            {activeTab === 'stock' && <StockTabContent onSelect={handleStockImageSelect} />}

            {activeTab === 'library' && (
              <LibraryTabContent
                onSelect={(resource) => {
                  onUploaded?.([resource])
                  onOpenChange(false)
                }}
              />
            )}

            {activeTab === 'ai' && <div>{/* AI image generation will go here */}</div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ResourceButtonUpload(
  props: ResourceUploaderProps & {
    buttonProps?: React.ComponentProps<typeof Button>
  }
) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        disabled={props.disabled}
        {...props.buttonProps}
        type='button'
        onClick={() => setOpen(true)}
        className={cn('border', props.buttonProps?.className)}
      >
        <PiUploadSimple className='mr-2' />
        Upload files
      </Button>

      <ResourceUploadDialog open={open} onOpenChange={setOpen} {...props} />
    </>
  )
}

function LibraryTabContent(props: { onSelect: (resource: Resource) => void }) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 500)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    mediaInfiniteQueryOptions({ search: debouncedSearch })
  )

  const resources = data?.pages.flatMap((page) => page.data) ?? []

  return (
    <div className='space-y-4 h-full flex flex-col'>
      <Input
        type='search'
        value={search}
        placeholder='Search resources...'
        onChange={(e) => setSearch(e.target.value)}
        before={<PiMagnifyingGlass className='ml-3 text-muted-foreground' />}
      />

      <div className='overflow-y-auto flex-1'>
        {isLoading ? (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {Array.from({ length: 8 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <Skeleton key={i} className='aspect-square rounded-lg' />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className='h-full flex flex-col items-center justify-center text-center p-4'>
            <PiFolder className='w-12 h-12 text-muted-foreground/40' />
            <h3 className='mt-4 text-sm font-bold'>No resources found</h3>
            <p className='mt-2 text-xs text-muted-foreground max-w-xs'>
              {search ? 'Try a different search term' : 'Upload some resources to get started'}
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {resources.map((resource) => (
                <Card
                  key={resource.id}
                  className='cursor-pointer hover:border-primary transition-colors'
                  onClick={() => props.onSelect(resource)}
                >
                  <ResourcePreview
                    resource={resource}
                    className='w-full aspect-square'
                    hideActions
                  />
                </Card>
              ))}
            </div>

            {hasNextPage && (
              <div className='flex justify-center py-4'>
                <Button
                  variant='outline'
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  size='sm'
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
