import type { TransactionLike } from '@bulkit/api/db/db.client'
import { notificationsTable } from '@bulkit/api/db/schema/notifications.table'
import { ioc } from '@bulkit/api/ioc'
import { pusher } from '@bulkit/api/pusher/pusher.client'
import { CHAT_CHANNELS, CHAT_EVENTS } from '@bulkit/shared/modules/chat/chat.constants'
import type {
  CreateNotification,
  Notification,
  NotificationReferenceType,
  NotificationType,
} from '@bulkit/shared/modules/notifications/notification.schemas'
import type { PaginatedResponse } from '@bulkit/shared/schemas/misc'
import { and, count, desc, eq } from 'drizzle-orm'
import { HttpError } from 'elysia-http-error'
import { nanoid } from 'nanoid'

export class NotificationService {
  async createNotification(
    db: TransactionLike,
    opts: {
      userId: string
      organizationId: string
    } & CreateNotification
  ): Promise<Notification> {
    const notification = await db
      .insert(notificationsTable)
      .values({
        id: nanoid(),
        userId: opts.userId,
        organizationId: opts.organizationId,
        title: opts.title,
        message: opts.message,
        notificationType: opts.notificationType,
        relatedEntityType: opts.relatedEntityType,
        relatedEntityId: opts.relatedEntityId,
        isRead: false,
        isActionable: opts.isActionable || false,
        actionUrl: opts.actionUrl,
      })
      .returning()
      .then((res) => res[0]!)

    // Send real-time notification via Pusher
    await pusher.trigger(
      CHAT_CHANNELS.USER_NOTIFICATIONS(opts.userId),
      CHAT_EVENTS.NOTIFICATION_CREATED,
      { notification }
    )

    return notification as Notification
  }

  async getUserNotifications(
    db: TransactionLike,
    opts: {
      userId: string
      organizationId: string
      limit?: number
      cursor?: number
      isRead?: boolean
      notificationType?: NotificationType
    }
  ): Promise<PaginatedResponse<Notification>> {
    const limit = Math.min(opts.limit || 20, 50)
    const offset = opts.cursor || 0

    // Build where conditions
    const conditions = [
      eq(notificationsTable.userId, opts.userId),
      eq(notificationsTable.organizationId, opts.organizationId),
    ]

    if (opts.isRead !== undefined) {
      conditions.push(eq(notificationsTable.isRead, opts.isRead))
    }

    if (opts.notificationType) {
      conditions.push(eq(notificationsTable.notificationType, opts.notificationType))
    }

    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(and(...conditions))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limit)
      .offset(offset)

    const totalCount = await db
      .select({ count: count() })
      .from(notificationsTable)
      .where(and(...conditions))
      .then((res) => res[0]?.count || 0)

    return {
      items: notifications.slice(0, limit),
      total: totalCount,
      nextCursor: notifications.length === limit + 1 ? offset + limit : null,
    }
  }

  async markNotificationAsRead(
    db: TransactionLike,
    opts: {
      notificationId: string
      userId: string
      organizationId: string
    }
  ): Promise<Notification> {
    const notification = await db
      .update(notificationsTable)
      .set({
        isRead: true,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(notificationsTable.id, opts.notificationId),
          eq(notificationsTable.userId, opts.userId),
          eq(notificationsTable.organizationId, opts.organizationId)
        )
      )
      .returning()
      .then((res) => res[0])

    if (!notification) {
      throw HttpError.NotFound('Notification not found')
    }

    return notification as Notification
  }

  async markAllNotificationsAsRead(
    db: TransactionLike,
    opts: {
      userId: string
      organizationId: string
    }
  ): Promise<void> {
    await db
      .update(notificationsTable)
      .set({
        isRead: true,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(notificationsTable.userId, opts.userId),
          eq(notificationsTable.organizationId, opts.organizationId),
          eq(notificationsTable.isRead, false)
        )
      )
  }

  async getUnreadCount(
    db: TransactionLike,
    opts: {
      userId: string
      organizationId: string
    }
  ): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.userId, opts.userId),
          eq(notificationsTable.organizationId, opts.organizationId),
          eq(notificationsTable.isRead, false)
        )
      )
      .then((res) => res[0]?.count || 0)

    return result
  }

  async deleteNotification(
    db: TransactionLike,
    opts: {
      notificationId: string
      userId: string
      organizationId: string
    }
  ): Promise<void> {
    const result = await db
      .delete(notificationsTable)
      .where(
        and(
          eq(notificationsTable.id, opts.notificationId),
          eq(notificationsTable.userId, opts.userId),
          eq(notificationsTable.organizationId, opts.organizationId)
        )
      )
      .returning({ id: notificationsTable.id })

    if (!result.length) {
      throw HttpError.NotFound('Notification not found')
    }
  }

  // Helper method to create specific notification types
  async notifyPostReadyForReview(
    db: TransactionLike,
    opts: {
      userId: string
      organizationId: string
      postId: string
      postName: string
      agentMessage?: string
    }
  ): Promise<Notification> {
    return this.createNotification(db, {
      userId: opts.userId,
      organizationId: opts.organizationId,
      title: 'Post Ready for Review',
      message: opts.agentMessage || `Post "${opts.postName}" is ready for your review`,
      notificationType: 'post_ready_for_review',
      relatedEntityType: 'post',
      relatedEntityId: opts.postId,
      isActionable: true,
      actionUrl: `/posts/${opts.postId}`,
    })
  }

  async notifyTaskAssigned(
    db: TransactionLike,
    opts: {
      userId: string
      organizationId: string
      taskId: string
      taskTitle: string
      assignedBy?: string
    }
  ): Promise<Notification> {
    return this.createNotification(db, {
      userId: opts.userId,
      organizationId: opts.organizationId,
      title: 'New Task Assigned',
      message: `Task "${opts.taskTitle}" has been assigned to you${opts.assignedBy ? ` by ${opts.assignedBy}` : ''}`,
      notificationType: 'task_assigned',
      relatedEntityType: 'task',
      relatedEntityId: opts.taskId,
      isActionable: true,
      actionUrl: `/tasks/${opts.taskId}`,
    })
  }

  async notifyAgentCompletedTask(
    db: TransactionLike,
    opts: {
      userId: string
      organizationId: string
      taskId: string
      taskTitle: string
      agentName: string
      results?: string
    }
  ): Promise<Notification> {
    return this.createNotification(db, {
      userId: opts.userId,
      organizationId: opts.organizationId,
      title: 'Agent Completed Task',
      message: `${opts.agentName} completed task "${opts.taskTitle}"${opts.results ? `: ${opts.results}` : ''}`,
      notificationType: 'agent_completed_task',
      relatedEntityType: 'task',
      relatedEntityId: opts.taskId,
      isActionable: false,
      actionUrl: `/tasks/${opts.taskId}`,
    })
  }

  async notifyMention(
    db: TransactionLike,
    opts: {
      userId: string
      organizationId: string
      mentionedBy: string
      contextType: 'conversation' | 'post' | 'task'
      contextId: string
      message: string
    }
  ): Promise<Notification> {
    const actionUrls = {
      conversation: `/chat?conversation=${opts.contextId}`,
      post: `/posts/${opts.contextId}`,
      task: `/tasks/${opts.contextId}`,
    }

    return this.createNotification(db, {
      userId: opts.userId,
      organizationId: opts.organizationId,
      title: 'You were mentioned',
      message: `${opts.mentionedBy} mentioned you: "${opts.message.slice(0, 100)}${opts.message.length > 100 ? '...' : ''}"`,
      notificationType: 'mention',
      relatedEntityType: opts.contextType as NotificationReferenceType,
      relatedEntityId: opts.contextId,
      isActionable: true,
      actionUrl: actionUrls[opts.contextType],
    })
  }
}

// Create singleton instance
export const injectNotificationService = ioc.register('notificationService', () => {
  return new NotificationService()
})
