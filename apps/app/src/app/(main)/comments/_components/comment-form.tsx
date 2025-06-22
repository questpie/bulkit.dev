'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@bulkit/ui/components/ui/button'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Send, Paperclip, AtSign, X } from 'lucide-react'
import { useCreateComment, useUpdateComment } from '../comments.queries'
import type {
  CommentWithUser,
  CreateComment,
  UpdateComment,
} from '@bulkit/shared/modules/comments/comments.schemas'

interface CommentFormProps {
  entityType: 'post' | 'task'
  entityId: string
  parentCommentId?: string | null
  editingComment?: CommentWithUser
  onSuccess?: () => void
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

interface CommentFormData {
  content: string
  mentions: Array<{
    type: 'user' | 'agent'
    id: string
    name: string
    startIndex: number
    endIndex: number
  }>
  attachmentIds: string[]
}

export function CommentForm({
  entityType,
  entityId,
  parentCommentId = null,
  editingComment,
  onSuccess,
  onCancel,
  placeholder = 'Write a comment...',
  autoFocus = false,
}: CommentFormProps) {
  const [attachments, setAttachments] = useState<string[]>([])
  const [mentions, setMentions] = useState<CommentFormData['mentions']>([])
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)

  const createComment = useCreateComment()
  const updateComment = useUpdateComment()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<CommentFormData>({
    defaultValues: {
      content: editingComment?.content || '',
      mentions: editingComment?.mentions || [],
      attachmentIds: editingComment?.attachments?.map((a) => a.resourceId) || [],
    },
  })

  const content = watch('content')
  const isEditing = !!editingComment

  const handleMentionClick = () => {
    setShowMentionSuggestions(true)
  }

  const handleMentionSelect = (mention: { type: 'user' | 'agent'; id: string; name: string }) => {
    const currentContent = content || ''
    const mentionText = '@' + mention.name
    const newContent = currentContent + mentionText + ' '

    setValue('content', newContent)
    setMentions((prev) => [
      ...prev,
      {
        ...mention,
        startIndex: currentContent.length,
        endIndex: currentContent.length + mentionText.length,
      },
    ])
    setShowMentionSuggestions(false)
  }

  const removeMention = (index: number) => {
    setMentions((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: CommentFormData) => {
    try {
      if (isEditing) {
        await updateComment.mutateAsync({
          commentId: editingComment.id,
          content: data.content,
          mentions: mentions,
          attachmentIds: attachments,
        })
      } else {
        await createComment.mutateAsync({
          entityType,
          entityId,
          parentCommentId,
          content: data.content,
          mentions: mentions,
          attachmentIds: attachments,
        })
      }

      reset()
      setAttachments([])
      setMentions([])
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save comment:', error)
    }
  }

  const handleCancel = () => {
    reset()
    setAttachments([])
    setMentions([])
    onCancel?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(onSubmit)()
    }
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
      <div className='flex space-x-3'>
        <Avatar className='h-8 w-8 shrink-0'>
          <AvatarImage src={'https://avatar.vercel.sh/current-user'} />
          <AvatarFallback className='text-sm'>You</AvatarFallback>
        </Avatar>

        <div className='flex-1 space-y-3'>
          {/* Mentions Display */}
          {mentions.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {mentions.map((mention, index) => (
                <Badge
                  key={`${mention.type}-${mention.id}-${index}`}
                  variant='secondary'
                  className='text-xs'
                >
                  @{mention.name}
                  <button
                    type='button'
                    onClick={() => removeMention(index)}
                    className='ml-1 hover:text-red-600'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Content Input */}
          <div className='relative'>
            <Textarea
              {...register('content', { required: true })}
              placeholder={placeholder}
              className='min-h-[80px] resize-none'
              autoFocus={autoFocus}
              onKeyDown={handleKeyDown}
            />

            {/* Mention Suggestions (Placeholder) */}
            {showMentionSuggestions && (
              <div className='absolute bottom-full left-0 right-0 mb-2 bg-white border rounded-md shadow-lg p-2 z-10'>
                <div className='text-xs text-muted-foreground mb-2'>Mention someone:</div>
                <div className='space-y-1'>
                  <button
                    type='button'
                    className='w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded'
                    onClick={() =>
                      handleMentionSelect({
                        type: 'agent',
                        id: 'ai-assistant',
                        name: 'AI Assistant',
                      })
                    }
                  >
                    🤖 AI Assistant
                  </button>
                  <button
                    type='button'
                    className='w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded'
                    onClick={() =>
                      handleMentionSelect({ type: 'user', id: 'team-member', name: 'Team Member' })
                    }
                  >
                    👤 Team Member
                  </button>
                </div>
                <button
                  type='button'
                  onClick={() => setShowMentionSuggestions(false)}
                  className='absolute top-1 right-1 text-gray-400 hover:text-gray-600'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            )}
          </div>

          {/* Attachments Display */}
          {attachments.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {attachments.map((attachmentId, index) => (
                <Badge key={attachmentId} variant='outline' className='text-xs'>
                  📎 Attachment {index + 1}
                  <button
                    type='button'
                    onClick={() =>
                      setAttachments((prev) => prev.filter((id) => id !== attachmentId))
                    }
                    className='ml-1 hover:text-red-600'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              {/* Mention Button */}
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-8 px-2'
                onClick={handleMentionClick}
              >
                <AtSign className='h-4 w-4' />
              </Button>

              {/* Attachment Button (Placeholder) */}
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-8 px-2'
                onClick={() => {
                  // TODO: Implement file upload
                  console.log('File upload not implemented yet')
                }}
              >
                <Paperclip className='h-4 w-4' />
              </Button>
            </div>

            <div className='flex items-center space-x-2'>
              {/* Cancel Button (only for editing or replies) */}
              {(isEditing || parentCommentId || onCancel) && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}

              {/* Submit Button */}
              <Button
                type='submit'
                size='sm'
                disabled={!content?.trim() || isSubmitting}
                className='min-w-[80px]'
              >
                {isSubmitting ? (
                  'Saving...'
                ) : (
                  <>
                    <Send className='h-4 w-4 mr-1' />
                    {isEditing ? 'Update' : parentCommentId ? 'Reply' : 'Comment'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className='text-xs text-muted-foreground'>
            Press Cmd/Ctrl + Enter to {isEditing ? 'update' : 'post'}, Escape to cancel
          </div>
        </div>
      </div>
    </form>
  )
}
