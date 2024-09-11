import type { TransactionLike } from '@bulkit/api/db/db.client'
import { channelsTable, socialMediaIntegrationsTable } from '@bulkit/api/db/db.schema'
import { and, eq, getTableColumns } from 'drizzle-orm'

export type ChannelWithIntegration = Required<Awaited<ReturnType<typeof getChannelWithIntegration>>>
export async function getChannelWithIntegration(
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
