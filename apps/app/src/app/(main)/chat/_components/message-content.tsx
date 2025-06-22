'use client'

import { useState, useEffect } from 'react'
import { cn } from '@bulkit/ui/lib'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { AtSign, Bot, Users } from 'react-icons/lu'

import type { Mention } from '@bulkit/shared/modules/chat/chat.schemas'

interface MessageContentProps {
  content: string
  mentions?: Mention[]
  isStreaming?: boolean
  className?: string
}

export function MessageContent({ content, mentions = [], isStreaming, className }: MessageContentProps) {
  const [displayContent, setDisplayContent] = useState(content)

  // Update content when streaming
  useEffect(() => {
    setDisplayContent(content)
  }, [content])

  // Enhanced markdown-like rendering with mention support
  const renderContent = (text: string) => {
    let formatted = text
      // Bold text **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text *text*
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code `code`
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Mentions @username
      .replace(/@(\w+)/g, '<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-sm font-medium"><span class="text-xs">@</span>$1</span>')
      // Line breaks
      .replace(/\n/g, '<br>')

    return formatted
  }

  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      <div
        dangerouslySetInnerHTML={{ __html: renderContent(displayContent) }}
      />
      
      {/* Streaming cursor */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
      )}
      
      {/* Rich mention display */}
      {mentions.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Mentioned:</div>
          <div className="flex flex-wrap gap-2">
            {mentions.map((mention) => {
              const getMentionIcon = () => {
                switch (mention.type) {
                  case 'agent':
                    return <Bot className="w-3 h-3" />
                  case 'user':
                    return <Users className="w-3 h-3" />
                  default:
                    return <AtSign className="w-3 h-3" />
                }
              }
              
              const getMentionVariant = () => {
                switch (mention.type) {
                  case 'agent':
                    return 'default' as const
                  case 'user':
                    return 'secondary' as const
                  default:
                    return 'outline' as const
                }
              }
              
              return (
                <Badge 
                  key={mention.id} 
                  variant={getMentionVariant()}
                  className="flex items-center gap-1 text-xs"
                >
                  {getMentionIcon()}
                  {mention.name}
                </Badge>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}