import { injectApiKeyManager, type ApiKeyManager } from '@bulkit/api/common/api-key.manager'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  channelsTable,
  scheduledPostsTable,
  socialMediaIntegrationsTable,
} from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { ChannelCantBeDeletedException } from '@bulkit/api/modules/channels/exceptions/channel-cant-be-deleted.exception'
import type { Platform, PostType } from '@bulkit/shared/constants/db.constants'
import { getAllowedPlatformsFromPostType } from '@bulkit/shared/modules/admin/utils/platform-settings.utils'
import type {
  ChannelGetAllQuery,
  ChannelListItem,
  ChannelWithIntegration,
} from '@bulkit/shared/modules/channels/channels.schemas'
import type { PaginatedQuery, PaginatedResponse } from '@bulkit/shared/schemas/misc'
import { and, desc, eq, getTableColumns, ilike, inArray, isNotNull, or, sql } from 'drizzle-orm'

class ChannelsService {
  constructor(private readonly apiKeyManager: ApiKeyManager) {}

  async getAll(
    db: TransactionLike,
    organizationId: string,
    opts: ChannelGetAllQuery & PaginatedQuery
  ): Promise<PaginatedResponse<ChannelListItem>> {
    const { limit = 10, cursor, platform, q, isActive, postType } = opts

    const platforms = postType ? getAllowedPlatformsFromPostType(postType) : undefined

    // Build where conditions
    const whereConditions: any[] = [eq(channelsTable.organizationId, organizationId)]

    if (platform) {
      whereConditions.push(eq(channelsTable.platform, platform))
    }

    if (isActive !== undefined) {
      whereConditions.push(eq(channelsTable.status, isActive ? 'active' : 'inactive'))
    }

    if (q) {
      whereConditions.push(ilike(channelsTable.name, `${q}%`))
    }

    if (platforms) {
      whereConditions.push(inArray(channelsTable.platform, platforms))
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${channelsTable.id})` })
      .from(channelsTable)
      .where(and(...whereConditions))

    const total = totalResult[0]?.count || 0

    // Get channels with pagination
    const channels = await db
      .select({
        ...getTableColumns(channelsTable),
        postsCount: sql<string>`COUNT(${scheduledPostsTable.id})`,
        publishedPostsCount: sql<string>`COUNT(CASE WHEN ${scheduledPostsTable.publishedAt} IS NOT NULL THEN 1 ELSE NULL END)`,
        scheduledPostsCount: sql<string>`COUNT(CASE WHEN ${scheduledPostsTable.publishedAt} IS NULL AND ${scheduledPostsTable.scheduledAt} IS NOT NULL THEN 1 ELSE NULL END)`,
      })
      .from(channelsTable)
      .where(and(...whereConditions))
      .orderBy(desc(channelsTable.name))
      .leftJoin(scheduledPostsTable, eq(scheduledPostsTable.channelId, channelsTable.id))
      .groupBy(channelsTable.id)
      .limit(limit + 1)
      .offset(cursor)

    const hasNextPage = channels.length > limit
    const results = channels.slice(0, limit)
    const nextCursor = hasNextPage ? cursor + limit : null

    return {
      items: results.map((r) => ({
        ...r,
        postsCount: Number(r.postsCount),
        publishedPostsCount: Number(r.publishedPostsCount),
        scheduledPostsCount: Number(r.scheduledPostsCount),
      })),
      total,
      nextCursor,
    }
  }

  async getChannelWithIntegration(
    db: TransactionLike,
    opts: { id: string; organizationId?: string }
  ): Promise<ChannelWithIntegration | null> {
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
      .groupBy(channelsTable.id, socialMediaIntegrationsTable.id)
      .limit(1)
      .then((rows) => rows[0])
      .then((item) => {
        if (!item) return null

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

export const injectChannelService = ioc.register('channelsService', (ioc) => {
  const { apiKeyManager } = ioc.resolve([injectApiKeyManager])
  return new ChannelsService(apiKeyManager)
})
