'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { calculateCostPerMillion } from '@bulkit/app/app/(main)/admin/ai-providers/ai-proivders.utils'
import { aiProvidersQueryOptions } from '@bulkit/app/app/(main)/admin/ai-providers/ai-providers.queries'
import { useAppSettings } from '@bulkit/app/app/_components/app-settings-provider'
import type { AIProvider } from '@bulkit/shared/modules/admin/schemas/ai-providers.schemas'
import { Badge } from '@bulkit/ui/components/ui/badge'
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
  const isCloud = useAppSettings().deploymentType === 'cloud'
  const appSettings = useAppSettings()

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
            id: 'isDefaultFor',
            header: 'Default For',
            accessorKey: 'isDefaultFor',
            cell: (row) => (
              <div className='flex flex-wrap gap-1 justify-start'>
                {row.isDefaultFor.map((capability) => (
                  <Badge key={capability} variant='outline' size='sm'>
                    {capability}
                  </Badge>
                ))}
              </div>
            ),
          },
          // {
          //   id: 'createdAt',
          //   header: 'Added',
          //   accessorKey: 'createdAt',
          //   cell: (row) => new Date(row.createdAt).toLocaleDateString(),
          // },
          ...(isCloud
            ? [
                {
                  id: 'tokenCosts',
                  header: 'Token Costs',
                  cell: (row: AIProvider) => (
                    <div className='space-y-1'>
                      <div className='text-sm'>
                        <span className='font-medium'>Prompt:</span>{' '}
                        {row.promptTokenToCreditCoefficient} credits
                        <span className='block text-xs text-muted-foreground'>
                          {calculateCostPerMillion(
                            row.promptTokenToCreditCoefficient,
                            appSettings.currency
                          )}
                          /million tokens
                        </span>
                      </div>
                      <div className='text-sm'>
                        <span className='font-medium'>Output:</span>{' '}
                        {row.outputTokenToCreditCoefficient} credits
                        <span className='block text-xs text-muted-foreground'>
                          {calculateCostPerMillion(
                            row.outputTokenToCreditCoefficient,
                            appSettings.currency
                          )}
                          /million tokens
                        </span>
                      </div>
                    </div>
                  ),
                },
              ]
            : []),
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
                id: selectedProvider.id,
                name: selectedProvider.name,
                model: selectedProvider.model,
                capabilities: selectedProvider.capabilities,
                isActive: selectedProvider.isActive,
                isDefaultFor: selectedProvider.isDefaultFor,
                promptTokenToCreditCoefficient: selectedProvider.promptTokenToCreditCoefficient,
                outputTokenToCreditCoefficient: selectedProvider.outputTokenToCreditCoefficient,
              }
            : {
                promptTokenToCreditCoefficient: 1,
                outputTokenToCreditCoefficient: 1,
                capabilities: [],
                isActive: true,
                isDefaultFor: [],
              }
        }
        mode='edit'
      />
    </>
  )
}
