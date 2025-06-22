'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@bulkit/ui/components/ui/input'
import { Button } from '@bulkit/ui/components/ui/button'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { ScrollArea } from '@bulkit/ui/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bulkit/ui/components/ui/tabs'
import { FileText, CheckSquare, User, Image, Hash, Radio, Search, Clock } from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import type { SmartReference, ChatReferenceType } from '@bulkit/shared/modules/chat/chat.schemas'
import { searchReferencesQueryOptions } from '../chat.queries'
import { useReferenceSearch } from '../chat.atoms'

interface ReferenceSelectorProps {
  onSelect: (reference: SmartReference) => void
}

const referenceTypes: Array<{ id: ReferenceType; label: string; icon: any }> = [
  { id: 'post', label: 'Posts', icon: FileText },
  { id: 'task', label: 'Tasks', icon: CheckSquare },
  { id: 'user', label: 'Users', icon: User },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'label', label: 'Labels', icon: Hash },
  { id: 'channel', label: 'Channels', icon: Radio },
]

const referenceColors = {
  post: 'bg-blue-500',
  task: 'bg-green-500',
  user: 'bg-purple-500',
  media: 'bg-orange-500',
  label: 'bg-pink-500',
  channel: 'bg-indigo-500',
}

export function ReferenceSelector({ onSelect }: ReferenceSelectorProps) {
  const [searchQuery, setSearchQuery] = useReferenceSearch()
  const [selectedType, setSelectedType] = useState<ReferenceType | 'all'>('all')

  const searchQuery_ = useQuery(searchReferencesQueryOptions(searchQuery))

  // Filter results by type
  const filteredReferences =
    searchQuery_.data?.references.filter(
      (ref) => selectedType === 'all' || ref.type === selectedType
    ) || []

  const handleSelect = (reference: SmartReference) => {
    onSelect(reference)
    setSearchQuery('')
  }

  const renderReference = (reference: SmartReference) => {
    const typeInfo = referenceTypes.find((t) => t.id === reference.type)
    const Icon = typeInfo?.icon || FileText
    const colorClass = referenceColors[reference.type] || 'bg-gray-500'

    return (
      <Button
        key={`${reference.type}-${reference.id}`}
        variant='ghost'
        onClick={() => handleSelect(reference)}
        className='w-full p-3 h-auto justify-start hover:bg-muted/50'
      >
        <div className='flex items-center gap-3 w-full'>
          {/* Icon */}
          <div
            className={cn(
              'w-8 h-8 rounded flex items-center justify-center shrink-0',
              colorClass
            )}
          >
            <Icon className='w-4 h-4 text-white' />
          </div>

          {/* Content */}
          <div className='flex-1 min-w-0 text-left'>
            <div className='font-medium text-sm truncate'>{reference.title}</div>
            {reference.preview && (
              <div className='text-xs text-muted-foreground truncate'>{reference.preview}</div>
            )}
          </div>

          {/* Type badge */}
          <Badge variant='outline' className='text-xs shrink-0'>
            {typeInfo?.label || reference.type}
          </Badge>
        </div>
      </Button>
    )
  }

  return (
    <div className='w-full'>
      {/* Search */}
      <div className='p-3 border-b'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Search posts, tasks, users...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
            autoFocus
          />
        </div>
      </div>

      {/* Type filters */}
      <Tabs
        value={selectedType}
        onValueChange={(value) => setSelectedType(value as ReferenceType | 'all')}
      >
        <TabsList className='w-full grid grid-cols-4 h-auto p-1'>
          <TabsTrigger value='all' className='text-xs'>
            All
          </TabsTrigger>
          <TabsTrigger value='post' className='text-xs'>
            Posts
          </TabsTrigger>
          <TabsTrigger value='task' className='text-xs'>
            Tasks
          </TabsTrigger>
          <TabsTrigger value='user' className='text-xs'>
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className='m-0'>
          <ScrollArea className='h-64'>
            <div className='p-1'>
              {searchQuery_.isLoading && searchQuery ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Search className='w-4 h-4 animate-pulse' />
                    Searching...
                  </div>
                </div>
              ) : filteredReferences.length === 0 ? (
                <div className='text-center py-8'>
                  <div className='text-sm text-muted-foreground'>
                    {searchQuery ? 'No results found' : 'Start typing to search...'}
                  </div>
                  {!searchQuery && (
                    <div className='text-xs text-muted-foreground mt-1'>
                      Search for posts, tasks, users, and more
                    </div>
                  )}
                </div>
              ) : (
                <div className='space-y-1'>{filteredReferences.map(renderReference)}</div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Quick actions */}
      {!searchQuery && (
        <div className='p-3 border-t bg-muted/30'>
          <div className='text-xs font-medium text-muted-foreground mb-2'>Quick references:</div>
          <div className='flex flex-wrap gap-1'>
            <Button
              variant='outline'
              size='sm'
              className='h-6 text-xs'
              onClick={() => setSearchQuery('recent posts')}
            >
              <Clock className='w-3 h-3 mr-1' />
              Recent posts
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='h-6 text-xs'
              onClick={() => setSearchQuery('my tasks')}
            >
              <CheckSquare className='w-3 h-3 mr-1' />
              My tasks
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
