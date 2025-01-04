import { apiClient } from '@bulkit/app/api/api.client'
import { mediaInfiniteQueryOptions } from '@bulkit/app/app/(main)/media/media.queries'
import { ResourcePreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/resource-preview'
import type { AIImageProvider } from '@bulkit/shared/modules/admin/schemas/ai-image-providers.schemas'
import type { Resource } from '@bulkit/shared/modules/resources/resources.schemas'
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
import { Spinner } from '@bulkit/ui/components/ui/spinner'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { useDebouncedValue } from '@bulkit/ui/hooks/use-debounce'
import { cn } from '@bulkit/ui/lib'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { LuWand2 } from 'react-icons/lu'
import {
  PiFolder,
  PiImage,
  PiMagnifyingGlass,
  PiSparkle,
  PiUploadSimple,
  PiX,
} from 'react-icons/pi'

type ResourceUploaderTab = 'upload' | 'stock' | 'library' | 'ai'

type ResourceUploaderProps = {
  onUploaded?: (resources: Resource[]) => void
  allowedTypes?: string[]
  maxFiles?: number
  maxSize?: number // in bytes
  disabled?: boolean
  hideTabs?: ResourceUploaderTab[]
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
  const queryClient = useQueryClient()
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
      queryClient.invalidateQueries(mediaInfiniteQueryOptions({}))
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

type ResourceUploaderTabConfig = {
  id: ResourceUploaderTab
  label: string
  icon: React.ElementType
  disabled?: boolean
  soon?: boolean
  content: (props: {
    onSelect?: (resource: Resource) => void
    onUploaded?: (resources: Resource[]) => void
    onClose?: () => void
    uploaderProps?: ResourceUploaderProps
  }) => React.ReactNode
}

type TabContentProps = {
  onSelect?: (resource: Resource) => void
  onUploaded?: (resources: Resource[]) => void
  onClose?: () => void
  uploaderProps?: ResourceUploaderProps
}

function AITabContent(props: {
  onSelect: (resource: Resource) => void
}) {
  const [prompt, setPrompt] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResource, setGeneratedResource] = useState<Resource | null>(null)

  const { data: providers = [] } = useQuery({
    queryKey: ['ai', 'providers'],
    queryFn: async () => {
      const response = await apiClient.resources.ai.providers.get()
      if (response.error) throw response.error
      return response.data as AIImageProvider[]
    },
  })

  const [activeProvider, setActiveProvider] = useState<string | undefined>()

  // Initialize activeProvider when providers are loaded
  useEffect(() => {
    if (providers.length > 0 && !activeProvider) {
      setActiveProvider(providers[0]?.id)
    }
  }, [providers, activeProvider])

  const queryClient = useQueryClient()
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!activeProvider) throw new Error('No provider selected')

      let imageUrl: string | undefined
      if (imageFile) {
        const formData = new FormData()
        formData.append('files', imageFile)
        formData.append('isPrivate', 'true')

        const uploadResponse = await apiClient.resources.index.post({
          files: [imageFile] as any,
          isPrivate: true,
        })

        if (uploadResponse.error) throw uploadResponse.error
        imageUrl = uploadResponse.data[0]?.url
      }

      const response = await apiClient.resources.ai.generate.post({
        prompt,
        imageUrl,
        providerId: activeProvider,
      })

      if (response.error) throw response.error
      return response.data
    },
    onSuccess: (data) => {
      setGeneratedResource(data)
      setIsGenerating(false)
      queryClient.invalidateQueries(mediaInfiniteQueryOptions({}))
    },
    onError: (error: Error) => {
      toast.error('Failed to generate image', {
        description: error.message,
      })
      setIsGenerating(false)
    },
  })

  if (providers.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-full text-center p-4'>
        <PiImage className='w-12 h-12 text-muted-foreground/40' />
        <h3 className='mt-4 text-sm font-bold'>AI image generation not configured</h3>
        <p className='mt-2 text-xs text-muted-foreground max-w-xs'>
          Contact your administrator to configure AI image providers.
        </p>
      </div>
    )
  }

  const defaultProvider = providers[0]
  if (!defaultProvider) return null

  const selectedProvider = providers.find((p) => p.id === activeProvider)
  const hasImageToImage = selectedProvider?.capabilities.includes('image-to-image') ?? false

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 flex items-center justify-center'>
        {isGenerating ? (
          <Skeleton className='w-64 h-64 rounded-lg' />
        ) : generatedResource ? (
          <div className='relative w-64 h-64'>
            <ResourcePreview resource={generatedResource} className='w-full h-full rounded-lg' />
            <Button
              variant='secondary'
              size='sm'
              className='absolute bottom-2 right-2'
              onClick={() => {
                props.onSelect(generatedResource)
                setGeneratedResource(null)
                setPrompt('')
                setImageFile(null)
              }}
            >
              Use Image
            </Button>
          </div>
        ) : (
          <div className='flex flex-col items-center text-center'>
            <PiImage className='w-12 h-12 text-muted-foreground/40' />
            <p className='mt-2 text-sm text-muted-foreground'>
              Enter a prompt below to generate an image
            </p>
          </div>
        )}
      </div>

      <div className='space-y-4 pt-4 border-t'>
        <div className='flex flex-col gap-2'>
          <div className='flex flex-col gap-2'>
            <Textarea
              value={prompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
              placeholder='Describe the image you want to generate...'
              disabled={isGenerating}
            />
            <div className='flex items-center justify-between'>
              <Select
                value={activeProvider ?? defaultProvider.id}
                onValueChange={setActiveProvider}
                disabled={isGenerating}
              >
                <SelectTrigger className='h-6 gap-2 rounded-sm w-auto px-2 shadow-none text-xs'>
                  <p className='text-xs'>
                    Using {selectedProvider?.model ?? defaultProvider.model}
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

              <Button
                onClick={() => {
                  setIsGenerating(true)
                  generateMutation.mutate()
                }}
                disabled={!prompt || isGenerating || !activeProvider}
              >
                {isGenerating ? <Spinner /> : <LuWand2 className='h-4 w-4' />}
                Generate
              </Button>
            </div>
          </div>
        </div>

        {hasImageToImage && (
          <div className='flex items-center gap-2 pt-2 border-t'>
            <Input
              type='file'
              accept='image/*'
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setImageFile(e.target.files?.[0] ?? null)
              }
              disabled={isGenerating}
            />
            {imageFile && (
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setImageFile(null)}
                disabled={isGenerating}
              >
                <PiX className='h-4 w-4' />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const RESOURCE_UPLOADER_TABS: ResourceUploaderTabConfig[] = [
  {
    id: 'upload',
    label: 'Upload',
    icon: PiUploadSimple,
    content: (props: TabContentProps) => (
      <ResourceDropzone
        {...props.uploaderProps}
        className='h-full items-center justify-center'
        onUploaded={(resources) => {
          props.onUploaded?.(resources)
        }}
      />
    ),
  },
  {
    id: 'stock',
    label: 'Stock',
    icon: PiImage,
    content: (props: TabContentProps) => (
      <StockTabContent
        onSelect={async (image) => {
          const response = await apiClient.resources.stock.index.post({
            url: image.url,
            name: image.author,
            caption: image.alt,
            isPrivate: true,
          })

          if (response.error) {
            throw new Error(response.error.value.message)
          }

          props.onSelect?.(response.data)
        }}
      />
    ),
  },
  {
    id: 'library',
    label: 'Library',
    icon: PiFolder,
    content: (props: TabContentProps) => (
      <LibraryTabContent
        onSelect={(resource) => {
          props.onSelect?.(resource)
        }}
      />
    ),
  },
  {
    id: 'ai',
    label: 'AI Image',
    icon: PiSparkle,
    content: (props: TabContentProps) => (
      <AITabContent
        onSelect={(resource) => {
          props.onSelect?.(resource)
        }}
      />
    ),
  },
]

export function ResourceUploadDialog({
  open,
  onOpenChange,
  onUploaded,
  hideTabs = [],
  ...props
}: ResourceUploaderProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [activeTab, setActiveTab] = useState<ResourceUploaderTab>('upload')
  const availableTabs = RESOURCE_UPLOADER_TABS.filter((tab) => !hideTabs.includes(tab.id))

  useEffect(() => {
    if (hideTabs.includes(activeTab) && availableTabs.length > 0) {
      setActiveTab(availableTabs[0]!.id)
    }
  }, [hideTabs, activeTab, availableTabs])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl'>
        <DialogHeader>
          <DialogTitle>Select Resource</DialogTitle>
        </DialogHeader>
        <div className='flex md:flex-row flex-col h-[600px] gap-4 md:gap-2'>
          <div className='flex md:flex-col md:w-48 w-full gap-2 md:h-full pr-4 md:border-border md:border-r'>
            {availableTabs.map((tab) => (
              <Card
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex md:flex-row flex-col flex-1 md:flex-none items-center gap-2 p-4 rounded-lg border transition-colors',
                  activeTab === tab.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                )}
                asChild
              >
                <button type='button'>
                  <tab.icon className='h-5 w-5' />
                  <span className='text-sm w-full line-clamp-1 text-ellipsis font-bold'>
                    {tab.label}
                  </span>
                </button>
              </Card>
            ))}
          </div>

          <div className='flex-1'>
            {RESOURCE_UPLOADER_TABS.find((tab) => tab.id === activeTab)?.content({
              onSelect: (resource) => {
                onUploaded?.([resource])
                onOpenChange(false)
              },
              onUploaded,
              onClose: () => onOpenChange(false),
              uploaderProps: props,
            })}
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
