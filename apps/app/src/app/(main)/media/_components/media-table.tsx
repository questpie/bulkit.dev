'use client'
import { apiClient } from '@bulkit/app/api/api.client'
import type { Resource } from '@bulkit/shared/modules/resources/resources.schemas'
import type { PaginatedResponse } from '@bulkit/shared/schemas/misc'
import { formatDateToMonthDayYear } from '@bulkit/shared/utils/date'
import { formatBytes } from '@bulkit/shared/utils/format'
import { DataTable } from '@bulkit/ui/components/ui/data-table/data-table'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { LuPencil, LuTrash } from 'react-icons/lu'
import { ResourcePreview } from '../../posts/[id]/_components/preview/resource-preview'
import { mediaInfiniteQueryOptions } from '../media.queries'
import { UpdateResourceSheet } from './update-resource-sheet'
import {
  ResponsiveConfirmDialog,
  ResponsiveConfirmDialogTrigger,
} from '@bulkit/ui/components/ui/responsive-dialog'

type MediaTableProps = {
  initialResources?: PaginatedResponse<Resource>
}

export function MediaTable(props: MediaTableProps) {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const mediaQuery = useInfiniteQuery(
    mediaInfiniteQueryOptions({
      initialResources: props.initialResources,
    })
  )

  const handleDelete = async (): Promise<boolean> => {
    if (!resourceToDelete) return false

    const response = await apiClient.resources({ id: resourceToDelete.id }).delete()

    if (response.error) {
      toast.error('Failed to delete media')
      return false
    }

    toast.success('Media deleted')
    queryClient.invalidateQueries({ queryKey: mediaInfiniteQueryOptions({}).queryKey })
    setResourceToDelete(null)
    return true
  }

  const allResources = mediaQuery.data?.pages.flatMap((page) => page.data ?? []) ?? []

  return (
    <>
      <DataTable
        data={allResources}
        keyExtractor={(row) => row.id}
        columns={[
          {
            id: 'preview',
            header: 'Preview',
            cell: (row) => <ResourcePreview resource={row} className='w-16 h-16' hideActions />,
          },
          {
            id: 'name',
            header: 'Name',
            accessorKey: (row) => row.name ?? '-',
          },
          {
            id: 'type',
            header: 'Type',
            hideBelowBreakpoint: 'sm',
            accessorKey: 'type',
          },
          {
            id: 'size',
            header: 'Size',
            hideBelowBreakpoint: 'sm',
            cell: (row) =>
              row.metadata?.sizeInBytes ? formatBytes(row.metadata?.sizeInBytes) : 'Not computed',
          },
          {
            id: 'createdAt',
            header: 'Created At',
            hideBelowBreakpoint: 'sm',
            cell: (row) => formatDateToMonthDayYear(row.createdAt),
          },
        ]}
        actions={(row) => ({
          primary: {
            variant: 'secondary',
            label: 'Edit',
            icon: <LuPencil className='h-4 w-4' />,
            onClick: () => setSelectedResource(row),
          },
          options: [
            {
              label: 'Delete',
              icon: <LuTrash className='h-4 w-4' />,
              variant: 'destructive',
              onClick: (row) => {
                setResourceToDelete(row)
                setIsDeleteDialogOpen(true)
              },
            },
          ],
        })}
        onLoadMore={mediaQuery.fetchNextPage}
        hasNextPage={mediaQuery.hasNextPage}
      />

      <UpdateResourceSheet resource={selectedResource} onClose={() => setSelectedResource(null)} />

      <ResponsiveConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title='Delete Media'
        content='Are you sure you want to delete this media? This action cannot be undone.'
        confirmLabel='Delete Media'
        cancelLabel='Cancel'
        onConfirm={handleDelete}
        repeatText={resourceToDelete?.name ?? resourceToDelete?.id}
      >
        <ResponsiveConfirmDialogTrigger />
      </ResponsiveConfirmDialog>
    </>
  )
}
