'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { FilesHeader } from './_components/files-header'
import { FolderGrid } from './_components/folder-grid'
import { CreateFolderDialog } from './_components/create-folder-dialog'
import { folderContentsQueryOptions, useDeleteFolder, useMoveItem } from './files.queries'
import type {
  FolderContentsResponse,
  FolderItem,
  Folder,
  BreadcrumbItem,
} from '@bulkit/shared/modules/folders/folders.schemas'

type FilesPageClientProps = {
  initialContents: FolderContentsResponse | null
  currentFolderId: string | null
  initialBreadcrumbs?: BreadcrumbItem[]
}

export function FilesPageClient(props: FilesPageClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [createFolderOpen, setCreateFolderOpen] = useState(false)

  const router = useRouter()
  const deleteFolderMutation = useDeleteFolder()
  const moveItemMutation = useMoveItem()

  // Query for current folder contents
  const contentsQuery = useQuery({
    ...folderContentsQueryOptions(props.currentFolderId),
    initialData: props.initialContents,
  })

  const contents = contentsQuery.data
  const folders = contents?.subFolders || []
  const items = contents?.items || []

  // Filter based on search query
  const filteredFolders = searchQuery
    ? folders.filter((folder) => folder.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders

  const filteredItems = searchQuery
    ? items.filter((item) => item.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
    : items

  const handleAction = async (action: string, item?: FolderItem | Folder) => {
    switch (action) {
      case 'create-folder':
        setCreateFolderOpen(true)
        break

      case 'open':
        if (item && 'name' in item) {
          // It's a folder
          router.push(`/files/${item.id}`)
        } else if (item && 'itemType' in item) {
          // It's an item - navigate to the appropriate page
          handleItemOpen(item)
        }
        break

      case 'rename':
        // TODO: Implement rename functionality
        toast.info('Rename functionality coming soon')
        break

      case 'delete':
        if (item && 'name' in item) {
          await handleFolderDelete(item)
        }
        break

      case 'remove':
        if (item && 'itemType' in item) {
          await handleItemRemove(item)
        }
        break

      case 'share':
        // TODO: Implement sharing functionality
        toast.info('Sharing functionality coming soon')
        break

      case 'properties':
        // TODO: Implement properties dialog
        toast.info('Properties dialog coming soon')
        break

      case 'cut':
      case 'copy':
        // TODO: Implement clipboard functionality
        toast.info('Cut/Copy functionality coming soon')
        break

      case 'download':
        // TODO: Implement download functionality
        toast.info('Download functionality coming soon')
        break

      default:
        console.warn('Unknown action:', action)
    }
  }

  const handleItemOpen = (item: FolderItem) => {
    switch (item.itemType) {
      case 'post':
        router.push(`/posts/${item.itemId}`)
        break
      case 'knowledge':
        router.push(`/knowledge/${item.itemId}`)
        break
      case 'resource':
        router.push(`/media?id=${item.itemId}`)
        break
      default:
        toast.error('Unknown item type')
    }
  }

  const handleFolderDelete = async (folder: Folder) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${folder.name}"? This action cannot be undone.`
    )

    if (confirmed) {
      try {
        await deleteFolderMutation.mutateAsync(folder.id)

        // If we're currently viewing the deleted folder, navigate to parent
        if (props.currentFolderId === folder.id) {
          router.push('/files')
        }
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  }

  const handleItemRemove = async (item: FolderItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${item.displayName}" from this folder?`
    )

    if (confirmed) {
      try {
        await moveItemMutation.mutateAsync({
          itemId: item.itemId,
          itemType: item.itemType,
          targetFolderId: null, // Move to root
        })
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  }

  const handleCreateFolder = () => {
    setCreateFolderOpen(true)
  }

  const handleUploadFiles = () => {
    // TODO: Implement file upload functionality
    toast.info('File upload functionality coming soon')
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
  }

  return (
    <div className='flex flex-col h-full'>
      <FilesHeader
        currentFolderId={props.currentFolderId}
        breadcrumbs={props.initialBreadcrumbs}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onCreateFolder={handleCreateFolder}
        onUploadFiles={handleUploadFiles}
        onSearch={handleSearch}
        searchQuery={searchQuery}
      />

      <div className='flex-1 overflow-auto p-6'>
        <FolderGrid
          folders={filteredFolders}
          items={filteredItems}
          isLoading={contentsQuery.isLoading}
          onAction={handleAction}
          viewMode={viewMode}
        />
      </div>

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        parentFolderId={props.currentFolderId}
      />
    </div>
  )
}
