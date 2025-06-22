import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  commentAttachmentsTable,
  commentReactionsTable,
  commentsTable,
  userOrganizationsTable,
  usersTable,
  type CommentMention,
} from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import type {
  CommentListQuery,
  CommentListResponse,
  CommentReplyQuery,
  CommentWithUser,
  CreateComment,
  CreateCommentReaction,
  UpdateComment,
} from '@bulkit/shared/modules/comments/comments.schemas'
import { and, asc, eq, gte, sql } from 'drizzle-orm'

export class CommentsService {
  async createComment(
    db: TransactionLike,
    opts: {
      userId: string
      organizationId: string
      data: CreateComment
    }
  ): Promise<CommentWithUser> {
    const { userId, organizationId, data } = opts

    // Validate reply-to comment exists if specified
    if (data.replyToCommentId) {
      const parentComment = await db
        .select({ id: commentsTable.id })
        .from(commentsTable)
        .where(
          and(
            eq(commentsTable.id, data.replyToCommentId),
            eq(commentsTable.organizationId, organizationId)
          )
        )
        .then((res) => res[0])

      if (!parentComment) {
        throw new Error('Reply-to comment not found')
      }
    }

    // Extract mentions from content
    const mentions = this.extractMentions(data.content)

    const comment = await db
      .insert(commentsTable)
      .values({
        entityId: data.entityId,
        entityType: data.entityType,
        userId,
        organizationId,
        content: data.content,
        mentions: [...(data.mentions || []), ...mentions],
        replyToCommentId: data.replyToCommentId || null,
        attachmentIds: data.attachmentIds || [],
      })
      .returning()
      .then((res) => res[0]!)

    return this.getCommentWithUser(db, comment.id, organizationId)
  }

  async updateComment(
    db: TransactionLike,
    opts: {
      commentId: string
      userId: string
      organizationId: string
      data: UpdateComment
    }
  ): Promise<CommentWithUser> {
    const { commentId, userId, organizationId, data } = opts

    // Verify user owns the comment
    const existingComment = await db
      .select({ userId: commentsTable.userId })
      .from(commentsTable)
      .where(and(eq(commentsTable.id, commentId), eq(commentsTable.organizationId, organizationId)))
      .then((res) => res[0])

    if (!existingComment) {
      throw new Error('Comment not found')
    }

    if (existingComment.userId !== userId) {
      throw new Error('Unauthorized to update this comment')
    }

    const updateData: Partial<typeof commentsTable.$inferInsert> = {}

    if (data.content !== undefined) {
      updateData.content = data.content
      updateData.mentions = [...(data.mentions || []), ...this.extractMentions(data.content)]
      updateData.isEdited = true
      updateData.editedAt = new Date().toISOString()
    }

    if (data.attachmentIds !== undefined) {
      updateData.attachmentIds = data.attachmentIds
    }

    await db.update(commentsTable).set(updateData).where(eq(commentsTable.id, commentId))

    return this.getCommentWithUser(db, commentId, organizationId)
  }

  async deleteComment(
    db: TransactionLike,
    opts: {
      commentId: string
      userId: string
      organizationId: string
    }
  ): Promise<void> {
    const { commentId, userId, organizationId } = opts

    // Verify user owns the comment
    const existingComment = await db
      .select({ userId: commentsTable.userId })
      .from(commentsTable)
      .where(and(eq(commentsTable.id, commentId), eq(commentsTable.organizationId, organizationId)))
      .then((res) => res[0])

    if (!existingComment) {
      throw new Error('Comment not found')
    }

    if (existingComment.userId !== userId) {
      throw new Error('Unauthorized to delete this comment')
    }

    await db.delete(commentsTable).where(eq(commentsTable.id, commentId))
  }

  async getCommentWithUser(
    db: TransactionLike,
    commentId: string,
    organizationId: string
  ): Promise<CommentWithUser> {
    const comment = await db
      .select({
        id: commentsTable.id,
        entityId: commentsTable.entityId,
        entityType: commentsTable.entityType,
        userId: commentsTable.userId,
        organizationId: commentsTable.organizationId,
        content: commentsTable.content,
        mentions: commentsTable.mentions,
        replyToCommentId: commentsTable.replyToCommentId,
        reactionCount: commentsTable.reactionCount,
        attachmentIds: commentsTable.attachmentIds,
        isEdited: commentsTable.isEdited,
        editedAt: commentsTable.editedAt,
        createdAt: commentsTable.createdAt,
        updatedAt: commentsTable.updatedAt,
        userName: usersTable.name,
        userEmail: usersTable.email,
        userRole: userOrganizationsTable.role,
      })
      .from(commentsTable)
      .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .innerJoin(
        userOrganizationsTable,
        and(
          eq(userOrganizationsTable.userId, usersTable.id),
          eq(userOrganizationsTable.organizationId, organizationId)
        )
      )
      .where(and(eq(commentsTable.id, commentId), eq(commentsTable.organizationId, organizationId)))
      .then((res) => res[0])

    if (!comment) {
      throw new Error('Comment not found')
    }

    // Get reactions
    const reactions = await db
      .select()
      .from(commentReactionsTable)
      .where(eq(commentReactionsTable.commentId, commentId))

    // Get attachments
    const attachments = await db
      .select()
      .from(commentAttachmentsTable)
      .where(eq(commentAttachmentsTable.commentId, commentId))

    // Get reply count
    const replyCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(commentsTable)
      .where(eq(commentsTable.replyToCommentId, commentId))
      .then((res) => res[0]?.count || 0)

    return {
      ...comment,
      mentions: comment.mentions || [],
      attachmentIds: comment.attachmentIds || [],
      reactionCount: comment.reactionCount || {},
      isEdited: comment.isEdited || false,
      reactions: reactions.map((r) => ({
        id: r.id,
        commentId: r.commentId,
        userId: r.userId,
        reactionType: r.reactionType,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      attachments: attachments.map((a) => ({
        id: a.id,
        commentId: a.commentId,
        resourceId: a.resourceId,
        attachmentType: a.attachmentType,
        orderIndex: a.orderIndex,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
      replyCount,
      user: {
        id: comment.userId,
        name: comment.userName,
        email: comment.userEmail,
        role: comment.userRole,
      },
    }
  }

  async getCommentList(
    db: TransactionLike,
    opts: CommentListQuery & { userId: string; organizationId: string }
  ): Promise<CommentListResponse> {
    const { entityId, entityType, replyToCommentId, cursor, limit = 25, organizationId } = opts

    const whereConditions = [
      eq(commentsTable.entityId, entityId),
      eq(commentsTable.entityType, entityType),
      eq(commentsTable.organizationId, organizationId),
    ]

    if (replyToCommentId !== undefined) {
      whereConditions.push(
        replyToCommentId === null
          ? sql`${commentsTable.replyToCommentId} IS NULL`
          : eq(commentsTable.replyToCommentId, replyToCommentId)
      )
    }

    if (cursor) {
      whereConditions.push(gte(sql`extract(epoch from ${commentsTable.createdAt})`, cursor))
    }

    const comments = await db
      .select({
        id: commentsTable.id,
        entityId: commentsTable.entityId,
        entityType: commentsTable.entityType,
        userId: commentsTable.userId,
        organizationId: commentsTable.organizationId,
        content: commentsTable.content,
        mentions: commentsTable.mentions,
        replyToCommentId: commentsTable.replyToCommentId,
        reactionCount: commentsTable.reactionCount,
        attachmentIds: commentsTable.attachmentIds,
        isEdited: commentsTable.isEdited,
        editedAt: commentsTable.editedAt,
        createdAt: commentsTable.createdAt,
        updatedAt: commentsTable.updatedAt,
        userName: usersTable.name,
        userEmail: usersTable.email,
        userRole: userOrganizationsTable.role,
      })
      .from(commentsTable)
      .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .innerJoin(
        userOrganizationsTable,
        and(
          eq(userOrganizationsTable.userId, usersTable.id),
          eq(userOrganizationsTable.organizationId, organizationId)
        )
      )
      .where(and(...whereConditions))
      .orderBy(asc(commentsTable.createdAt))
      .limit(limit + 1)

    const hasMore = comments.length > limit
    const data = hasMore ? comments.slice(0, -1) : comments

    // Enrich comments with reactions, attachments, and reply counts
    const enrichedComments: CommentWithUser[] = []
    for (const comment of data) {
      // Get reactions
      const reactions = await db
        .select()
        .from(commentReactionsTable)
        .where(eq(commentReactionsTable.commentId, comment.id))

      // Get attachments
      const attachments = await db
        .select()
        .from(commentAttachmentsTable)
        .where(eq(commentAttachmentsTable.commentId, comment.id))

      // Get reply count
      const replyCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(commentsTable)
        .where(eq(commentsTable.replyToCommentId, comment.id))
        .then((res) => res[0]?.count || 0)

      enrichedComments.push({
        ...comment,
        mentions: comment.mentions || [],
        attachmentIds: comment.attachmentIds || [],
        reactionCount: comment.reactionCount || {},
        isEdited: comment.isEdited || false,
        reactions: reactions.map((r) => ({
          id: r.id,
          commentId: r.commentId,
          userId: r.userId,
          reactionType: r.reactionType,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        attachments: attachments.map((a) => ({
          id: a.id,
          commentId: a.commentId,
          resourceId: a.resourceId,
          attachmentType: a.attachmentType,
          orderIndex: a.orderIndex,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        })),
        replyCount,
        user: {
          id: comment.userId,
          name: comment.userName,
          email: comment.userEmail,
          role: comment.userRole,
        },
      })
    }

    const nextCursor = hasMore
      ? Math.floor(new Date(data[data.length - 1]!.createdAt).getTime() / 1000)
      : null

    return {
      data: enrichedComments,
      nextCursor,
      hasMore,
    }
  }

  async getCommentReplies(
    db: TransactionLike,
    commentId: string,
    organizationId: string,
    opts: CommentReplyQuery
  ): Promise<CommentListResponse> {
    const { cursor, limit = 25 } = opts

    const whereConditions = [
      eq(commentsTable.replyToCommentId, commentId),
      eq(commentsTable.organizationId, organizationId),
    ]

    if (cursor) {
      whereConditions.push(gte(sql`extract(epoch from ${commentsTable.createdAt})`, cursor))
    }

    const replies = await db
      .select({
        id: commentsTable.id,
        entityId: commentsTable.entityId,
        entityType: commentsTable.entityType,
        userId: commentsTable.userId,
        organizationId: commentsTable.organizationId,
        content: commentsTable.content,
        mentions: commentsTable.mentions,
        replyToCommentId: commentsTable.replyToCommentId,
        reactionCount: commentsTable.reactionCount,
        attachmentIds: commentsTable.attachmentIds,
        isEdited: commentsTable.isEdited,
        editedAt: commentsTable.editedAt,
        createdAt: commentsTable.createdAt,
        updatedAt: commentsTable.updatedAt,
        userName: usersTable.name,
        userEmail: usersTable.email,
        userRole: userOrganizationsTable.role,
      })
      .from(commentsTable)
      .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .innerJoin(
        userOrganizationsTable,
        and(
          eq(userOrganizationsTable.userId, usersTable.id),
          eq(userOrganizationsTable.organizationId, organizationId)
        )
      )
      .where(and(...whereConditions))
      .orderBy(asc(commentsTable.createdAt))
      .limit(limit + 1)

    const hasMore = replies.length > limit
    const data = hasMore ? replies.slice(0, -1) : replies

    // Enrich replies with reactions and attachments
    const enrichedReplies: CommentWithUser[] = []
    for (const reply of data) {
      // Get reactions
      const reactions = await db
        .select()
        .from(commentReactionsTable)
        .where(eq(commentReactionsTable.commentId, reply.id))

      // Get attachments
      const attachments = await db
        .select()
        .from(commentAttachmentsTable)
        .where(eq(commentAttachmentsTable.commentId, reply.id))

      // Reply count is 0 for replies (no nested replies in this simplified system)
      const replyCount = 0

      enrichedReplies.push({
        ...reply,
        mentions: reply.mentions || [],
        attachmentIds: reply.attachmentIds || [],
        reactionCount: reply.reactionCount || {},
        isEdited: reply.isEdited || false,
        reactions: reactions.map((r) => ({
          id: r.id,
          commentId: r.commentId,
          userId: r.userId,
          reactionType: r.reactionType,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        attachments: attachments.map((a) => ({
          id: a.id,
          commentId: a.commentId,
          resourceId: a.resourceId,
          attachmentType: a.attachmentType,
          orderIndex: a.orderIndex,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        })),
        replyCount,
        user: {
          id: reply.userId,
          name: reply.userName,
          email: reply.userEmail,
          role: reply.userRole,
        },
      })
    }

    const nextCursor = hasMore
      ? Math.floor(new Date(data[data.length - 1]!.createdAt).getTime() / 1000)
      : null

    return {
      data: enrichedReplies,
      nextCursor,
      hasMore,
    }
  }

  async addReaction(
    db: TransactionLike,
    opts: {
      userId: string
      organizationId: string
      data: CreateCommentReaction
    }
  ): Promise<void> {
    const { userId, organizationId, data } = opts

    // Verify comment exists and belongs to organization
    const comment = await db
      .select({ id: commentsTable.id })
      .from(commentsTable)
      .where(
        and(eq(commentsTable.id, data.commentId), eq(commentsTable.organizationId, organizationId))
      )
      .then((res) => res[0])

    if (!comment) {
      throw new Error('Comment not found')
    }

    // Remove existing reaction of same type from same user
    await db
      .delete(commentReactionsTable)
      .where(
        and(
          eq(commentReactionsTable.commentId, data.commentId),
          eq(commentReactionsTable.userId, userId),
          eq(commentReactionsTable.reactionType, data.reactionType)
        )
      )

    // Add new reaction
    await db.insert(commentReactionsTable).values({
      commentId: data.commentId,
      userId,
      reactionType: data.reactionType,
    })

    // Update reaction count on comment
    await this.updateReactionCount(db, data.commentId)
  }

  async removeReaction(
    db: TransactionLike,
    opts: {
      commentId: string
      userId: string
      organizationId: string
      reactionType: string
    }
  ): Promise<void> {
    const { commentId, userId, organizationId, reactionType } = opts

    // Verify comment exists and belongs to organization
    const comment = await db
      .select({ id: commentsTable.id })
      .from(commentsTable)
      .where(and(eq(commentsTable.id, commentId), eq(commentsTable.organizationId, organizationId)))
      .then((res) => res[0])

    if (!comment) {
      throw new Error('Comment not found')
    }

    await db
      .delete(commentReactionsTable)
      .where(
        and(
          eq(commentReactionsTable.commentId, commentId),
          eq(commentReactionsTable.userId, userId),
          eq(commentReactionsTable.reactionType, reactionType)
        )
      )

    // Update reaction count on comment
    await this.updateReactionCount(db, commentId)
  }

  private async updateReactionCount(db: TransactionLike, commentId: string): Promise<void> {
    const reactions = await db
      .select({ reactionType: commentReactionsTable.reactionType })
      .from(commentReactionsTable)
      .where(eq(commentReactionsTable.commentId, commentId))

    const reactionCount: Record<string, number> = {}
    for (const reaction of reactions) {
      reactionCount[reaction.reactionType] = (reactionCount[reaction.reactionType] || 0) + 1
    }

    await db.update(commentsTable).set({ reactionCount }).where(eq(commentsTable.id, commentId))
  }

  private extractMentions(content: string): CommentMention[] {
    const mentions: CommentMention[] = []
    let match: RegExpExecArray | null

    // Match @user mentions (simple format for now)
    const userMentionRegex = /@([a-zA-Z0-9_-]+)(?!\[)/g
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    while ((match = userMentionRegex.exec(content)) !== null) {
      mentions.push({
        type: 'user',
        id: match[1]!, // TODO: Resolve username to user ID
        name: match[1]!,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }

    return mentions
  }
}

export const injectCommentsService = ioc.register('commentsService', () => {
  return new CommentsService()
})
