import { tExt } from '@bulkit/api/common/schemas'
import { db } from '@bulkit/api/db/db.client'
import { PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { insertPostSchema, postsTable } from '@bulkit/api/db/db.schema'
import { getChannelManager } from '@bulkit/api/modules/channels/channels.route'
import { eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

export const postsRoutes = new Elysia({ prefix: '/posts', detail: { tags: ['Posts'] } }).post(
  '/:id/send',
  async (ctx) => {
    const [post] = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, ctx.params.id))
      .limit(1)

    for (const platform of ctx.body.platforms) {
      const channelManagers = getChannelManager(platform)
      await channelManagers.sendPost(post)
    }
  },
  {
    body: t.Object({
      platforms: t.Array(tExt.StringEnum(PLATFORMS)),
    }),
  }
)
