import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { channelsTable, selectChannelSchema } from '@bulkit/api/db/db.schema'
import { channelAuthRoutes } from '@bulkit/api/modules/channels/channel-auth.routes'
import { ChannelCantBeDeletedException } from '@bulkit/api/modules/channels/exceptions/channel-cant-be-deleted.exception'
import { injectChannelService } from '@bulkit/api/modules/channels/services/channels.service'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { PaginatedResponseSchema, PaginationQuerySchema } from '@bulkit/shared/schemas/misc'
import { and, eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'
import {
  ChannelGetAllQuerySchema,
  ChannelListItemSchema,
} from '@bulkit/shared/modules/channels/channels.schemas'
import { applyRateLimit } from '@bulkit/api/common/rate-limit'
import { bindContainer } from '@bulkit/api/ioc'

export const channelRoutes = new Elysia({
  prefix: '/channels',
  detail: {
    tags: ['Channels'],
  },
})
  .use(
    applyRateLimit({
      tiers: {
        authenticated: {
          points: 200, // 200 requests
          duration: 300, // per 5 minutes
          blockDuration: 600, // 10 minute block
        },
      },
    })
  )
  .use(channelAuthRoutes)
  .use(organizationMiddleware)
  .use(bindContainer([injectDatabase, injectChannelService]))
  .get(
    '/',
    async (ctx) => {
      return ctx.channelsService.getAll(ctx.db, ctx.organization!.id, {
        limit: ctx.query.limit,
        cursor: ctx.query.cursor,
        platform: ctx.query.platform,
        q: ctx.query.q,
        isActive: ctx.query.isActive,
        postType: ctx.query.postType,
      })
    },
    {
      detail: {
        tags: ['Channels'],
      },
      query: t.Composite([PaginationQuerySchema, ChannelGetAllQuerySchema]),
      response: {
        200: PaginatedResponseSchema(ChannelListItemSchema),
      },
    }
  )
  .get(
    '/:id',
    async (ctx) => {
      const { id } = ctx.params

      const channel = await ctx.db.query.channelsTable.findFirst({
        where: and(
          eq(channelsTable.id, id),
          eq(channelsTable.organizationId, ctx.organization!.id)
        ),
      })

      if (!channel) {
        throw HttpError.NotFound('Channel not found')
      }

      return channel
    },
    {
      detail: {
        tags: ['Channels'],
      },
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: selectChannelSchema,
        404: HttpErrorSchema(),
      },
    }
  )
  .delete(
    '/:id',
    async (ctx) => {
      const { id } = ctx.params

      try {
        const channel = await ctx.channelsService.deleteById(ctx.db, {
          id: id,
          organizationId: ctx.organization!.id,
        })

        if (channel) {
          throw HttpError.NotFound('Channel not found')
        }

        return { message: 'Channel deleted successfully' }
      } catch (err) {
        if (err instanceof ChannelCantBeDeletedException) {
          throw HttpError.BadRequest(err.message)
        }

        throw HttpError.Internal()
      }
    },
    {
      detail: {
        tags: ['Channels'],
      },
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          message: t.String(),
        }),
        404: HttpErrorSchema(),
        400: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )
  .patch(
    '/:id/archive',
    async (ctx) => {
      const { id } = ctx.params

      const channel = await ctx.channelsService.archiveById(ctx.db, {
        id,
        organizationId: ctx.organization!.id,
      })

      if (!channel) {
        throw HttpError.NotFound('Channel not found')
      }

      return { message: 'Channel archived successfully' }
    },
    {
      detail: {
        tags: ['Channels'],
      },
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          message: t.String(),
        }),
        404: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )
