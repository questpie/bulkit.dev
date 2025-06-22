'use client'

import { useState, useRef } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { PiPaperclip } from 'react-icons/pi'
import { RichTextEditor, type RichTextEditorRef } from './rich-text-editor'
import { useCreateComment, useUpdateComment } from '../comments.queries'
import type {
  CommentWithUser,
  CommentMention,
} from '@bulkit/shared/modules/comments/comments.schemas'

interface CommentFormEnhancedProps {
  entityType: 'post' | 'task'
  entityId: string
  parentCommentId?: string | null
  editingComment?: CommentWithUser
  onSuccess?: () => void
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export function CommentFormEnhanced({
  entityType,
  entityId,
  parentCommentId = null,
  editingComment,
  onSuccess,
  onCancel,
  placeholder = 'Write a comment...',
  autoFocus = false,
}: CommentFormEnhancedProps) {
  const [content, setContent] = useState(editingComment?.content || '')
  const [mentions, setMentions] = useState<CommentMention[]>(editingComment?.mentions || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const editorRef = useRef<RichTextEditorRef>(null)

  const createComment = useCreateComment()
  const updateComment = useUpdateComment()

  const isEditing = !!editingComment

  const handleEditorUpdate = (newContent: string, newMentions: CommentMention[]) => {
    setContent(newContent)
    setMentions(newMentions)
  }

  const handleSubmit = async () => {
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      if (isEditing) {
        await updateComment.mutateAsync({
          commentId: editingComment.id,
          content,
          mentions,
          attachmentIds: [], // TODO: Handle attachments
        })
      } else {
        await createComment.mutateAsync({
          entityType,
          entityId,
          parentCommentId,
          content,
          mentions,
          attachmentIds: [], // TODO: Handle attachments
        })
      }

      // Clear the editor
      editorRef.current?.clear()
      setContent('')
      setMentions([])
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    editorRef.current?.clear()
    setContent('')
    setMentions([])
    onCancel?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className='space-y-3' onKeyDown={handleKeyDown}>
      <div className='flex space-x-3'>
        <Avatar className='h-8 w-8 flex-shrink-0'>
          <AvatarImage src={'https://avatar.vercel.sh/current-user'} />
          <AvatarFallback className='text-sm'>You</AvatarFallback>
        </Avatar>

        <div className='flex-1 space-y-3'>
          {/* Rich Text Editor */}
          <RichTextEditor
            ref={editorRef}
            content={content}
            placeholder={placeholder}
            onUpdate={handleEditorUpdate}
            onSubmit={handleSubmit}
            autoFocus={autoFocus}
            className='min-h-[80px]'
          />

          {/* Actions */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
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
                <PiPaperclip className='h-4 w-4' />
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
                type='button'
                size='sm'
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
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
    </div>
  )
}
