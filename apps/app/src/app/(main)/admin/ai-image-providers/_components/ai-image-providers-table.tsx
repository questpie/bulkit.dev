'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { aiImageProvidersQueryOptions } from '@bulkit/app/app/(main)/admin/ai-image-providers/ai-image-providers.queries'
import { useAppSettings } from '@bulkit/app/app/_components/app-settings-provider'
import type { AIImageProvider } from '@bulkit/shared/modules/admin/schemas/ai-image-providers.schemas'
import { formatCurrency } from '@bulkit/shared/utils/string'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { DataTable } from '@bulkit/ui/components/ui/data-table/data-table'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PiPencil, PiTrash } from 'react-icons/pi'
import { AIImageProviderForm } from './ai-image-provider-form'

type AIImageProvidersTableProps = {
  initialProviders?: AIImageProvider[]
}

export function AIImageProvidersTable(props: AIImageProvidersTableProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIImageProvider | null>(null)
  const queryClient = useQueryClient()
  const appSettings = useAppSettings()

  const providersQuery = useQuery(
    aiImageProvidersQueryOptions({
      initialProviders: props.initialProviders,
    })
  )

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.admin['ai-image-providers']({ id }).delete()
      if (response.error) throw new Error(response.error.value.message)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiImageProvidersQueryOptions({}).queryKey })
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
            id: 'capabilities',
            header: 'Capabilities',
            accessorKey: 'capabilities',
            cell: (row) => (
              <div className='flex flex-wrap gap-1'>
                {row.capabilities.map((capability) => (
                  <Badge key={capability} variant='secondary' size='sm'>
                    {capability}
                  </Badge>
                ))}
              </div>
            ),
          },
          {
            id: 'isActive',
            header: 'Status',
            accessorKey: 'isActive',
            cell: (row) => (
              <Badge variant={row.isActive ? 'default' : 'secondary'} size='sm'>
                {row.isActive ? 'Active' : 'Inactive'}
              </Badge>
            ),
          },
          {
            id: 'costPerImage',
            header: 'Cost Per Image',
            accessorKey: 'costPerImage',
            cell: (row) => (
              <div className='space-y-1'>
                <div className='text-sm'>
                  {row.costPerImage} credits
                  <span className='block text-xs text-muted-foreground'>
                    {formatCurrency(row.costPerImage, appSettings.currency)} per image
                  </span>
                </div>
              </div>
            ),
            forceHide: appSettings.deploymentType !== 'cloud',
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

      {selectedProvider && (
        <AIImageProviderForm
          key={selectedProvider.id}
          open={!!selectedProvider}
          onOpenChange={(open) => {
            if (!open) setSelectedProvider(null)
          }}
          defaultValues={
            selectedProvider
              ? {
                  id: selectedProvider.id,
                  name: selectedProvider.name,
                  model: selectedProvider.model,
                  capabilities: selectedProvider.capabilities,
                  isActive: selectedProvider.isActive,
                  costPerImage: selectedProvider.costPerImage,
                  inputMapping: selectedProvider.inputMapping,
                  defaultInput: selectedProvider.defaultInput,
                  //   outputMapping: selectedProvider.outputMapping,
                }
              : {
                  capabilities: [],
                  isActive: true,
                  costPerImage: 0.01,
                  inputMapping: {
                    prompt: 'prompt',
                  },
                  defaultInput: null,
                  //   outputMapping: {
                  //     image_url: 'url',
                  //   },
                }
          }
          mode='edit'
        />
      )}
    </>
  )
}
