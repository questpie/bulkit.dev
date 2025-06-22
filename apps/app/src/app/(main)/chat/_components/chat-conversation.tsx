'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@bulkit/ui/components/ui/button'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { ScrollArea } from '@bulkit/ui/components/ui/scroll-area'
import { Skeleton } from '@bulkit/ui/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@bulkit/ui/components/ui/avatar'
import { 
  User, 
  Bot, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  MoreVertical,
  AlertCircle,
  Loader2,
  Sparkles,
  MessageCircle,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import type { ChatMessage } from '@bulkit/shared/modules/chat/chat.schemas'
import { conversationQueryOptions, messagesQueryOptions, useAddMessageReaction } from '../chat.queries'
import { useAgentTyping, useStreamingMessage } from '../chat.atoms'
import { MessageContent } from './message-content'
import { MessageReferences } from './message-references'
import { MessageActions } from './message-actions'

interface ChatConversationProps {
  conversationId: string
}

export function ChatConversation({ conversationId }: ChatConversationProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [agentTyping] = useAgentTyping()
  const [streamingMessage] = useStreamingMessage()
  
  // Queries
  const conversationQuery = useQuery(conversationQueryOptions(conversationId))
  const messagesQuery = useQuery(messagesQueryOptions(conversationId))
  
  const addReactionMutation = useAddMessageReaction()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messagesQuery.data, streamingMessage])

  // Flatten messages from pages
  const allMessages = messagesQuery.data?.pages.flatMap(page => page.data) || []

  const handleReaction = async (messageId: string, reactionType: 'like' | 'dislike' | 'helpful' | 'not_helpful') => {
    try {
      await addReactionMutation.mutateAsync({ messageId, reactionType })
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.messageType === 'user'
    const isAgent = message.messageType === 'agent'
    const isSystem = message.messageType === 'system'
    const isError = message.isError
    const isStreaming = message.isStreaming

    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-3 p-4 rounded-lg",
          isUser && "ml-8 bg-primary/5 border border-primary/10",
          isAgent && "mr-8 bg-muted/30",
          isSystem && "mx-8 bg-amber-50 border border-amber-200",
          isError && "mx-8 bg-destructive/5 border border-destructive/20"
        )}
      >
        {/* Avatar */}
        <div className="shrink-0">
          {isUser ? (
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          ) : isAgent ? (
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">
              {isUser ? 'You' : isAgent ? (message.agentName || 'AI Assistant') : 'System'}
            </span>
            
            {isAgent && (
              <Badge variant="secondary" className="text-xs h-5">
                <Sparkles className="w-3 h-3 mr-1" />
                AI
              </Badge>
            )}
            
            {isError && (
              <Badge variant="destructive" className="text-xs h-5">
                Error
              </Badge>
            )}
            
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
            
            {isStreaming && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Typing...
              </div>
            )}
          </div>

          {/* References (if any) */}
          {message.references && message.references.length > 0 && (
            <MessageReferences references={message.references} className="mb-3" />
          )}

          {/* Message Text */}
          <MessageContent 
            content={message.content}
            mentions={message.mentions}
            isStreaming={isStreaming}
            className={cn(
              "prose prose-sm max-w-none",
              isError && "text-destructive"
            )}
          />

          {/* Tool Calls (if any) */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Actions performed:
              </div>
              <div className="space-y-2">
                {message.toolCalls.map((toolCall, index) => (
                  <div key={index} className="text-xs">
                    <Badge variant="outline" className="mr-2">
                      {toolCall.name}
                    </Badge>
                    <span className="text-muted-foreground">
                      {toolCall.status || 'completed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Actions */}
          {!isStreaming && (
            <MessageActions
              message={message}
              onReaction={handleReaction}
              onCopy={handleCopyMessage}
              className="mt-3"
            />
          )}
        </div>
      </div>
    )
  }

  const renderTypingIndicator = () => {
    if (!agentTyping || agentTyping.conversationId !== conversationId) return null

    return (
      <div className="flex gap-3 p-4 mr-8 bg-muted/30 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">{agentTyping.agentName}</span>
            <Badge variant="secondary" className="text-xs h-5">
              <Sparkles className="w-3 h-3 mr-1" />
              AI
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>thinking...</span>
          </div>
        </div>
      </div>
    )
  }

  if (messagesQuery.isLoading && allMessages.length === 0) {
    return (
      <div className="flex-1 p-4">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 h-full">
      <div className="p-4 space-y-4">
        {/* Conversation Header */}
        {conversationQuery.data && (
          <div className="text-center py-4">
            <h2 className="text-lg font-semibold mb-2">
              {conversationQuery.data.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              Started {formatDistanceToNow(new Date(conversationQuery.data.createdAt), { addSuffix: true })}
            </p>
          </div>
        )}

        {/* Messages */}
        {allMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ask me anything about your social media management, content creation, 
              analytics, or any other topic I can help with.
            </p>
          </div>
        ) : (
          <>
            {allMessages.map(renderMessage)}
            {renderTypingIndicator()}
            
            {/* Load more messages */}
            {messagesQuery.hasNextPage && (
              <div className="text-center py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => messagesQuery.fetchNextPage()}
                  disabled={messagesQuery.isFetchingNextPage}
                >
                  {messagesQuery.isFetchingNextPage ? 'Loading...' : 'Load Earlier Messages'}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}