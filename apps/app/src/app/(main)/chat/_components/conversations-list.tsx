'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Skeleton } from '@bulkit/ui/components/ui/skeleton'
import { ScrollArea } from '@bulkit/ui/components/ui/scroll-area'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import { 
  Search, 
  MoreVertical, 
  Pin, 
  Archive, 
  Trash2,
  MessageCircle,
  Bot,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import type { ChatConversation } from '@bulkit/shared/modules/chat/chat.schemas'
import { useConversationSearch, usePinnedConversations } from '../chat.atoms'
import { useDeleteConversation, useUpdateConversation } from '../chat.queries'

interface ConversationsListProps {
  conversations?: {
    pages: Array<{
      data: ChatConversation[]
      pagination: { hasMore: boolean; total: number }
    }>
  }
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  isLoading: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

export function ConversationsList({
  conversations,
  activeConversationId,
  onSelectConversation,
  isLoading,
  onLoadMore,
  hasMore,
}: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = useConversationSearch()
  const [pinnedConversations, setPinnedConversations] = usePinnedConversations()
  
  const deleteConversationMutation = useDeleteConversation()
  const updateConversationMutation = useUpdateConversation()

  // Flatten conversations from pages
  const allConversations = conversations?.pages.flatMap(page => page.data) || []
  
  // Filter conversations based on search
  const filteredConversations = allConversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Separate pinned and regular conversations
  const pinnedConvs = filteredConversations.filter(conv => 
    pinnedConversations.includes(conv.id)
  )
  const regularConvs = filteredConversations.filter(conv => 
    !pinnedConversations.includes(conv.id)
  )

  const handlePinConversation = (conversationId: string) => {
    if (pinnedConversations.includes(conversationId)) {
      setPinnedConversations(prev => prev.filter(id => id !== conversationId))
    } else {
      setPinnedConversations(prev => [...prev, conversationId])
    }
  }

  const handleArchiveConversation = async (conversation: ChatConversation) => {
    try {
      await updateConversationMutation.mutateAsync({
        conversationId: conversation.id,
        isArchived: true,
      })
    } catch (error) {
      console.error('Failed to archive conversation:', error)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversationMutation.mutateAsync(conversationId)
      // Switch to another conversation if this was active
      if (conversationId === activeConversationId && regularConvs.length > 0) {
        const nextConv = regularConvs.find(c => c.id !== conversationId)
        if (nextConv) {
          onSelectConversation(nextConv.id)
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const renderConversation = (conversation: ChatConversation, isPinned = false) => {
    const isActive = conversation.id === activeConversationId
    const lastMessageTime = conversation.lastMessageAt 
      ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })
      : 'No messages'

    return (
      <div
        key={conversation.id}
        className={cn(
          "group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
          "hover:bg-muted/60 border border-transparent",
          isActive && "bg-primary/10 border-primary/20 shadow-sm"
        )}
        onClick={() => onSelectConversation(conversation.id)}
      >
        {/* Conversation Icon */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
        )}>
          <Bot className="w-5 h-5" />
        </div>

        {/* Conversation Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "font-medium text-sm truncate",
              isActive ? "text-primary" : "text-foreground"
            )}>
              {conversation.title}
            </h4>
            {isPinned && (
              <Pin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground truncate">
              {lastMessageTime}
            </p>
            
            {/* Page context indicator */}
            {conversation.currentPageContext && (
              <Badge variant="outline" className="text-xs h-5">
                {conversation.currentPageContext.entityType || 'page'}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "w-8 h-8 flex-shrink-0",
                isActive && "opacity-100"
              )}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handlePinConversation(conversation.id)}>
              <Pin className="w-4 h-4 mr-2" />
              {isPinned ? 'Unpin' : 'Pin'} Conversation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleArchiveConversation(conversation)}>
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteConversation(conversation.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  if (isLoading && allConversations.length === 0) {
    return (
      <div className="p-4 space-y-3">
        {/* Search skeleton */}
        <Skeleton className="h-9 w-full" />
        
        {/* Conversation skeletons */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              {!searchQuery && (
                <p className="text-xs text-muted-foreground mt-1">
                  Start a new conversation to get help from AI
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Pinned Conversations */}
              {pinnedConvs.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-muted-foreground mb-2 px-1">
                    PINNED
                  </h5>
                  <div className="space-y-1">
                    {pinnedConvs.map(conv => renderConversation(conv, true))}
                  </div>
                </div>
              )}

              {/* Regular Conversations */}
              {regularConvs.length > 0 && (
                <div>
                  {pinnedConvs.length > 0 && (
                    <h5 className="text-xs font-medium text-muted-foreground mb-2 px-1">
                      RECENT
                    </h5>
                  )}
                  <div className="space-y-1">
                    {regularConvs.map(conv => renderConversation(conv, false))}
                  </div>
                </div>
              )}

              {/* Load More */}
              {hasMore && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLoadMore}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}