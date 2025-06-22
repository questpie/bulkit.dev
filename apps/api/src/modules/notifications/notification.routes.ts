import { bindContainer } from '@bulkit/api/ioc'
import { injectNotificationService } from '@bulkit/api/modules/notifications/services/notification.service'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import {
  NotificationSchema,
  NotificationTypeSchema,
} from '@bulkit/shared/modules/notifications/notification.schemas'
import { PaginatedResponseSchema, PaginationQuerySchema } from '@bulkit/shared/schemas/misc'
import Elysia, { t } from 'elysia'

export const notificationRoutes = new Elysia({ prefix: '/notifications' })
  .use(organizationMiddleware)
  .use(bindContainer([injectNotificationService]))
  // Notifications
  .get(
    '/',
    async ({ query, auth, organization, notificationService, db }) => {
      return await notificationService.getUserNotifications(db, {
        userId: auth.user.id,
        organizationId: organization.id,
        ...query,
      })
    },
    {
      query: t.Composite([
        PaginationQuerySchema,
        t.Object({
          isRead: t.Optional(t.Boolean()),
          notificationType: t.Optional(NotificationTypeSchema),
        }),
      ]),
      response: PaginatedResponseSchema(NotificationSchema),
    }
  )

  .put(
    '/:id/read',
    async ({ params, auth, organization, notificationService, db }) => {
      return await notificationService.markNotificationAsRead(db, {
        notificationId: params.id,
        userId: auth.user.id,
        organizationId: organization.id,
      })
    },
    {
      params: t.Object({ id: t.String() }),
      response: NotificationSchema,
    }
  )

  .put('/mark-all-read', async ({ auth, organization, notificationService, db }) => {
    await notificationService.markAllNotificationsAsRead(db, {
      userId: auth.user.id,
      organizationId: organization.id,
    })
    return { success: true }
  })
