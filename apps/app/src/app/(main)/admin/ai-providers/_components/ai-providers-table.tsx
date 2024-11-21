'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { aiProvidersQueryOptions } from '@bulkit/app/app/(main)/admin/ai-providers/ai-providers.queries'
import type { AIProvider } from '@bulkit/shared/modules/admin/schemas/ai-providers.schemas'
import { DataTable } from '@bulkit/ui/components/ui/data-table/data-table'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PiPencil, PiTrash } from 'react-icons/pi'
import { AIProviderForm } from './ai-provider-form'

type AIProvidersTableProps = {
  initialProviders?: AIProvider[]
}

export function AIProvidersTable(props: AIProvidersTableProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null)
  const queryClient = useQueryClient()

  const providersQuery = useQuery(
    aiProvidersQueryOptions({
      initialProviders: props.initialProviders,
    })
  )

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.admin['ai-providers']({ id }).delete()
      if (response.error) throw new Error(response.error.value.message)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiProvidersQueryOptions({}).queryKey })
      toast.success('Provider deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete provider', {
        description: error.message,
      })
    },
  })

  return (
    <>
      <DataTable
        data={providersQuery.data ?? []}
        keyExtractor={(row) => row.id}
        columns={[
          {
            id: 'name',
            header: 'Provider',
            accessorKey: 'name',
            cell: (row) => <div className='capitalize'>{row.name}</div>,
          },
          {
            id: 'model',
            header: 'Model',
            accessorKey: 'model',
          },
          {
            id: 'createdAt',
            header: 'Added',
            accessorKey: 'createdAt',
            cell: (row) => new Date(row.createdAt).toLocaleDateString(),
          },
        ]}
        actions={(row) => ({
          options: [
            {
              label: 'Edit',
              icon: <PiPencil className='h-4 w-4' />,
              onClick: (row) => {
                setSelectedProvider(row)
              },
            },
            {
              label: 'Delete',
              icon: <PiTrash className='h-4 w-4' />,
              variant: 'destructive',
              onClick: async (row) => {
                await deleteMutation.mutateAsync(row.id)
              },
              requireConfirm: {
                title: 'Delete Provider',
                content: 'Are you sure you want to delete this provider?',
                confirmLabel: 'Delete',
                cancelLabel: 'Cancel',
              },
            },
          ],
        })}
      />

      <AIProviderForm
        open={!!selectedProvider}
        onOpenChange={(open) => {
          if (!open) setSelectedProvider(null)
        }}
        defaultValues={
          selectedProvider
            ? {
                name: selectedProvider.name,
                model: selectedProvider.model,
              }
            : undefined
        }
        mode='edit'
      />
    </>
  )
}
