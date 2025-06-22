'use client'

import { Badge } from '@bulkit/ui/components/ui/badge'
import { Button } from '@bulkit/ui/components/ui/button'
import { Skeleton } from '@bulkit/ui/components/ui/skeleton'
import { cn } from '@bulkit/ui/lib'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import {
  PiFolder,
  PiFolderOpen,
  PiFile,
  PiImage,
  PiNote,
  PiFilmReel,
  PiNeedle,
  PiCamera,
  PiBookOpen,
  PiCaretDown,
  PiCaretUp,
} from 'react-icons/pi'
import { FolderContextMenu } from './folder-context-menu'
import type { Folder, FolderItem } from '@bulkit/shared/modules/folders/folders.schemas'
import type { FolderItemType } from '@bulkit/shared/constants/db.constants'
import { useState } from 'react'

type FolderListProps = {
  folders: Folder[]
  items: FolderItem[]
  isLoading?: boolean
  onAction: (action: string, item?: FolderItem | Folder) => void
  className?: string
}

type SortField = 'name' | 'type' | 'modified'
type SortDirection = 'asc' | 'desc'

// Icon mapping for different item types (same as grid)
const ITEM_TYPE_ICONS = {
  post: PiNote,
  knowledge: PiBookOpen,
  resource: PiFile,
} as const

const POST_SUBTYPE_ICONS = {
  post: PiNote,
  reel: PiFilmReel,
  thread: PiNeedle,
  story: PiCamera,
} as const

function getItemIcon(itemType: FolderItemType, displayName: string) {
  if (itemType === 'post') {
    if (displayName.endsWith('.reel')) return POST_SUBTYPE_ICONS.reel
    if (displayName.endsWith('.thread')) return POST_SUBTYPE_ICONS.thread
    if (displayName.endsWith('.story')) return POST_SUBTYPE_ICONS.story
    return POST_SUBTYPE_ICONS.post
  }

  if (itemType === 'resource') {
    if (displayName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return PiImage
    return PiFile
  }

  return ITEM_TYPE_ICONS[itemType] || PiFile
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '-'

  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`
}

type ListItemProps = {
  item: Folder | FolderItem
  type: 'folder' | FolderItemType
  onAction: (action: string, item?: FolderItem | Folder) => void
}

function ListItem(props: ListItemProps) {
  const isFolder = props.type === 'folder'
  const item = props.item

  if (isFolder) {
    const folder = item as Folder
    return (
      <tr className='group hover:bg-muted/50 border-b border-border last:border-b-0'>
        <td className='py-3 px-4'>
          <Link
            href={`/files/${folder.id}`}
            className='flex items-center gap-3 group-hover:text-primary'
          >
            <PiFolder className='h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0' />
            <span className='font-medium truncate'>{folder.name}</span>
          </Link>
        </td>
        <td className='py-3 px-4 text-sm text-muted-foreground'>
          <Badge
            variant='outline'
            className='bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
          >
            Folder
          </Badge>
        </td>
        <td className='py-3 px-4 text-sm text-muted-foreground'>-</td>
        <td className='py-3 px-4 text-sm text-muted-foreground'>
          {formatDistanceToNow(new Date(folder.updatedAt), { addSuffix: true })}
        </td>
        <td className='py-3 px-4'>
          <div className='opacity-0 group-hover:opacity-100 transition-opacity flex justify-end'>
            <FolderContextMenu type='folder' item={folder} onAction={props.onAction} />
          </div>
        </td>
      </tr>
    )
  }

  const folderItem = item as FolderItem
  const Icon = getItemIcon(folderItem.itemType, folderItem.displayName)

  return (
    <tr className='group hover:bg-muted/50 border-b border-border last:border-b-0'>
      <td className='py-3 px-4'>
        <div className='flex items-center gap-3'>
          <Icon className='h-5 w-5 text-muted-foreground shrink-0' />
          <span className='truncate'>{folderItem.displayName}</span>
        </div>
      </td>
      <td className='py-3 px-4 text-sm text-muted-foreground'>
        <Badge variant='secondary' className='capitalize'>
          {folderItem.itemType}
        </Badge>
      </td>
      <td className='py-3 px-4 text-sm text-muted-foreground'>{formatFileSize()}</td>
      <td className='py-3 px-4 text-sm text-muted-foreground'>
        {formatDistanceToNow(new Date(folderItem.updatedAt), { addSuffix: true })}
      </td>
      <td className='py-3 px-4'>
        <div className='opacity-0 group-hover:opacity-100 transition-opacity flex justify-end'>
          <FolderContextMenu
            type={folderItem.itemType}
            item={folderItem}
            onAction={props.onAction}
          />
        </div>
      </td>
    </tr>
  )
}

function LoadingSkeleton() {
  return (
    <div className='border rounded-lg overflow-hidden'>
      <table className='w-full'>
        <thead className='border-b bg-muted/50'>
          <tr>
            <th className='text-left py-3 px-4 font-medium'>Name</th>
            <th className='text-left py-3 px-4 font-medium'>Type</th>
            <th className='text-left py-3 px-4 font-medium'>Size</th>
            <th className='text-left py-3 px-4 font-medium'>Modified</th>
            <th className='w-12' />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 10 }).map((_, i) => (
            <tr key={`loading-${i}`} className='border-b border-border last:border-b-0'>
              <td className='py-3 px-4'>
                <div className='flex items-center gap-3'>
                  <Skeleton className='h-5 w-5' />
                  <Skeleton className='h-4 w-48' />
                </div>
              </td>
              <td className='py-3 px-4'>
                <Skeleton className='h-5 w-16' />
              </td>
              <td className='py-3 px-4'>
                <Skeleton className='h-4 w-12' />
              </td>
              <td className='py-3 px-4'>
                <Skeleton className='h-4 w-20' />
              </td>
              <td className='py-3 px-4'>
                <Skeleton className='h-6 w-6 ml-auto' />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FolderList(props: FolderListProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  if (props.isLoading) {
    return <LoadingSkeleton />
  }

  const hasContent = props.folders.length > 0 || props.items.length > 0

  if (!hasContent) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
        <div className='p-4 rounded-full bg-muted mb-4'>
          <PiFolderOpen className='h-12 w-12 text-muted-foreground' />
        </div>
        <h3 className='text-lg font-medium mb-2'>This folder is empty</h3>
        <p className='text-muted-foreground mb-6 max-w-md'>
          Start by creating a new folder or adding items to organize your content.
        </p>
        <Button onClick={() => props.onAction('create-folder')}>
          <PiFolder className='h-4 w-4 mr-2' />
          Create Folder
        </Button>
      </div>
    )
  }

  // Combine and sort items
  const allItems: Array<{ item: Folder | FolderItem; type: 'folder' | FolderItemType }> = [
    ...props.folders.map((folder) => ({ item: folder, type: 'folder' as const })),
    ...props.items.map((item) => ({ item, type: item.itemType })),
  ]

  const sortedItems = allItems.sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (sortField) {
      case 'name':
        aValue = 'name' in a.item ? a.item.name : a.item.displayName
        bValue = 'name' in b.item ? b.item.name : b.item.displayName
        break
      case 'type':
        aValue = a.type === 'folder' ? 'folder' : a.type
        bValue = b.type === 'folder' ? 'folder' : b.type
        break
      case 'modified':
        aValue = new Date(a.item.updatedAt).getTime()
        bValue = new Date(b.item.updatedAt).getTime()
        break
      default:
        aValue = 'name' in a.item ? a.item.name : a.item.displayName
        bValue = 'name' in b.item ? b.item.name : b.item.displayName
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
      return sortDirection === 'asc' ? comparison : -comparison
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant='ghost'
      className='h-auto p-0 font-medium hover:bg-transparent hover:text-primary'
      onClick={() => handleSort(field)}
    >
      <span className='flex items-center gap-1'>
        {children}
        {sortField === field &&
          (sortDirection === 'asc' ? (
            <PiCaretUp className='h-3 w-3' />
          ) : (
            <PiCaretDown className='h-3 w-3' />
          ))}
      </span>
    </Button>
  )

  return (
    <div className={cn('border rounded-lg overflow-hidden', props.className)}>
      <table className='w-full'>
        <thead className='border-b bg-muted/50'>
          <tr>
            <th className='text-left py-3 px-4'>
              <SortButton field='name'>Name</SortButton>
            </th>
            <th className='text-left py-3 px-4'>
              <SortButton field='type'>Type</SortButton>
            </th>
            <th className='text-left py-3 px-4 font-medium'>Size</th>
            <th className='text-left py-3 px-4'>
              <SortButton field='modified'>Modified</SortButton>
            </th>
            <th className='w-12'></th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, index) => (
            <ListItem
              key={
                item.type === 'folder'
                  ? `folder-${item.item.id}`
                  : `item-${(item.item as FolderItem).itemType}-${(item.item as FolderItem).itemId}`
              }
              item={item.item}
              type={item.type}
              onAction={props.onAction}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
