'use client'

import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { apiClient } from '@bulkit/app/api/api.client'
import type {
  CommentWithUser,
  CreateComment,
  UpdateComment,
  CommentReactionRequest,
  CommentListQuery,
  TypingIndicator,
} from '@bulkit/shared/modules/comments/comments.schemas'
import type { CommentReactionType } from '@bulkit/shared/constants/db.constants'

// Query key factory
export const COMMENTS_QUERY_KEY = 'comments'

export const commentsQueryKeys = {
  all: [COMMENTS_QUERY_KEY] as const,
  entityComments: (entityType: string, entityId: string) =>
    [...commentsQueryKeys.all, 'entity', entityType, entityId] as const,
  commentReplies: (commentId: string) => [...commentsQueryKeys.all, 'replies', commentId] as const,
  entityPresence: (entityType: string, entityId: string) =>
    [...commentsQueryKeys.all, 'presence', entityType, entityId] as const,
}

// Entity comments infinite query (works for both posts and tasks)
export function entityCommentsInfiniteQueryOptions(
  entityType: 'post' | 'task',
  entityId: string,
  query: Omit<CommentListQuery, 'cursor' | 'replyToCommentId'> & {
    replyToCommentId?: string | null
  } = {}
) {
  return infiniteQueryOptions({
    queryKey: [...commentsQueryKeys.entityComments(entityType, entityId), query],
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.comments
        .entity({ entityType })({ entityId })
        .get({
          query: {
            ...query,
            cursor: pageParam as string | undefined,
            replyToCommentId: query.replyToCommentId ?? null,
          },
        })
      if (res.error) throw res.error
      return res.data ?? []
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      // Implement cursor-based pagination logic
      if (lastPage.length < (query.limit || 25)) return undefined
      return lastPage[lastPage.length - 1]?.id
    },
  })
}

// Single comment query
export function commentQueryOptions(commentId: string) {
  return queryOptions({
    queryKey: [...commentsQueryKeys.all, commentId],
    queryFn: async () => {
      const res = await apiClient.comments({ id: commentId }).get()
      if (res.error) throw res.error
      return res.data
    },
  })
}

// Comment replies infinite query
export function commentRepliesInfiniteQueryOptions(
  commentId: string,
  query: Omit<CommentListQuery, 'cursor' | 'replyToCommentId'> = {}
) {
  return infiniteQueryOptions({
    queryKey: [...commentsQueryKeys.commentReplies(commentId), query],
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.comments({ id: commentId }).replies.get({
        query: { ...query, cursor: pageParam as string | undefined },
      })
      if (res.error) throw res.error
      return res.data ?? []
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < (query.limit || 25)) return undefined
      return lastPage[lastPage.length - 1]?.id
    },
  })
}

// Entity presence query (for real-time features)
export function entityPresenceQueryOptions(entityType: 'post' | 'task', entityId: string) {
  return queryOptions({
    queryKey: commentsQueryKeys.entityPresence(entityType, entityId),
    queryFn: async () => {
      // This would typically use WebSocket/SSE for real-time updates
      // For now, it's a placeholder that returns empty array
      return []
    },
    refetchInterval: 5000, // Refetch every 5 seconds for demo
  })
}

// Mutation hooks
export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateComment) => {
      const res = await apiClient.comments.post({ ...data })
      if (res.error) throw res.error
      return res.data!
    },
    onSuccess: (newComment) => {
      // Invalidate and refetch entity comments
      queryClient.invalidateQueries({
        queryKey: commentsQueryKeys.entityComments(newComment.entityType, newComment.entityId),
      })

      // If it's a reply, also invalidate parent comment replies
      if (newComment.replyToCommentId) {
        queryClient.invalidateQueries({
          queryKey: commentsQueryKeys.commentReplies(newComment.replyToCommentId),
        })
      }
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, ...data }: UpdateComment & { commentId: string }) => {
      const res = await apiClient.comments({ id: commentId }).put({ ...data })
      if (res.error) throw res.error
      return res.data!
    },
    onSuccess: (updatedComment) => {
      // Update comment in cache
      queryClient.setQueryData([...commentsQueryKeys.all, updatedComment.id], updatedComment)

      // Invalidate entity comments to refresh the list
      queryClient.invalidateQueries({
        queryKey: commentsQueryKeys.entityComments(
          updatedComment.entityType,
          updatedComment.entityId
        ),
      })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commentId,
      entityType,
      entityId,
    }: {
      commentId: string
      entityType: 'post' | 'task'
      entityId: string
    }) => {
      const res = await apiClient.comments({ id: commentId }).delete()
      if (res.error) throw res.error
      return res.data!
    },
    onSuccess: (_, { commentId, entityType, entityId }) => {
      // Remove comment from cache
      queryClient.removeQueries({
        queryKey: [...commentsQueryKeys.all, commentId],
      })

      // Invalidate entity comments
      queryClient.invalidateQueries({
        queryKey: commentsQueryKeys.entityComments(entityType, entityId),
      })
    },
  })
}

export function useAddReaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commentId,
      reactionType,
    }: { commentId: string; reactionType: CommentReactionType }) => {
      const res = await apiClient.comments({ id: commentId }).reactions.post({
        reactionType,
      })
      if (res.error) throw res.error
      return res.data!
    },
    onSuccess: (_, { commentId }) => {
      // Invalidate comment to refresh reactions
      queryClient.invalidateQueries({
        queryKey: [...commentsQueryKeys.all, commentId],
      })
    },
  })
}

export function useRemoveReaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commentId,
      reactionType,
    }: { commentId: string; reactionType: string }) => {
      const res = await apiClient
        .comments({ id: commentId })
        .reactions({ type: reactionType })
        .delete()
      if (res.error) throw res.error
      return res.data!
    },
    onSuccess: (_, { commentId }) => {
      // Invalidate comment to refresh reactions
      queryClient.invalidateQueries({
        queryKey: [...commentsQueryKeys.all, commentId],
      })
    },
  })
}

export function useMarkAsRead() {
  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await apiClient.comments({ id: commentId }).read.post()
      if (res.error) throw res.error
      return res.data!
    },
    // No cache updates needed for read status
  })
}

export function useTypingIndicator() {
  return useMutation({
    mutationFn: async ({ commentId, isTyping }: { commentId: string; isTyping: boolean }) => {
      const res = await apiClient.comments({ id: commentId }).typing.post({
        isTyping,
      })
      if (res.error) throw res.error
      return res.data!
    },
    // No cache updates for typing indicators
  })
}

// Removed AI response functionality as part of simplified comments system

// Helper function to optimistically update comment reactions
export function updateCommentReactionOptimistically(
  queryClient: ReturnType<typeof useQueryClient>,
  commentId: string,
  reactionType: string,
  userId: string,
  isAdding: boolean
) {
  queryClient.setQueryData(
    [...commentsQueryKeys.all, commentId],
    (oldComment: CommentWithUser | undefined) => {
      if (!oldComment) return oldComment

      const updatedReactions = isAdding
        ? [
            ...oldComment.reactions,
            {
              id: `temp-${Date.now()}`,
              commentId,
              userId,
              reactionType,
              isAiReaction: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]
        : oldComment.reactions.filter(
            (r) => !(r.userId === userId && r.reactionType === reactionType)
          )

      const updatedReactionCount = { ...oldComment.reactionCount } as Record<string, number>
      if (isAdding) {
        updatedReactionCount[reactionType] = (updatedReactionCount[reactionType] || 0) + 1
      } else {
        updatedReactionCount[reactionType] = Math.max(
          (updatedReactionCount[reactionType] || 1) - 1,
          0
        )
      }

      return {
        ...oldComment,
        reactions: updatedReactions,
        reactionCount: updatedReactionCount,
      }
    }
  )
}
