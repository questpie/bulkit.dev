'use client'

import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import { Separator } from '@bulkit/ui/components/ui/separator'
import {
  PiPlus,
  PiFolder,
  PiMagnifyingGlass,
  PiUploadSimple,
  PiDotsThreeVertical,
  PiListBullets,
  PiSquaresFour,
  PiSliders,
} from 'react-icons/pi'
import { useState } from 'react'
import { FolderBreadcrumbs } from './folder-breadcrumbs'
import type { BreadcrumbItem } from '@bulkit/shared/modules/folders/folders.schemas'

type FilesHeaderProps = {
  currentFolderId?: string | null
  breadcrumbs?: BreadcrumbItem[]
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onCreateFolder: () => void
  onUploadFiles: () => void
  onSearch: (query: string) => void
  searchQuery?: string
  className?: string
}

export function FilesHeader(props: FilesHeaderProps) {
  const [searchValue, setSearchValue] = useState(props.searchQuery || '')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    props.onSearch(searchValue)
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    // Debounced search could be implemented here
    if (!value) {
      props.onSearch('')
    }
  }

  return (
    <div className='border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60'>
      <div className='flex flex-col gap-4 p-4'>
        {/* Breadcrumbs */}
        <FolderBreadcrumbs folderId={props.currentFolderId} staticBreadcrumbs={props.breadcrumbs} />

        {/* Main Header Actions */}
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-2'>
            {/* Create Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <PiPlus className='h-4 w-4 mr-2' />
                  New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className='w-48'>
                <DropdownMenuItem onClick={props.onCreateFolder}>
                  <PiFolder className='h-4 w-4 mr-2' />
                  Create Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={props.onUploadFiles}>
                  <PiUploadSimple className='h-4 w-4 mr-2' />
                  Upload Files
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick create folder button for better UX */}
            <Button variant='outline' onClick={props.onCreateFolder}>
              <PiFolder className='h-4 w-4 mr-2' />
              <span className='hidden sm:inline'>New Folder</span>
            </Button>
          </div>

          <div className='flex items-center gap-2'>
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className='relative'>
              <PiMagnifyingGlass className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search files and folders...'
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className={{ wrapper: 'pl-10 w-64' }}
              />
            </form>

            <Separator orientation='vertical' className='h-6' />

            {/* View Toggle */}
            <div className='flex items-center border rounded-md'>
              <Button
                variant={props.viewMode === 'grid' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => props.onViewModeChange('grid')}
                className='rounded-r-none border-r'
              >
                <PiSquaresFour className='h-4 w-4' />
                <span className='sr-only'>Grid view</span>
              </Button>
              <Button
                variant={props.viewMode === 'list' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => props.onViewModeChange('list')}
                className='rounded-l-none'
              >
                <PiListBullets className='h-4 w-4' />
                <span className='sr-only'>List view</span>
              </Button>
            </div>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='icon'>
                  <PiDotsThreeVertical className='h-4 w-4' />
                  <span className='sr-only'>More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuItem>
                  <PiSliders className='h-4 w-4 mr-2' />
                  Sort & Filter
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <PiUploadSimple className='h-4 w-4 mr-2' />
                  Bulk Upload
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
