'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import { 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  MoreVertical,
  Heart,
  HelpCircle,
  Check,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import type { ChatMessage } from '@bulkit/shared/modules/chat/chat.schemas'

interface MessageActionsProps {
  message: ChatMessage
  onReaction: (messageId: string, reactionType: 'like' | 'dislike' | 'helpful' | 'not_helpful') => void
  onCopy: (content: string) => void
  className?: string
}

export function MessageActions({ 
  message, 
  onReaction, 
  onCopy, 
  className 
}: MessageActionsProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  
  const isAgent = message.messageType === 'agent'
  const isUser = message.messageType === 'user'

  const handleCopy = () => {
    onCopy(message.content)
    setCopiedMessageId(message.id)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const handleReaction = (reactionType: 'like' | 'dislike' | 'helpful' | 'not_helpful') => {
    onReaction(message.id, reactionType)
  }

  return (
    <div className={cn(
      "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
      className
    )}>
      {/* Quick reactions for agent messages */}
      {isAgent && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleReaction('helpful')}
            className="h-7 px-2 text-xs"
          >
            <ThumbsUp className="w-3 h-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleReaction('not_helpful')}
            className="h-7 px-2 text-xs"
          >
            <ThumbsDown className="w-3 h-3" />
          </Button>
        </>
      )}

      {/* Copy button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 px-2 text-xs"
      >
        {copiedMessageId === message.id ? (
          <Check className="w-3 h-3 text-green-500" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </Button>

      {/* More actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
          >
            <MoreVertical className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {isAgent && (
            <>
              <DropdownMenuItem onClick={() => handleReaction('like')}>
                <Heart className="w-4 h-4 mr-2" />
                Like
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleReaction('dislike')}>
                <ThumbsDown className="w-4 h-4 mr-2" />
                Dislike
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleReaction('helpful')}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Helpful
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleReaction('not_helpful')}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Not Helpful
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Text
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}