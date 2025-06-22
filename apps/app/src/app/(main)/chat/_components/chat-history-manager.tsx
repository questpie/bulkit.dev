'use client'

import { useState, useCallback } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { ScrollArea } from '@bulkit/ui/components/ui/scroll-area'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@bulkit/ui/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import { 
  History, 
  Search, 
  Filter,
  Calendar,
  Archive,
  Star,
  Trash2,
  Download,
  Share,
  MoreVertical,
  MessageCircle,
  Clock,
  Tag,
  User,
  Bot,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import { useInfiniteQuery } from '@tanstack/react-query'
import { conversationsQueryOptions, useUpdateConversation } from '../chat.queries'
import { useActiveConversation, usePinnedConversations } from '../chat.atoms'
import { formatDistanceToNow } from 'date-fns'
import type { ChatConversation } from '@bulkit/shared/modules/chat/chat.schemas'

interface ChatHistoryManagerProps {
  children?: React.ReactNode
}

type SortOption = 'recent' | 'oldest' | 'title' | 'messages'
type FilterOption = 'all' | 'active' | 'archived' | 'pinned'

export function ChatHistoryManager({ children }: ChatHistoryManagerProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [selectedConversations, setSelectedConversations] = useState<string[]>([])

  const [, setActiveConversationId] = useActiveConversation()
  const [pinnedConversations, setPinnedConversations] = usePinnedConversations()
  const updateConversationMutation = useUpdateConversation()
  
  const conversationsQuery = useInfiniteQuery(conversationsQueryOptions())
  const allConversations = conversationsQuery.data?.pages.flatMap(page => page.data) || []

  // Filter and sort conversations
  const filteredAndSortedConversations = allConversations
    .filter(conv => {
      // Search filter
      if (searchQuery && !conv.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Status filter
      switch (filterBy) {
        case 'active':
          return !conv.isArchived
        case 'archived':
          return conv.isArchived
        case 'pinned':
          return pinnedConversations.includes(conv.id)
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.lastMessageAt || b.createdAt).getTime() - 
                 new Date(a.lastMessageAt || a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'messages':
          // Would need message count from conversation data
          return 0
        default:
          return 0
      }
    })

  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversations(prev => 
      prev.includes(conversationId) 
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedConversations.length === filteredAndSortedConversations.length) {
      setSelectedConversations([])
    } else {
      setSelectedConversations(filteredAndSortedConversations.map(conv => conv.id))
    }
  }, [selectedConversations.length, filteredAndSortedConversations])

  const handleBulkAction = useCallback(async (action: 'archive' | 'delete' | 'pin') => {
    try {
      for (const conversationId of selectedConversations) {
        switch (action) {
          case 'archive':
            await updateConversationMutation.mutateAsync({
              conversationId,
              isArchived: true,
            })
            break
          case 'pin':
            setPinnedConversations(prev => [...prev, conversationId])
            break
          case 'delete':
            // Would need delete mutation
            console.log('Delete conversation:', conversationId)
            break
        }
      }
      setSelectedConversations([])
    } catch (error) {
      console.error('Bulk action failed:', error)
    }
  }, [selectedConversations, updateConversationMutation, setPinnedConversations])

  const handleExportHistory = useCallback(() => {
    // Export conversation history as JSON
    const exportData = {
      conversations: filteredAndSortedConversations,
      exportedAt: new Date().toISOString(),
      totalCount: filteredAndSortedConversations.length,
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filteredAndSortedConversations])

  const renderConversation = (conversation: ChatConversation) => {
    const isSelected = selectedConversations.includes(conversation.id)
    const isPinned = pinnedConversations.includes(conversation.id)
    const lastActivity = conversation.lastMessageAt || conversation.createdAt

    return (
      <div
        key={conversation.id}
        className={cn(
          "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
          "hover:bg-muted/50 border-border",
          isSelected && "bg-primary/10 border-primary/20",
          conversation.isArchived && "opacity-60"
        )}
        onClick={() => handleSelectConversation(conversation.id)}
      >
        {/* Selection checkbox */}
        <div className={cn(
          "w-4 h-4 rounded border-2 flex items-center justify-center",
          isSelected ? "bg-primary border-primary" : "border-muted-foreground"
        )}>
          {isSelected && <span className="text-primary-foreground text-xs">✓</span>}
        </div>

        {/* Conversation icon */}
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>

        {/* Conversation details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
            {isPinned && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
            {conversation.isArchived && (
              <Badge variant="outline" className="text-xs">Archived</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}</span>
            </div>
            
            {conversation.currentPageContext && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>{conversation.currentPageContext.path.split('/').pop()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setActiveConversationId(conversation.id)
              setOpen(false)
            }}
            className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100"
          >
            Open
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Chat History Manager
          </DialogTitle>
          <DialogDescription>
            Manage, search, and organize your conversation history.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Toolbar */}
          <div className="p-6 pb-4 border-b space-y-4">
            {/* Search and filters */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    {filterBy === 'all' ? 'All' : filterBy}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterBy('all')}>
                    All Conversations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy('active')}>
                    Active Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy('archived')}>
                    Archived Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy('pinned')}>
                    Pinned Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Sort: {sortBy}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy('recent')}>
                    Most Recent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('title')}>
                    Title A-Z
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Bulk actions */}
            {selectedConversations.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedConversations.length} selected
                </span>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('pin')}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Pin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('archive')}
                  >
                    <Archive className="w-3 h-3 mr-1" />
                    Archive
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversations([])}
                  className="ml-auto"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Conversations list */}
          <ScrollArea className="h-96 p-6 pt-4">
            <div className="space-y-3">
              {filteredAndSortedConversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No conversations found matching your search' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Select all */}
                  <div className="flex items-center gap-3 pb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-7 text-xs"
                    >
                      {selectedConversations.length === filteredAndSortedConversations.length 
                        ? 'Deselect All' 
                        : 'Select All'
                      }
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {filteredAndSortedConversations.length} conversation{filteredAndSortedConversations.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  
                  {filteredAndSortedConversations.map(renderConversation)}
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer actions */}
          <div className="p-6 pt-4 border-t flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportHistory}>
                <Download className="w-4 h-4 mr-2" />
                Export History
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Total: {allConversations.length} conversations
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}