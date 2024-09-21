import type { TransactionLike } from '@bulkit/api/db/db.client'
import { channelsTable, socialMediaIntegrationsTable } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { and, eq, getTableColumns } from 'drizzle-orm'
import { Elysia, type Static } from 'elysia'

export type ChannelWithIntegration = Required<
  Awaited<ReturnType<typeof ChannelsService.prototype.getChannelWithIntegration>>
>

class ChannelsService {
  async getChannelWithIntegration(
    db: TransactionLike,
    opts: { channelId: string; organizationId: string }
  ) {
    return db
      .select({
        ...getTableColumns(channelsTable),
        socialMediaIntegration: getTableColumns(socialMediaIntegrationsTable),
      })
      .from(channelsTable)
      .innerJoin(
        socialMediaIntegrationsTable,
        eq(channelsTable.socialMediaIntegrationId, socialMediaIntegrationsTable.id)
      )
      .where(
        and(
          eq(channelsTable.id, opts.channelId),
          eq(channelsTable.organizationId, opts.organizationId)
        )
      )
      .limit(1)
      .then((rows) => rows[0])
  }

  // Add other methods here as needed, following the structure in resources.service.ts
  // For example:
  // async getAll(db: TransactionLike, opts: {...}) {...}
  // async getById(db: TransactionLike, opts: {...}) {...}
  // async create(db: TransactionLike, opts: {...}) {...}
  // async deleteById(db: TransactionLike, opts: {...}) {...}
}

export const channelsServicePlugin = () =>
  ioc.use(
    new Elysia({ name: 'ioc.ChannelsService' }).decorate('channelsService', new ChannelsService())
  )
