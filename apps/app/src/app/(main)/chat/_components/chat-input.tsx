'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@bulkit/ui/components/ui/popover'
import {
  LuSend,
  LuPaperclip,
  LuAtSign,
  LuHash,
  LuLoader2,
  LuSmile,
  LuMic,
  LuSquare,
  LuX,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import type { SmartReference, Mention } from '@bulkit/shared/modules/chat/chat.schemas'
import {
  useChatInput,
  useChatReferences,
  useChatMentions,
  useCurrentPageContext,
  useIsTyping,
  useCompositionMode,
} from '../chat.atoms'
import { useSendMessage, agentsQueryOptions, searchReferencesQueryOptions } from '../chat.queries'
import { useQuery } from '@tanstack/react-query'
import { ReferenceSelector } from './reference-selector'
import { EnhancedMentionSelector } from './enhanced-mention-selector'

interface ChatInputProps {
  conversationId: string
}

export function ChatInput({ conversationId }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useChatInput()
  const [references, setReferences] = useChatReferences()
  const [mentions, setMentions] = useChatMentions()
  const [currentPageContext] = useCurrentPageContext()
  const [isTyping, setIsTyping] = useIsTyping()
  const [compositionMode] = useCompositionMode()

  const [showReferences, setShowReferences] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)

  const sendMessageMutation = useSendMessage()
  const agentsQuery = useQuery(agentsQueryOptions())

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input, adjustTextareaHeight])

  // Handle typing indicators
  useEffect(() => {
    if (input.trim()) {
      setIsTyping(true)
      const timer = setTimeout(() => setIsTyping(false), 1000)
      return () => clearTimeout(timer)
    }
    setIsTyping(false)
  }, [input, setIsTyping])

  // Detect @ and # triggers
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const position = e.target.selectionStart

    setInput(value)
    setCursorPosition(position)

    // Check for @ mention trigger
    const beforeCursor = value.slice(0, position)
    const mentionMatch = beforeCursor.match(/@(\w*)$/)
    if (mentionMatch) {
      setShowMentions(true)
      setShowReferences(false)
    }
    // Check for # reference trigger
    else if (beforeCursor.endsWith('#')) {
      setShowReferences(true)
      setShowMentions(false)
    }
    // Close popups if no triggers
    else {
      setShowMentions(false)
      setShowReferences(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
    // Close popups on Escape
    else if (e.key === 'Escape') {
      setShowMentions(false)
      setShowReferences(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || sendMessageMutation.isPending) return

    try {
      await sendMessageMutation.mutateAsync({
        conversationId,
        content: input.trim(),
        references,
        mentions,
        currentPageContext,
      })

      // Clear input and states
      setInput('')
      setReferences([])
      setMentions([])
      setShowMentions(false)
      setShowReferences(false)

      // Focus back to textarea
      textareaRef.current?.focus()
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleAddReference = (reference: SmartReference) => {
    // Add reference if not already added
    if (!references.find((r) => r.id === reference.id && r.type === reference.type)) {
      setReferences((prev) => [...prev, reference])
    }
    setShowReferences(false)
  }

  const handleAddMention = (mention: Mention) => {
    // Insert mention into text at cursor position
    const beforeCursor = input.slice(0, cursorPosition)
    const afterCursor = input.slice(cursorPosition)
    const mentionText = `@${mention.name} `

    // Remove the @ trigger character
    const beforeWithoutTrigger = beforeCursor.replace(/@(\w*)$/, '')
    const newInput = beforeWithoutTrigger + mentionText + afterCursor

    setInput(newInput)

    // Add to mentions array if not already added
    if (!mentions.find((m) => m.id === mention.id)) {
      const updatedMention = {
        ...mention,
        startIndex: beforeWithoutTrigger.length,
        endIndex: beforeWithoutTrigger.length + mentionText.length - 1,
      }
      setMentions((prev) => [...prev, updatedMention])
    }

    setShowMentions(false)

    // Focus and position cursor
    setTimeout(() => {
      const newPosition = beforeWithoutTrigger.length + mentionText.length
      textareaRef.current?.setSelectionRange(newPosition, newPosition)
      textareaRef.current?.focus()
    }, 0)
  }

  const handleRemoveReference = (referenceId: string, referenceType: string) => {
    setReferences((prev) => prev.filter((r) => !(r.id === referenceId && r.type === referenceType)))
  }

  const handleRemoveMention = (mentionId: string) => {
    setMentions((prev) => prev.filter((m) => m.id !== mentionId))
  }

  const canSend = input.trim() && !sendMessageMutation.isPending

  return (
    <div className='p-4 border-t bg-background'>
      {/* References display */}
      {references.length > 0 && (
        <div className='mb-3'>
          <div className='text-xs font-medium text-muted-foreground mb-2'>Referenced:</div>
          <div className='flex flex-wrap gap-2'>
            {references.map((ref, index) => (
              <Badge
                key={`${ref.id}-${ref.type}-${index}`}
                variant='secondary'
                className='flex items-center gap-1'
              >
                <span className='text-xs'>{ref.title}</span>
                <button
                  type='button'
                  onClick={() => handleRemoveReference(ref.id, ref.type)}
                  className='text-muted-foreground hover:text-foreground'
                >
                  <LuX className='w-3 h-3' />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Mentions display */}
      {mentions.length > 0 && (
        <div className='mb-3'>
          <div className='text-xs font-medium text-muted-foreground mb-2'>Mentioned:</div>
          <div className='flex flex-wrap gap-2'>
            {mentions.map((mention) => (
              <Badge key={mention.id} variant='outline' className='flex items-center gap-1'>
                <LuAtSign className='w-3 h-3' />
                <span className='text-xs'>{mention.name}</span>
                <button
                  type='button'
                  onClick={() => handleRemoveMention(mention.id)}
                  className='text-muted-foreground hover:text-foreground'
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className='flex gap-3'>
        {/* Textarea with popovers */}
        <div className='flex-1 relative'>
          <Popover open={showReferences} onOpenChange={setShowReferences}>
            <PopoverTrigger asChild>
              <div className='relative'>
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder='Ask me anything... Use @ to mention agents or # to reference content'
                  className={cn(
                    'min-h-[44px] max-h-[200px] resize-none',
                    'pr-12' // Space for attachment button
                  )}
                  disabled={sendMessageMutation.isPending}
                />

                {/* Attachment button overlay */}
                <Button
                  variant='ghost'
                  size='sm'
                  className='absolute right-2 top-2 h-7 w-7 p-0'
                  onClick={() => setShowReferences(!showReferences)}
                >
                  <LuHash className='w-4 h-4' />
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent className='w-80 p-0' align='start' side='top'>
              <ReferenceSelector onSelect={handleAddReference} />
            </PopoverContent>
          </Popover>

          {/* Mention selector popover */}
          <Popover open={showMentions} onOpenChange={setShowMentions}>
            <PopoverTrigger asChild>
              <span />
            </PopoverTrigger>
            <PopoverContent className='w-80 p-0' align='start' side='top'>
              <EnhancedMentionSelector 
                onSelectAgent={handleAddMention}
                onSelectUser={handleAddMention}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Action buttons */}
        <div className='flex items-end gap-2'>
          {/* Mention button */}
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setShowMentions(!showMentions)}
            className='h-11 w-11 p-0'
          >
            <LuAtSign className='w-4 h-4' />
          </Button>

          {/* Send button */}
          <Button onClick={handleSend} disabled={!canSend} className='h-11 w-11 p-0'>
            {sendMessageMutation.isPending ? (
              <LuLoader2 className='w-4 h-4 animate-spin' />
            ) : (
              <LuSend className='w-4 h-4' />
            )}
          </Button>
        </div>
      </div>

      {/* Helper text */}
      <div className='mt-2 flex items-center justify-between text-xs text-muted-foreground'>
        <div className='flex items-center gap-3'>
          <span>Press Ctrl+Enter to send</span>
          {isTyping && (
            <div className='flex items-center gap-1'>
              <div className='w-1 h-1 bg-blue-500 rounded-full animate-pulse' />
              <span>Typing...</span>
            </div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {currentPageContext && (
            <Badge variant='outline' className='text-xs h-5'>
              Context: {currentPageContext.path}
            </Badge>
          )}
          <span>{input.length}/4000</span>
        </div>
      </div>
    </div>
  )
}
