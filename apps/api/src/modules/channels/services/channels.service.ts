import { injectApiKeyManager, type ApiKeyManager } from '@bulkit/api/common/api-key.manager'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  channelsTable,
  scheduledPostsTable,
  socialMediaIntegrationsTable,
} from '@bulkit/api/db/db.schema'
import { ioc, iocRegister, iocResolve } from '@bulkit/api/ioc'
import { ChannelCantBeDeletedException } from '@bulkit/api/modules/channels/exceptions/channel-cant-be-deleted.exception'
import { and, eq, getTableColumns, isNotNull, or, sql } from 'drizzle-orm'

export type ChannelWithIntegration = Exclude<
  Awaited<ReturnType<typeof ChannelsService.prototype.getChannelWithIntegration>>,
  undefined
>

class ChannelsService {
  private readonly apiKeyManager: ApiKeyManager

  constructor() {
    const container = iocResolve(ioc.use(injectApiKeyManager))
    this.apiKeyManager = container.apiKeyManager
  }

  async getChannelWithIntegration(
    db: TransactionLike,
    opts: { id: string; organizationId?: string }
  ) {
    return db
      .select({
        ...getTableColumns(channelsTable),
        socialMediaIntegration: getTableColumns(socialMediaIntegrationsTable),
        postsCount: sql<string>`COUNT(${scheduledPostsTable.id})`,
        publishedPostsCount: sql<string>`COUNT(CASE WHEN ${scheduledPostsTable.publishedAt} IS NOT NULL THEN 1 ELSE NULL END)`,
        scheduledPostsCount: sql<string>`COUNT(CASE WHEN ${scheduledPostsTable.publishedAt} IS NULL AND ${scheduledPostsTable.scheduledAt} IS NOT NULL THEN 1 ELSE NULL END)`,
      })
      .from(channelsTable)
      .innerJoin(
        socialMediaIntegrationsTable,
        eq(channelsTable.socialMediaIntegrationId, socialMediaIntegrationsTable.id)
      )
      .where(
        and(
          eq(channelsTable.id, opts.id),
          opts.organizationId ? eq(channelsTable.organizationId, opts.organizationId) : undefined
        )
      )
      .leftJoin(scheduledPostsTable, eq(channelsTable.id, scheduledPostsTable.channelId))
      .groupBy(channelsTable.id)
      .limit(1)
      .then((rows) => rows[0])
      .then((item) => {
        if (!item) return item

        return {
          ...item,
          postsCount: Number(item.postsCount),
          publishedPostsCount: Number(item.publishedPostsCount),
          scheduledPostsCount: Number(item.scheduledPostsCount),
          socialMediaIntegration: {
            ...item.socialMediaIntegration,
            accessToken: this.apiKeyManager.decrypt(item.socialMediaIntegration.accessToken),
            refreshToken:
              item.socialMediaIntegration.refreshToken &&
              this.apiKeyManager.decrypt(item.socialMediaIntegration.refreshToken),
          },
        }
      })
  }

  async deleteById(db: TransactionLike, opts: { id: string; organizationId: string }) {
    const channel = await this.getChannelWithIntegration(db, opts)
    if (!channel) {
      return null
    }

    const hasPostedContent = await db
      .select({ id: channelsTable.id })
      .from(channelsTable)
      .where(
        and(
          eq(channelsTable.id, opts.id),
          eq(channelsTable.organizationId, opts.organizationId),
          or(isNotNull(scheduledPostsTable.publishedAt), isNotNull(scheduledPostsTable.scheduledAt))
        )
      )
      .leftJoin(scheduledPostsTable, eq(channelsTable.id, scheduledPostsTable.channelId))
      .then((r) => !!r.length)

    if (hasPostedContent) {
      throw new ChannelCantBeDeletedException(channel.id)
    }

    return db
      .delete(channelsTable)
      .where(
        and(eq(channelsTable.id, opts.id), eq(channelsTable.organizationId, opts.organizationId))
      )
      .returning()
      .then((r) => r[0]!)
  }

  async archiveById(db: TransactionLike, opts: { id: string; organizationId: string }) {
    return db
      .update(channelsTable)
      .set({
        archivedAt: new Date().toISOString(),
      })
      .where(
        and(eq(channelsTable.id, opts.id), eq(channelsTable.organizationId, opts.organizationId))
      )
      .returning()
      .then((r) => r[0])
  }
}

export const injectChannelService = iocRegister('channelsService', () => new ChannelsService())
