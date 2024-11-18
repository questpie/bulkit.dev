'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { StockProviderForm } from '@bulkit/app/app/(main)/admin/stock-images/_components/stock-provider-form'
import { stockProvidersQueryOptions } from '@bulkit/app/app/(main)/admin/stock-images/stock-providers.queries'
import type { StockImageProvider } from '@bulkit/shared/modules/admin/schemas/stock-image-providers.schemas'
import { DataTable } from '@bulkit/ui/components/ui/data-table/data-table'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PiPencil, PiTrash } from 'react-icons/pi'

type StockProvidersTableProps = {
  initialProviders?: StockImageProvider[]
}

export function StockProvidersTable(props: StockProvidersTableProps) {
  const [selectedProvider, setSelectedProvider] = useState<StockImageProvider | null>(null)
  const queryClient = useQueryClient()

  const providersQuery = useQuery(
    stockProvidersQueryOptions({
      initialProviders: props.initialProviders,
    })
  )

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.admin['stock-image-providers']({ id }).delete()
      if (response.error) throw new Error(response.error.value.message)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockProvidersQueryOptions({}).queryKey })
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
            id: 'id',
            header: 'Provider',
            accessorKey: 'id',
            cell: (row) => <div className='capitalize'>{row.id}</div>,
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

      <StockProviderForm
        open={!!selectedProvider}
        onOpenChange={(open) => {
          if (!open) setSelectedProvider(null)
        }}
        defaultValues={selectedProvider ? { id: selectedProvider.id } : undefined}
        mode='edit'
      />
    </>
  )
}
