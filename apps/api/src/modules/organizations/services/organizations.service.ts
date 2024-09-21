import type { TransactionLike } from '@bulkit/api/db/db.client'
import { organizationsTable, userOrganizationsTable } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { and, eq, getTableColumns } from 'drizzle-orm'
import { Elysia, type Static } from 'elysia'

export type OrganizationWithRole = Required<
  Awaited<ReturnType<typeof OrganizationsService.prototype.getForUser>>
>

class OrganizationsService {
  async getForUser(
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
      .innerJoin(
        organizationsTable,
        eq(userOrganizationsTable.organizationId, organizationsTable.id)
      )
      .limit(1)
      .then((res) => res[0])
  }

  async getById(db: TransactionLike, organizationId: string) {
    return db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, organizationId))
      .limit(1)
      .then((res) => res[0])
  }

  // Add other methods here as needed, following the structure in resources.service.ts
  // For example:
  // async getAll(db: TransactionLike, opts: {...}) {...}
  // async create(db: TransactionLike, opts: {...}) {...}
  // async deleteById(db: TransactionLike, opts: {...}) {...}
}

export const organizationsServicePlugin = () =>
  ioc.use(
    new Elysia({ name: 'ioc.OrganizationsService' }).decorate(
      'organizationsService',
      new OrganizationsService()
    )
  )
