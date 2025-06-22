'use client'

import { Button } from '@bulkit/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bulkit/ui/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@bulkit/ui/components/ui/form'
import { Input } from '@bulkit/ui/components/ui/input'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PiFolder, PiSpinner } from 'react-icons/pi'
import { useCreateFolder } from '../files.queries'
import type { CreateFolder } from '@bulkit/shared/modules/folders/folders.schemas'

const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(255, 'Folder name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
})

type CreateFolderFormData = z.infer<typeof createFolderSchema>

type CreateFolderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentFolderId?: string | null
}

export function CreateFolderDialog(props: CreateFolderDialogProps) {
  const createFolderMutation = useCreateFolder()

  const form = useForm<CreateFolderFormData>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const handleSubmit = async (data: CreateFolderFormData) => {
    const createData: CreateFolder = {
      name: data.name,
      description: data.description || null,
      parentFolderId: props.parentFolderId || null,
    }

    try {
      await createFolderMutation.mutateAsync(createData)
      form.reset()
      props.onOpenChange(false)
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset()
    }
    props.onOpenChange(open)
  }

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <PiFolder className='h-5 w-5 text-blue-600' />
            Create New Folder
          </DialogTitle>
          <DialogDescription>
            Create a new folder to organize your files and content.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter folder name...' autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Enter folder description...' rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleOpenChange(false)}
                disabled={createFolderMutation.isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={createFolderMutation.isPending}>
                {createFolderMutation.isPending && (
                  <PiSpinner className='h-4 w-4 mr-2 animate-spin' />
                )}
                Create Folder
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
