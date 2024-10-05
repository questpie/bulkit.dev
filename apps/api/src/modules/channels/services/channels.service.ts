import { injectApiKeyManager, type ApiKeyManager } from '@bulkit/api/common/api-key.manager'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import { channelsTable, socialMediaIntegrationsTable } from '@bulkit/api/db/db.schema'
import { ioc, iocRegister, iocResolve } from '@bulkit/api/ioc'
import type { ChannelManager } from '@bulkit/api/modules/channels/abstract/channel.manager'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import { and, eq, getTableColumns } from 'drizzle-orm'

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
    opts: { channelId: string; organizationId?: string }
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
          opts.organizationId ? eq(channelsTable.organizationId, opts.organizationId) : undefined
        )
      )
      .limit(1)
      .then((rows) => rows[0])
      .then((item) => {
        if (!item) return item

        return {
          ...item,
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

  // Add other methods here as needed, following the structure in resources.service.ts
  // For example:
  // async getAll(db: TransactionLike, opts: {...}) {...}
  // async getById(db: TransactionLike, opts: {...}) {...}
  // async create(db: TransactionLike, opts: {...}) {...}
  // async deleteById(db: TransactionLike, opts: {...}) {...}
}

export const injectChannelService = iocRegister('channelsService', () => new ChannelsService())
