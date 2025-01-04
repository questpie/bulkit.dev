import { Button } from '@bulkit/ui/components/ui/button'
import { Checkbox } from '@bulkit/ui/components/ui/checkbox'
import { TableActions } from '@bulkit/ui/components/ui/data-table/table-actions'
import { Skeleton } from '@bulkit/ui/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bulkit/ui/components/ui/table'
import { cn } from '@bulkit/ui/lib'
import { Fragment } from 'react/jsx-runtime'
import { motion, AnimatePresence } from 'framer-motion'

type HideBelowBreakPoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

type TableColumn<T> = {
  id: string
  header: string
  accessorKey?: keyof T | ((row: T) => any)
  cell?: (row: T) => React.ReactNode
  enableSorting?: boolean
  className?: string
  headerClassName?: string
  cellClassName?: string
  hideBelowBreakpoint?: HideBelowBreakPoint
  forceHide?: boolean
} & (
  | { accessorKey: keyof T | ((row: T) => any); cell?: (row: T) => React.ReactNode }
  | { accessorKey?: never; cell: (row: T) => React.ReactNode }
)

type TableProps<T> = {
  data: T[]
  keyExtractor: (row: T, index: number) => string
  columns: TableColumn<T>[]
  actions?: TableActions<T> | ((row: T) => TableActions<T>)
  isLoading?: boolean

  // Pagination/Infinite scroll
  pageSize?: number
  onLoadMore?: () => void
  hasNextPage?: boolean

  // Selection
  enableSelection?: boolean
  selectedRows?: T[]
  onSelectionChange?: (rows: T[]) => void

  // Sorting
  enableSorting?: boolean
  sortingState?: {
    key: keyof T
    direction: 'asc' | 'desc'
  }
  onSortingChange?: (key: keyof T, direction: 'asc' | 'desc') => void
}

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.03,
      duration: 0.3,
    },
  }),
  exit: { opacity: 0, x: 20 },
}

const skeletonVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const pulseVariant = {
  hidden: { opacity: 0.3 },
  visible: {
    opacity: 0.7,
    transition: {
      duration: 0.8,
      repeat: Number.POSITIVE_INFINITY,
      repeatType: 'reverse' as const,
    },
  },
}

export function DataTable<T extends Record<string, any>>({
  data,
  actions,
  isLoading,
  pageSize,
  onLoadMore,
  hasNextPage,
  enableSelection,
  selectedRows,
  onSelectionChange,
  enableSorting,
  sortingState,
  onSortingChange,
  keyExtractor,
  columns: allColumns,
}: TableProps<T>) {
  // Selection handling
  const handleRowSelection = (row: T, isSelected: boolean) => {
    if (!onSelectionChange || !selectedRows) return

    if (isSelected) {
      onSelectionChange([...selectedRows, row])
    } else {
      onSelectionChange(selectedRows.filter((r) => r !== row))
    }
  }

  const handleSelectAll = (isSelected: boolean) => {
    if (!onSelectionChange) return
    onSelectionChange(isSelected ? data : [])
  }

  const getBreakpointClass = (breakpoint?: HideBelowBreakPoint): string => {
    if (!breakpoint) return ''

    const breakpointMap: Record<HideBelowBreakPoint, string> = {
      sm: 'hidden sm:table-cell',
      md: 'hidden md:table-cell',
      lg: 'hidden lg:table-cell',
      xl: 'hidden xl:table-cell',
      '2xl': 'hidden 2xl:table-cell',
    }

    return breakpointMap[breakpoint]
  }

  const columns = allColumns.filter((column) => !column.forceHide)

  const renderSkeletonRows = () => {
    return (
      <motion.div variants={skeletonVariants} initial='hidden' animate='visible'>
        {Array.from({ length: 3 }).map((_, index) => (
          <motion.tr
            key={`skeleton-${
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              index
            }`}
            variants={pulseVariant}
            className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'
          >
            {enableSelection && (
              <TableCell className='w-[50px]'>
                <Skeleton className='h-4 w-4' />
              </TableCell>
            )}
            {columns.map((column) => (
              <TableCell
                key={column.id}
                className={cn(column.cellClassName, getBreakpointClass(column.hideBelowBreakpoint))}
              >
                <Skeleton className='h-4 w-full' />
              </TableCell>
            ))}
            {actions && (
              <TableCell>
                <Skeleton className='h-8 w-20' />
              </TableCell>
            )}
          </motion.tr>
        ))}
      </motion.div>
    )
  }

  return (
    <Fragment>
      <Table>
        <TableHeader>
          <TableRow>
            {enableSelection && (
              <TableHead className='w-[50px]'>
                <Checkbox
                  checked={selectedRows?.length === data.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  column.headerClassName,
                  getBreakpointClass(column.hideBelowBreakpoint),
                  enableSorting && column.enableSorting && 'cursor-pointer'
                )}
                onClick={() => {
                  if (!enableSorting || !column.enableSorting) return
                  const isCurrentSort = sortingState?.key === column.id
                  const newDirection = !isCurrentSort
                    ? 'asc'
                    : sortingState.direction === 'asc'
                      ? 'desc'
                      : 'asc'
                  onSortingChange?.(column.id as keyof T, newDirection)
                }}
              >
                {column.header}
              </TableHead>
            ))}
            {actions && <TableHead className='w-[100px]'>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode='wait'>
            {data.map((row, index) => (
              <motion.tr
                key={keyExtractor(row, index)}
                variants={tableRowVariants}
                initial='hidden'
                animate='visible'
                exit='exit'
                custom={index}
                className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'
              >
                {enableSelection && (
                  <TableCell className='w-[50px]'>
                    <Checkbox
                      checked={selectedRows?.includes(row)}
                      onCheckedChange={(checked) => handleRowSelection(row, !!checked)}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      column.cellClassName,
                      getBreakpointClass(column.hideBelowBreakpoint)
                    )}
                  >
                    {column.cell?.(row) ??
                      (typeof column.accessorKey === 'function'
                        ? column.accessorKey(row)
                        : row[column.accessorKey as keyof T])}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell>
                    <TableActions
                      actions={typeof actions === 'function' ? actions(row) : actions}
                      row={row}
                    />
                  </TableCell>
                )}
              </motion.tr>
            ))}
            {isLoading && renderSkeletonRows()}
          </AnimatePresence>
        </TableBody>
      </Table>

      {hasNextPage && !isLoading && (
        <motion.div
          className='mt-4 flex justify-center'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <Button variant='outline' onClick={onLoadMore}>
            Load More
          </Button>
        </motion.div>
      )}
    </Fragment>
  )
}
