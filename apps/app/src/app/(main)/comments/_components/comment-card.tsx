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
  Heart,
  ThumbsUp,
  Laugh,
  Angry,
  Frown,
  MessageCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Bot,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { CommentWithUser } from '@bulkit/shared/modules/comments/comments.schemas'
import { CommentList } from './comment-list'
import { CommentForm } from './comment-form'
import {
  useAddReaction,
  useRemoveReaction,
  useDeleteComment,
  useMarkAsRead,
} from '../comments.queries'

interface CommentCardProps {
  comment: CommentWithUser
  entityType: 'post' | 'task'
  entityId: string
  maxDepth?: number
  currentDepth?: number
}

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  laugh: Laugh,
  angry: Angry,
  sad: Frown,
  thumbs_up: ThumbsUp,
  thumbs_down: ThumbsUp, // We'll rotate this with CSS
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

export function CommentCard({
  comment,
  entityType,
  entityId,
  maxDepth = 5,
  currentDepth = 0,
}: CommentCardProps) {
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
                        <Bot className='h-3 w-3 mr-1' />
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
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className='h-4 w-4 mr-2' />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className='text-red-600'>
                    <Trash2 className='h-4 w-4 mr-2' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content */}
            {isEditing ? (
              <CommentForm
                entityType={entityType}
                entityId={entityId}
                parentCommentId={comment.parentCommentId}
                editingComment={comment}
                onCancel={() => setIsEditing(false)}
                onSuccess={() => setIsEditing(false)}
              />
            ) : (
              <div className='prose prose-sm max-w-none'>
                <p className='text-sm leading-relaxed whitespace-pre-wrap'>{comment.content}</p>
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
                  const Icon = reactionIcons[reactionType as keyof typeof reactionIcons]
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
                      <Icon className='h-3 w-3 mr-1' />
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
                  const Icon = reactionIcons[reactionType as keyof typeof reactionIcons]
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
                      <Icon className='h-3 w-3' />
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
                  <MessageCircle className='h-3 w-3 mr-1' />
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
                <CommentForm
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
