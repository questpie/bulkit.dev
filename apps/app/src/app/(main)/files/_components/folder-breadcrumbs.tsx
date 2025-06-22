'use client'

import { Button } from '@bulkit/ui/components/ui/button'
import { Skeleton } from '@bulkit/ui/components/ui/skeleton'
import { cn } from '@bulkit/ui/lib'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { PiCaretRight, PiHouse } from 'react-icons/pi'
import { folderBreadcrumbsQueryOptions } from '../files.queries'
import type { BreadcrumbItem } from '@bulkit/shared/modules/folders/folders.schemas'

type FolderBreadcrumbsProps = {
  folderId?: string | null
  className?: string
  staticBreadcrumbs?: BreadcrumbItem[]
}

export function FolderBreadcrumbs(props: FolderBreadcrumbsProps) {
  const breadcrumbsQuery = useQuery({
    ...folderBreadcrumbsQueryOptions(props.folderId!),
    enabled: !!props.folderId && !props.staticBreadcrumbs,
  })

  // Use static breadcrumbs if provided, otherwise use query data
  const breadcrumbs = props.staticBreadcrumbs || breadcrumbsQuery.data || []

  // Always include root as first item if not already there
  const allBreadcrumbs: BreadcrumbItem[] = [
    { id: 'root', name: 'Files', isRoot: true },
    ...breadcrumbs.filter((b) => !b.isRoot),
  ]

  if (breadcrumbsQuery.isLoading && !props.staticBreadcrumbs) {
    return (
      <div className={cn('flex items-center gap-2', props.className)}>
        <Skeleton className='h-6 w-12' />
        <PiCaretRight className='h-4 w-4 text-muted-foreground' />
        <Skeleton className='h-6 w-20' />
        <PiCaretRight className='h-4 w-4 text-muted-foreground' />
        <Skeleton className='h-6 w-16' />
      </div>
    )
  }

  return (
    <nav className={cn('flex items-center gap-1 text-sm', props.className)} aria-label='Breadcrumb'>
      <ol className='flex items-center gap-1'>
        {allBreadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.id} className='flex items-center gap-1'>
            {index > 0 && <PiCaretRight className='h-4 w-4 text-muted-foreground shrink-0' />}

            {index === allBreadcrumbs.length - 1 ? (
              // Current folder - not clickable
              <span className='flex items-center gap-2 px-2 py-1 text-foreground font-medium'>
                {breadcrumb.isRoot && <PiHouse className='h-4 w-4' />}
                {breadcrumb.name}
              </span>
            ) : (
              // Parent folders - clickable
              <Button
                variant='ghost'
                size='sm'
                className='h-auto p-2 text-muted-foreground hover:text-foreground'
                asChild
              >
                <Link href={breadcrumb.isRoot ? '/files' : `/files/${breadcrumb.id}`}>
                  <span className='flex items-center gap-2'>
                    {breadcrumb.isRoot && <PiHouse className='h-4 w-4' />}
                    {breadcrumb.name}
                  </span>
                </Link>
              </Button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
