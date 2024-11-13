'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import { AIProviderForm } from '@bulkit/app/app/(main)/admin/ai-providers/_components/ai-provider-form'
import type { AITextProviderType } from '@bulkit/shared/modules/app/app-constants'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
import { ResponsiveConfirmDialog } from '@bulkit/ui/components/ui/responsive-dialog'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PiPencil, PiRobot, PiTrash } from 'react-icons/pi'
import { PageDescription } from '@bulkit/app/app/(main)/admin/_components/page-description'

export default function AIProvidersPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<(typeof providers)[0] | null>(null)
  const [deletingProvider, setDeletingProvider] = useState<(typeof providers)[0] | null>(null)
  const queryClient = useQueryClient()

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['admin', 'ai-providers'],
    queryFn: async () => {
      const response = await apiClient.admin['ai-providers'].index.get()
      if (response.error) throw response.error
      return response.data
    },
  })

  const addProviderMutation = useMutation({
    mutationFn: async (values: {
      name: AITextProviderType
      model: string
      apiKey: string
    }) => {
      const response = await apiClient.admin['ai-providers'].index.post({
        ...values,
      })
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-providers'] })
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
    mutationFn: async (values: {
      id: string
      model: string
      apiKey?: string
    }) => {
      const response = await apiClient.admin['ai-providers'].index.put({
        ...values,
      })
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-providers'] })
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
      const response = await apiClient.admin['ai-providers']({ id }).delete()
      if (response.error) throw response.error
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-providers'] })
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
        title='AI Providers'
        description='Configure AI providers to enable text generation and other AI-powered features across the platform.'
      />

      {providers.length === 0 ? (
        <div className='flex flex-col items-center justify-center h-[400px] text-center'>
          <PiRobot className='w-16 h-16 text-muted-foreground/40' />
          <h3 className='mt-4 text-lg font-medium'>No AI providers configured</h3>
          <p className='mt-2 text-sm text-muted-foreground max-w-sm'>
            AI providers enable AI-powered features like text generation and image creation. Add
            your first provider to get started.
          </p>
          <Button onClick={() => setFormOpen(true)} className='mt-6'>
            Add your first AI provider
          </Button>
        </div>
      ) : (
        <div className='grid gap-4'>
          {providers.map((provider) => (
            <Card key={`${provider.name}-${provider.model}`} className='p-4'>
              <div className='flex justify-between items-center'>
                <div>
                  <h3 className='font-semibold capitalize'>{provider.name}</h3>
                  <p className='text-sm text-muted-foreground'>Model: {provider.model}</p>
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

      <AIProviderForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingProvider(null)
        }}
        onSubmit={async (values) => {
          if (editingProvider) {
            await editProviderMutation.mutateAsync({
              id: editingProvider.id,
              model: values.model,
              apiKey: values.apiKey,
            })
          } else {
            await addProviderMutation.mutateAsync(values)
          }
        }}
        defaultValues={
          editingProvider
            ? {
                name: editingProvider.name,
                model: editingProvider.model,
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
        content='This will permanently delete this AI provider. This action cannot be undone.'
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
