import type { TransactionLike } from '@bulkit/api/db/db.client'
import { organizationsTable, userOrganizationsTable } from '@bulkit/api/db/db.schema'
import { and, eq, getTableColumns } from 'drizzle-orm'

export async function getUserOrganization(
  db: TransactionLike,
  opts: {
    organizationId: string
    userId: string
  }
) {
  return db
    .select({
      ...getTableColumns(organizationsTable),
      role: userOrganizationsTable.role,
    })
    .from(userOrganizationsTable)
    .where(
      and(
        eq(userOrganizationsTable.organizationId, opts.organizationId),
        eq(userOrganizationsTable.userId, opts.userId)
      )
    )
    .innerJoin(organizationsTable, eq(userOrganizationsTable.organizationId, organizationsTable.id))
    .limit(1)
    .then((res) => res[0])
}

export async function getOrganizationById(db: TransactionLike, organizationId: string) {
  return db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, organizationId))
    .limit(1)
    .then((res) => res[0])
}
