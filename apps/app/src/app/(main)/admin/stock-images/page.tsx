'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import { StockProviderForm } from '@bulkit/app/app/(main)/admin/stock-images/_components/stock-provider-form'
import type { StockImageProviderType } from '@bulkit/shared/modules/app/app-constants'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
import { ResponsiveConfirmDialog } from '@bulkit/ui/components/ui/responsive-dialog'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PiImages, PiPencil, PiTrash } from 'react-icons/pi'
import { PageDescription } from '@bulkit/app/app/(main)/admin/_components/page-description'

export default function StockImagesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<(typeof providers)[0] | null>(null)
  const [deletingProvider, setDeletingProvider] = useState<(typeof providers)[0] | null>(null)
  const queryClient = useQueryClient()

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['admin', 'stock-providers'],
    queryFn: async () => {
      const response = await apiClient.admin['stock-image-providers'].index.get()
      if (response.error) throw response.error
      return response.data
    },
  })

  const addProviderMutation = useMutation({
    mutationFn: async (values: { id: StockImageProviderType; apiKey: string }) => {
      const response = await apiClient.admin['stock-image-providers'].index.post({
        ...values,
      })
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stock-providers'] })
      setFormOpen(false)
      toast.success('Provider added successfully')
    },
    onError: (error) => {
      toast.error('Failed to add provider', {
        description: error.message,
      })
    },
  })

  const editProviderMutation = useMutation({
    mutationFn: async (values: { id: StockImageProviderType; apiKey?: string }) => {
      const response = await apiClient.admin['stock-image-providers'].index.put({
        ...values,
      })
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stock-providers'] })
      setFormOpen(false)
      setEditingProvider(null)
      toast.success('Provider updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update provider', {
        description: error.message,
      })
    },
  })

  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.admin['stock-image-providers']({ id }).delete()
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stock-providers'] })
      setDeletingProvider(null)
      toast.success('Provider deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete provider', {
        description: error.message,
      })
    },
  })

  const handleEdit = (provider: (typeof providers)[0]) => {
    setEditingProvider(provider)
    setFormOpen(true)
  }

  return (
    <div className='p-6'>
      <PageDescription
        title='Stock Image Providers'
        description='Manage stock image providers to enable users to search and use high-quality images in their content.'
      />

      {providers.length === 0 ? (
        <div className='flex flex-col items-center justify-center h-[400px] text-center'>
          <PiImages className='w-16 h-16 text-muted-foreground/40' />
          <h3 className='mt-4 text-lg font-medium'>No stock image providers configured</h3>
          <p className='mt-2 text-sm text-muted-foreground max-w-sm'>
            Stock image providers allow users to search and use high-quality images in their posts.
            Add a provider to enable this feature.
          </p>
          <Button onClick={() => setFormOpen(true)} className='mt-6'>
            Add your first stock provider
          </Button>
        </div>
      ) : (
        <div className='grid gap-4'>
          {providers.map((provider) => (
            <Card key={provider.id} className='p-4'>
              <div className='flex justify-between items-center'>
                <div>
                  <h3 className='font-semibold capitalize'>{provider.id}</h3>
                  <p className='text-sm text-muted-foreground'>
                    Added: {new Date(provider.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button variant='ghost' size='icon' onClick={() => handleEdit(provider)}>
                    <PiPencil className='h-4 w-4' />
                  </Button>
                  <Button variant='ghost' size='icon' onClick={() => setDeletingProvider(provider)}>
                    <PiTrash className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <StockProviderForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingProvider(null)
        }}
        onSubmit={async (values) => {
          if (editingProvider) {
            await editProviderMutation.mutateAsync({
              id: values.id,
              apiKey: values.apiKey,
            })
          } else {
            await addProviderMutation.mutateAsync(values)
          }
        }}
        defaultValues={
          editingProvider
            ? {
                id: editingProvider.id,
                apiKey: '',
              }
            : undefined
        }
        mode={editingProvider ? 'edit' : 'add'}
      />

      <ResponsiveConfirmDialog
        open={!!deletingProvider}
        onOpenChange={() => setDeletingProvider(null)}
        title='Are you sure?'
        content='This will permanently delete this stock image provider. This action cannot be undone.'
        confirmLabel='Delete'
        cancelLabel='Cancel'
        onConfirm={() => {
          if (deletingProvider) {
            return deleteProviderMutation.mutateAsync(deletingProvider.id).then(() => true)
          }
          return Promise.resolve(false)
        }}
      />
    </div>
  )
}
