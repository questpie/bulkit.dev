'use client'

import { useState } from 'react'
import { Input } from '@bulkit/ui/components/ui/input'
import { Button } from '@bulkit/ui/components/ui/button'
import { Badge } from '@bulkit/ui/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { Search, Filter, X } from 'lucide-react'
import { TASK_STATUS, TASK_PRIORITY } from '@bulkit/shared/constants/db.constants'

export function TasksHeader() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<{
    status: string[]
    priority: string[]
    assignedTo: string | null
  }>({
    status: [],
    priority: [],
    assignedTo: null,
  })

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }))
  }

  const handlePriorityFilter = (priority: string) => {
    setFilters((prev) => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter((p) => p !== priority)
        : [...prev.priority, priority],
    }))
  }

  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      assignedTo: null,
    })
    setSearchTerm('')
  }

  const hasActiveFilters =
    filters.status.length > 0 || filters.priority.length > 0 || filters.assignedTo || searchTerm

  return (
    <div className='border-b bg-white px-6 py-4'>
      <div className='flex flex-col space-y-4'>
        {/* Search and Filters Row */}
        <div className='flex items-center space-x-4'>
          <div className='relative flex-1 max-w-md'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            <Input
              placeholder='Search tasks...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={{ wrapper: 'pl-9' }}
            />
          </div>

          <div className='flex items-center space-x-2'>
            <Filter className='h-4 w-4 text-gray-500' />
            <span className='text-sm text-gray-600'>Filters:</span>
          </div>

          {/* Status Filter */}
          <Select onValueChange={(value) => handleStatusFilter(value)}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Priority' />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITY.map((priority) => (
                <SelectItem
                  key={priority}
                  value={priority}
                  onClick={() => handlePriorityFilter(priority)}
                  className='cursor-pointer'
                >
                  <div className='flex items-center justify-between w-full'>
                    <span>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                    {filters.priority.includes(priority) && (
                      <span className='ml-2 text-blue-600'>✓</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant='outline' size='sm' onClick={clearFilters}>
              <X className='h-4 w-4 mr-1' />
              Clear
            </Button>
          )}
        </div>

        {/* Active Filters Row */}
        {hasActiveFilters && (
          <div className='flex items-center space-x-2 flex-wrap'>
            <span className='text-sm text-gray-600'>Active filters:</span>

            {filters.status.map((status) => (
              <Badge key={status} variant='secondary' className='cursor-pointer'>
                {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                <X className='h-3 w-3 ml-1' onClick={() => handleStatusFilter(status)} />
              </Badge>
            ))}

            {filters.priority.map((priority) => (
              <Badge key={priority} variant='secondary' className='cursor-pointer'>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
                <X className='h-3 w-3 ml-1' onClick={() => handlePriorityFilter(priority)} />
              </Badge>
            ))}

            {searchTerm && (
              <Badge variant='secondary' className='cursor-pointer'>
                Search: "{searchTerm}"
                <X className='h-3 w-3 ml-1' onClick={() => setSearchTerm('')} />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
