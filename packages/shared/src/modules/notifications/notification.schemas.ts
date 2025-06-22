import { Nullish, StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'

// Notification types

export const NOTIFICATION_TYPES = [
  'post_ready_for_review',
  'task_assigned',
  'agent_completed_task',
  'mention',
] as const
export const NotificationTypeSchema = StringLiteralEnum(NOTIFICATION_TYPES)

// Reference types for mentions and smart references
export const NOTIFICATION_REFERENCE_TYPES = ['conversation', 'post', 'task'] as const
export const NotificationReferenceTypeSchema = StringLiteralEnum(NOTIFICATION_REFERENCE_TYPES)

// Chat notification schema
export const NotificationSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  organizationId: Type.String(),
  title: Type.String(),
  message: Type.String(),
  notificationType: NotificationTypeSchema,
  relatedEntityType: Nullish(NotificationReferenceTypeSchema),
  relatedEntityId: Nullish(Type.String()),
  isRead: Type.Boolean(),
  isActionable: Type.Boolean(),
  actionUrl: Nullish(Type.String()),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

// Create notification
export const CreateNotificationSchema = Type.Object({
  title: Type.String(),
  message: Type.String(),
  notificationType: NotificationTypeSchema,
  relatedEntityType: Nullish(NotificationReferenceTypeSchema),
  relatedEntityId: Nullish(Type.String()),
  isActionable: Nullish(Type.Boolean()),
  actionUrl: Nullish(Type.String()),
})

export type NotificationType = Static<typeof NotificationTypeSchema>
export type NotificationReferenceType = Static<typeof NotificationReferenceTypeSchema>
export type Notification = Static<typeof NotificationSchema>

export type CreateNotification = Static<typeof CreateNotificationSchema>
