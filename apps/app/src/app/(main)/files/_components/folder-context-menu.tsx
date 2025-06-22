'use client'

import { Button } from '@bulkit/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import {
  PiDotsThreeVertical,
  PiFolder,
  PiFolderOpen,
  PiPencil,
  PiTrash,
  PiDownload,
  PiShare,
  PiCopy,
  PiScissors,
  PiInfo,
} from 'react-icons/pi'
import type { FolderItem, Folder } from '@bulkit/shared/modules/folders/folders.schemas'
import type { FolderItemType } from '@bulkit/shared/constants/db.constants'

type FolderContextMenuProps = {
  item?: FolderItem | Folder
  type: 'folder' | FolderItemType
  onAction: (action: string, item?: FolderItem | Folder) => void
  children?: React.ReactNode
  disabled?: boolean
}

export function FolderContextMenu(props: FolderContextMenuProps) {
  const handleAction = (action: string) => {
    props.onAction(action, props.item)
  }

  const getMenuItems = () => {
    if (props.type === 'folder') {
      return (
        <>
          <DropdownMenuItem onClick={() => handleAction('open')}>
            <PiFolderOpen className='h-4 w-4 mr-2' />
            Open
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction('rename')}>
            <PiPencil className='h-4 w-4 mr-2' />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('share')}>
            <PiShare className='h-4 w-4 mr-2' />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('properties')}>
            <PiInfo className='h-4 w-4 mr-2' />
            Properties
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleAction('delete')}
            className='text-destructive focus:text-destructive'
          >
            <PiTrash className='h-4 w-4 mr-2' />
            Delete
          </DropdownMenuItem>
        </>
      )
    }

    // For items (post, knowledge, resource)
    return (
      <>
        <DropdownMenuItem onClick={() => handleAction('open')}>
          <PiFolderOpen className='h-4 w-4 mr-2' />
          Open
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleAction('cut')}>
          <PiScissors className='h-4 w-4 mr-2' />
          Cut
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('copy')}>
          <PiCopy className='h-4 w-4 mr-2' />
          Copy
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleAction('rename')}>
          <PiPencil className='h-4 w-4 mr-2' />
          Rename
        </DropdownMenuItem>
        {props.type === 'resource' && (
          <DropdownMenuItem onClick={() => handleAction('download')}>
            <PiDownload className='h-4 w-4 mr-2' />
            Download
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleAction('properties')}>
          <PiInfo className='h-4 w-4 mr-2' />
          Properties
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleAction('remove')}
          className='text-destructive focus:text-destructive'
        >
          <PiTrash className='h-4 w-4 mr-2' />
          Remove from folder
        </DropdownMenuItem>
      </>
    )
  }

  if (props.children) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={props.disabled}>
          {props.children}
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          {getMenuItems()}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={props.disabled}>
        <Button variant='ghost' size='icon' className='h-8 w-8'>
          <PiDotsThreeVertical className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        {getMenuItems()}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
