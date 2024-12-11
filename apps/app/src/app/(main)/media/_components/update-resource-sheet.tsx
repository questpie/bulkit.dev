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
import { Sheet, SheetContent } from '@bulkit/ui/components/ui/sheet'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ResourcePreview } from '../../posts/[id]/_components/preview/resource-preview'
import { mediaInfiniteQueryOptions } from '../media.queries'

type UpdateResourceSheetProps = {
  resource: Resource | null
  onClose: () => void
}

export function UpdateResourceSheet(props: UpdateResourceSheetProps) {
  const queryClient = useQueryClient()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
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

  return (
    <Sheet open={!!props.resource} onOpenChange={() => props.onClose()}>
      <SheetContent className='sm:max-w-xl'>
        <div className='space-y-4'>
          {props.resource && (
            <ResourcePreview
              resource={props.resource}
              variant='wide'
              className='w-full aspect-video'
            />
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdate)} className='space-y-4'>
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

              <div className='flex justify-between gap-2'>
                <ResponsiveConfirmDialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                  title='Delete Resource'
                  content='Are you sure you want to delete this resource? This action cannot be undone.'
                  confirmLabel='Delete Resource'
                  cancelLabel='Cancel'
                  onConfirm={handleDelete}
                  repeatText={props.resource?.name ?? props.resource?.id}
                >
                  <ResponsiveConfirmDialogTrigger asChild>
                    <Button type='button' variant='destructive'>
                      Delete
                    </Button>
                  </ResponsiveConfirmDialogTrigger>
                </ResponsiveConfirmDialog>
                <div className='flex gap-2'>
                  <Button variant='outline' onClick={props.onClose}>
                    Cancel
                  </Button>
                  <Button type='submit'>Save</Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
