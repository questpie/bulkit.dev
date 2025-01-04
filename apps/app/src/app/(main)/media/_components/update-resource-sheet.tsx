'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import type { Resource, UpdateResource } from '@bulkit/shared/modules/resources/resources.schemas'
import { Button } from '@bulkit/ui/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@bulkit/ui/components/ui/form'
import { Input } from '@bulkit/ui/components/ui/input'
import {
  ResponsiveConfirmDialog,
  ResponsiveConfirmDialogTrigger,
} from '@bulkit/ui/components/ui/responsive-dialog'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@bulkit/ui/components/ui/sheet'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { mediaInfiniteQueryOptions } from '../media.queries'
import { formatBytes } from '@bulkit/shared/utils/format'
import { ResourceDialogPreview } from '../../posts/[id]/_components/preview/resource-preview'
import { PiArrowsOutSimple, PiFloppyDisk, PiTrash } from 'react-icons/pi'

type UpdateResourceSheetProps = {
  resource: Resource | null
  onClose: () => void
}

export function UpdateResourceSheet(props: UpdateResourceSheetProps) {
  const queryClient = useQueryClient()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const form = useForm<UpdateResource>({
    defaultValues: {
      name: '',
      caption: '',
    },
  })

  useEffect(() => {
    if (props.resource) {
      form.reset({
        name: props.resource.name ?? '',
        caption: props.resource.caption ?? '',
      })
    }
  }, [props.resource, form])

  const handleUpdate = async (data: UpdateResource) => {
    if (!props.resource) return

    const response = await apiClient.resources({ id: props.resource.id }).patch(data)

    if (response.error) {
      toast.error('Failed to update resource')
      return
    }

    toast.success('Resource updated')
    queryClient.invalidateQueries({ queryKey: mediaInfiniteQueryOptions({}).queryKey })
    props.onClose()
  }

  const handleDelete = async (): Promise<boolean> => {
    if (!props.resource) return false

    const response = await apiClient.resources({ id: props.resource.id }).delete()

    if (response.error) {
      toast.error('Failed to delete resource')
      return false
    }

    toast.success('Resource deleted')
    queryClient.invalidateQueries({ queryKey: mediaInfiniteQueryOptions({}).queryKey })
    props.onClose()
    return true
  }

  const isVideo = props.resource?.type.startsWith('video/')
  const isImage = props.resource?.type.startsWith('image/')

  return (
    <>
      <Sheet open={!!props.resource} onOpenChange={() => props.onClose()}>
        <SheetContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUpdate)}
              className='h-full flex flex-col relative gap-4'
            >
              <SheetHeader className='mb-4'>
                <SheetTitle className='text-lg font-semibold'>Edit Resource</SheetTitle>
              </SheetHeader>

              <div className='flex flex-1 overflow-auto flex-col gap-4'>
                {props.resource && isImage && (
                  <div className='relative'>
                    <img
                      src={props.resource.url}
                      alt={props.resource.name || 'Media preview'}
                      className='w-full aspect-video object-contain'
                    />
                    <Button
                      variant='ghost'
                      size='icon'
                      className='absolute top-2 right-2'
                      onClick={() => setShowFullscreen(true)}
                    >
                      <PiArrowsOutSimple className='h-4 w-4' />
                    </Button>
                  </div>
                )}

                {props.resource && isVideo && (
                  <div className='relative'>
                    <video
                      src={props.resource.url}
                      controls
                      className='w-full aspect-video object-contain'
                    >
                      <track kind='captions' src='' label='English' />
                    </video>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='absolute top-2 right-2'
                      onClick={() => setShowFullscreen(true)}
                    >
                      <PiArrowsOutSimple className='h-4 w-4' />
                    </Button>
                  </div>
                )}

                {props.resource && (
                  <div className='grid grid-cols-2 gap-2 text-sm mt-4 mb-6 p-4 rounded-lg bg-muted'>
                    <div>
                      <p className='text-muted-foreground'>Type</p>
                      <p>{props.resource.type}</p>
                    </div>
                    <div>
                      <p className='text-muted-foreground'>Size</p>
                      <p>
                        {props.resource.metadata?.sizeInBytes
                          ? formatBytes(props.resource.metadata?.sizeInBytes)
                          : 'Not computed'}{' '}
                      </p>
                    </div>
                    <div>
                      <p className='text-muted-foreground'>Width</p>
                      <p>{props.resource.metadata?.width ?? 'Not available'}</p>
                    </div>
                    <div>
                      <p className='text-muted-foreground'>Height</p>
                      <p>{props.resource.metadata?.height ?? 'Not available'}</p>
                    </div>

                    <div>
                      <p className='text-muted-foreground'>Uploaded</p>
                      <p>{new Date(props.resource.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name='name'
                  render={(props) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...props.field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='caption'
                  render={(props) => (
                    <FormItem>
                      <FormLabel>Caption</FormLabel>
                      <FormControl>
                        <Input {...props.field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className='flex gap-2 '>
                <ResponsiveConfirmDialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                  title='Delete Resource'
                  content='Are you sure you want to delete this resource? This action cannot be undone.'
                  confirmLabel='Delete Resource'
                  cancelLabel='Cancel'
                  onConfirm={handleDelete}
                  // repeatText={props.resource?.name ?? props.resource?.id}
                >
                  <ResponsiveConfirmDialogTrigger asChild>
                    <Button type='button' variant='destructive' className='w-auto'>
                      <PiTrash /> Delete
                    </Button>
                  </ResponsiveConfirmDialogTrigger>
                </ResponsiveConfirmDialog>

                <Button type='submit' className='w-auto'>
                  <PiFloppyDisk /> Save
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {showFullscreen && props.resource && (
        <ResourceDialogPreview resource={props.resource} onClose={() => setShowFullscreen(false)} />
      )}
    </>
  )
}
