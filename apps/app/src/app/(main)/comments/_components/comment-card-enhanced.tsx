'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@bulkit/ui/components/ui/avatar'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card, CardContent } from '@bulkit/ui/components/ui/card'
import { Badge } from '@bulkit/ui/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import {
  PiDotsThreeOutlineHorizontalBold,
  PiPencilSimpleBold,
  PiTrashBold,
  PiRobotBold,
  PiChatCircleBold,
} from 'react-icons/pi'
import { formatDistanceToNow } from 'date-fns'
import type { CommentWithUser } from '@bulkit/shared/modules/comments/comments.schemas'
import { CommentList } from './comment-list'
import { CommentFormEnhanced } from './comment-form-enhanced'
import {
  useAddReaction,
  useRemoveReaction,
  useDeleteComment,
  useMarkAsRead,
} from '../comments.queries'

interface CommentCardEnhancedProps {
  comment: CommentWithUser
  entityType: 'post' | 'task'
  entityId: string
  maxDepth?: number
  currentDepth?: number
}

const reactionEmojis = {
  like: '👍',
  love: '❤️',
  laugh: '😄',
  angry: '😠',
  sad: '😢',
  thumbs_up: '👍',
  thumbs_down: '👎',
} as const

const reactionColors = {
  like: 'text-blue-600',
  love: 'text-red-600',
  laugh: 'text-yellow-600',
  angry: 'text-red-600',
  sad: 'text-gray-600',
  thumbs_up: 'text-green-600',
  thumbs_down: 'text-red-600',
} as const

export function CommentCardEnhanced({
  comment,
  entityType,
  entityId,
  maxDepth = 5,
  currentDepth = 0,
}: CommentCardEnhancedProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const addReaction = useAddReaction()
  const removeReaction = useRemoveReaction()
  const deleteComment = useDeleteComment()
  const markAsRead = useMarkAsRead()

  const canShowReplies = currentDepth < maxDepth
  const hasReplies = comment.replyCount > 0

  const handleReactionClick = (reactionType: string) => {
    const userReaction = comment.reactions.find(
      (r) => r.userId === comment.user.id && r.reactionType === reactionType
    )

    if (userReaction) {
      removeReaction.mutate({ commentId: comment.id, reactionType })
    } else {
      addReaction.mutate({ commentId: comment.id, reactionType })
    }
  }

  const handleDelete = () => {
    deleteComment.mutate({
      commentId: comment.id,
      entityType,
      entityId,
    })
  }

  // Mark as read when comment is viewed
  useState(() => {
    markAsRead.mutate(comment.id)
  })

  // Function to render rich content with mentions
  const renderRichContent = (content: string) => {
    let result = content

    // Process mentions if they exist
    if (comment.mentions && comment.mentions.length > 0) {
      // Sort mentions by startIndex in descending order to replace from end to start
      const sortedMentions = [...comment.mentions].sort((a, b) => b.startIndex - a.startIndex)

      for (const mention of sortedMentions) {
        const before = result.slice(0, mention.startIndex)
        const after = result.slice(mention.endIndex)
        const mentionText = result.slice(mention.startIndex, mention.endIndex)

        const mentionIcon = getMentionIcon(mention.type)
        const mentionColor = getMentionColor(mention.type)

        result =
          before +
          `<span class="${mentionColor} px-1 py-0.5 rounded text-sm font-medium cursor-pointer"
                 data-mention-type="${mention.type}"
                 data-mention-id="${mention.id}">
             ${mentionIcon}${mentionText}
           </span>` +
          after
      }
    }

    // Simple markdown-like processing
    result = result
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>'
      )
      .replace(/\n/g, '<br />')

    return <div dangerouslySetInnerHTML={{ __html: result }} />
  }

  const getMentionIcon = (type: string) => {
    switch (type) {
      case 'user':
        return '👤'
      case 'agent':
        return '🤖'
      case 'post':
        return '📝'
      case 'media':
        return '📎'
      default:
        return '@'
    }
  }

  const getMentionColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'agent':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'post':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200'
      case 'media':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  return (
    <div className={`${currentDepth > 0 ? 'ml-8 border-l border-gray-200 pl-4' : ''}`}>
      <Card className='border-0 shadow-none'>
        <CardContent className='p-4'>
          <div className='space-y-3'>
            {/* Header */}
            <div className='flex items-start justify-between'>
              <div className='flex items-center space-x-3'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={`https://avatar.vercel.sh/${comment.user.email}`} />
                  <AvatarFallback className='text-sm'>
                    {comment.user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className='flex items-center space-x-2'>
                    <p className='text-sm font-medium'>{comment.user.name}</p>
                    {comment.isAiResponse && (
                      <Badge variant='secondary' className='text-xs'>
                        <PiRobotBold className='h-3 w-3 mr-1' />
                        AI
                      </Badge>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    {comment.isEdited && ' (edited)'}
                  </p>
                </div>
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <PiDotsThreeOutlineHorizontalBold className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <PiPencilSimpleBold className='h-4 w-4 mr-2' />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className='text-red-600'>
                    <PiTrashBold className='h-4 w-4 mr-2' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content */}
            {isEditing ? (
              <CommentFormEnhanced
                entityType={entityType}
                entityId={entityId}
                parentCommentId={comment.parentCommentId}
                editingComment={comment}
                onCancel={() => setIsEditing(false)}
                onSuccess={() => setIsEditing(false)}
              />
            ) : (
              <div className='prose prose-sm max-w-none'>
                <div className='text-sm leading-relaxed'>{renderRichContent(comment.content)}</div>
              </div>
            )}

            {/* Attachments */}
            {comment.attachments && comment.attachments.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {comment.attachments.map((attachment) => (
                  <Badge key={attachment.id} variant='outline' className='text-xs'>
                    📎 {attachment.attachmentType}
                  </Badge>
                ))}
              </div>
            )}

            {/* Reactions */}
            {comment.reactions && comment.reactions.length > 0 && (
              <div className='flex flex-wrap gap-1'>
                {Object.entries(comment.reactionCount || {}).map(([reactionType, count]) => {
                  if (count === 0) return null
                  const emoji = reactionEmojis[reactionType as keyof typeof reactionEmojis]
                  const color = reactionColors[reactionType as keyof typeof reactionColors]
                  const userReacted = comment.reactions.some(
                    (r) => r.userId === comment.user.id && r.reactionType === reactionType
                  )

                  return (
                    <Button
                      key={reactionType}
                      variant={userReacted ? 'default' : 'outline'}
                      size='sm'
                      className={`h-6 px-2 text-xs ${userReacted ? color : ''}`}
                      onClick={() => handleReactionClick(reactionType)}
                    >
                      <span className='mr-1'>{emoji}</span>
                      {count}
                    </Button>
                  )
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex items-center space-x-4 pt-2'>
              {/* Reaction Buttons */}
              <div className='flex items-center space-x-1'>
                {['like', 'love', 'laugh'].map((reactionType) => {
                  const emoji = reactionEmojis[reactionType as keyof typeof reactionEmojis]
                  const color = reactionColors[reactionType as keyof typeof reactionColors]
                  const userReacted = comment.reactions.some(
                    (r) => r.userId === comment.user.id && r.reactionType === reactionType
                  )

                  return (
                    <Button
                      key={reactionType}
                      variant='ghost'
                      size='sm'
                      className={`h-7 px-2 ${userReacted ? color : 'text-muted-foreground'}`}
                      onClick={() => handleReactionClick(reactionType)}
                    >
                      {emoji}
                    </Button>
                  )
                })}
              </div>

              {/* Reply Button */}
              {canShowReplies && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-7 px-2 text-muted-foreground'
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <PiChatCircleBold className='h-3 w-3 mr-1' />
                  Reply
                </Button>
              )}

              {/* Show Replies Button */}
              {hasReplies && canShowReplies && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-7 px-2 text-muted-foreground'
                  onClick={() => setShowReplies(!showReplies)}
                >
                  {showReplies ? 'Hide' : 'Show'} {comment.replyCount} replies
                </Button>
              )}
            </div>

            {/* Reply Form */}
            {showReplyForm && canShowReplies && (
              <div className='pt-3'>
                <CommentFormEnhanced
                  entityType={entityType}
                  entityId={entityId}
                  parentCommentId={comment.id}
                  onSuccess={() => setShowReplyForm(false)}
                  onCancel={() => setShowReplyForm(false)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      {showReplies && canShowReplies && hasReplies && (
        <div className='mt-4'>
          <CommentList
            entityType={entityType}
            entityId={entityId}
            parentCommentId={comment.id}
            showForm={false}
            maxDepth={maxDepth}
          />
        </div>
      )}
    </div>
  )
}
// End of Selection
