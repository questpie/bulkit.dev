import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import Elysia, { t } from 'elysia'
import ogs from 'open-graph-scraper'

export const openGraphRoutes = new Elysia({
  prefix: '/opengraph',
  detail: {
    tags: ['Open Graph'],
  },
})
  .use(protectedMiddleware)
  .get(
    '/',
    async (ctx) => {
      const { url } = ctx.query
      const { error, result } = await ogs({
        url,
      })
      if (error) {
        return ctx.error(500, {
          message: 'Error fetching open graph data',
        })
      }
      switch (ctx.query.platform) {
        case 'x': {
          return {
            title: result.twitterTitle,
            description: result.twitterDescription,
            image: result.twitterImage?.[0]?.url,
            url: result.twitterUrl,
          }
        }
        default: {
          return {
            title: result.ogTitle,
            description: result.ogDescription,
            image: result.ogImage?.[0]?.url,
            url: result.ogUrl,
          }
        }
      }
    },
    {
      query: t.Object({
        url: t.String(),
        platform: t.Nullable(StringLiteralEnum(PLATFORMS)),
      }),
      response: {
        500: t.Object({
          message: t.String(),
        }),
        200: t.Object({
          title: t.Optional(t.String()),
          description: t.Optional(t.String()),
          image: t.Optional(t.String()),
          url: t.Optional(t.String()),
        }),
      },
    }
  )
