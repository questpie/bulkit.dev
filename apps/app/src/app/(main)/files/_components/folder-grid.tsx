'use client'

import { Badge } from '@bulkit/ui/components/ui/badge'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
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
} from 'react-icons/pi'
import { FolderContextMenu } from './folder-context-menu'
import { FolderList } from './folder-list'
import type { Folder, FolderItem } from '@bulkit/shared/modules/folders/folders.schemas'
import type { FolderItemType } from '@bulkit/shared/constants/db.constants'

type FolderGridProps = {
  folders: Folder[]
  items: FolderItem[]
  isLoading?: boolean
  onAction: (action: string, item?: FolderItem | Folder) => void
  viewMode?: 'grid' | 'list'
  className?: string
}

// Icon mapping for different item types
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
    // Try to determine subtype from displayName extension
    if (displayName.endsWith('.reel')) return POST_SUBTYPE_ICONS.reel
    if (displayName.endsWith('.thread')) return POST_SUBTYPE_ICONS.thread
    if (displayName.endsWith('.story')) return POST_SUBTYPE_ICONS.story
    return POST_SUBTYPE_ICONS.post
  }

  if (itemType === 'resource') {
    // For resources, check file extension or mime type from displayName
    if (displayName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return PiImage
    return PiFile
  }

  return ITEM_TYPE_ICONS[itemType] || PiFile
}

function getItemTypeColor(itemType: FolderItemType) {
  switch (itemType) {
    case 'post':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
    case 'knowledge':
      return 'bg-green-500/10 text-green-700 dark:text-green-400'
    case 'resource':
      return 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
    default:
      return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
  }
}

type FolderCardProps = {
  folder: Folder
  onAction: (action: string, item?: FolderItem | Folder) => void
}

function FolderCard(props: FolderCardProps) {
  return (
    <Card className='group relative p-4 hover:shadow-md transition-shadow cursor-pointer'>
      <Link href={`/files/${props.folder.id}`} className='block'>
        <div className='flex flex-col items-center text-center space-y-3'>
          <div className='p-3 rounded-lg bg-blue-500/10'>
            <PiFolder className='h-8 w-8 text-blue-600 dark:text-blue-400' />
          </div>
          <div className='w-full'>
            <h4 className='font-medium text-sm line-clamp-2 min-h-[2rem]'>{props.folder.name}</h4>
            {props.folder.description && (
              <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>
                {props.folder.description}
              </p>
            )}
            <p className='text-xs text-muted-foreground mt-2'>
              {formatDistanceToNow(new Date(props.folder.updatedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </Link>

      <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
        <FolderContextMenu type='folder' item={props.folder} onAction={props.onAction} />
      </div>
    </Card>
  )
}

type ItemCardProps = {
  item: FolderItem
  onAction: (action: string, item?: FolderItem | Folder) => void
}

function ItemCard(props: ItemCardProps) {
  const Icon = getItemIcon(props.item.itemType, props.item.displayName)
  const typeColor = getItemTypeColor(props.item.itemType)

  return (
    <Card className='group relative p-4 hover:shadow-md transition-shadow cursor-pointer'>
      <div className='flex flex-col items-center text-center space-y-3'>
        <div className={cn('p-3 rounded-lg', typeColor)}>
          <Icon className='h-8 w-8' />
        </div>
        <div className='w-full'>
          <h4 className='font-medium text-sm line-clamp-2 min-h-[2rem]'>
            {props.item.displayName}
          </h4>
          <div className='flex justify-center mt-2'>
            <Badge variant='secondary' className='text-xs capitalize'>
              {props.item.itemType}
            </Badge>
          </div>
          <p className='text-xs text-muted-foreground mt-2'>
            {formatDistanceToNow(new Date(props.item.updatedAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
        <FolderContextMenu type={props.item.itemType} item={props.item} onAction={props.onAction} />
      </div>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
      {Array.from({ length: 12 }).map((_, i) => (
        <Card key={`skeleton-${i}`} className='p-4'>
          <div className='flex flex-col items-center text-center space-y-3'>
            <Skeleton className='h-14 w-14 rounded-lg' />
            <div className='w-full space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-3 w-3/4 mx-auto' />
              <Skeleton className='h-3 w-1/2 mx-auto' />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function FolderGrid(props: FolderGridProps) {
  if (props.isLoading) {
    return <LoadingSkeleton />
  }

  // Use list view if specified
  if (props.viewMode === 'list') {
    return (
      <FolderList
        folders={props.folders}
        items={props.items}
        isLoading={props.isLoading}
        onAction={props.onAction}
        className={props.className}
      />
    )
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

  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4',
        props.className
      )}
    >
      {props.folders.map((folder) => (
        <FolderCard key={folder.id} folder={folder} onAction={props.onAction} />
      ))}

      {props.items.map((item) => (
        <ItemCard key={`${item.itemType}-${item.itemId}`} item={item} onAction={props.onAction} />
      ))}
    </div>
  )
}
